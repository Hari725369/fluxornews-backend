const cron = require('node-cron');
const Article = require('../models/Article');
const LifecycleConfig = require('../models/LifecycleConfig');

/**
 * Lifecycle Jobs
 * - Daily: Move articles older than X days from hot → archive
 * - Monthly: Move articles older than Y years from archive → cold
 */

// Run daily at 2:00 AM
const hotToArchiveJob = cron.schedule('0 2 * * *', async () => {
    try {
        const config = await LifecycleConfig.getConfig();

        if (!config.enableAutomation) {
            console.log('[Lifecycle] Automation disabled, skipping hot→archive');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.hotToArchiveDays);

        const result = await Article.updateMany(
            {
                lifecycleStage: 'hot',
                status: 'published',
                publishedAt: { $lte: cutoffDate },
                isDeleted: false,
            },
            {
                $set: {
                    lifecycleStage: 'archive',
                    archivedAt: new Date(),
                },
            }
        );

        // Update config stats
        config.lastHotToArchiveRun = new Date();
        config.lastRunStats.hotToArchiveCount = result.modifiedCount;
        await config.save();

        console.log(`[Lifecycle] Moved ${result.modifiedCount} articles from hot → archive`);
    } catch (error) {
        console.error('[Lifecycle] Hot to archive job failed:', error);
    }
}, {
    scheduled: false, // Don't start automatically, we'll start after DB connects
});

// Run monthly on the 1st at 3:00 AM
const archiveToColdJob = cron.schedule('0 3 1 * *', async () => {
    try {
        const config = await LifecycleConfig.getConfig();

        if (!config.enableAutomation) {
            console.log('[Lifecycle] Automation disabled, skipping archive→cold');
            return;
        }

        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - config.archiveToColdDays);

        const result = await Article.updateMany(
            {
                lifecycleStage: 'archive',
                status: 'published',
                publishedAt: { $lte: cutoffDate },
                isDeleted: false,
            },
            {
                $set: { lifecycleStage: 'cold' },
            }
        );

        // Update config stats
        config.lastArchiveToColdRun = new Date();
        config.lastRunStats.archiveToColdCount = result.modifiedCount;
        await config.save();

        console.log(`[Lifecycle] Moved ${result.modifiedCount} articles from archive → cold`);
    } catch (error) {
        console.error('[Lifecycle] Archive to cold job failed:', error);
    }
}, {
    scheduled: false,
});

// Start all lifecycle jobs
const startLifecycleJobs = () => {
    hotToArchiveJob.start();
    archiveToColdJob.start();
    console.log('[Lifecycle] Scheduled jobs started');
};

// Stop all lifecycle jobs
const stopLifecycleJobs = () => {
    hotToArchiveJob.stop();
    archiveToColdJob.stop();
    console.log('[Lifecycle] Scheduled jobs stopped');
};

module.exports = {
    startLifecycleJobs,
    stopLifecycleJobs,
    hotToArchiveJob,
    archiveToColdJob,
};
