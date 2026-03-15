const prisma = require('../utils/prisma');
const logger = require('../utils/logger');
const { checkAndCreateAlerts } = require('../utils/alerts');

const calcOEE = (grossProduction, targetQty, unplannedDowntime, plannedDowntime, goodQty, shiftDuration = 480) => {
  const availableTime = shiftDuration - plannedDowntime;
  const runTime = Math.max(availableTime - unplannedDowntime, 0);
  const availability = availableTime > 0 ? (runTime / availableTime) * 100 : 0;
  const performance = targetQty > 0 ? Math.min((grossProduction / targetQty) * 100, 100) : 100;
  const quality = grossProduction > 0 ? (goodQty / grossProduction) * 100 : 100;
  const oeeScore = (availability * performance * quality) / 10000;
  return {
    oeeAvailability: +availability.toFixed(1),
    oeePerformance: +performance.toFixed(1),
    oeeQuality: +quality.toFixed(1),
    oeeScore: +oeeScore.toFixed(1),
    runTime,
  };
};

exports.getShiftLogs = async (req, res) => {
  try {
    const { status, lineId, shift, date, page = 1, limit = 20 } = req.query;
    const where = {};

    if (req.user.role === 'OPERATOR') where.userId = req.user.id;
    else if (req.user.role !== 'GLOBAL_ADMIN') where.plantId = req.user.plantId;

    if (status) where.status = status;
    if (lineId) where.lineId = parseInt(lineId);
    if (shift) where.shift = shift;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.date = { gte: start, lt: end };
    }

    const [logs, total] = await Promise.all([
      prisma.shiftLog.findMany({
        where,
        include: {
          line: { select: { id: true, name: true, code: true } },
          sku: { select: { id: true, name: true, code: true } },
          submittedBy: { select: { id: true, name: true, empId: true } },
          reviewedBy: { select: { id: true, name: true } },
          downtimeLogs: { include: { equipment: { select: { name: true, code: true } } } },
          qualityLogs: true,
          utilityLogs: true,
        },
        orderBy: [{ date: 'desc' }, { shift: 'asc' }],
        skip: (parseInt(page) - 1) * parseInt(limit),
        take: parseInt(limit),
      }),
      prisma.shiftLog.count({ where }),
    ]);

    res.json({ logs, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (err) {
    logger.error(`getShiftLogs: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch shift logs' });
  }
};

exports.createShiftLog = async (req, res) => {
  try {
    const {
      date, shift, lineId, skuId, skuName,
      targetQty, grossProduction, rejectedQty,
      plannedDowntime, unplannedDowntime, changeoverTime,
      remarks, downtimeLogs = [], qualityLogs = [], utilityLogs = [],
    } = req.body;

    const gross = parseInt(grossProduction) || 0;
    const rejected = parseInt(rejectedQty) || 0;
    const goodQty = gross - rejected;
    const oee = calcOEE(gross, parseInt(targetQty) || 0, parseInt(unplannedDowntime) || 0, parseInt(plannedDowntime) || 30, goodQty);

    const line = await prisma.line.findUnique({ where: { id: parseInt(lineId) } });
    if (!line) return res.status(404).json({ error: 'Line not found' });

    const shiftLog = await prisma.shiftLog.create({
      data: {
        date: new Date(date),
        shift,
        plantId: line.plantId,
        lineId: parseInt(lineId),
        skuId: skuId ? parseInt(skuId) : null,
        skuName: skuName || null,
        targetQty: parseInt(targetQty) || 0,
        grossProduction: gross,
        goodQty,
        rejectedQty: rejected,
        shiftDuration: 480,
        plannedDowntime: parseInt(plannedDowntime) || 30,
        unplannedDowntime: parseInt(unplannedDowntime) || 0,
        changeoverTime: parseInt(changeoverTime) || 0,
        runTime: oee.runTime,
        oeeAvailability: oee.oeeAvailability,
        oeePerformance: oee.oeePerformance,
        oeeQuality: oee.oeeQuality,
        oeeScore: oee.oeeScore,
        status: 'PENDING',
        remarks: remarks || null,
        userId: req.user.id,
        // Nested downtime logs
        downtimeLogs: {
          create: downtimeLogs.map(d => ({
            lineId: parseInt(lineId),
            equipmentId: parseInt(d.equipmentId),
            type: d.type,
            durationMins: parseInt(d.durationMins),
            reason: d.reason,
            actionTaken: d.actionTaken || null,
          })),
        },
        // Nested quality logs
        qualityLogs: {
          create: qualityLogs.map(q => ({
            lineId: parseInt(lineId),
            skuId: skuId ? parseInt(skuId) : null,
            rejectQty: parseInt(q.rejectQty),
            rejectReason: q.rejectReason,
            rejectStage: q.rejectStage || null,
          })),
        },
        // Nested utility logs
        utilityLogs: {
          create: utilityLogs.map(u => ({
            lineId: parseInt(lineId),
            utilityType: u.utilityType,
            reading: parseFloat(u.reading),
            unit: u.unit,
            notes: u.notes || null,
          })),
        },
      },
      include: {
        line: { select: { name: true } },
        submittedBy: { select: { name: true } },
        downtimeLogs: { include: { equipment: true } },
        qualityLogs: true,
        utilityLogs: true,
      },
    });

    // Fire alerts
    checkAndCreateAlerts({
      ...shiftLog,
      downtime: shiftLog.unplannedDowntime,
      plantId: shiftLog.plantId,
      userId: shiftLog.userId,
      submittedBy: { name: req.user.name },
      departmentName: line.name,
    }).catch(e => logger.error(`Alert error: ${e.message}`));

    await prisma.auditLog.create({
      data: { userId: req.user.id, plantId: line.plantId, action: 'SHIFT_LOG_CREATED', targetId: shiftLog.id },
    });

    logger.info(`Shift log created by ${req.user.name} for line ${line.name}`);
    res.status(201).json(shiftLog);
  } catch (err) {
    logger.error(`createShiftLog: ${err.message}`);
    res.status(500).json({ error: err.message });
  }
};

exports.updateLogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['APPROVED', 'REJECTED'].includes(status))
      return res.status(400).json({ error: 'Invalid status' });

    const log = await prisma.shiftLog.findUnique({ where: { id: parseInt(id) } });
    if (!log) return res.status(404).json({ error: 'Log not found' });
    if (log.status !== 'PENDING')
      return res.status(400).json({ error: 'Only pending logs can be reviewed' });
    if (req.user.role !== 'GLOBAL_ADMIN' && req.user.plantId !== log.plantId)
      return res.status(403).json({ error: 'Access denied' });

    const updated = await prisma.shiftLog.update({
      where: { id: parseInt(id) },
      data: { status, reviewerId: req.user.id, reviewedAt: new Date() },
      include: {
        line: { select: { name: true } },
        submittedBy: { select: { name: true } },
        reviewedBy: { select: { name: true } },
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, plantId: log.plantId, action: `LOG_${status}`, targetId: log.id },
    });

    res.json(updated);
  } catch (err) {
    logger.error(`updateLogStatus: ${err.message}`);
    res.status(500).json({ error: 'Failed to update status' });
  }
};

exports.getPlantStats = async (req, res) => {
  try {
    const plantId = req.user.role === 'GLOBAL_ADMIN'
      ? (req.query.plantId ? parseInt(req.query.plantId) : null)
      : req.user.plantId;

    const days = parseInt(req.query.days) || 7;
    const since = new Date();
    since.setDate(since.getDate() - days);

    const where = { status: 'APPROVED', date: { gte: since } };
    if (plantId) where.plantId = plantId;

    const logs = await prisma.shiftLog.findMany({
      where,
      include: {
        line: { select: { name: true, code: true } },
        downtimeLogs: { include: { equipment: { select: { name: true } } } },
        qualityLogs: true,
      },
    });

    const totalGross = logs.reduce((s, l) => s + l.grossProduction, 0);
    const totalGood = logs.reduce((s, l) => s + l.goodQty, 0);
    const totalRejected = logs.reduce((s, l) => s + l.rejectedQty, 0);
    const totalTarget = logs.reduce((s, l) => s + l.targetQty, 0);
    const totalDowntime = logs.reduce((s, l) => s + l.unplannedDowntime, 0);
    const pending = await prisma.shiftLog.count({
      where: { status: 'PENDING', ...(plantId ? { plantId } : {}) },
    });

    const oeeEntries = logs.filter(l => l.oeeScore !== null);
    const avgOEE = oeeEntries.length
      ? +(oeeEntries.reduce((s, l) => s + l.oeeScore, 0) / oeeEntries.length).toFixed(1)
      : 0;
    const avgAvail = oeeEntries.length
      ? +(oeeEntries.reduce((s, l) => s + l.oeeAvailability, 0) / oeeEntries.length).toFixed(1)
      : 0;
    const avgPerf = oeeEntries.length
      ? +(oeeEntries.reduce((s, l) => s + l.oeePerformance, 0) / oeeEntries.length).toFixed(1)
      : 0;
    const avgQual = oeeEntries.length
      ? +(oeeEntries.reduce((s, l) => s + l.oeeQuality, 0) / oeeEntries.length).toFixed(1)
      : 0;

    // By line
    const byLine = {};
    logs.forEach(l => {
      const key = l.line.name;
      if (!byLine[key]) byLine[key] = { gross: 0, good: 0, target: 0, downtime: 0, oeeSum: 0, oeeCount: 0 };
      byLine[key].gross += l.grossProduction;
      byLine[key].good += l.goodQty;
      byLine[key].target += l.targetQty;
      byLine[key].downtime += l.unplannedDowntime;
      if (l.oeeScore) { byLine[key].oeeSum += l.oeeScore; byLine[key].oeeCount++; }
    });

    // By shift
    const byShift = {};
    logs.forEach(l => {
      if (!byShift[l.shift]) byShift[l.shift] = { gross: 0, target: 0, downtime: 0 };
      byShift[l.shift].gross += l.grossProduction;
      byShift[l.shift].target += l.targetQty;
      byShift[l.shift].downtime += l.unplannedDowntime;
    });

    // Daily trend
    const byDay = {};
    logs.forEach(l => {
      const day = l.date.toISOString().split('T')[0];
      if (!byDay[day]) byDay[day] = { gross: 0, target: 0, downtime: 0, oeeSum: 0, oeeCount: 0 };
      byDay[day].gross += l.grossProduction;
      byDay[day].target += l.targetQty;
      byDay[day].downtime += l.unplannedDowntime;
      if (l.oeeScore) { byDay[day].oeeSum += l.oeeScore; byDay[day].oeeCount++; }
    });

    // Equipment downtime breakdown
    const byEquipment = {};
    logs.forEach(l => {
      l.downtimeLogs.forEach(d => {
        const eq = d.equipment?.name || 'Unknown';
        if (!byEquipment[eq]) byEquipment[eq] = { planned: 0, unplanned: 0, total: 0, incidents: 0 };
        byEquipment[eq][d.type === 'PLANNED' ? 'planned' : 'unplanned'] += d.durationMins;
        byEquipment[eq].total += d.durationMins;
        byEquipment[eq].incidents += 1;
      });
    });

    // Quality reject breakdown
    const byRejectReason = {};
    logs.forEach(l => {
      l.qualityLogs.forEach(q => {
        if (!byRejectReason[q.rejectReason]) byRejectReason[q.rejectReason] = 0;
        byRejectReason[q.rejectReason] += q.rejectQty;
      });
    });

    // Status counts for pie chart
    const statusWhere = { date: { gte: since } };
    if (plantId) statusWhere.plantId = plantId;

    const [approved, rejected, pendingAll] = await Promise.all([
      prisma.shiftLog.count({ where: { ...statusWhere, status: 'APPROVED' } }),
      prisma.shiftLog.count({ where: { ...statusWhere, status: 'REJECTED' } }),
      prisma.shiftLog.count({ where: { ...statusWhere, status: 'PENDING' } }),
    ]);

    // Unread alert count
    const alertWhere = { isRead: false };
    if (plantId) alertWhere.plantId = plantId;
    const alertCount = await prisma.alert.count({ where: alertWhere });

    res.json({
      totalGross, totalGood, totalRejected, totalTarget, totalDowntime, pending,
      avgOEE, avgAvail, avgPerf, avgQual,
      targetAchievement: totalTarget > 0 ? +((totalGross / totalTarget) * 100).toFixed(1) : 0,
      byLine, byShift, byDay, byEquipment, byRejectReason,
      logCount: logs.length,
      approved, rejected, pendingAll, alertCount,
    });
  } catch (err) {
    logger.error(`getPlantStats: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
};

exports.exportLogs = async (req, res) => {
  try {
    const ExcelJS = require('exceljs');
    const { days = 30, lineId, status } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const where = { date: { gte: since } };
    if (req.user.role !== 'GLOBAL_ADMIN') where.plantId = req.user.plantId;
    if (lineId) where.lineId = parseInt(lineId);
    if (status) where.status = status;

    const logs = await prisma.shiftLog.findMany({
      where,
      include: {
        line: { select: { name: true, code: true } },
        sku: { select: { name: true, code: true } },
        submittedBy: { select: { name: true, empId: true } },
        reviewedBy: { select: { name: true } },
        plant: { select: { name: true, code: true } },
      },
      orderBy: [{ date: 'desc' }],
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'PlantFlow';
    workbook.created = new Date();
    const sheet = workbook.addWorksheet('Shift Logs', {
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    // Columns
    sheet.columns = [
      { header: 'Date', key: 'date', width: 13 },
      { header: 'Shift', key: 'shift', width: 7 },
      { header: 'Plant', key: 'plant', width: 18 },
      { header: 'Line', key: 'line', width: 18 },
      { header: 'SKU', key: 'sku', width: 20 },
      { header: 'Target', key: 'target', width: 10 },
      { header: 'Gross Production', key: 'gross', width: 16 },
      { header: 'Good Qty', key: 'good', width: 10 },
      { header: 'Rejected', key: 'rejected', width: 10 },
      { header: 'Planned DT(min)', key: 'plannedDT', width: 16 },
      { header: 'Unplanned DT(min)', key: 'unplannedDT', width: 18 },
      { header: 'Changeover(min)', key: 'changeover', width: 16 },
      { header: 'OEE %', key: 'oee', width: 9 },
      { header: 'Availability %', key: 'availability', width: 14 },
      { header: 'Performance %', key: 'performance', width: 14 },
      { header: 'Quality %', key: 'quality', width: 11 },
      { header: 'Status', key: 'status', width: 12 },
      { header: 'Operator', key: 'operator', width: 24 },
      { header: 'Reviewed By', key: 'reviewer', width: 18 },
    ];

    // Header style
    const headerFill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0A1929' } };
    const headerFont = { bold: true, color: { argb: 'FF00D4FF' }, size: 11 };
    sheet.getRow(1).eachCell(cell => {
      cell.fill = headerFill;
      cell.font = headerFont;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = { bottom: { style: 'thin', color: { argb: 'FF00D4FF' } } };
    });
    sheet.getRow(1).height = 24;

    // Data rows
    for (const l of logs) {
      const row = sheet.addRow({
        date: l.date.toISOString().split('T')[0],
        shift: l.shift,
        plant: l.plant?.name || '',
        line: l.line?.name || '',
        sku: l.sku?.name || l.skuName || '',
        target: l.targetQty,
        gross: l.grossProduction,
        good: l.goodQty,
        rejected: l.rejectedQty,
        plannedDT: l.plannedDowntime,
        unplannedDT: l.unplannedDowntime,
        changeover: l.changeoverTime,
        oee: l.oeeScore,
        availability: l.oeeAvailability,
        performance: l.oeePerformance,
        quality: l.oeeQuality,
        status: l.status,
        operator: `${l.submittedBy?.name || ''} (${l.submittedBy?.empId || ''})`,
        reviewer: l.reviewedBy?.name || '',
      });

      // Conditional color for OEE
      const oeeCell = row.getCell('oee');
      if (l.oeeScore != null) {
        oeeCell.font = { bold: true, color: { argb: l.oeeScore >= 85 ? 'FF10B981' : l.oeeScore >= 65 ? 'FFF59E0B' : 'FFF43F5E' } };
      }

      // Status color
      const statusCell = row.getCell('status');
      const statusColors = { APPROVED: 'FF10B981', REJECTED: 'FFF43F5E', PENDING: 'FFF59E0B' };
      statusCell.font = { bold: true, color: { argb: statusColors[l.status] || 'FFFFFFFF' } };

      // Alternate row shading
      if (row.number % 2 === 0) {
        row.eachCell(cell => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0D2137' } };
        });
      }
    }

    // Auto-filter
    sheet.autoFilter = { from: 'A1', to: `S${logs.length + 1}` };

    const filename = `plantflow_${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    logger.error(`exportLogs: ${err.message}`);
    res.status(500).json({ error: 'Export failed' });
  }
};