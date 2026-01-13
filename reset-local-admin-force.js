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

async function resetAdmin() {
    try {
        console.log('Connecting to Local MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/news-website');
        console.log('✅ Connected');

        const email = 'admin@fluxornews.com';
        const newPassword = 'admin123';

        let user = await User.findOne({ email });

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        if (user) {
            console.log('🔄 User exists. Resetting password...');
            user.password = hashedPassword;
            user.role = 'admin';
            user.isActive = true;
            await user.save();
            console.log('✅ Password successfully reset.');
        } else {
            console.log('🆕 Creating new admin user...');
            user = new User({
                email,
                password: hashedPassword,
                name: 'Local Admin',
                role: 'admin',
                isActive: true
            });
            await user.save();
            console.log('✅ New admin user created.');
        }

        console.log('================================');
        console.log('   LOCAL ACCESS RESTORED        ');
        console.log('================================');
        console.log(`Email:    ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log('================================');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

resetAdmin();
