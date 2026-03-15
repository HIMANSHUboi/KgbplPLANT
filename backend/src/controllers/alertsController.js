const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

exports.getAlerts = async (req, res) => {
    try {
        const { page = 1, limit = 20, type, severity } = req.query;
        const where = {};

        // Scope to user's plant unless GLOBAL_ADMIN
        if (req.user.role !== 'GLOBAL_ADMIN') {
            where.plantId = req.user.plantId;
        } else if (req.query.plantId) {
            where.plantId = parseInt(req.query.plantId);
        }

        if (type) where.type = type;
        if (severity) where.severity = severity;

        const [alerts, total] = await Promise.all([
            prisma.alert.findMany({
                where,
                include: {
                    plant: { select: { name: true, code: true } },
                    user: { select: { name: true, empId: true } },
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
            }),
            prisma.alert.count({ where }),
        ]);

        res.json({
            alerts,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / parseInt(limit)),
        });
    } catch (err) {
        logger.error(`getAlerts: ${err.message}`);
        res.status(500).json({ error: 'Failed to fetch alerts' });
    }
};

exports.markRead = async (req, res) => {
    try {
        const alert = await prisma.alert.update({
            where: { id: parseInt(req.params.id) },
            data: { isRead: true },
        });
        res.json(alert);
    } catch (err) {
        logger.error(`markRead: ${err.message}`);
        res.status(500).json({ error: 'Failed to mark alert as read' });
    }
};

exports.getUnreadCount = async (req, res) => {
    try {
        const where = { isRead: false };
        if (req.user.role !== 'GLOBAL_ADMIN') {
            where.plantId = req.user.plantId;
        }
        const count = await prisma.alert.count({ where });
        res.json({ count });
    } catch (err) {
        logger.error(`getUnreadCount: ${err.message}`);
        res.status(500).json({ error: 'Failed to get unread count' });
    }
};

exports.deleteAlert = async (req, res) => {
    try {
        await prisma.alert.delete({ where: { id: parseInt(req.params.id) } });
        res.json({ message: 'Alert deleted' });
    } catch (err) {
        logger.error(`deleteAlert: ${err.message}`);
        res.status(500).json({ error: 'Failed to delete alert' });
    }
};

exports.bulkDeleteAlerts = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ error: 'ids array is required' });
        }
        const result = await prisma.alert.deleteMany({ where: { id: { in: ids.map(Number) } } });
        res.json({ message: `${result.count} alerts deleted` });
    } catch (err) {
        logger.error(`bulkDeleteAlerts: ${err.message}`);
        res.status(500).json({ error: 'Failed to delete alerts' });
    }
};
