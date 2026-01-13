const express = require('express');
const router = express.Router();
const AdminUser = require('../models/AdminUser');
const { protect, generateToken } = require('../middleware/auth');

// @route   POST /api/auth/login
// @desc    Login admin user
// @access  Public
router.post('/login', async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password',
            });
        }

        // Check for user (include password for comparison)
        const user = await AdminUser.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Check if user is suspended
        if (user.status === 'suspended') {
            if (process.env.NODE_ENV === 'production') {
                res.setHeader('Location', `${process.env.FRONTEND_URL}/admin/login?error=auth_failed`);
            } else {
                res.setHeader('Location', `http://localhost:3000/admin/login?error=auth_failed`);
            }
            return res.status(403).json({
                success: false,
                message: 'Account suspended. Contact administrator.',
            });
        }

        // Check password
        const isMatch = await user.matchPassword(password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials',
            });
        }

        // Update last login
        user.lastLogin = new Date();
        await user.save();

        // Return token and user data (matching frontend AuthResponse type)
        res.json({
            success: true,
            data: {
                token: generateToken(user._id),
                user: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        data: req.user,
    });
});

// @route   POST /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.post('/verify', protect, async (req, res) => {
    res.json({
        success: true,
        message: 'Token is valid',
    });
});

// @route   PUT /api/auth/profile
// @desc    Update own profile (name, email)
// @access  Private
router.put('/profile', protect, async (req, res, next) => {
    try {
        const { name, email } = req.body;

        const user = await AdminUser.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if new email is taken by another user
        if (email && email !== user.email) {
            const existingUser = await AdminUser.findOne({ email });
            if (existingUser) {
                return res.status(400).json({ success: false, message: 'Email already in use' });
            }
        }

        user.name = name || user.name;
        user.email = email || user.email;
        await user.save();

        res.json({
            success: true,
            data: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/auth/password
// @desc    Update own password
// @access  Private
router.put('/password', protect, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Please provide current and new password',
            });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters',
            });
        }

        const user = await AdminUser.findById(req.user._id).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify current password
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Current password is incorrect',
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
