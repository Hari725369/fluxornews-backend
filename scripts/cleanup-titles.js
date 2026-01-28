require('dotenv').config();
const mongoose = require('mongoose');
const Article = require('../src/models/Article');
const connectDB = require('../src/config/database');

const cleanupTitles = async () => {
    try {
        await connectDB();
        console.log('Connected to database...');

        const suffix = '| Fluxor News';
        const articles = await Article.find({ title: { $regex: /\|\s*Fluxor\s*News$/i } });

        console.log(`Found ${articles.length} articles with hardcoded branding.`);

        let updatedCount = 0;
        for (const article of articles) {
            const oldTitle = article.title;
            // Remove the suffix, case insensitive
            const newTitle = oldTitle.replace(/\|\s*Fluxor\s*News$/i, '').trim();

            if (newTitle !== oldTitle) {
                article.title = newTitle;
                // Prevent slug regeneration if possible, or let it regenerate if desired.
                // In Article model, slug regens if title modified. 
                // We typically want to keep legacy slugs to preserve SEO links.
                // So we should manually mark slug as NOT modified or force it to stay same?
                // Mongoose pre-save checks `isModified('slug')`.
                // Actually, if we change title, pre-save WILL regen slug if we don't handle it.
                // Let's force set slug to itself to "modify" it so logic triggers or DOESNT trigger?
                // Logic: if (!this.slug && this.isModified('title')) -> regen
                // So if slug exists, it WON'T regen unless we wipe it.
                // existing articles have slugs. So it's safe! title changes, slug stays.

                await article.save();
                console.log(`Updated: "${oldTitle}" -> "${newTitle}"`);
                updatedCount++;
            }
        }

        console.log(`\nCleanup complete! Updated ${updatedCount} articles.`);
        process.exit(0);
    } catch (error) {
        console.error('Error cleaning up titles:', error);
        process.exit(1);
    }
};

cleanupTitles();
