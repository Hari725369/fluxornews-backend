const jwt = require('jsonwebtoken');
const AdminUser = require('../models/AdminUser');
const Reader = require('../models/Reader');
const AuditLog = require('../models/AuditLog');

// Optional auth - verify token if present, but don't error if missing
const protectOptional = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await AdminUser.findById(decoded.id).select('-password');
        } catch (error) {
            console.error('Optional Auth Error:', error.message);
            // Do not return error, just continue without user
        }
    }
    next();
};

// Protect routes - verify JWT token
const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // Get token from header (format: Bearer <token>)
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from token (exclude password)
            req.user = await AdminUser.findById(decoded.id).select('-password');

            if (!req.user) {
                return res.status(401).json({ success: false, message: 'User not found' });
            }

            // Check if user is suspended
            if (req.user.status === 'suspended') {
                return res.status(403).json({ success: false, message: 'Account suspended. Contact administrator.' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Protect routes for Readers
const protectReader = async (req, res, next) => {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Look up in Reader model
            req.reader = await Reader.findById(decoded.id).select('-password');

            if (!req.reader) {
                return res.status(401).json({ success: false, message: 'Reader not found' });
            }

            if (req.reader.status === 'suspended') {
                return res.status(403).json({ success: false, message: 'Account suspended' });
            }

            next();
        } catch (error) {
            console.error('Reader Auth Error:', error.message);
            return res.status(401).json({ success: false, message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }
};

// Role-based authorization middleware
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Not authorized' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: `Role '${req.user.role}' is not authorized to access this resource`
            });
        }

        next();
    };
};

// Shorthand for Super Admin only routes
const requireSuperAdmin = authorize('superadmin');

// Shorthand for Editor or above
const requireEditorOrAbove = authorize('superadmin', 'editor');

// Generate JWT token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d',
    });
};

// Log activity to AuditLog
const logActivity = async ({ action, targetType, targetId, targetName, performedBy, details, req }) => {
    try {
        await AuditLog.create({
            action,
            targetType,
            targetId,
            targetName,
            performedBy: performedBy._id || performedBy,
            performedByName: performedBy.name || 'Unknown',
            performedByRole: performedBy.role || 'unknown',
            details,
            ipAddress: req?.ip || req?.connection?.remoteAddress,
            userAgent: req?.headers?.['user-agent'],
        });
    } catch (error) {
        console.error('Failed to log activity:', error);
        // Don't throw - logging shouldn't break the request
    }
};

module.exports = {
    protect,
    protectOptional,
    protectReader,
    authorize,
    requireSuperAdmin,
    requireEditorOrAbove,
    generateToken,
    logActivity
};

