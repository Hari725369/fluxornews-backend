const express = require('express');
const router = express.Router();
const Comment = require('../models/Comment');
const SiteConfig = require('../models/SiteConfig');
const { protect, requireSuperAdmin, protectReader } = require('../middleware/auth');

const jwt = require('jsonwebtoken');

// @route   GET /api/comments/article/:articleId
// @desc    Get comments (Approved + User's own Pending)
// @access  Public (but checks for token)
router.get('/article/:articleId', async (req, res, next) => {
    try {
        const config = await SiteConfig.getConfig();
        if (!config.features.enableComments) {
            return res.json({ success: true, data: [], message: 'Comments are disabled site-wide' });
        }

        let query = {
            article: req.params.articleId,
            status: 'approved'
        };

        // If user is logged in, allow them to see their own pending comments
        // Manually check token since this route is public
        let readerId = null;
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            try {
                const token = req.headers.authorization.split(' ')[1];
                const decoded = jwt.verify(token, process.env.JWT_SECRET);
                readerId = decoded.id; // Reader ID
            } catch (err) {
                // Invalid token, just ignore
            }
        }

        if (readerId) {
            query = {
                article: req.params.articleId,
                $or: [
                    { status: 'approved' },
                    { status: 'pending', reader: readerId }
                ]
            };
        }

        const comments = await Comment.find(query)
            .sort({ likes: -1, createdAt: -1 })
            .limit(50)
            .select('-authorEmail -ipAddress');

        res.json({ success: true, data: comments });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/comments/:id/like
// @desc    Like/Unlike a comment
// @access  Private
// @route   POST /api/comments/:id/like
// @desc    Like/Unlike a comment
// @access  Private (Reader)
router.post('/:id/like', protectReader, async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        const userId = req.reader._id;
        const hasLiked = comment.likedBy.includes(userId);

        if (hasLiked) {
            // Unlike
            comment.likedBy = comment.likedBy.filter(id => id.toString() !== userId.toString());
            comment.likes = Math.max(0, comment.likes - 1);
        } else {
            // Like
            comment.likedBy.push(userId);
            comment.likes += 1;
        }

        await comment.save();

        res.json({ success: true, data: { likes: comment.likes, hasLiked: !hasLiked } });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/comments/:id
// @desc    Edit own comment
// @access  Private (Reader)
router.put('/:id', protectReader, async (req, res, next) => {
    try {
        const { content } = req.body;
        if (!content) {
            return res.status(400).json({ success: false, message: 'Content is required' });
        }

        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Check ownership
        if (comment.reader && comment.reader.toString() !== req.reader._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to edit this comment' });
        }

        if (!comment.reader) {
            return res.status(403).json({ success: false, message: 'Cannot edit anonymous comments' });
        }

        comment.content = content;
        comment.isEdited = true;
        comment.editedAt = Date.now();
        // Option: Re-set status to pending if you want re-moderation?
        // For now, let's keep it approved but maybe flag it? 
        // User didn't ask for re-moderation, so let's allow direct edit for now.

        await comment.save();
        res.json({ success: true, data: comment });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/comments/:id
// @desc    Delete own comment
// @access  Private (Reader)
router.delete('/:id', protectReader, async (req, res, next) => {
    try {
        const comment = await Comment.findById(req.params.id);
        if (!comment) {
            return res.status(404).json({ success: false, message: 'Comment not found' });
        }

        // Check ownership
        if (comment.reader && comment.reader.toString() !== req.reader._id.toString()) {
            return res.status(403).json({ success: false, message: 'Not authorized to delete this comment' });
        }

        // If comment has no reader (posted as guest?) - technically shouldn't happen for this route as we enforce reader auth
        // But if someone tries to delete a guest comment claimimg it's theirs... 
        if (!comment.reader) {
            return res.status(403).json({ success: false, message: 'Cannot delete anonymous comments' });
        }

        await Comment.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/comments
// @desc    Post a new comment
// @access  Public (or Private based on implementation, allowing guests for now)
router.post('/', async (req, res, next) => {
    try {
        const config = await SiteConfig.getConfig();
        if (!config.features.enableComments) {
            return res.status(403).json({ success: false, message: 'Comments are disabled.' });
        }

        // Optional: Block if reader required and not provided? 
        // For now, we allow guests but can attach readerId if token header present? 
        // Let's assume frontend passes everything.

        const { articleId, authorName, content, readerId } = req.body;

        if (!content || !articleId || !authorName) {
            return res.status(400).json({ success: false, message: 'Please provide all fields' });
        }

        const comment = await Comment.create({
            article: articleId,
            authorName,
            content,
            reader: readerId || null,
            ipAddress: req.ip,
            status: 'pending' // Always pending first
        });

        res.json({
            success: true,
            message: 'Comment submitted for moderation.',
            data: comment
        });
    } catch (error) {
        next(error);
    }
});

// ==========================================
// ADMIN ROUTES
// ==========================================

// @route   GET /api/comments/admin/all
// @desc    Get ALL comments (for moderation)
// @access  Private (Admin)
router.get('/admin/all', protect, async (req, res, next) => {
    try {
        const { status, page = 1, limit = 20 } = req.query;
        const query = {};
        if (status) query.status = status;

        const comments = await Comment.find(query)
            .populate('article', 'title slug')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit);

        const total = await Comment.countDocuments(query);

        res.json({
            success: true,
            data: comments,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page: Number(page)
            }
        });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/comments/admin/:id/status
// @desc    Approve/Reject comment
// @access  Private (Admin)
router.patch('/admin/:id/status', protect, async (req, res, next) => {
    try {
        const { status } = req.body;
        if (!['approved', 'rejected', 'spam', 'pending'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const comment = await Comment.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );

        res.json({ success: true, data: comment });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/comments/admin/:id
// @desc    Delete comment
// @access  Private (Admin)
router.delete('/admin/:id', protect, async (req, res, next) => {
    try {
        await Comment.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Comment deleted' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
