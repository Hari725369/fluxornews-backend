const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Production MongoDB URI (from your setup)
const MONGODB_URI = 'mongodb+srv://fluxornews:5I1ZzffFtTzxeDXI@fluxornews.edt2frg.mongodb.net/fluxornews?retryWrites=true&w=majority';

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, enum: ['admin', 'writer'], default: 'writer' },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

async function createProductionAdmin() {
    try {
        console.log('Connecting to Production Database...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas');

        const email = 'admin@fluxornews.com';
        const password = 'admin123';

        // Check availability
        const existing = await User.findOne({ email });
        if (existing) {
            console.log('⚠️ User already exists. Updating password...');
            existing.password = await bcrypt.hash(password, 10);
            existing.role = 'admin';
            existing.isActive = true;
            await existing.save();
            console.log('✅ Password updated for existing user.');
        } else {
            console.log('Creating new admin user...');
            const hashedPassword = await bcrypt.hash(password, 10);
            const user = new User({
                email,
                password: hashedPassword,
                name: 'Production Admin',
                role: 'admin',
                isActive: true
            });
            await user.save();
            console.log('✅ New admin user created.');
        }

        console.log('==========================================');
        console.log('       PRODUCTION ACCESS GRANTED          ');
        console.log('==========================================');
        console.log(`URL:      https://www.fluxornews.com/admin/login`);
        console.log(`Email:    ${email}`);
        console.log(`Password: ${password}`);
        console.log('==========================================');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.connection.close();
    }
}

createProductionAdmin();
