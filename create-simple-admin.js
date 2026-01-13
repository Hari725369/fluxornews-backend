const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// User model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'writer'], default: 'writer' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createAdmin() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Check if admin exists
        const existingAdmin = await User.findOne({ email: 'admin@fluxornews.com' });

        if (existingAdmin) {
            console.log('⚠️  Admin user already exists!');
            console.log('Email: admin@fluxornews.com');
            console.log('Password: admin123');
            await mongoose.connection.close();
            return;
        }

        // Hash password
        const hashedPassword = await bcrypt.hash('admin123', 10);

        // Create admin user
        const admin = new User({
            email: 'admin@fluxornews.com',
            password: hashedPassword,
            name: 'Admin',
            role: 'admin',
            isActive: true
        });

        await admin.save();

        console.log('✅ Admin user created successfully!');
        console.log('================================');
        console.log('Email: admin@fluxornews.com');
        console.log('Password: admin123');
        console.log('Role: admin');
        console.log('================================');
        console.log('You can now login at: http://localhost:3000/admin/login');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

createAdmin();
