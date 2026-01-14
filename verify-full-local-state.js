const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const AdminUser = require('./src/models/AdminUser');
require('dotenv').config();

async function deepVerify() {
    try {
        console.log('🔍 STEP 1: Connecting to Local MongoDB...');
        console.log(`   URI: ${process.env.MONGODB_URI}`);
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('   ✅ Connected successfully');

        console.log('\n🔍 STEP 2: checking for "admin@fluxornews.com"...');
        const user = await AdminUser.findOne({ email: 'admin@fluxornews.com' }).select('+password');

        if (!user) {
            console.log('   ❌ User NOT FOUND in "adminusers" collection.');
            console.log('   ⚠️  Action: You need to run the reset script again.');
            return;
        }

        console.log('   ✅ User found:');
        console.log(`      ID: ${user._id}`);
        console.log(`      Email: ${user.email}`);
        console.log(`      Role: ${user.role}`);
        console.log(`      Status: ${user.status}`);
        console.log(`      DirectPublish: ${user.directPublishEnabled}`);

        console.log('\n🔍 STEP 3: Verifying Password Hash...');
        const isMatch = await bcrypt.compare('admin123', user.password);

        if (isMatch) {
            console.log('   ✅ Password "admin123" MATCHES the hash in database.');
        } else {
            console.log('   ❌ Password "admin123" DOES NOT MATCH the hash.');
            console.log('   ⚠️  Action: Password corrupted. Run reset script.');
        }

        console.log('\n🔍 STEP 4: Verifying Code Logic (Simulation)...');
        // Simulate the exact logic from auth.js
        if (typeof user.matchPassword !== 'function') {
            console.log('   ❌ CRITICAL: user.matchPassword is NOT a function. Model definition is broken.');
        } else {
            const methodCheck = await user.matchPassword('admin123');
            console.log(`   ✅ user.matchPassword('admin123') returned: ${methodCheck}`);
        }

    } catch (error) {
        console.error('   ❌ ERROR:', error);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

deepVerify();
