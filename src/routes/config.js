const express = require('express');
const router = express.Router();
const SiteConfig = require('../models/SiteConfig');
const { protect, requireSuperAdmin } = require('../middleware/auth');
const logActivity = require('../utils/activityLogger');

// @route   GET /api/config
// @desc    Get site configuration
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const config = await SiteConfig.getConfig();
        res.status(200).json({
            success: true,
            data: config
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/config
// @desc    Update site configuration
// @access  Private/Super Admin
router.put('/', protect, requireSuperAdmin, async (req, res, next) => {
    try {
        const config = await SiteConfig.getConfig();

        console.log('Update Config Request - Features:', JSON.stringify(req.body.features, null, 2));

        // Explicitly update fields to ensure Mongoose detects changes
        if (req.body.homeLayout) config.homeLayout = req.body.homeLayout;
        if (req.body.branding) config.branding = req.body.branding;

        // Handle features update
        if (req.body.features) {
            config.features = req.body.features;
            // Explicitly mark as modified to force update if Mongoose misses deep changes
            config.markModified('features');
        }

        if (req.body.socialLinks) config.socialLinks = req.body.socialLinks;
        if (req.body.footer) config.footer = req.body.footer;

        config.updatedBy = req.user._id;
        config.updatedAt = Date.now();

        const savedConfig = await config.save();

        // Log saved state to verify
        // console.log('Saved Config State:', JSON.stringify(savedConfig.features, null, 2));

        await logActivity({
            action: 'update_config',
            targetType: 'config',
            targetId: config._id,
            targetName: 'Global Site Config',
            performedBy: req.user,
            req
        });

        res.status(200).json({
            success: true,
            data: savedConfig
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
