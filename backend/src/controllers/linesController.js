const prisma = require('../utils/prisma');

exports.getLines = async (req, res) => {
  try {
    const where = req.user.role === 'GLOBAL_ADMIN'
      ? {}
      : { plantId: req.user.plantId };

    if (req.query.plantId) where.plantId = parseInt(req.query.plantId);

    const lines = await prisma.line.findMany({
      where,
      include: {
        plant: { select: { name: true, code: true } },
        equipment: { orderBy: { name: 'asc' } },
        _count: { select: { shiftLogs: true } },
      },
      orderBy: { name: 'asc' },
    });
    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch lines' });
  }
};

exports.createLine = async (req, res) => {
  try {
    const { name, code, plantId, ratedSpeed } = req.body;
    const line = await prisma.line.create({
      data: { name, code, plantId: parseInt(plantId), ratedSpeed: parseFloat(ratedSpeed) || 0 },
      include: { plant: { select: { name: true } } },
    });
    res.status(201).json(line);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateLine = async (req, res) => {
  try {
    const { id } = req.params;
    const line = await prisma.line.update({
      where: { id: parseInt(id) },
      data: req.body,
    });
    res.json(line);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update line' });
  }
};

exports.getEquipment = async (req, res) => {
  try {
    const { lineId } = req.params;
    const equipment = await prisma.equipment.findMany({
      where: { lineId: parseInt(lineId), isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(equipment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
};

exports.addEquipment = async (req, res) => {
  try {
    const { lineId } = req.params;
    const { name, code, category } = req.body;
    const equipment = await prisma.equipment.create({
      data: { name, code, lineId: parseInt(lineId), category: category || 'PRODUCTION' },
    });
    res.status(201).json(equipment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};