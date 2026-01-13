require('dotenv').config();
const mongoose = require('mongoose');

/**
 * Production Readiness Verification Script
 * Run this before deploying to production
 */

console.log('\\n🔍 Production Readiness Check\\n');
console.log('================================\\n');

let hasErrors = false;
let hasWarnings = false;

// 1. Check Environment Variables
console.log('📋 Checking Environment Variables...');

const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
    'FRONTEND_URL'
];

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`   ❌ Missing: ${varName}`);
        hasErrors = true;
    } else {
        console.log(`   ✅ ${varName}`);
    }
});

// 2. Check JWT Secret Strength
console.log('\\n🔐 Checking JWT Secret...');
const jwtSecret = process.env.JWT_SECRET || '';

if (jwtSecret.length < 32) {
    console.error('   ❌ JWT_SECRET is too short (minimum 32 characters)');
    hasErrors = true;
} else if (jwtSecret.length < 64) {
    console.warn('   ⚠️  JWT_SECRET should be at least 64 characters');
    hasWarnings = true;
} else {
    console.log('   ✅ JWT_SECRET is strong');
}

// Check if JWT secret looks like a default/example value
if (jwtSecret.includes('change-this') || jwtSecret.includes('your-') || jwtSecret.includes('secret')) {
    console.error('   ❌ JWT_SECRET appears to be a default value - generate a new one!');
    hasErrors = true;
}

// 3. Check MongoDB Connection
console.log('\\n🗄️  Checking Database Connection...');

async function checkDatabase() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('   ✅ Successfully connected to MongoDB');

        // Check if using local MongoDB in production
        if (process.env.NODE_ENV === 'production' && process.env.MONGODB_URI.includes('localhost')) {
            console.error('   ❌ Using localhost MongoDB in production!');
            hasErrors = true;
        }

        await mongoose.disconnect();
    } catch (error) {
        console.error('   ❌ Failed to connect to MongoDB:', error.message);
        hasErrors = true;
    }
}

// 4. Check Cloudinary Configuration
console.log('\\n☁️  Checking Cloudinary Configuration...');

const cloudinary = require('cloudinary').v2;

try {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });

    // Try to ping Cloudinary
    cloudinary.api.ping((error, result) => {
        if (error) {
            console.error('   ❌ Cloudinary configuration invalid:', error.message);
            hasErrors = true;
        } else {
            console.log('   ✅ Cloudinary configured correctly');
        }

        finishChecks();
    });
} catch (error) {
    console.error('   ❌ Cloudinary error:', error.message);
    hasErrors = true;
    finishChecks();
}

// 5. Check FRONTEND_URL
console.log('\\n🌐 Checking Frontend URL...');

if (process.env.FRONTEND_URL) {
    if (process.env.FRONTEND_URL.startsWith('http://') && process.env.NODE_ENV === 'production') {
        console.warn('   ⚠️  Frontend URL uses HTTP instead of HTTPS in production');
        hasWarnings = true;
    } else if (process.env.FRONTEND_URL.includes('localhost') && process.env.NODE_ENV === 'production') {
        console.error('   ❌ Frontend URL points to localhost in production');
        hasErrors = true;
    } else {
        console.log('   ✅ Frontend URL configured');
    }
}

// 6. Check Node Environment
console.log('\\n⚙️  Checking Node Environment...');
console.log(`   NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);

if (!process.env.NODE_ENV) {
    console.warn('   ⚠️  NODE_ENV is not set');
    hasWarnings = true;
}

// Database check (async)
checkDatabase().then(() => {
    // Cloudinary check is async and will call finishChecks
});

function finishChecks() {
    console.log('\\n================================');
    console.log('\\n📊 Summary:\\n');

    if (hasErrors) {
        console.error('❌ FAILED: Please fix the errors above before deploying to production!\\n');
        process.exit(1);
    } else if (hasWarnings) {
        console.warn('⚠️  WARNINGS: Review warnings above. You may proceed but should address them.\\n');
        process.exit(0);
    } else {
        console.log('✅ SUCCESS: All checks passed! Ready for production deployment.\\n');
        process.exit(0);
    }
}

// Timeout to ensure script doesn't hang
setTimeout(() => {
    console.error('\\n⏱️  Verification timed out');
    process.exit(1);
}, 15000);
