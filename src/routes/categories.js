const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const Article = require('../models/Article');
const { protect } = require('../middleware/auth');

// @route   GET /api/categories
// @desc    Get all categories
// @access  Public
router.get('/', async (req, res, next) => {
    try {
        const categories = await Category.find()
            .populate('parent', 'name slug')
            .sort({ order: 1, name: 1 })
            .lean();

        // Count articles per category
        const articleCounts = await Article.aggregate([
            { $match: { isDeleted: false } }, // Only count non-deleted articles
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        const countMap = {};
        articleCounts.forEach(item => {
            if (item._id) countMap[item._id.toString()] = item.count;
        });

        const categoriesWithCount = categories.map(cat => ({
            ...cat,
            articleCount: countMap[cat._id.toString()] || 0
        }));

        res.json({
            success: true,
            count: categoriesWithCount.length,
            data: categoriesWithCount,
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/categories/:slug
// @desc    Get single category by slug
// @access  Public
router.get('/:slug', async (req, res, next) => {
    try {
        const category = await Category.findOne({ slug: req.params.slug });

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/categories
// @desc    Create new category
// @access  Private (Admin only)
router.post('/', protect, async (req, res, next) => {
    try {
        const { name, icon, slug, description, color, metaTitle, metaKeywords } = req.body;

        let categorySlug = slug;
        if (!categorySlug && name) {
            categorySlug = name.toLowerCase()
                .replace(/[^a-z0-9]+/g, '-')
                .replace(/(^-|-$)+/g, '');
        }

        const category = await Category.create({
            name,
            icon,
            description,
            color,
            metaTitle,
            metaKeywords,
            slug: categorySlug,
            order: req.body.order || 0
        });

        res.status(201).json({
            success: true,
            data: category,
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/categories/reorder
// @desc    Reorder categories
// @access  Private (Admin only)
router.put('/reorder', protect, async (req, res, next) => {
    try {
        const { categories } = req.body;

        if (!categories || !Array.isArray(categories)) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        const updates = categories.map((cat, index) => {
            const updateData = { order: index };
            if (cat.isActive !== undefined) updateData.isActive = cat.isActive;
            if (cat.showInHeader !== undefined) updateData.showInHeader = cat.showInHeader;
            return Category.findByIdAndUpdate(cat._id, updateData);
        });

        await Promise.all(updates);

        res.json({ success: true, message: 'Categories reordered' });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/categories/:id
// @desc    Update category
// @access  Private (Admin only)
router.put('/:id', protect, async (req, res, next) => {
    try {
        const { name, icon, slug, parent, isActive } = req.body;

        // Build update object
        const updateFields = {};
        if (name) updateFields.name = name;
        if (icon) updateFields.icon = icon;
        if (req.body.description !== undefined) updateFields.description = req.body.description;
        if (req.body.color !== undefined) updateFields.color = req.body.color;
        if (req.body.metaTitle !== undefined) updateFields.metaTitle = req.body.metaTitle;
        if (req.body.metaKeywords !== undefined) updateFields.metaKeywords = req.body.metaKeywords;
        if (slug) updateFields.slug = slug;
        if (parent !== undefined) updateFields.parent = parent || null;
        if (isActive !== undefined) updateFields.isActive = isActive;
        if (req.body.showInHeader !== undefined) updateFields.showInHeader = req.body.showInHeader;

        const category = await Category.findByIdAndUpdate(
            req.params.id,
            updateFields,
            { new: true, runValidators: true }
        ).populate('parent', 'name slug');

        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        res.json({
            success: true,
            data: category
        });
    } catch (err) {
        // Handle duplicate key error
        if (err.code === 11000) {
            return res.status(400).json({ success: false, message: 'Category with this name or slug already exists' });
        }
        next(err);
    }
});

// @route   DELETE /api/categories/:id
// @desc    Delete category
// @access  Private (Admin only)
router.delete('/:id', protect, async (req, res, next) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);

        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Category not found',
            });
        }

        res.json({
            success: true,
            message: 'Category deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
