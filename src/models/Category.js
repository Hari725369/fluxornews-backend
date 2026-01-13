const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Category name is required'],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
    description: {
        type: String,
        trim: true,
    },
    metaTitle: {
        type: String, // SEO Title
        trim: true,
    },
    metaKeywords: {
        type: String, // Comma separated
        trim: true,
    },
    icon: {
        type: String, // Optional icon class or emoji
    },
    color: {
        type: String, // Optional hex color or class name
        default: '#2563EB' // Default primary blue
    },
    order: {
        type: Number,
        default: 0, // For custom ordering in menus
    },
    parent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        default: null
    },
    isActive: {
        type: Boolean,
        default: true
    },
    showInHeader: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Auto-generate slug checked in controller now to avoid middleware errors

module.exports = mongoose.model('Category', categorySchema);
