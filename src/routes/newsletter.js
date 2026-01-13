const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const Reader = require('../models/Reader');
const { sendNewsletter } = require('../services/email');

// @route   POST /api/newsletter/send
// @desc    Send newsletter to all subscribers
// @access  Private (Admin)
router.post('/send', protect, authorize('admin', 'editor'), async (req, res, next) => {
    try {
        const { subject, html } = req.body;

        if (!subject || !html) {
            return res.status(400).json({ success: false, message: 'Subject and HTML content are required' });
        }

        // Get all visible subscribers
        const subscribers = await Reader.find({ isSubscriber: true }).select('email');
        const recipientEmails = subscribers.map(s => s.email);

        if (recipientEmails.length === 0) {
            return res.status(400).json({ success: false, message: 'No subscribers found' });
        }

        // Send (Batching happens inside email service simply via array for now, or loop here if list > 500)
        // For simple usage, passing array works with many SMTP providers, but BCC is better for privacy.
        // Assuming sendNewsletter handles it or we send individually.
        // Let's modify logic to send individual usage to hide emails from each other if using simple To:
        // Actually, best practice for simple nodemailer is loop or BCC.
        // Let's stick to the service implementation which used 'to'. If array, it's visible. 
        // We should probably iterate to avoid exposing emails, OR use BCC.

        // Let's do BATCH sending in loops for privacy if the service just puts them in 'to'.
        // Checking previous service code... it did .join(',') which EXPOSES everyone. bad.
        // Re-implementing privacy loop here.

        const results = await Promise.all(
            recipientEmails.map(email => sendNewsletter(email, subject, html))
        );

        const successCount = results.filter(r => r).length;

        res.json({
            success: true,
            message: `Newsletter queued. Sent to ${successCount} of ${recipientEmails.length} subscribers.`
        });

    } catch (error) {
        next(error);
    }
});

// @route   POST /api/newsletter/test
// @desc    Send test newsletter to current admin
// @access  Private (Admin)
router.post('/test', protect, authorize('admin', 'editor'), async (req, res, next) => {
    try {
        const { subject, html } = req.body;

        // Send to the requesting user only
        const success = await sendNewsletter(req.user.email, `[TEST] ${subject}`, html);

        if (success) {
            res.json({ success: true, message: `Test email sent to ${req.user.email}` });
        } else {
            res.status(500).json({ success: false, message: 'Failed to send test email' });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
