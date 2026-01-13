const express = require('express');
const router = express.Router();
const Tag = require('../models/Tag');
const { protect } = require('../middleware/auth');

// @route   GET /api/tags
// @desc    Get all tags
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const tags = await Tag.find().sort({ name: 1 });

        res.json({
            success: true,
            count: tags.length,
            data: tags,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/tags
// @desc    Create new tag
// @access  Private (Admin only)
router.post('/', protect, async (req, res, next) => {
    try {
        console.log('Creating tag:', req.body);
        const tag = await Tag.create(req.body);

        res.status(201).json({
            success: true,
            data: tag,
        });
    } catch (error) {
        console.error('Error creating tag:', error);
        res.status(400).json({
            success: false,
            message: error.message || 'Failed to create tag'
        });
    }
});

// @route   PUT /api/tags/:id
// @desc    Update tag
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res, next) => {
    try {
        const tag = await Tag.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found',
            });
        }

        res.json({
            success: true,
            data: tag,
        });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/tags/:id
// @desc    Delete tag
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const tag = await Tag.findByIdAndDelete(req.params.id);

        if (!tag) {
            return res.status(404).json({
                success: false,
                message: 'Tag not found',
            });
        }

        res.json({
            success: true,
            message: 'Tag deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
