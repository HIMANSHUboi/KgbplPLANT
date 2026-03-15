const prisma = require('../utils/prisma');
const ExcelJS = require('exceljs');
const logger = require('../utils/logger');

// Map of app IDs to Prisma model names
const MODEL_MAP = {
    production: 'productionDailyEntry',
    safety: 'safetyMetric',
    quality: 'qualityMetric',
    environment: 'environmentMetric',
    maintenance: 'maintenanceDailyEntry',
    hr: 'hrDailyEntry',
    stores: 'storesDailyEntry',
};

// Fields to parse as float for each model
const FLOAT_FIELDS = {
    production: [
        'volumeKhsPdw', 'volumeKronesCsd', 'volumeTetra',
        'meKhsPdw', 'meKronesCsd', 'meTetra',
        'downtimeKhsPdw', 'downtimeKronesCsd', 'downtimeTetra',
        'preformYieldKhsPdw', 'preformYieldKronesCsd',
        'closureYieldKhsPdw', 'closureYieldKronesCsd',
        'cipFlushing', 'co2YieldPlant',
    ],
    safety: ['tbtCompliance', 'bbsPercent', 'ucUaPercent'],
    quality: ['waterUsageRatio', 'concentrateYield', 'sugarYield', 'pulpYield', 'totalRawSyrup'],
    environment: ['etpDischarge', 'etpInlet', 'etpRoDischarge', 'stpDischarge'],
    maintenance: [
        'pmCompliance', 'steamGenerated', 'fuelUsed', 'electricityConsumed',
        'solarUnits', 'dieselConsumption', 'dgUnits', 'eur', 'pur', 'fur',
    ],
    hr: ['manpowerProductivity'],
    stores: ['currentStock'],
};

// Fields to parse as int for each model
const INT_FIELDS = {
    production: ['openPoKhsPdw', 'openPoKronesCsd', 'openPoTetra'],
    safety: ['nearMissSifis'],
    quality: ['numCips'],
    maintenance: ['breakdownCount'],
    hr: ['totalOpenPosition', 'noCases', 'totalManpower', 'contractual', 'ownPermanent'],
    stores: ['plannedOrders', 'dispatchedOrders', 'palletizedOrders', 'manualOrders', 'totalVehicles'],
};

// Fields that are text (don't parse)
const TEXT_FIELDS = {
    production: ['next24hrsPlan', 'criticalIssues'],
    safety: ['criticalSafetyIssue'],
    quality: ['criticalQualityIssue'],
    environment: ['criticalEnvIssue'],
    maintenance: ['criticalIssue', 'remarks'],
    hr: ['criticalHrIssue'],
    stores: ['remarks', 'criticalIssue'],
};

// Human-readable column headers for Excel export
const EXPORT_COLUMNS = {
    production: [
        { key: 'date', header: 'Date' },
        { key: 'volumeKhsPdw', header: 'KHS PDW Volume' },
        { key: 'volumeKronesCsd', header: 'Krones CSD Volume' },
        { key: 'volumeTetra', header: 'Tetra Volume' },
        { key: 'meKhsPdw', header: 'ME% KHS' },
        { key: 'meKronesCsd', header: 'ME% Krones' },
        { key: 'meTetra', header: 'ME% Tetra' },
        { key: 'downtimeKhsPdw', header: 'Downtime KHS' },
        { key: 'downtimeKronesCsd', header: 'Downtime Krones' },
        { key: 'downtimeTetra', header: 'Downtime Tetra' },
        { key: 'preformYieldKhsPdw', header: 'Preform Yield KHS' },
        { key: 'preformYieldKronesCsd', header: 'Preform Yield Krones' },
        { key: 'closureYieldKhsPdw', header: 'Closure Yield KHS' },
        { key: 'closureYieldKronesCsd', header: 'Closure Yield Krones' },
        { key: 'cipFlushing', header: 'CIP / Flushing' },
        { key: 'co2YieldPlant', header: 'CO2 Yield Plant' },
        { key: 'openPoKhsPdw', header: 'Open PO KHS' },
        { key: 'openPoKronesCsd', header: 'Open PO Krones' },
        { key: 'openPoTetra', header: 'Open PO Tetra' },
        { key: 'next24hrsPlan', header: 'Next 24hrs Plan' },
        { key: 'criticalIssues', header: 'Critical Issues' },
    ],
    safety: [
        { key: 'date', header: 'Date' },
        { key: 'tbtCompliance', header: 'TBT Compliance %' },
        { key: 'bbsPercent', header: 'BBS %' },
        { key: 'ucUaPercent', header: 'UC/UA %' },
        { key: 'nearMissSifis', header: 'Near Miss / SIFIs' },
        { key: 'criticalSafetyIssue', header: 'Critical Safety Issue' },
    ],
    quality: [
        { key: 'date', header: 'Date' },
        { key: 'waterUsageRatio', header: 'Water Usage Ratio' },
        { key: 'concentrateYield', header: 'Concentrate Yield' },
        { key: 'sugarYield', header: 'Sugar Yield' },
        { key: 'pulpYield', header: 'Pulp Yield' },
        { key: 'totalRawSyrup', header: 'Total Raw Syrup' },
        { key: 'numCips', header: 'No. CIPs' },
        { key: 'criticalQualityIssue', header: 'Critical Quality Issue' },
    ],
    environment: [
        { key: 'date', header: 'Date' },
        { key: 'etpDischarge', header: 'ETP Discharge' },
        { key: 'etpInlet', header: 'ETP Inlet' },
        { key: 'etpRoDischarge', header: 'ETP RO Discharge' },
        { key: 'stpDischarge', header: 'STP Discharge' },
        { key: 'criticalEnvIssue', header: 'Critical Env Issue' },
    ],
    maintenance: [
        { key: 'date', header: 'Date' },
        { key: 'breakdownCount', header: 'Breakdown Count' },
        { key: 'pmCompliance', header: 'PM Compliance %' },
        { key: 'steamGenerated', header: 'Steam Generated (Tons)' },
        { key: 'fuelUsed', header: 'Fuel Used' },
        { key: 'electricityConsumed', header: 'Electricity Consumed (Units)' },
        { key: 'solarUnits', header: 'Solar Units' },
        { key: 'dieselConsumption', header: 'Diesel Consumption (Liters)' },
        { key: 'dgUnits', header: 'DG Units' },
        { key: 'eur', header: 'EUR %' },
        { key: 'pur', header: 'PUR %' },
        { key: 'fur', header: 'FUR %' },
        { key: 'criticalIssue', header: 'Critical Issue' },
        { key: 'remarks', header: 'Remarks' },
    ],
    hr: [
        { key: 'date', header: 'Date' },
        { key: 'manpowerProductivity', header: 'Manpower Productivity' },
        { key: 'totalOpenPosition', header: 'Total Open Positions' },
        { key: 'noCases', header: 'No. of Cases' },
        { key: 'totalManpower', header: 'Total Manpower' },
        { key: 'contractual', header: 'Contractual' },
        { key: 'ownPermanent', header: 'Own/Permanent' },
        { key: 'criticalHrIssue', header: 'Critical HR Issue' },
    ],
    stores: [
        { key: 'date', header: 'Date' },
        { key: 'plannedOrders', header: 'Planned Orders' },
        { key: 'dispatchedOrders', header: 'Dispatched Orders' },
        { key: 'palletizedOrders', header: 'Palletized Orders' },
        { key: 'manualOrders', header: 'Manual Orders' },
        { key: 'totalVehicles', header: 'Total Vehicles' },
        { key: 'currentStock', header: 'Current Stock' },
        { key: 'remarks', header: 'Remarks' },
        { key: 'criticalIssue', header: 'Critical Issue' },
    ],
};

function parseBody(appId, body) {
    const data = {};
    const floats = FLOAT_FIELDS[appId] || [];
    const ints = INT_FIELDS[appId] || [];
    const texts = TEXT_FIELDS[appId] || [];

    for (const f of floats) {
        if (body[f] !== undefined && body[f] !== '' && body[f] !== null) {
            data[f] = parseFloat(body[f]);
        }
    }
    for (const f of ints) {
        if (body[f] !== undefined && body[f] !== '' && body[f] !== null) {
            data[f] = parseInt(body[f], 10);
        }
    }
    for (const f of texts) {
        if (body[f] !== undefined && body[f] !== null) {
            data[f] = body[f] || null;
        }
    }
    return data;
}

// CREATE entry
const createEntry = async (req, res, next) => {
    try {
        const appId = req.params.appId;
        const model = MODEL_MAP[appId];
        if (!model) return res.status(400).json({ error: 'Invalid app ID' });

        const plantId = req.user.plantId;
        if (!plantId) return res.status(400).json({ error: 'User must be assigned to a plant' });

        const { date, shift } = req.body;
        if (!date) return res.status(400).json({ error: 'Date is required' });

        const data = parseBody(appId, req.body);
        data.date = new Date(date);
        data.plantId = plantId;
        data.userId = req.user.id;

        // Production entries support shift-wise submission
        if (appId === 'production') {
            data.shift = shift || 'GENERAL';
            data.status = 'PENDING';
            // Upsert with shift in composite key
            const entry = await prisma[model].upsert({
                where: {
                    date_plantId_shift: { date: data.date, plantId: data.plantId, shift: data.shift },
                },
                create: data,
                update: data,
            });
            return res.status(201).json(entry);
        }

        // Other DMS apps: upsert by date+plant
        const entry = await prisma[model].upsert({
            where: {
                date_plantId: { date: data.date, plantId: data.plantId },
            },
            create: data,
            update: data,
        });

        res.status(201).json(entry);
    } catch (err) {
        next(err);
    }
};

// GET entries (with pagination, date, shift, status filters)
const getEntries = async (req, res, next) => {
    try {
        const appId = req.params.appId;
        const model = MODEL_MAP[appId];
        if (!model) return res.status(400).json({ error: 'Invalid app ID' });

        const plantId = req.user.plantId;
        const { page = 1, limit = 20, from, to, shift, status } = req.query;
        const where = {};

        if (plantId) where.plantId = plantId;
        if (from || to) {
            where.date = {};
            if (from) where.date.gte = new Date(from);
            if (to) where.date.lte = new Date(to);
        }
        // Production-specific filters
        if (appId === 'production') {
            if (shift) where.shift = shift;
            if (status) where.status = status;
        }

        const include = appId === 'production' ? {
            plant: { select: { name: true } },
        } : undefined;

        const [entries, total] = await Promise.all([
            prisma[model].findMany({
                where,
                ...(include ? { include } : {}),
                orderBy: { date: 'desc' },
                skip: (Number(page) - 1) * Number(limit),
                take: Number(limit),
            }),
            prisma[model].count({ where }),
        ]);

        // For production entries, fetch user names
        if (appId === 'production' && entries.length > 0) {
            const userIds = [...new Set(entries.map(e => e.userId).filter(Boolean))];
            const reviewerIds = [...new Set(entries.map(e => e.reviewerId).filter(Boolean))];
            const allIds = [...new Set([...userIds, ...reviewerIds])];
            const users = await prisma.user.findMany({
                where: { id: { in: allIds } },
                select: { id: true, name: true, empId: true },
            });
            const userMap = Object.fromEntries(users.map(u => [u.id, u]));
            entries.forEach(e => {
                e.submittedBy = userMap[e.userId] || null;
                e.reviewedBy = userMap[e.reviewerId] || null;
            });
        }

        res.json({ entries, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
    } catch (err) {
        next(err);
    }
};

// GET stats (for dashboards) with shift-wise grouping for production
const getStats = async (req, res, next) => {
    try {
        const appId = req.params.appId;

        // Special handling for unified QSE fetching:
        if (appId === 'qse') {
            const plantId = req.user.plantId;
            const { days = 7, from, to } = req.query;

            const where = {};
            if (from && to) {
                where.date = { gte: new Date(from), lte: new Date(to) };
            } else {
                const since = new Date();
                since.setDate(since.getDate() - Number(days));
                where.date = { gte: since };
            }
            if (plantId) where.plantId = plantId;

            const [safety, quality, environment] = await Promise.all([
                prisma.safetyMetric.findMany({ where, orderBy: { date: 'asc' } }),
                prisma.qualityMetric.findMany({ where, orderBy: { date: 'asc' } }),
                prisma.environmentMetric.findMany({ where, orderBy: { date: 'asc' } }),
            ]);

            // Combine metrics onto single date entries to support existing QSE dashboard
            const entriesMap = {};
            [...safety, ...quality, ...environment].forEach(entry => {
                const dateKey = entry.date.toISOString();
                if (!entriesMap[dateKey]) {
                    entriesMap[dateKey] = { date: entry.date, plantId: entry.plantId };
                }
                Object.assign(entriesMap[dateKey], entry);
            });

            const mergedEntries = Object.values(entriesMap).sort((a, b) => new Date(a.date) - new Date(b.date));

            return res.json({ entries: mergedEntries, days: Number(days), lastUpdated: new Date().toISOString() });
        }

        const model = MODEL_MAP[appId];
        if (!model) return res.status(400).json({ error: 'Invalid app ID' });

        const plantId = req.user.plantId;
        const { days = 7, from, to, shift } = req.query;

        const where = {};
        if (from && to) {
            where.date = { gte: new Date(from), lte: new Date(to) };
        } else {
            const since = new Date();
            since.setDate(since.getDate() - Number(days));
            where.date = { gte: since };
        }
        if (plantId) where.plantId = plantId;
        if (appId === 'production' && shift) where.shift = shift;

        const entries = await prisma[model].findMany({
            where,
            orderBy: { date: 'asc' },
        });

        // For production, provide additional shift-wise aggregation
        if (appId === 'production') {
            const byShift = {};
            entries.forEach(e => {
                const s = e.shift || 'GENERAL';
                if (!byShift[s]) byShift[s] = { count: 0, volumeKhs: 0, volumeCsd: 0, volumeTetra: 0, entries: [] };
                byShift[s].count++;
                byShift[s].volumeKhs += (e.volumeKhsPdw || 0);
                byShift[s].volumeCsd += (e.volumeKronesCsd || 0);
                byShift[s].volumeTetra += (e.volumeTetra || 0);
                byShift[s].entries.push(e);
            });

            // User input comparison: who entered what
            const userIds = [...new Set(entries.map(e => e.userId).filter(Boolean))];
            const users = await prisma.user.findMany({
                where: { id: { in: userIds } },
                select: { id: true, name: true, empId: true },
            });
            const userMap = Object.fromEntries(users.map(u => [u.id, u]));

            const userInputs = entries.map(e => ({
                date: e.date,
                shift: e.shift,
                user: userMap[e.userId] || { name: 'Unknown' },
                volumeKhs: e.volumeKhsPdw || 0,
                volumeCsd: e.volumeKronesCsd || 0,
                volumeTetra: e.volumeTetra || 0,
                status: e.status,
            }));

            // Status counts
            const statusWhere = { ...where };
            const [approved, pending, rejected] = await Promise.all([
                prisma.productionDailyEntry.count({ where: { ...statusWhere, status: 'APPROVED' } }),
                prisma.productionDailyEntry.count({ where: { ...statusWhere, status: 'PENDING' } }),
                prisma.productionDailyEntry.count({ where: { ...statusWhere, status: 'REJECTED' } }),
            ]);

            return res.json({ entries, days: Number(days), byShift, userInputs, approved, pending, rejected, lastUpdated: new Date().toISOString() });
        }

        res.json({ entries, days: Number(days), lastUpdated: new Date().toISOString() });
    } catch (err) {
        next(err);
    }
};

// EXPORT entries as Excel
const exportEntries = async (req, res, next) => {
    try {
        const appId = req.params.appId;

        // Custom unified QSE excel export
        if (appId === 'qse') {
            const plantId = req.user.plantId;
            const { from, to, days } = req.query;

            const where = {};
            if (from && to) {
                where.date = { gte: new Date(from), lte: new Date(to) };
            } else {
                const since = new Date();
                since.setDate(since.getDate() - Number(days || 30));
                where.date = { gte: since };
            }
            if (plantId) where.plantId = plantId;

            const [safety, quality, environment] = await Promise.all([
                prisma.safetyMetric.findMany({ where, orderBy: { date: 'asc' } }),
                prisma.qualityMetric.findMany({ where, orderBy: { date: 'asc' } }),
                prisma.environmentMetric.findMany({ where, orderBy: { date: 'asc' } }),
            ]);

            const entriesMap = {};
            [...safety, ...quality, ...environment].forEach(entry => {
                const dateKey = entry.date.toISOString();
                if (!entriesMap[dateKey]) {
                    entriesMap[dateKey] = { date: entry.date, plantId: entry.plantId };
                }
                Object.assign(entriesMap[dateKey], entry);
            });
            const mergedEntries = Object.values(entriesMap).sort((a, b) => new Date(a.date) - new Date(b.date));

            const columns = [
                { key: 'date', header: 'Date' },
                { key: 'tbtCompliance', header: 'TBT Compliance %' },
                { key: 'bbsPercent', header: 'BBS %' },
                { key: 'ucUaPercent', header: 'UC/UA %' },
                { key: 'nearMissSifis', header: 'Near Miss / SIFIs' },
                { key: 'waterUsageRatio', header: 'Water Usage Ratio' },
                { key: 'concentrateYield', header: 'Concentrate Yield' },
                { key: 'sugarYield', header: 'Sugar Yield' },
                { key: 'pulpYield', header: 'Pulp Yield' },
                { key: 'totalRawSyrup', header: 'Total Raw Syrup' },
                { key: 'numCips', header: 'No. CIPs' },
                { key: 'etpDischarge', header: 'ETP Discharge' },
                { key: 'etpInlet', header: 'ETP Inlet' },
                { key: 'etpRoDischarge', header: 'ETP RO Discharge' },
                { key: 'stpDischarge', header: 'STP Discharge' },
                { key: 'criticalSafetyIssue', header: 'Critical Safety Issue' },
                { key: 'criticalQualityIssue', header: 'Critical Quality Issue' },
                { key: 'criticalEnvIssue', header: 'Critical Env Issue' },
            ];

            const workbook = new ExcelJS.Workbook();
            const sheet = workbook.addWorksheet(`QSE Report`);

            sheet.columns = columns.map(c => ({
                header: c.header,
                key: c.key,
                width: c.key === 'date' ? 14 : 18,
            }));

            // Style header row
            sheet.getRow(1).font = { bold: true };
            sheet.getRow(1).fill = {
                type: 'pattern', pattern: 'solid',
                fgColor: { argb: 'FF1E3A5F' },
            };
            sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

            for (const entry of mergedEntries) {
                const row = {};
                for (const col of columns) {
                    if (col.key === 'date') {
                        row[col.key] = new Date(entry.date).toLocaleDateString('en-IN');
                    } else {
                        row[col.key] = entry[col.key] ?? '';
                    }
                }
                sheet.addRow(row);
            }

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=qse_report.xlsx`);

            await workbook.xlsx.write(res);
            return res.end();
        }

        const model = MODEL_MAP[appId];
        const columns = EXPORT_COLUMNS[appId];
        if (!model || !columns) return res.status(400).json({ error: 'Invalid app ID' });

        const plantId = req.user.plantId;
        const { from, to, days } = req.query;

        const where = {};
        if (from && to) {
            where.date = { gte: new Date(from), lte: new Date(to) };
        } else {
            const since = new Date();
            since.setDate(since.getDate() - Number(days || 30));
            where.date = { gte: since };
        }
        if (plantId) where.plantId = plantId;

        const entries = await prisma[model].findMany({
            where,
            orderBy: { date: 'asc' },
        });

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet(`${appId.charAt(0).toUpperCase() + appId.slice(1)} Report`);

        sheet.columns = columns.map(c => ({
            header: c.header,
            key: c.key,
            width: c.key === 'date' ? 14 : 18,
        }));

        // Style header row
        sheet.getRow(1).font = { bold: true };
        sheet.getRow(1).fill = {
            type: 'pattern', pattern: 'solid',
            fgColor: { argb: 'FF1E3A5F' },
        };
        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };

        for (const entry of entries) {
            const row = {};
            for (const col of columns) {
                if (col.key === 'date') {
                    row[col.key] = new Date(entry.date).toLocaleDateString('en-IN');
                } else {
                    row[col.key] = entry[col.key] ?? '';
                }
            }
            sheet.addRow(row);
        }

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=${appId}_report.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (err) {
        next(err);
    }
};

// REVIEW / APPROVE / REJECT a DMS production entry
const reviewEntry = async (req, res, next) => {
    try {
        const { appId, id } = req.params;
        if (appId !== 'production') {
            return res.status(400).json({ error: 'Only production entries support approval workflow' });
        }

        const { status } = req.body;
        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ error: 'Invalid status — must be APPROVED or REJECTED' });
        }

        const entry = await prisma.productionDailyEntry.findUnique({ where: { id: parseInt(id) } });
        if (!entry) return res.status(404).json({ error: 'Entry not found' });
        if (entry.status !== 'PENDING') {
            return res.status(400).json({ error: 'Only pending entries can be reviewed' });
        }

        // Check plant access
        if (req.user.role !== 'GLOBAL_ADMIN' && req.user.plantId !== entry.plantId) {
            return res.status(403).json({ error: 'Access denied — different plant' });
        }

        const updated = await prisma.productionDailyEntry.update({
            where: { id: parseInt(id) },
            data: {
                status,
                reviewerId: req.user.id,
                reviewedAt: new Date(),
            },
        });

        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                plantId: entry.plantId,
                action: `DMS_PRODUCTION_${status}`,
                targetId: entry.id,
            },
        });

        logger.info(`DMS production entry ${id} ${status} by user ${req.user.id}`);
        res.json(updated);
    } catch (err) {
        next(err);
    }
};

module.exports = { createEntry, getEntries, getStats, exportEntries, reviewEntry };
