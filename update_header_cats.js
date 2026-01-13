const mongoose = require('mongoose');
const Category = require('./src/models/Category');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/news-project';

const updateCategories = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const slugsToUpdate = ['breaking-news', 'world', 'technology', 'business'];

        // Find existing categories first to debug
        const cats = await Category.find({});
        console.log('Available categories:', cats.map(c => c.slug));

        const result = await Category.updateMany(
            { slug: { $in: slugsToUpdate } },
            { $set: { showInHeader: true } }
        );

        console.log('Update result:', result);
        console.log('Updated categories for header visibility.');

    } catch (error) {
        console.error('Error updating categories:', error);
    } finally {
        await mongoose.disconnect();
    }
};

updateCategories();
