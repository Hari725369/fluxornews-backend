const express = require('express');
const router = express.Router();
const AuditLog = require('../models/AuditLog');
const { protect, requireSuperAdmin } = require('../middleware/auth');

// All routes require Super Admin
router.use(protect);
router.use(requireSuperAdmin);

// @route   GET /api/audit
// @desc    Get audit logs with pagination and filters
// @access  Private (Super Admin only)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const query = {};

        // Filter by action
        if (req.query.action) {
            query.action = req.query.action;
        }

        // Filter by target type
        if (req.query.targetType) {
            query.targetType = req.query.targetType;
        }

        // Filter by user who performed action
        if (req.query.performedBy) {
            query.performedBy = req.query.performedBy;
        }

        // Filter by date range
        if (req.query.startDate || req.query.endDate) {
            query.createdAt = {};
            if (req.query.startDate) {
                query.createdAt.$gte = new Date(req.query.startDate);
            }
            if (req.query.endDate) {
                const end = new Date(req.query.endDate);
                end.setHours(23, 59, 59, 999);
                query.createdAt.$lte = end;
            }
        }

        // Search by target name
        if (req.query.search) {
            query.$or = [
                { targetName: { $regex: req.query.search, $options: 'i' } },
                { performedByName: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .populate('performedBy', 'name email role')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: logs,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/audit/actions
// @desc    Get list of available actions for filtering
// @access  Private (Super Admin only)
router.get('/actions', async (req, res, next) => {
    try {
        const actions = await AuditLog.distinct('action');
        res.json({ success: true, data: actions });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/audit/user/:userId
// @desc    Get audit logs for specific user
// @access  Private (Super Admin only)
router.get('/user/:userId', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const query = { performedBy: req.params.userId };

        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: logs.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: logs,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/audit/article/:articleId
// @desc    Get audit logs for specific article
// @access  Private (Super Admin only)
router.get('/article/:articleId', async (req, res, next) => {
    try {
        const logs = await AuditLog.find({
            targetType: 'article',
            targetId: req.params.articleId,
        })
            .populate('performedBy', 'name email role')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: logs.length, data: logs });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/audit/stats
// @desc    Get audit log statistics
// @access  Private (Super Admin only)
router.get('/stats', async (req, res, next) => {
    try {
        const total = await AuditLog.countDocuments();

        // Get counts by action type
        const byAction = await AuditLog.aggregate([
            { $group: { _id: '$action', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 10 },
        ]);

        // Get counts by target type
        const byTargetType = await AuditLog.aggregate([
            { $group: { _id: '$targetType', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
        ]);

        // Recent activity (last 24 hours)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const recentCount = await AuditLog.countDocuments({ createdAt: { $gte: yesterday } });

        res.json({
            success: true,
            data: {
                total,
                recentCount,
                byAction,
                byTargetType,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
