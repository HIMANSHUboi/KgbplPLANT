const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

exports.getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 20, action } = req.query;
        const where = {};
        if (action) where.action = action;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                include: {
                    // AuditLog doesn't have a direct relation to User in schema,
                    // so we do a manual lookup
                },
            }),
            prisma.auditLog.count({ where }),
        ]);

        // Enrich logs with user names
        const userIds = [...new Set(logs.map(l => l.userId))];
        const users = await prisma.user.findMany({
            where: { id: { in: userIds } },
            select: { id: true, name: true, email: true },
        });
        const userMap = Object.fromEntries(users.map(u => [u.id, u]));

        const enrichedLogs = logs.map(log => ({
            ...log,
            user: userMap[log.userId] || null,
        }));

        res.json({
            logs: enrichedLogs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        logger.error(`getAuditLogs: ${err.message}`);
        res.status(500).json({ error: 'Failed to fetch audit logs' });
    }
};
