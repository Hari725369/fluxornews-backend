require('dotenv').config();
const mongoose = require('mongoose');

// Fallback URI if .env is missing
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/news-production';

const seed = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Define Category Schema Inline
        const CategorySchema = new mongoose.Schema({
            name: { type: String, required: true, unique: true },
            slug: { type: String, required: true, unique: true },
            icon: { type: String, default: '📄' },
            order: { type: Number, default: 0 },
            createdAt: { type: Date, default: Date.now }
        });

        // Get or Create Model
        const Category = mongoose.models.Category || mongoose.model('Category', CategorySchema);

        const defaultCategories = [
            { name: 'Breaking News', icon: '🔴', order: 1, slug: 'breaking-news' },
            { name: 'World', icon: '🌍', order: 2, slug: 'world' },
            { name: 'Politics', icon: '🏛️', order: 3, slug: 'politics' },
            { name: 'Sports', icon: '⚽', order: 4, slug: 'sports' },
            { name: 'Technology', icon: '💻', order: 5, slug: 'technology' },
            { name: 'Business', icon: '💼', order: 6, slug: 'business' },
            { name: 'Entertainment', icon: '🎬', order: 7, slug: 'entertainment' },
            { name: 'Health', icon: '🏥', order: 8, slug: 'health' },
            { name: 'Local News', icon: '📍', order: 9, slug: 'local-news' },
        ];

        for (const cat of defaultCategories) {
            const exists = await Category.findOne({ slug: cat.slug });
            if (!exists) {
                await Category.create(cat);
                console.log(`✅ Created category: ${cat.name}`);
            } else {
                console.log(`ℹ️ Category already exists: ${cat.name}`);
            }
        }

        console.log('🎉 Seeding complete!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding:', error);
        process.exit(1);
    }
};

seed();
