const mongoose = require('mongoose');

const lifecycleConfigSchema = new mongoose.Schema({
    // Days before articles move from hot to archive
    hotToArchiveDays: {
        type: Number,
        default: 90,
        min: 1,
        max: 365,
    },
    // Days before articles move from archive to cold storage
    archiveToColdDays: {
        type: Number,
        default: 730, // 2 years
        min: 180,
        max: 3650, // 10 years
    },
    // Enable/disable automated lifecycle transitions
    enableAutomation: {
        type: Boolean,
        default: true,
    },
    // Last time the automation ran
    lastHotToArchiveRun: {
        type: Date,
    },
    lastArchiveToColdRun: {
        type: Date,
    },
    // Statistics from last run
    lastRunStats: {
        hotToArchiveCount: { type: Number, default: 0 },
        archiveToColdCount: { type: Number, default: 0 },
    },
    // Who last updated the config
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Ensure only one config document exists (singleton pattern)
lifecycleConfigSchema.statics.getConfig = async function () {
    let config = await this.findOne();
    if (!config) {
        config = await this.create({});
    }
    return config;
};

module.exports = mongoose.model('LifecycleConfig', lifecycleConfigSchema);
