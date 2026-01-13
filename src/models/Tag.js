const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Tag name is required'],
        unique: true,
        trim: true,
    },
    slug: {
        type: String,
        unique: true,
        lowercase: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Auto-generate slug from name
tagSchema.pre('save', async function () {
    if (this.isModified('name')) {
        this.slug = this.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }
});

module.exports = mongoose.model('Tag', tagSchema);
