const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const { optimizeAndSaveLocally } = require('../utils/imageOptimize');

// @route   POST /api/upload
// @desc    Upload and optimize image (saves locally)
// @access  Private (Admin only)
router.post('/', protect, upload.single('image'), async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'Please upload an image',
            });
        }

        // Save locally and get URL path
        const folder = req.query.folder || 'articles';
        const imageUrl = await optimizeAndSaveLocally(req.file.buffer, folder);

        res.json({
            success: true,
            data: {
                url: imageUrl,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
