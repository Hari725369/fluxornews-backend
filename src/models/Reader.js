const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const readerSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        minlength: 6,
        select: false, // Don't include password by default
    },
    authProvider: {
        type: String,
        enum: ['otp', 'google'],
        default: 'otp',
    },
    googleId: {
        type: String,
        unique: true,
        sparse: true, // Only if present
    },
    name: {
        type: String,
        trim: true,
        default: '',
    },
    interests: [{
        type: String,
        trim: true,
    }],
    isRegistered: {
        type: Boolean,
        default: false, // true if user has fully registered/verified
    },
    isSubscriber: {
        type: Boolean,
        default: false, // true if subscribed to newsletter
    },
    isVerified: {
        type: Boolean,
        default: false, // true if email is verified
    },
    otp: {
        type: String,
        select: false,
    },
    otpExpires: {
        type: Date,
        select: false,
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
    },
    savedArticles: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Article',
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
    lastLogin: {
        type: Date,
    },
    subscribedAt: {
        type: Date,
    },
});

// Hash password before saving (if used)
readerSchema.pre('save', async function () {
    if (!this.isModified('password') || !this.password) {
        return;
    }
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
readerSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

readerSchema.index({ isSubscriber: 1 });
readerSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Reader', readerSchema);
