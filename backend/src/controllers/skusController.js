const prisma = require('../utils/prisma');

exports.getSKUs = async (req, res) => {
  try {
    const where = req.user.role === 'GLOBAL_ADMIN'
      ? {}
      : { plantId: req.user.plantId };
    const skus = await prisma.sKU.findMany({
      where,
      include: { plant: { select: { name: true, code: true } } },
      orderBy: { name: 'asc' },
    });
    res.json(skus);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch SKUs' });
  }
};

exports.createSKU = async (req, res) => {
  try {
    const { name, code, sizeML, packageType, ratedSpeed } = req.body;
    const plantId = req.user.role === 'GLOBAL_ADMIN'
      ? parseInt(req.body.plantId)
      : req.user.plantId;
    const sku = await prisma.sKU.create({
      data: { name, code, plantId, sizeML: sizeML ? parseInt(sizeML) : null, packageType, ratedSpeed: ratedSpeed ? parseFloat(ratedSpeed) : null },
    });
    res.status(201).json(sku);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateSKU = async (req, res) => {
  try {
    const sku = await prisma.sKU.update({
      where: { id: parseInt(req.params.id) },
      data: req.body,
    });
    res.json(sku);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update SKU' });
  }
};