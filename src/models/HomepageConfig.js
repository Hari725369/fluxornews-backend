const mongoose = require('mongoose');

const HomepageConfigSchema = new mongoose.Schema({
    heroArticle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        default: null
    },
    subFeaturedArticles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article'
    }],
    breakingNews: {
        active: {
            type: Boolean,
            default: false
        },
        text: {
            type: String,
            default: ''
        },
        link: {
            type: String,
            default: ''
        }
    },
    sections: [{
        category: {
            type: String,
            required: true
        },
        layout: {
            type: String,
            enum: ['grid', 'list', 'carousel'],
            default: 'grid'
        },
        order: {
            type: Number,
            default: 0
        },
        active: {
            type: Boolean,
            default: true
        }
    }],
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser'
    },
    lastUpdated: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Ensure only one config document exists typically, but we can manage via singleton logic in controller
module.exports = mongoose.model('HomepageConfig', HomepageConfigSchema);
