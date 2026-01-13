const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'writer'], default: 'writer' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function fixAdmin() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Delete existing admin
        await User.deleteOne({ email: 'admin@flux ornews.com' });
        console.log('🗑️ Deleted old admin');

        // Create new admin with correct hash
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('admin123', salt);

        console.log('Generated hash:', hash);

        // Verify hash works
        const matches = await bcrypt.compare('admin123', hash);
        console.log('Hash verification:', matches);

        const admin = new User({
            email: 'admin@fluxornews.com',
            password: hash,
            name: 'Admin',
            role: 'admin',
            isActive: true
        });

        await admin.save();

        console.log('✅ Admin user fixed!');
        console.log('================================');
        console.log('Email: admin@fluxornews.com');
        console.log('Password: admin123');
        console.log('================================');

        await mongoose.connection.close();
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

fixAdmin();
