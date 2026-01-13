require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/news-production';

mongoose.connect(MONGODB_URI)
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch(err => {
        console.error('❌ MongoDB connection error:', err);
        process.exit(1);
    });

// Define User Schema (inline to avoid import issues)
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor', 'viewer'], default: 'viewer' },
    createdAt: { type: Date, default: Date.now }
});

// Hash password before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

const User = mongoose.model('AdminUser', userSchema);

// Create admin user
async function createAdminUser() {
    try {
        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: 'admin@news.com' });

        if (existingAdmin) {
            console.log('ℹ️  Admin user already exists');
            console.log('Email: admin@news.com');
            console.log('You can log in now!');
            process.exit(0);
        }

        // Create new admin user
        const adminUser = new User({
            name: 'Admin User',
            email: 'admin@news.com',
            password: 'Admin@123', // Will be hashed by pre-save hook
            role: 'admin'
        });

        await adminUser.save();

        console.log('');
        console.log('🎉 Admin user created successfully!');
        console.log('');
        console.log('📧 Email: admin@news.com');
        console.log('🔑 Password: Admin@123');
        console.log('');
        console.log('✅ You can now log in at: http://localhost:3000/admin/login');
        console.log('');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating admin user:', error.message);
        process.exit(1);
    }
}

createAdminUser();
