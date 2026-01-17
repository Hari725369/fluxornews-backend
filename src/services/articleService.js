const Article = require('../models/Article');
const mongoose = require('mongoose');

class ArticleService {
    /**
     * List articles with advanced filtering, pagination, and role-based access
     */
    async listArticles(params, user) {
        const page = parseInt(params.page) || 1;
        const limit = parseInt(params.limit) || 10;
        const skip = (page - 1) * limit;

        // Build query
        const query = {};

        // Exclude soft-deleted articles by default
        query.isDeleted = false;

        // --- Default to Published ---
        // We start restrictive and open up based on role
        query.status = 'published';

        // --- Role & Visibility Logic ---
        if (user) {
            if (user.role === 'superadmin' || user.role === 'editor') {
                // Admins see everything if they ask, or if they don't ask we defaults to published? 
                // Usually admins want to see published by default on home, but 'all' on dashboard.
                // If they explicitly asked for something, give it to them.
                if (params.status) {
                    if (params.status === 'all') delete query.status;
                    else if (params.status === 'trash') query.isDeleted = true;
                    else query.status = params.status;
                } else {
                    // If admins don't specify, we still default to published for the main site feed.
                    // This prevents admins from seeing drafts on the homepage which can be confusing.
                }
            } else if (user.role === 'writer') {
                // WRITERS
                if (params.status) {
                    if (params.status === 'all') {
                        // "All" for writer = Their own articles (drafts+published) + All Published others?
                        // Usually dashboard usage.
                        delete query.status;
                        query.author = user._id; // Restrict "All" to own
                    } else if (params.status !== 'published') {
                        // Viewing specific non-published status -> must be own
                        query.status = params.status;
                        query.author = user._id;
                    } else {
                        // Viewing published -> allowed (default)
                    }
                } else if (params.author === user._id.toString()) {
                    // Writer specifically asking for THEIR OWN profile/articles -> show all?
                    // Or still default to published unless they asked for status=all?
                    // Let's stick to published default unless explicit.
                }
            }
        }

        // Ensure guests can never override
        if (!user && params.status && params.status !== 'published') {
            // Ignore status param for guests, force published
            query.status = 'published';
        }

        // For public home feed (no specific filters), ensure we respect the "Show In Home Feed" flag if applicable
        if (!params.category && !params.tag && !params.search && !params.author && query.status === 'published') {
            // query.showInHomeFeed = true; // Optional: Enforce this if we only want specific logic
        }

        // Apply filters
        if (params.lifecycleStage) query.lifecycleStage = params.lifecycleStage;
        if (params.author) query.author = params.author;
        if (params.category) query.category = params.category;
        if (params.tag) {
            // Case-insensitive exact match for the tag
            query.tags = { $regex: new RegExp(`^${params.tag}$`, 'i') };
        }
        if (params.isTrending) query.isTrending = params.isTrending === 'true';
        if (params.isFeatured) query.isFeatured = params.isFeatured === 'true';

        // Date Range
        if (params.startDate || params.endDate) {
            query.createdAt = {};
            if (params.startDate) query.createdAt.$gte = new Date(params.startDate);
            if (params.endDate) {
                const end = new Date(params.endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Search
        if (params.search) {
            query.$or = [
                { title: { $regex: params.search, $options: 'i' } },
                { tags: { $regex: params.search, $options: 'i' } },
                { content: { $regex: params.search, $options: 'i' } },
                { excerpt: { $regex: params.search, $options: 'i' } }
            ];
        }

        const total = await Article.countDocuments(query);

        const articles = await Article.find(query)
            .populate('category', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name')
            .populate('editor', 'name')
            .sort({ publishedAt: -1, createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return {
            count: articles.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: articles,
        };
    }

    /**
     * Get related articles using smart tag/category logic
     */
    async getRelatedArticles(articleId) {
        const article = await Article.findById(articleId);
        if (!article) return null;

        const sourceTags = article.tags || [];
        const sourceCategory = article.category;
        const limit = 4;

        let relatedArticles = [];

        // 1. Tag-based Relevance
        if (sourceTags.length > 0) {
            relatedArticles = await Article.aggregate([
                {
                    $match: {
                        _id: { $ne: article._id },
                        status: 'published',
                        isDeleted: false,
                        tags: { $in: sourceTags }
                    }
                },
                {
                    $addFields: {
                        sharedTags: { $size: { $setIntersection: ["$tags", sourceTags] } }
                    }
                },
                { $sort: { sharedTags: -1, publishedAt: -1 } },
                { $limit: limit },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'author'
                    }
                },
                { $unwind: '$author' },
                {
                    $project: {
                        title: 1, slug: 1, featuredImage: 1, publishedAt: 1, "author.name": 1, category: 1
                    }
                }
            ]);
        }

        // 2. Fallback to Category
        if (relatedArticles.length < limit && sourceCategory) {
            const excludeIds = [article._id, ...relatedArticles.map(a => a._id)];

            const categoryFillers = await Article.find({
                _id: { $nin: excludeIds },
                category: sourceCategory,
                status: 'published',
                isDeleted: false
            })
                .sort({ publishedAt: -1 })
                .limit(limit - relatedArticles.length)
                .select('title slug featuredImage publishedAt author category')
                .populate('author', 'name');

            relatedArticles = [...relatedArticles, ...categoryFillers];
        }

        return relatedArticles;
    }

    async getBySlug(slug, user) {
        const article = await Article.findOne({ slug, isDeleted: false })
            .populate('category', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name')
            .populate('editor', 'name');

        if (!article) return null;

        // Permission check
        if (article.status !== 'published' && !user) {
            return null;
        }

        // Increment views logic could be here or in controller/separate event
        // Keeping side-effects minimal in 'get' query makes it purer, 
        // but 'viewing' an article inherently increments view.
        article.views += 1;
        await article.save();

        return article;
    }

    // ... other methods (create, update, delete) can be moved here in future
}

module.exports = new ArticleService();
