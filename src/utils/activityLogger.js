const AuditLog = require('../models/AuditLog');

/**
 * Log an activity to the database
 * @param {Object} data
 * @param {string} data.action
 * @param {string} data.targetType
 * @param {Object} [data.targetId]
 * @param {string} [data.targetName]
 * @param {Object} data.performedBy - User object
 * @param {Object} [data.req] - Express request object for IP/Agent
 * @param {Object} [data.details]
 */
const logActivity = async ({
    action,
    targetType,
    targetId,
    targetName,
    performedBy,
    req,
    details = {}
}) => {
    try {
        let ipAddress = '';
        let userAgent = '';

        if (req) {
            ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
            userAgent = req.get('User-Agent');
        }

        await AuditLog.create({
            action,
            targetType,
            targetId,
            targetName,
            performedBy: performedBy._id,
            performedByName: performedBy.name,
            performedByRole: performedBy.role,
            details,
            ipAddress,
            userAgent
        });
    } catch (error) {
        // Log error but don't crash application
        console.error('Audit Log Error:', error.message);
    }
};

module.exports = logActivity;
