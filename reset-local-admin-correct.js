const mongoose = require('mongoose');
const AdminUser = require('./src/models/AdminUser'); // Use the REAL model
require('dotenv').config();

async function resetAdminCorrectly() {
    try {
        console.log('Connecting to Local MongoDB...');
        // Ensure we hit the local database specifically
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news-website');
        console.log('✅ Connected');

        const email = 'admin@fluxornews.com';
        const password = 'admin123';

        // Use the AdminUser model to ensure correct collection (adminusers)
        let user = await AdminUser.findOne({ email });

        if (user) {
            console.log('🔄 AdminUser found. Resetting password...');
            user.password = password; // Pre-save hook will hash this
            user.role = 'superadmin'; // Correct enum value from schema
            user.status = 'active';   // Correct enum value from schema
            await user.save();
            console.log('✅ Password successfully reset.');
        } else {
            console.log('🆕 Creating new AdminUser...');
            user = new AdminUser({
                email,
                password: password, // Pre-save hook will hash this
                name: 'Local Admin',
                role: 'superadmin',
                status: 'active'
            });
            await user.save();
            console.log('✅ New AdminUser created.');
        }

        console.log('================================');
        console.log('   LOCAL ACCESS FIXED (REALLY)  ');
        console.log('================================');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('================================');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

resetAdminCorrectly();
