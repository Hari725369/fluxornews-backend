/**
 * Seed Demo Users
 * Creates default demo users for testing the CMS:
 * - Super Admin: superadmin@news.com / SuperAdmin@123
 * - Editor: editor@news.com / Editor@123
 * - Writer: writer@news.com / Writer@123
 * 
 * Run: node seed-demo-users.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('./src/models/AdminUser');

const demoUsers = [
    {
        email: 'superadmin@news.com',
        password: 'SuperAdmin@123',
        name: 'Super Admin',
        role: 'superadmin',
        status: 'active',
    },
    {
        email: 'editor@news.com',
        password: 'Editor@123',
        name: 'Demo Editor',
        role: 'editor',
        status: 'active',
    },
    {
        email: 'writer@news.com',
        password: 'Writer@123',
        name: 'Demo Writer',
        role: 'writer',
        status: 'active',
    },
];

const seedDemoUsers = async () => {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        for (const userData of demoUsers) {
            // Check if user already exists
            const existingUser = await AdminUser.findOne({ email: userData.email });

            if (existingUser) {
                console.log(`⏭️  User ${userData.email} already exists, skipping...`);
                continue;
            }

            // Create new user
            const user = await AdminUser.create(userData);
            console.log(`✅ Created ${userData.role}: ${userData.email}`);
        }

        console.log('\n📋 Demo Users Summary:');
        console.log('━'.repeat(50));
        console.log('| Role          | Email                  | Password       |');
        console.log('━'.repeat(50));
        console.log('| Super Admin   | superadmin@news.com    | SuperAdmin@123 |');
        console.log('| Editor        | editor@news.com        | Editor@123     |');
        console.log('| Writer        | writer@news.com        | Writer@123     |');
        console.log('━'.repeat(50));

        console.log('\n🎉 Demo users seeding complete!');

    } catch (error) {
        console.error('❌ Error seeding demo users:', error.message);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

seedDemoUsers();
