const express = require('express');
const router = express.Router();
const Reader = require('../models/Reader');
const { protect, requireSuperAdmin } = require('../middleware/auth');

// All routes require Super Admin
router.use(protect);
router.use(requireSuperAdmin);

// @route   GET /api/subscribers
// @desc    Get all subscribers with pagination
// @access  Private (Super Admin only)
router.get('/', async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const skip = (page - 1) * limit;

        const query = {};

        // Filter by type
        if (req.query.type === 'subscribers') {
            query.isSubscriber = true;
        } else if (req.query.type === 'registered') {
            query.isRegistered = true;
        }

        // Filter by status
        if (req.query.status) {
            query.status = req.query.status;
        }

        // Search by email or name
        if (req.query.search) {
            query.$or = [
                { email: { $regex: req.query.search, $options: 'i' } },
                { name: { $regex: req.query.search, $options: 'i' } },
            ];
        }

        const total = await Reader.countDocuments(query);
        const readers = await Reader.find(query)
            .select('-password -savedArticles')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        res.json({
            success: true,
            count: readers.length,
            total,
            page,
            pages: Math.ceil(total / limit),
            data: readers,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/subscribers/stats
// @desc    Get subscriber statistics
// @access  Private (Super Admin only)
router.get('/stats', async (req, res, next) => {
    try {
        const total = await Reader.countDocuments();
        const subscribers = await Reader.countDocuments({ isSubscriber: true });
        const registered = await Reader.countDocuments({ isRegistered: true });
        const active = await Reader.countDocuments({ status: 'active' });
        const suspended = await Reader.countDocuments({ status: 'suspended' });

        // Get subscribers in last 7 days
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        const newThisWeek = await Reader.countDocuments({
            createdAt: { $gte: weekAgo }
        });

        res.json({
            success: true,
            data: {
                total,
                subscribers,
                registered,
                active,
                suspended,
                newThisWeek
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/subscribers/:id
// @desc    Delete a subscriber/reader
// @access  Private (Super Admin only)
router.delete('/:id', async (req, res, next) => {
    try {
        const reader = await Reader.findById(req.params.id);
        if (!reader) {
            return res.status(404).json({ success: false, message: 'Reader not found' });
        }

        await Reader.findByIdAndDelete(req.params.id);

        res.json({ success: true, message: 'Reader deleted successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/subscribers/:id/suspend
// @desc    Suspend a reader
// @access  Private (Super Admin only)
router.patch('/:id/suspend', async (req, res, next) => {
    try {
        const reader = await Reader.findById(req.params.id);
        if (!reader) {
            return res.status(404).json({ success: false, message: 'Reader not found' });
        }

        reader.status = 'suspended';
        await reader.save();

        res.json({ success: true, data: reader });
    } catch (error) {
        next(error);
    }
});

// @route   PATCH /api/subscribers/:id/activate
// @desc    Activate a suspended reader
// @access  Private (Super Admin only)
router.patch('/:id/activate', async (req, res, next) => {
    try {
        const reader = await Reader.findById(req.params.id);
        if (!reader) {
            return res.status(404).json({ success: false, message: 'Reader not found' });
        }

        reader.status = 'active';
        await reader.save();

        res.json({ success: true, data: reader });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/subscribers/export
// @desc    Export subscribers as CSV
// @access  Private (Super Admin only)
router.get('/export', async (req, res, next) => {
    try {
        const readers = await Reader.find({ isSubscriber: true })
            .select('email name subscribedAt isRegistered')
            .sort({ subscribedAt: -1 });

        // Create CSV content
        const csvHeader = 'Email,Name,Subscribed Date,Is Registered,Method\n';
        const csvRows = readers.map(r =>
            `"${r.email}","${r.name || ''}","${r.subscribedAt ? new Date(r.subscribedAt).toISOString() : ''}","${r.isRegistered ? 'Yes' : 'No'}","${r.authProvider || 'otp'}"`
        ).join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
        res.send(csvHeader + csvRows);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
