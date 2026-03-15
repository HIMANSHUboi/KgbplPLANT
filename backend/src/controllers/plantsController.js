const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

exports.getPlants = async (req, res) => {
    try {
        const plants = await prisma.plant.findMany({
            include: {
                company: { select: { name: true, code: true } },
                _count: { select: { lines: true, users: true, shiftLogs: true } },
            },
            orderBy: { name: 'asc' },
        });
        res.json(plants);
    } catch (err) {
        logger.error(`getPlants: ${err.message}`);
        res.status(500).json({ error: 'Failed to fetch plants' });
    }
};

exports.createPlant = async (req, res) => {
    try {
        const { name, code, location, timezone, companyId } = req.body;
        const plant = await prisma.plant.create({
            data: {
                name,
                code,
                location,
                timezone: timezone || 'Asia/Kolkata',
                companyId: parseInt(companyId),
            },
            include: { company: { select: { name: true } } },
        });

        await prisma.auditLog.create({
            data: { userId: req.user.id, plantId: plant.id, action: 'PLANT_CREATED', targetId: plant.id },
        });

        logger.info(`Plant created: ${code} by user ${req.user.id}`);
        res.status(201).json(plant);
    } catch (err) {
        logger.error(`createPlant: ${err.message}`);
        res.status(500).json({ error: err.message });
    }
};

exports.updatePlant = async (req, res) => {
    try {
        const { id } = req.params;
        const plant = await prisma.plant.update({
            where: { id: parseInt(id) },
            data: req.body,
        });

        await prisma.auditLog.create({
            data: { userId: req.user.id, plantId: plant.id, action: 'PLANT_UPDATED', targetId: plant.id },
        });

        res.json(plant);
    } catch (err) {
        logger.error(`updatePlant: ${err.message}`);
        res.status(500).json({ error: 'Failed to update plant' });
    }
};
