const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const { protect, requireSuperAdmin, logActivity } = require('../middleware/auth');

// All routes require Super Admin
router.use(protect);
router.use(requireSuperAdmin);

// @route   GET /api/users
// @desc    Get all users
// @access  Private (Super Admin only)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};

        // Filter by role
        if (req.query.role) {
            query.role = req.query.role;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Search by name or email
        if (req.query.search) {
            query.$or = [
                { name: { $regex: req.query.search, $options: 'i' } },
                { email: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        const total = await AdminUser.countDocuments(query);
        const users = await AdminUser.find(query)
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: users.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: users,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/stats
// @desc    Get user statistics
// @access  Private (Super Admin only)
router.get('/stats', async (req, res, next) => {
    try {
        const total = await AdminUser.countDocuments();
        const superadmins = await AdminUser.countDocuments({ role: 'superadmin' });
        const editors = await AdminUser.countDocuments({ role: 'editor' });
        const writers = await AdminUser.countDocuments({ role: 'writer' });
        const active = await AdminUser.countDocuments({ status: 'active' });
        const suspended = await AdminUser.countDocuments({ status: 'suspended' });

        res.json({
            success: true,
            data: { total, superadmins, editors, writers, active, suspended },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/:id
// @desc    Get single user
// @access  Private (Super Admin only)
router.get('/:id', async (req, res, next) => {
    try {
        const user = await AdminUser.findById(req.params.id)
            .populate('createdBy', 'name email');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/users
// @desc    Create new user
// @access  Private (Super Admin only)
router.post('/', async (req, res, next) => {
    try {
        const { email, password, name, role } = req.body;

        // Check if user exists
        const existingUser = await AdminUser.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await AdminUser.create({
            email,
            password,
            name,
            role: role || 'writer',
            createdBy: req.user._id,
        });

        // Log the action
        await logActivity({
            action: 'create_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            performedBy: req.user,
            details: { email: user.email, role: user.role },
            req,
        });

        res.status(201).json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/users/:id
// @desc    Update user
// @access  Private (Super Admin only)
router.put('/:id', async (req, res, next) => {
    try {
        const { name, email, role } = req.body;

        const user = await AdminUser.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Prevent demoting the last superadmin
        if (user.role === 'superadmin' && role !== 'superadmin') {
            const superadminCount = await AdminUser.countDocuments({ role: 'superadmin' });
            if (superadminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot demote the last Super Admin'
                });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        user.role = role || user.role;
        await user.save();

        await logActivity({
            action: 'update_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            performedBy: req.user,
            details: { name, email, role },
            req,
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/users/:id/suspend
// @desc    Suspend user
// @access  Private (Super Admin only)
router.patch('/:id/suspend', async (req, res, next) => {
    try {
        const user = await AdminUser.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Cannot suspend yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot suspend yourself' });
        }

        // Cannot suspend the last superadmin
        if (user.role === 'superadmin') {
            const activeSuperadmins = await AdminUser.countDocuments({
                role: 'superadmin',
                status: 'active'
            });
            if (activeSuperadmins <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot suspend the last active Super Admin'
                });
            }
        }

        user.status = 'suspended';
        await user.save();

        await logActivity({
            action: 'suspend_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/users/:id/activate
// @desc    Activate suspended user
// @access  Private (Super Admin only)
router.patch('/:id/activate', async (req, res, next) => {
    try {
        const user = await AdminUser.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.status = 'active';
        await user.save();

        await logActivity({
            action: 'activate_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/users/:id/password
// @desc    Reset user password
// @access  Private (Super Admin only)
router.patch('/:id/password', async (req, res, next) => {
    try {
        const { password } = req.body;

        if (!password || password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        const user = await AdminUser.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = password;
        await user.save();

        await logActivity({
            action: 'update_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            performedBy: req.user,
            details: { passwordReset: true },
            req,
        });

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/users/:id
// @desc    Delete user (permanent)
// @access  Private (Super Admin only)
router.delete('/:id', async (req, res, next) => {
    try {
        const user = await AdminUser.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Cannot delete yourself
        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        }

        // Cannot delete the last superadmin
        if (user.role === 'superadmin') {
            const superadminCount = await AdminUser.countDocuments({ role: 'superadmin' });
            if (superadminCount <= 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete the last Super Admin'
                });
            }
        }

        await AdminUser.findByIdAndDelete(req.params.id);

        await logActivity({
            action: 'delete',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            performedBy: req.user,
            req,
        });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/users/:id/direct-publish
// @desc    Toggle direct publish permission for writers
// @access  Private (Super Admin only)
router.patch('/:id/direct-publish', async (req, res, next) => {
    try {
        const { enabled } = req.body;
        const user = await AdminUser.findById(req.params.id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Only applicable to writers
        if (user.role !== 'writer') {
            return res.status(400).json({
                success: false,
                message: 'Direct publish permission only applies to writers'
            });
        }

        user.directPublishEnabled = enabled;
        await user.save();

        await logActivity({
            action: 'update_user',
            targetType: 'user',
            targetId: user._id,
            targetName: user.name,
            performedBy: req.user,
            details: { directPublishEnabled: enabled },
            req,
        });

        res.json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/users/:id/stats
// @desc    Get user performance statistics
// @access  Private (Super Admin for others, any user for self)
router.get('/:id/stats', protect, async (req, res, next) => {
    try {
        const userId = req.params.id;

        // Only super admin can view other's stats
        if (req.user._id.toString() !== userId && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Unauthorized' });
        }

        const Article = require('../models/Article');
        const now = new Date();
        const startOfDay = new Date(now.setHours(0, 0, 0, 0));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));

        // Parse query params for date range, default to last 30 days
        const endDate = req.query.endDate ? new Date(req.query.endDate) : new Date();
        // Reset time part of endDate to end of day
        endDate.setHours(23, 59, 59, 999);

        let startDate;
        if (req.query.startDate) {
            startDate = new Date(req.query.startDate);
        } else {
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 30);
        }
        // Reset time part of startDate to start of day
        startDate.setHours(0, 0, 0, 0);

        const [today, thisWeek, thisMonth, total, viewsData, statusBreakdown, dailyTrend] = await Promise.all([
            Article.countDocuments({ author: userId, createdAt: { $gte: startOfDay }, isDeleted: false }),
            Article.countDocuments({ author: userId, createdAt: { $gte: startOfWeek }, isDeleted: false }),
            Article.countDocuments({ author: userId, createdAt: { $gte: startOfMonth }, isDeleted: false }),
            Article.countDocuments({ author: userId, isDeleted: false }),
            Article.aggregate([
                { $match: { author: new mongoose.Types.ObjectId(userId), isDeleted: false } },
                { $group: { _id: null, totalViews: { $sum: '$views' } } }
            ]),
            Article.aggregate([
                { $match: { author: new mongoose.Types.ObjectId(userId), isDeleted: false } },
                { $group: { _id: '$status', count: { $sum: 1 } } }
            ]),
            Article.aggregate([
                {
                    $match: {
                        author: new mongoose.Types.ObjectId(userId),
                        isDeleted: false,
                        createdAt: { $gte: startDate, $lte: endDate }
                    }
                },
                {
                    $group: {
                        _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                        count: { $sum: 1 },
                        views: { $sum: "$views" }
                    }
                },
                { $sort: { _id: 1 } }
            ])
        ]);

        const totalViews = viewsData[0]?.totalViews || 0;
        const avgViewsPerArticle = total > 0 ? Math.round(totalViews / total) : 0;

        const breakdown = statusBreakdown.reduce((acc, { _id, count }) => {
            acc[_id] = count;
            return acc;
        }, {});

        // Process daily stats to ensure all days in range are present
        const dailyStats = [];
        // Calculate number of days in range
        const diffTime = Math.abs(endDate - startDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Loop from 0 to diffDays
        for (let i = 0; i <= diffDays; i++) {
            const d = new Date(startDate);
            d.setDate(d.getDate() + i);
            const dateStr = d.toISOString().split('T')[0];
            const found = dailyTrend.find(item => item._id === dateStr);
            dailyStats.push({
                date: dateStr,
                articles: found ? found.count : 0,
                views: found ? found.views : 0
            });
        }

        res.json({
            success: true,
            data: {
                today,
                thisWeek,
                thisMonth,
                total,
                totalViews,
                avgViewsPerArticle,
                statusBreakdown: {
                    published: breakdown.published || 0,
                    draft: breakdown.draft || 0,
                    review: breakdown.review || 0,
                    inactive: breakdown.inactive || 0
                },
                dailyStats // [{ date, articles, views }]
            }
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
