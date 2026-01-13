const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const HomepageConfig = require('../models/HomepageConfig');
const { protect, protectOptional, authorize, requireEditorOrAbove, requireSuperAdmin, logActivity } = require('../middleware/auth');
const ArticleController = require('../controllers/articleController');

// @route   GET /api/articles
// @desc    Get all articles with pagination and filters
// @access  Public
// @route   GET /api/articles
// @desc    Get all articles with pagination and filters
// @access  Public
router.get('/', protectOptional, ArticleController.getArticles);

// @route   GET /api/articles/stats
// @desc    Get article statistics (admin only)
// @access  Private (Admin only)
router.get('/stats', protect, async (req, res, next) => {
    try {
        // Base query - exclude deleted
        const baseQuery = { isDeleted: false };

        // If writer, restrict stats to their own articles
        if (req.user.role === 'writer') {
            baseQuery.author = req.user._id;
        }

        const total = await Article.countDocuments(baseQuery);
        const published = await Article.countDocuments({ ...baseQuery, status: 'published' });
        const drafts = await Article.countDocuments({ ...baseQuery, status: 'draft' });
        const inReview = await Article.countDocuments({ ...baseQuery, status: 'review' });

        // For inactive, we might not want writers to see deleted stuff? 
        // Or if they can see "My Trash"? 
        // Requirement said "Cannot delete articles". 
        // So they probably have 0 inactive. But good to filter anyway.
        const inactiveQuery = { isDeleted: true };
        if (req.user.role === 'writer') inactiveQuery.author = req.user._id;
        const inactive = await Article.countDocuments(inactiveQuery);

        // Lifecycle counts
        const hot = await Article.countDocuments({ ...baseQuery, lifecycleStage: 'hot' });
        const archive = await Article.countDocuments({ ...baseQuery, lifecycleStage: 'archive' });
        const cold = await Article.countDocuments({ ...baseQuery, lifecycleStage: 'cold' });

        // Aggregate views
        // Match stage must include author filter if writer
        const matchStage = { isDeleted: false };
        if (req.user.role === 'writer') {
            matchStage.author = req.user._id;
        }

        const viewsResult = await Article.aggregate([
            { $match: matchStage },
            { $group: { _id: null, totalViews: { $sum: "$views" } } }
        ]);
        const views = viewsResult.length > 0 ? viewsResult[0].totalViews : 0;

        res.json({
            success: true,
            data: {
                total,
                published,
                drafts,
                inReview,
                inactive,
                hot,
                archive,
                cold,
                views
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/articles/:slug
// @desc    Get single article by slug
// @access  Public
// @route   GET /api/articles/:slug
// @desc    Get single article by slug
// @access  Public
router.get('/:slug', ArticleController.getArticleBySlug);

// @route   GET /api/articles/:id/related
// @desc    Get related articles based on tags and category (Smart Logic)
// @access  Public
// @route   GET /api/articles/:id/related
// @desc    Get related articles based on tags and category (Smart Logic)
// @access  Public
router.get('/:id/related', ArticleController.getRelatedArticles);

// @route   GET /api/articles/id/:id
// @desc    Get single article by ID (for admin/edit)
// @access  Private (Admin only)
router.get('/id/:id', protect, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id)
            .populate('category', 'name slug')
            .populate('tags', 'name slug')
            .populate('author', 'name email')
            .populate('editor', 'name email');

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found',
            });
        }

        res.json({
            success: true,
            data: article,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/articles
// @desc    Create new article
// @access  Private (All authenticated users)
router.post('/', protect, async (req, res, next) => {
    try {
        // Add author to request body
        req.body.author = req.user._id;

        // Writers: Check direct publish permission
        if (req.user.role === 'writer') {
            // If writer doesn't have direct publish enabled, set to pending review
            if (!req.user.directPublishEnabled) {
                req.body.status = 'review';
            } else {
                // Has permission - can publish if they want
                req.body.status = req.body.status || 'published';
            }
        }

        const article = await Article.create(req.body);

        await logActivity({
            action: 'create',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            req,
        });

        res.status(201).json({
            success: true,
            data: article,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/articles/:id
// @desc    Update article
// @access  Private (Writers can edit own drafts, Editors+ can edit any)
router.put('/:id', protect, async (req, res, next) => {
    try {
        let article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({
                success: false,
                message: 'Article not found',
            });
        }

        // Writers can only edit their own drafts
        if (req.user.role === 'writer') {
            if (article.author.toString() !== req.user._id.toString()) {
                return res.status(403).json({ success: false, message: 'You can only edit your own articles' });
            }
            if (article.status !== 'draft') {
                return res.status(403).json({ success: false, message: 'You can only edit draft articles' });
            }
            // Prevent writers from changing status
            delete req.body.status;
        }

        // Track changes in history
        article.updateHistory.push({
            updatedBy: req.user._id,
            updatedAt: new Date(),
            changes: JSON.stringify(Object.keys(req.body)),
        });

        Object.assign(article, req.body);
        await article.save();

        await article.populate('category', 'name slug');
        await article.populate('author', 'name');
        await article.populate('editor', 'name');

        await logActivity({
            action: 'update',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            details: { fieldsUpdated: Object.keys(req.body) },
            req,
        });

        res.json({
            success: true,
            data: article,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/articles/:id/submit
// @desc    Submit article for review (Writer only)
// @access  Private
router.patch('/:id/submit', protect, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Check ownership for writers
        if (req.user.role === 'writer' && article.author.toString() !== req.user._id.toString()) {
            return res.status(403).json({ success: false, message: 'You can only submit your own articles' });
        }

        if (article.status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Only drafts can be submitted for review' });
        }

        article.status = 'review';
        await article.save();

        await logActivity({
            action: 'submit_review',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/articles/:id/approve
// @desc    Approve and publish article (Editor+ only)
// @access  Private
router.patch('/:id/approve', protect, requireEditorOrAbove, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        if (article.status !== 'review' && article.status !== 'draft') {
            return res.status(400).json({ success: false, message: 'Article is not pending review' });
        }

        article.status = 'published';
        article.editor = req.user._id;
        if (!article.publishedAt) {
            article.publishedAt = new Date();
        }
        await article.save();

        await logActivity({
            action: 'approve',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/articles/:id/reject
// @desc    Reject article back to draft (Editor+ only)
// @access  Private
router.patch('/:id/reject', protect, requireEditorOrAbove, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        article.status = 'draft';
        await article.save();

        await logActivity({
            action: 'reject',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            details: { reason: req.body.reason },
            req,
        });

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/articles/:id/publish
// @desc    Toggle publish/unpublish article (Editor+ only)
// @access  Private
router.patch('/:id/publish', protect, requireEditorOrAbove, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        const wasPublished = article.status === 'published';
        article.status = wasPublished ? 'draft' : 'published';
        if (!wasPublished && !article.publishedAt) {
            article.publishedAt = new Date();
            article.editor = req.user._id;
        }
        await article.save();

        await logActivity({
            action: wasPublished ? 'unpublish' : 'publish',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/articles/:id/soft-delete
// @desc    Soft delete article (Super Admin only)
// @access  Private
router.patch('/:id/soft-delete', protect, requireSuperAdmin, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }
        // Check if article is used in Homepage Config
        const homepageConfig = await HomepageConfig.findOne();
        if (homepageConfig) {
            let configChanged = false;
            if (homepageConfig.heroArticle && homepageConfig.heroArticle.toString() === req.params.id) {
                homepageConfig.heroArticle = undefined;
                configChanged = true;
            }
            if (homepageConfig.subFeaturedArticles && homepageConfig.subFeaturedArticles.includes(req.params.id)) {
                homepageConfig.subFeaturedArticles = homepageConfig.subFeaturedArticles.filter(id => id.toString() !== req.params.id);
                configChanged = true;
            }
            if (configChanged) {
                await homepageConfig.save();
                console.log(`Removed deleted article ${req.params.id} from Homepage Config`);
            }
        }

        // Soft delete
        article.isDeleted = true;
        article.deletedAt = Date.now();
        article.deletedBy = req.user._id;
        article.status = 'inactive';
        await article.save();

        await logActivity({
            action: 'soft_delete',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, message: 'Article moved to inactive' });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/articles/:id/restore
// @desc    Restore soft-deleted article (Super Admin only)
// @access  Private
router.patch('/:id/restore', protect, requireSuperAdmin, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        article.isDeleted = false;
        article.deletedAt = null;
        article.deletedBy = null;
        article.status = 'draft'; // Restore to draft for re-review
        await article.save();

        await logActivity({
            action: 'restore',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, data: article });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/articles/:id
// @desc    Hard delete article (Super Admin only, unpublished only)
// @access  Private
router.delete('/:id', protect, requireSuperAdmin, async (req, res, next) => {
    try {
        const article = await Article.findById(req.params.id);

        if (!article) {
            return res.status(404).json({ success: false, message: 'Article not found' });
        }

        // Allow Super Admin to delete any article, including published ones
        // if (article.status === 'published' && !article.isDeleted) {
        //    return res.status(400).json({
        //        success: false,
        //        message: 'Cannot permanently delete published articles. Soft delete first.'
        //    });
        // }

        await Article.findByIdAndDelete(req.params.id);

        await logActivity({
            action: 'delete',
            targetType: 'article',
            targetId: article._id,
            targetName: article.title,
            performedBy: req.user,
            details: { permanentDelete: true },
            req,
        });

        res.json({ success: true, message: 'Article permanently deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;

