require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('./src/models/AdminUser');
const Category = require('./src/models/Category');
const connectDB = require('./src/config/database');

const seedDatabase = async () => {
    try {
        // Connect to database
        await connectDB();

        console.log('🌱 Starting database seed...');

        // Create admin users
        const adminExists = await AdminUser.findOne({ email: 'superadmin@fluxornews.com' });

        if (!adminExists) {
            await AdminUser.create({
                email: 'superadmin@fluxornews.com',
                password: 'admin@9705350979_',
                name: 'Super Admin',
                role: 'superadmin',
            });
            console.log('✅ Super Admin created (superadmin@fluxornews.com / admin@9705350979_)');
        } else {
            console.log('ℹ️ Super Admin already exists');
        }

        // Create default categories
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
            const exists = await Category.findOne({ name: cat.name });
            if (!exists) {
                await Category.create(cat);
                console.log(`✅ Created category: ${cat.name}`);
            }
        }

        console.log('🎉 Database seeded successfully!');
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase();
