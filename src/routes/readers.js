const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const emailService = require('../services/email');
const { generateToken, protectReader } = require('../middleware/auth');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const Reader = require('../models/Reader');
const Article = require('../models/Article');
// ... (imports)

// Helper to generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

// @route   POST /api/readers/send-otp
// @desc    Send OTP to email (Create account if not exists)
// @access  Public
router.post('/send-otp', async (req, res, next) => {
    try {
        let { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        email = email.trim().toLowerCase();

        let reader = await Reader.findOne({ email });

        // Create initial reader record if not exists
        if (!reader) {
            console.log(`[OTP] Creating new reader for: ${email}`);
            reader = await Reader.create({
                email,
                isRegistered: false
            });
        }

        if (reader.status === 'suspended') {
            return res.status(403).json({ success: false, message: 'Account suspended' });
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        reader.otp = otp;
        reader.otpExpires = otpExpires;
        await reader.save();

        // Send OTP via Email
        const emailSent = await emailService.sendOTP(email, otp);

        if (!emailSent) {
            // Fallback to console for dev if email fails (or if creds missing)
            console.log(`\n[DEV API MOCK] OTP for ${email}: ${otp}\n`);
        }

        res.json({
            success: true,
            // If email failed, let user know (or pretend success but provide code for dev)
            message: emailSent ? 'OTP sent to your email' : 'OTP generated (Email config missing?? Check console/network)',
            data: {
                isNewUser: !reader.isRegistered,
                // Return OTP in response only if email failed (for testing convenience)
                devOtp: !emailSent ? otp : undefined
            }
        });

    } catch (error) {
        console.error('Send OTP Error:', error);
        next(error);
    }
});

// @route   POST /api/readers/verify-otp
// @desc    Verify OTP and Login/Register
// @access  Public
router.post('/verify-otp', async (req, res, next) => {
    try {
        let { email, otp, name, interests } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
        }

        email = email.trim().toLowerCase();
        otp = otp.trim();

        const reader = await Reader.findOne({ email }).select('+otp +otpExpires');

        if (!reader) {
            return res.status(400).json({ success: false, message: 'Invalid email' });
        }

        // Check if OTP matches
        if (reader.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Check expiry
        if (reader.otpExpires < Date.now()) {
            return res.status(400).json({ success: false, message: 'OTP expired. Request a new one.' });
        }

        // Onboarding for new users: require name if not present
        // For returning users: check if they already have interests
        const requiresOnboarding = !reader.isRegistered && !name;
        const hasInterests = reader.interests && reader.interests.length > 0;

        if (requiresOnboarding) {
            // New user needs to provide name and interests
            return res.json({
                success: true,
                message: 'OTP Verified',
                data: {
                    requiresOnboarding: true,
                    email: reader.email
                }
            });
        }

        // Complete Registration/Login
        reader.otp = undefined;
        reader.otpExpires = undefined;
        reader.isVerified = true;
        reader.isRegistered = true;
        reader.lastLogin = new Date();

        if (name) reader.name = name;
        if (interests && Array.isArray(interests)) reader.interests = interests;

        // Auto subscribe logic removed or can be optional

        await reader.save();

        res.json({
            success: true,
            message: 'Logged in successfully',
            data: {
                token: generateToken(reader._id),
                user: {
                    _id: reader._id,
                    email: reader.email,
                    name: reader.name,
                    interests: reader.interests,
                    isSubscriber: reader.isSubscriber,
                    // Add flag to indicate if user needs to set interests
                    needsInterests: !hasInterests
                },
            },
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        next(error);
    }
});

// @route   POST /api/readers/subscribe
// @desc    Subscribe to newsletter (no auth required)
// @access  Public
router.post('/subscribe', async (req, res, next) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        let reader = await Reader.findOne({ email });

        if (reader) {
            if (reader.isSubscriber) {
                return res.status(400).json({ success: false, message: 'Already subscribed' });
            }
            reader.isSubscriber = true;
            reader.subscribedAt = new Date();
            await reader.save();
        } else {
            reader = await Reader.create({
                email,
                isSubscriber: true,
                subscribedAt: new Date()
            });
        }

        res.json({ success: true, message: 'Subscribed successfully' });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/readers/google-login
// @desc    Google Sign In/Up
// @access  Public
router.post('/google-login', async (req, res, next) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: 'Token is required' });
        }

        // Verify Google Token
        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        let reader = await Reader.findOne({ $or: [{ googleId }, { email }] });

        if (reader) {
            // Update existing reader if they previously used OTP or just log them in
            if (!reader.googleId) {
                reader.googleId = googleId;
                reader.authProvider = 'google';
                if (!reader.name) reader.name = name;
            }
            reader.lastLogin = new Date();
        } else {
            // Create new reader
            reader = await Reader.create({
                email,
                name,
                googleId,
                authProvider: 'google',
                isVerified: true,
                isRegistered: true,
                lastLogin: new Date()
            });
        }

        await reader.save();

        res.json({
            success: true,
            data: {
                token: generateToken(reader._id),
                user: {
                    _id: reader._id,
                    email: reader.email,
                    name: reader.name,
                    interests: reader.interests,
                    isSubscriber: reader.isSubscriber,
                    authProvider: reader.authProvider
                }
            }
        });
    } catch (error) {
        console.error('Google Login Error:', error);
        res.status(401).json({ success: false, message: 'Google authentication failed' });
    }
});

// @route   GET /api/readers/me
// @desc    Get current reader profile
// @access  Private (Reader)
router.get('/me', protectReader, async (req, res, next) => {
    try {
        res.json({ success: true, data: req.reader });
    } catch (error) {
        next(error);
    }
});

// @route   PUT /api/readers/me
// @desc    Update reader profile
// @access  Private (Reader)
router.put('/me', protectReader, async (req, res, next) => {
    try {
        const { name, interests } = req.body;
        const reader = await Reader.findById(req.reader._id);

        if (name) reader.name = name;
        if (interests) reader.interests = interests;

        await reader.save();
        res.json({ success: true, data: reader });
    } catch (error) {
        next(error);
    }
});

// @route   GET /api/readers/saved-articles
// @desc    Get reader's saved articles
// @access  Private (Reader)
router.get('/saved-articles', protectReader, async (req, res, next) => {
    try {
        const reader = await Reader.findById(req.reader._id).populate({
            path: 'savedArticles',
            select: 'title slug image category createdAt author',
            populate: { path: 'category', select: 'name slug color' }
        });
        res.json({ success: true, data: reader.savedArticles });
    } catch (error) {
        next(error);
    }
});

// @route   POST /api/readers/saved-articles/:articleId
// @desc    Save an article
// @access  Private (Reader)
router.post('/saved-articles/:articleId', protectReader, async (req, res, next) => {
    try {
        const reader = await Reader.findById(req.reader._id);
        if (reader.savedArticles.includes(req.params.articleId)) {
            return res.status(400).json({ success: false, message: 'Article already saved' });
        }

        reader.savedArticles.push(req.params.articleId);
        await reader.save();
        res.json({ success: true, message: 'Article saved' });
    } catch (error) {
        next(error);
    }
});

// @route   DELETE /api/readers/saved-articles/:articleId
// @desc    Unsave an article
// @access  Private (Reader)
router.delete('/saved-articles/:articleId', protectReader, async (req, res, next) => {
    try {
        const reader = await Reader.findById(req.reader._id);
        reader.savedArticles = reader.savedArticles.filter(id => id.toString() !== req.params.articleId);
        await reader.save();
        res.json({ success: true, message: 'Article removed from saved' });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
