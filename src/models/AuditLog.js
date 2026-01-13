const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // Type of action performed
    action: {
        type: String,
        required: true,
        enum: [
            'create', 'update', 'delete', 'soft_delete', 'restore',
            'publish', 'unpublish', 'submit_review', 'approve', 'reject',
            'archive', 'unarchive', 'move_cold',
            'login', 'logout', 'create_user', 'update_user', 'suspend_user', 'activate_user',
            'update_lifecycle_config', 'update_config'
        ],
    },
    // Target entity type
    targetType: {
        type: String,
        required: true,
        enum: ['article', 'user', 'category', 'tag', 'lifecycle_config', 'auth', 'config'],
    },
    // Target entity ID
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
    },
    // Target entity name/title (for display without lookup)
    targetName: {
        type: String,
    },
    // User who performed the action
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
        required: true,
    },
    // Name cached for display
    performedByName: {
        type: String,
    },
    // Role at time of action
    performedByRole: {
        type: String,
        enum: ['superadmin', 'editor', 'writer'],
    },
    // Additional details (JSON)
    details: {
        type: mongoose.Schema.Types.Mixed,
    },
    // IP address (optional)
    ipAddress: {
        type: String,
    },
    // User agent (optional)
    userAgent: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 365 * 24 * 60 * 60, // Auto-delete after 1 year (TTL index)
    },
});

// Indexes for efficient querying
auditLogSchema.index({ performedBy: 1, createdAt: -1 });
auditLogSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ createdAt: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
