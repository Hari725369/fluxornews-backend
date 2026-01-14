const mongoose = require('mongoose');
require('dotenv').config();

// Import the actual AdminUser model used by auth.js
const AdminUser = require('./src/models/AdminUser');

async function createAdminUser() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists in AdminUser collection
        const existingAdmin = await AdminUser.findOne({ email: 'admin@fluxornews.com' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists in AdminUser collection!');
            console.log('================================');
            console.log('Email: admin@fluxornews.com');
            console.log('Password: admin123');
            console.log('Role:', existingAdmin.role);
            console.log('Status:', existingAdmin.status);
            console.log('================================');
            await mongoose.connection.close();
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

        console.log('✅ Admin user created successfully in AdminUser collection!');
        console.log('================================');
        console.log('Email: admin@fluxornews.com');
        console.log('Password: admin123');
        console.log('Role: superadmin');
        console.log('Status: active');
        console.log('================================');
        console.log('You can now login at: http://localhost:3000/admin/login');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createAdminUser();
