const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Article title is required'],
        trim: true,
        maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
        type: String,
        lowercase: true,
    },
    intro: {
        type: String,
        maxlength: [500, 'Intro cannot exceed 500 characters'],
        trim: true,
        default: '',
    },
    content: {
        type: String,
        required: [true, 'Article content is required'],
    },
    excerpt: {
        type: String,
        maxlength: [500, 'Excerpt cannot exceed 500 characters'],
    },
    featuredImage: {
        type: String,
        required: [true, 'Featured image is required'],
    },
    imageAlt: {
        type: String,
        default: '',
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: false,
    },
    tags: {
        type: [String],
        default: [],
    },
    country: {
        type: String,
        default: '',
        trim: true,
    },
    isTrending: {
        type: Boolean,
        default: false,
    },
    isFeatured: {
        type: Boolean,
        default: false,
    },
    showPublishDate: {
        type: Boolean,
        default: true,
    },
    showInHomeFeed: {
        type: Boolean,
        default: true,
    },
    // Editorial workflow status
    status: {
        type: String,
        enum: ['draft', 'review', 'published', 'inactive', 'rejected'],
        default: 'draft',
    },
    // Content Lifecycle
    lifecycle: {
        status: {
            type: String,
            enum: ['active', 'archived', 'trash'],
            default: 'active',
            index: true
        },
        archivedAt: {
            type: Date
        },
        archiveReason: {
            type: String, // 'manual', 'automation', 'expired'
        },
        lastReviewDate: {
            type: Date
        }
    },
    // Author (writer who created)
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
    },
    // Editor (who approved/published)
    editor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
    },
    views: {
        type: Number,
        default: 0,
    },
    // Soft delete fields
    isDeleted: {
        type: Boolean,
        default: false,
    },
    deletedAt: {
        type: Date,
    },
    deletedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
    },
    // Update history for audit trail
    updateHistory: [{
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'AdminUser',
        },
        updatedAt: {
            type: Date,
            default: Date.now,
        },
        changes: {
            type: String, // JSON string of what changed
        },
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
    publishedAt: {
        type: Date,
    },
    // When article was moved to archive
    archivedAt: {
        type: Date,
    },
});

// Auto-generate slug from title if not provided
articleSchema.pre('save', async function () {
    // Only generate slug if not manually provided
    if (!this.slug && this.isModified('title')) {
        this.slug = this.title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    // If slug was manually set, sanitize it
    if (this.isModified('slug') && this.slug) {
        this.slug = this.slug
            .toLowerCase()
            .replace(/[^a-z0-9-]+/g, '-')
            .replace(/(^-|-$)/g, '');
    }

    // Update updatedAt
    this.updatedAt = Date.now();

    // Set publishedAt when status changes to published
    if (this.isModified('status') && this.status === 'published' && !this.publishedAt) {
        this.publishedAt = Date.now();
    }

    // Generate excerpt from content if not provided
    if (!this.excerpt && this.content) {
        const plainText = this.content.replace(/<[^>]*>/g, '');
        this.excerpt = plainText.substring(0, 200) + (plainText.length > 200 ? '...' : '');
    }
});

// Create indexes for better query performance
articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ lifecycleStage: 1, status: 1 });
articleSchema.index({ author: 1, status: 1 });
articleSchema.index({ isDeleted: 1 });
articleSchema.index({ slug: 1 }, { unique: true });

module.exports = mongoose.model('Article', articleSchema);

