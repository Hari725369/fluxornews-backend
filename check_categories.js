require('dotenv').config();
const mongoose = require('mongoose');
const Category = require('./src/models/Category');
const connectDB = require('./src/config/database');

const checkCategories = async () => {
    try {
        await connectDB();

        console.log('Checking for Categories in DB...');
        const categories = await Category.find({}).sort({ order: 1 });

        console.log(`Found ${categories.length} categories:`);
        categories.forEach(c => {
            console.log(`- ${c.name} (Slug: ${c.slug}, ID: ${c._id})`);
        });

        const local = categories.find(c => c.name === 'Local News');
        if (local) {
            console.log('\n✅ "Local News" category EXISTS.');
        } else {
            console.log('\n❌ "Local News" category MISSING.');
        }

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkCategories();
