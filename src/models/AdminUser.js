const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminUserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please provide a valid email'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false, // Don't return password by default
    },
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
    },
    role: {
        type: String,
        enum: ['superadmin', 'editor', 'writer'],
        default: 'writer',
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active',
    },
    directPublishEnabled: {
        type: Boolean,
        default: false,
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'AdminUser',
    },
    lastLogin: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});

// Hash password before saving
adminUserSchema.pre('save', async function () {
    // Update timestamp
    this.updatedAt = Date.now();

    // Only hash password if it was modified
    if (!this.isModified('password')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Match password
adminUserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

// Index for faster queries
adminUserSchema.index({ role: 1, status: 1 });

module.exports = mongoose.model('AdminUser', adminUserSchema);

