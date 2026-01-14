const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function diagnoseAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check User collection (created by create-simple-admin.js)
        const UserSchema = new mongoose.Schema({}, { strict: false, collection: 'users' });
        const User = mongoose.model('TempUser', UserSchema);

        const usersInUserCollection = await User.find();
        console.log('\n📊 Users in "users" collection:', usersInUserCollection.length);
        usersInUserCollection.forEach(u => {
            console.log(`   - ${u.email} (role: ${u.role})`);
        });

        // Check AdminUser collection (used by auth.js)
        const AdminUserSchema = new mongoose.Schema({}, { strict: false, collection: 'adminusers' });
        const AdminUser = mongoose.model('TempAdminUser', AdminUserSchema);

        const usersInAdminUserCollection = await AdminUser.find();
        console.log('\n📊 Users in "adminusers" collection:', usersInAdminUserCollection.length);
        usersInAdminUserCollection.forEach(u => {
            console.log(`   - ${u.email} (role: ${u.role})`);
        });

        // Check if admin@fluxornews.com exists in User collection
        const adminInUsers = await User.findOne({ email: 'admin@fluxornews.com' });
        if (adminInUsers) {
            console.log('\n✅ admin@fluxornews.com found in "users" collection');
            console.log('   Password hash:', adminInUsers.password.substring(0, 20) + '...');

            // Test password
            const isMatch = await bcrypt.compare('admin123', adminInUsers.password);
            console.log('   Password "admin123" matches:', isMatch);
        } else {
            console.log('\n❌ admin@fluxornews.com NOT found in "users" collection');
        }

        // Check if admin@fluxornews.com exists in AdminUser collection
        const adminInAdminUsers = await AdminUser.findOne({ email: 'admin@fluxornews.com' });
        if (adminInAdminUsers) {
            console.log('\n✅ admin@fluxornews.com found in "adminusers" collection');
        } else {
            console.log('\n❌ admin@fluxornews.com NOT found in "adminusers" collection');
            console.log('   ⚠️  THIS IS THE PROBLEM! Auth route looks in "adminusers" but user is in "users"');
        }

        console.log('\n🔍 DIAGNOSIS:');
        console.log('   - create-simple-admin.js creates users in "users" collection');
        console.log('   - auth.js login route looks for users in "adminusers" collection');
        console.log('   - Solution: Create user in "adminusers" collection OR update auth.js to use "users"');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

diagnoseAdmin();
