require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const compression = require('compression');
const connectDB = require('./src/config/database');
const errorHandler = require('./src/middleware/error');
const { startLifecycleJobs } = require('./src/jobs/lifecycleJobs');
const logger = require('./src/utils/logger');

// Import routes
const authRoutes = require('./src/routes/auth');
const articleRoutes = require('./src/routes/articles');
const categoryRoutes = require('./src/routes/categories');
const tagRoutes = require('./src/routes/tags');
const uploadRoutes = require('./src/routes/upload');
const userRoutes = require('./src/routes/users');
const lifecycleRoutes = require('./src/routes/lifecycle');
const auditRoutes = require('./src/routes/audit');
const readerRoutes = require('./src/routes/readers');
const subscriberRoutes = require('./src/routes/subscribers');

// Initialize app
const app = express();

const createAdminUser = require('./create-admin-user');

// Connect to database and start lifecycle jobs
if (process.env.NODE_ENV !== 'test') {
    connectDB().then(async () => {
        await createAdminUser();
        startLifecycleJobs();
    });
}

// Trust proxy (required for rate limiting behind reverse proxies like Railway/Render)
app.set('trust proxy', 1);

// Security Middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" }, // Allow images from different origins
}));

// CORS Configuration
// CORS Configuration
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? [
        process.env.FRONTEND_URL,
        'https://www.fluxornews.com',
        'https://fluxornews.com',
        'https://fluxornews-frontend-c6fg.vercel.app'
    ].filter(Boolean)
    : [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        process.env.FRONTEND_URL || 'http://localhost:3000'
    ];

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        // Check if origin is allowed (handling potential trailing slashes)
        const isAllowed = allowedOrigins.some(allowed => {
            if (!allowed) return false;
            // Normalize URLs by removing trailing slash for comparison
            const normalizedAllowed = allowed.replace(/\/$/, '');
            const normalizedOrigin = origin.replace(/\/$/, '');
            return normalizedAllowed === normalizedOrigin;
        });

        if (isAllowed) {
            callback(null, true);
        } else {
            logger.warn(`Blocked CORS request from origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));

// Compression middleware
app.use(compression());

// Request logging
if (process.env.NODE_ENV === 'production') {
    app.use(morgan('combined', {
        stream: { write: message => logger.http(message.trim()) }
    }));
} else {
    app.use(morgan('dev'));
}

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded images statically
app.use('/uploads', express.static('uploads'));

// Rate limiting
// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: process.env.NODE_ENV === 'production' ? 100 : 10000, // Limit each IP to 100 requests per windowMs (production) or 10000 (development)
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// In development, exclude auth routes from general rate limiting
if (process.env.NODE_ENV !== 'production') {
    app.use('/api/', (req, res, next) => {
        // Skip rate limiting for auth endpoints in development
        if (req.path.startsWith('/auth/login') || req.path.startsWith('/auth/register') || req.path.startsWith('/auth/dev-login')) {
            return next();
        }
        return limiter(req, res, next);
    });
} else {
    // In production, apply rate limiting to all routes
    app.use('/api/', limiter);
}

// Stricter rate limit for auth routes (production only)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
});

// Only apply auth rate limiting in production
if (process.env.NODE_ENV === 'production') {
    app.use('/api/auth/login', authLimiter);
    app.use('/api/auth/register', authLimiter);
}

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'News Website API',
        version: '2.0.0',
        status: 'running'
    });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/articles', articleRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lifecycle', lifecycleRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/readers', readerRoutes);
app.use('/api/subscribers', subscriberRoutes);
app.use('/api/config', require('./src/routes/config'));
app.use('/api/homepage', require('./src/routes/homepage'));
app.use('/api/comments', require('./src/routes/comments'));
app.use('/api/newsletter', require('./src/routes/newsletter'));

// Error handler middleware (must be last)
app.use(errorHandler);

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});

// Start server
const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
    });
}

module.exports = app;
