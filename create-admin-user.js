const mongoose = require('mongoose');
require('dotenv').config();

// Import the actual AdminUser model used by auth.js
const AdminUser = require('./src/models/AdminUser');

async function createAdminUser() {
    try {
        console.log('🔄 Checking for Admin user...');

        // Check if admin exists in AdminUser collection
        const existingAdmin = await AdminUser.findOne({ email: 'admin@fluxornews.com' });

        if (existingAdmin) {
            console.log('✅ Admin user verified (admin@fluxornews.com)');
            return;
        }

        // Create admin user using AdminUser model
        const admin = new AdminUser({
            email: 'admin@fluxornews.com',
            password: 'admin123', // Will be hashed by pre-save hook
            name: 'Admin',
            role: 'superadmin',
            status: 'active',
            directPublishEnabled: true
        });

        await admin.save();

        console.log('✅ Admin user created successfully: admin@fluxornews.com / admin123');
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
    }
}

module.exports = createAdminUser;
