require('dotenv').config();
const mongoose = require('mongoose');
const AdminUser = require('./src/models/AdminUser');
const connectDB = require('./src/config/database');

const resetAdminUsers = async () => {
    try {
        // Connect to database
        await connectDB();

        console.log('🧹 Cleaning up admin users...');

        // DELETE ALL existing admin users
        const deleted = await AdminUser.deleteMany({});
        console.log(`✅ Deleted ${deleted.deletedCount} existing admin users`);

        // Create FRESH superadmin
        const superadmin = await AdminUser.create({
            email: 'superadmin@fluxornews.com',
            password: 'admin@9705350979_',
            name: 'Super Admin',
            role: 'superadmin',
            status: 'active'
        });

        console.log('✅ Created FRESH Super Admin:');
        console.log('   Email: superadmin@fluxornews.com');
        console.log('   Password: admin@9705350979_');
        console.log('   Role: superadmin');
        console.log('');
        console.log('🎉 You can now login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

resetAdminUsers();
