const express = require('express');
const router = express.Router();
const Article = require('../models/Article');
const { protect } = require('../middleware/auth');

// @route   GET /api/lifecycle/stats
// @desc    Get counts of lifecycle states
// @access  Private (Admin)
router.get('/stats', protect, async (req, res) => {
    try {
        const stats = await Article.aggregate([
            {
                $group: {
                    _id: '$lifecycle.status',
                    count: { $sum: 1 }
                }
            }
        ]);

        const formattedStats = {
            active: 0,
            archived: 0,
            trash: 0
        };

        stats.forEach(stat => {
            if (stat._id) formattedStats[stat._id] = stat.count;
            // Existing articles defaulting to null/undefined count as active (logic handled in finding candidates usually, but for stats grouping, we might see null)
        });

        // Also count those without lifecycle field as active
        const legacyCount = await Article.countDocuments({ 'lifecycle.status': { $exists: false } });
        formattedStats.active += legacyCount;

        res.json({ success: true, data: formattedStats });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   GET /api/lifecycle/candidates
// @desc    Get candidates for archival (e.g. > 90 days old)
// @access  Private (Admin)
router.get('/candidates', protect, async (req, res) => {
    try {
        const ninetyDaysAgo = new Date();
        ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

        const candidates = await Article.find({
            $or: [
                { 'lifecycle.status': 'active' },
                { 'lifecycle.status': { $exists: false } }
            ],
            createdAt: { $lt: ninetyDaysAgo }
        })
            .select('title createdAt author views category lifecycle')
            .sort({ createdAt: 1 })
            .limit(50);

        res.json({ success: true, data: candidates });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/lifecycle/archive
// @desc    Archive articles
// @access  Private (Admin)
router.post('/archive', protect, async (req, res) => {
    try {
        const { articleIds, reason = 'manual' } = req.body;

        if (!Array.isArray(articleIds) || articleIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No articles selected' });
        }

        await Article.updateMany(
            { _id: { $in: articleIds } },
            {
                $set: {
                    'lifecycle.status': 'archived',
                    'lifecycle.archivedAt': new Date(),
                    'lifecycle.archiveReason': reason
                }
            }
        );

        res.json({ success: true, message: `Archived ${articleIds.length} articles` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// @route   POST /api/lifecycle/restore
// @desc    Restore archived articles
// @access  Private (Admin)
router.post('/restore', protect, async (req, res) => {
    try {
        const { articleIds } = req.body;

        if (!Array.isArray(articleIds) || articleIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No articles selected' });
        }

        await Article.updateMany(
            { _id: { $in: articleIds } },
            {
                $set: {
                    'lifecycle.status': 'active',
                    'lifecycle.archivedAt': null,
                    'lifecycle.archiveReason': null
                }
            }
        );

        res.json({ success: true, message: `Restored ${articleIds.length} articles` });
    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
