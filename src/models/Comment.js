const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    article: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
        required: true
    },
    // If user is logged in, link to Reader. If not, store name/email.
    reader: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reader',
        default: null
    },
    authorName: {
        type: String,
        required: true
    },
    authorEmail: {
        type: String, // Optional, only if guest comments allowed later, but good to have
        select: false // Hide email from public
    },
    content: {
        type: String,
        required: true,
        trim: true,
        maxlength: 1000
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'spam'],
        default: 'pending' // STRICT MODERATION: All comments must be approved
    },
    parentComment: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    likes: {
        type: Number,
        default: 0
    },
    likedBy: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Reader'
    }],
    isEdited: {
        type: Boolean,
        default: false
    },
    editedAt: {
        type: Date
    },
    ipAddress: {
        type: String,
        select: false
    }
}, {
    timestamps: true
});

// Index for fast lookups by article and status
commentSchema.index({ article: 1, status: 1 });
commentSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Comment', commentSchema);
