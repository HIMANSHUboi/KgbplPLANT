const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

exports.getEntries = async (req, res) => {
  try {
    const { status, department, shift, date, page = 1, limit = 20 } = req.query;
    const where = {};

    // Employees only see their own entries
    if (req.user.role === 'EMPLOYEE') where.userId = req.user.id;

    if (status) where.status = status;
    if (department) where.department = department;
    if (shift) where.shift = shift;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }

    const [entries, total] = await Promise.all([
      prisma.entry.findMany({
        where,
        include: {
          submittedBy: { select: { id: true, name: true, email: true } },
          reviewedBy: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: parseInt(limit),
      }),
      prisma.entry.count({ where }),
    ]);

    res.json({ entries, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    logger.error(`getEntries: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch entries' });
  }
};

exports.createEntry = async (req, res) => {
  try {
    const { date, shift, department, qty, downtime, downtimeReason, remarks } = req.body;

    const entry = await prisma.entry.create({
      data: {
        date: new Date(date),
        shift,
        department,
        qty: parseInt(qty),
        downtime: parseInt(downtime) || 0,
        downtimeReason: downtimeReason || null,
        remarks: remarks || null,
        userId: req.user.id,
        status: 'PENDING',
      },
      include: {
        submittedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'ENTRY_CREATED', targetId: entry.id },
    });

    logger.info(`Entry created by user ${req.user.id}`);
    res.status(201).json(entry);
  } catch (err) {
    logger.error(`createEntry: ${err.message}`);
    res.status(500).json({ error: 'Failed to create entry' });
  }
};

exports.updateEntryStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const entry = await prisma.entry.findUnique({ where: { id: parseInt(id) } });
    if (!entry) return res.status(404).json({ error: 'Entry not found' });
    if (entry.status !== 'PENDING')
      return res.status(400).json({ error: 'Only pending entries can be reviewed' });

    const updated = await prisma.entry.update({
      where: { id: parseInt(id) },
      data: { status, reviewerId: req.user.id },
      include: {
        submittedBy: { select: { id: true, name: true } },
        reviewedBy: { select: { id: true, name: true } },
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: `ENTRY_${status}`, targetId: entry.id },
    });

    logger.info(`Entry ${id} ${status} by user ${req.user.id}`);
    res.json(updated);
  } catch (err) {
    logger.error(`updateEntryStatus: ${err.message}`);
    res.status(500).json({ error: 'Failed to update entry' });
  }
};

exports.getStats = async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const entries = await prisma.entry.findMany({
      where: { status: 'APPROVED', date: { gte: since } },
    });

    const totalQty = entries.reduce((s, e) => s + e.qty, 0);
    const totalDowntime = entries.reduce((s, e) => s + e.downtime, 0);
    const pending = await prisma.entry.count({ where: { status: 'PENDING' } });
    const efficiency = entries.length
      ? Math.round((1 - totalDowntime / (entries.length * 480)) * 100)
      : 0;

    // By department
    const byDept = {};
    entries.forEach(e => {
      if (!byDept[e.department]) byDept[e.department] = { qty: 0, downtime: 0, count: 0 };
      byDept[e.department].qty += e.qty;
      byDept[e.department].downtime += e.downtime;
      byDept[e.department].count += 1;
    });

    // By shift
    const byShift = {};
    entries.forEach(e => {
      if (!byShift[e.shift]) byShift[e.shift] = { qty: 0, downtime: 0 };
      byShift[e.shift].qty += e.qty;
      byShift[e.shift].downtime += e.downtime;
    });

    // Daily trend
    const byDay = {};
    entries.forEach(e => {
      const day = e.date.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { qty: 0, downtime: 0, count: 0 };
      byDay[day].qty += e.qty;
      byDay[day].downtime += e.downtime;
      byDay[day].count += 1;
    });

    // Downtime reasons
    const byReason = {};
    entries.filter(e => e.downtime > 0).forEach(e => {
      if (!byReason[e.downtimeReason]) byReason[e.downtimeReason] = 0;
      byReason[e.downtimeReason] += e.downtime;
    });

    res.json({ totalQty, totalDowntime, pending, efficiency, byDept, byShift, byDay, byReason, lastUpdated: new Date().toISOString() });
  } catch (err) {
    logger.error(`getStats: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

exports.exportEntries = async (req, res) => {
  try {
    const { days = 30, department, status } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const where = { date: { gte: since } };
    if (department) where.department = department;
    if (status) where.status = status;

    const entries = await prisma.entry.findMany({
      where,
      include: {
        submittedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } },
      },
      orderBy: { date: 'desc' },
    });

    const headers = ['ID', 'Date', 'Employee', 'Department', 'Shift', 'Quantity', 'Downtime(min)', 'Downtime Reason', 'Remarks', 'Status', 'Reviewed By', 'Submitted At'];
    const rows = entries.map(e => [
      e.id,
      e.date.toISOString().split('T')[0],
      e.submittedBy.name,
      e.department,
      e.shift,
      e.qty,
      e.downtime,
      e.downtimeReason || '',
      e.remarks || '',
      e.status,
      e.reviewedBy?.name || '',
      e.createdAt.toISOString(),
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=plantflow_export_${Date.now()}.csv`);
    res.send(csv);
  } catch (err) {
    logger.error(`exportEntries: ${err.message}`);
    res.status(500).json({ error: 'Export failed' });
  }
};