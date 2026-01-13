require('dotenv').config({ path: './.env' });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');

const automobilesCategory = {
    name: "Automobiles",
    slug: "automobiles",
    description: "Comprehensive coverage of the automotive industry. Latest car launches, reviews, industry trends, and innovations shaping the future of mobility.",
    metaTitle: "Automobiles - Car News, Reviews & Auto Industry | Fluxor",
    metaKeywords: "automobiles, cars, automotive, car reviews, auto industry, vehicles, car news, auto shows, car launches, automotive tech, driving, motor industry",
    color: "#DC2626",
    showInHeader: false,
    isActive: true
};

const addCategory = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected...');

        const result = await Category.findOneAndUpdate(
            { slug: automobilesCategory.slug },
            automobilesCategory,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        console.log(`✅ Added/Updated: ${result.name}`);
        console.log(`   Slug: ${result.slug}`);
        console.log(`   Color: ${result.color}`);

        process.exit(0);
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
};

addCategory();
