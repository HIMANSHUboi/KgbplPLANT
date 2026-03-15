const prisma = require('../utils/prisma');

// Create a new vehicle entry (Gate In)
exports.createVehicleEntry = async (req, res) => {
    try {
        const { vehicleNumber, transporterName, destination, driverContact, vehicleCapacity, agency, shift } = req.body;

        if (!vehicleNumber || !transporterName || !driverContact || !shift) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        if (!req.user.plantId) {
            return res.status(400).json({ error: 'Your account is not assigned to a plant. Please contact your administrator.' });
        }

        const vehicle = await prisma.vehicleLog.create({
            data: {
                vehicleNumber: vehicleNumber.toUpperCase(),
                transporterName,
                destination,
                driverContact,
                vehicleCapacity,
                agency,
                shift,
                plantId: req.user.plantId,
                userId: req.user.id,
                status: 'GATE_IN'
            }
        });

        res.status(201).json(vehicle);
    } catch (error) {
        console.error('Create vehicle error:', error);
        res.status(500).json({ error: 'Failed to create vehicle entry' });
    }
};

// Get all vehicles for a plant (optionally filtered by status)
exports.getVehicles = async (req, res) => {
    try {
        if (!req.user.plantId) {
            return res.json([]);
        }
        const { status } = req.query;
        const whereClause = { plantId: req.user.plantId };

        if (status) {
            whereClause.status = status;
        }

        const vehicles = await prisma.vehicleLog.findMany({
            where: whereClause,
            include: {
                recordedBy: {
                    select: { name: true, empId: true }
                }
            },
            orderBy: { tokenNumber: 'desc' }
        });

        res.json(vehicles);
    } catch (error) {
        console.error('Get vehicles error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicles' });
    }
};

// Advance a vehicle to the next status
exports.updateVehicleStatus = async (req, res) => {
    try {
        if (!req.user.plantId) {
            return res.status(400).json({ error: 'Your account is not assigned to a plant.' });
        }
        const { id } = req.params;
        const { nextStatus, supplyLoaded } = req.body;

        if (!nextStatus) {
            return res.status(400).json({ error: 'Missing nextStatus field' });
        }

        const updateData = { status: nextStatus };
        if (supplyLoaded !== undefined) {
            updateData.supplyLoaded = parseFloat(supplyLoaded);
        }
        const now = new Date();

        switch (nextStatus) {
            case 'DOCK_REPORT':
                updateData.dockReportTime = now;
                break;
            case 'LOADING':
                updateData.loadingTime = now;
                break;
            case 'INVOICE':
                updateData.invoiceTime = now;
                break;
            case 'GATE_EXIT':
                updateData.gateExitTime = now;
                break;
            case 'COMPLETED':
                // Vehicle journey completed, no additional timestamp needed
                break;
            default:
                return res.status(400).json({ error: 'Invalid status transition' });
        }

        const updatedVehicle = await prisma.vehicleLog.update({
            where: { id: parseInt(id), plantId: req.user.plantId },
            data: updateData
        });

        res.json(updatedVehicle);
    } catch (error) {
        console.error('Update vehicle status error:', error);
        res.status(500).json({ error: 'Failed to update vehicle status' });
    }
};

// Get vehicle statistics (daily / weekly / monthly counts)
exports.getVehicleStats = async (req, res) => {
    try {
        if (!req.user.plantId) {
            return res.json({ todayTotal: 0, todayCompleted: 0, activeVehicles: 0, daily: [], weekly: [] });
        }
        const plantId = req.user.plantId;
        const now = new Date();

        // Today boundaries (IST-aware: use UTC offsets relative to now)
        const todayStart = new Date(now);
        todayStart.setHours(0, 0, 0, 0);
        const todayEnd = new Date(now);
        todayEnd.setHours(23, 59, 59, 999);

        // Last 30 days for daily breakdown
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        // Daily completed vehicles for last 30 days
        const completedVehicles = await prisma.vehicleLog.findMany({
            where: {
                plantId,
                status: 'COMPLETED',
                gateInTime: { gte: thirtyDaysAgo }
            },
            select: { gateInTime: true, tokenNumber: true }
        });

        // All vehicles created today (regardless of status) for daily total
        const todayTotal = await prisma.vehicleLog.count({
            where: { plantId, gateInTime: { gte: todayStart, lte: todayEnd } }
        });

        // Today completed
        const todayCompleted = await prisma.vehicleLog.count({
            where: { plantId, status: 'COMPLETED', gateInTime: { gte: todayStart, lte: todayEnd } }
        });

        // Currently active (not completed)
        const activeVehicles = await prisma.vehicleLog.count({
            where: { plantId, status: { not: 'COMPLETED' } }
        });

        // Build daily counts map for last 30 days
        const dailyCounts = {};
        for (let i = 0; i < 30; i++) {
            const d = new Date(thirtyDaysAgo);
            d.setDate(d.getDate() + i);
            const key = d.toISOString().split('T')[0];
            dailyCounts[key] = 0;
        }

        completedVehicles.forEach(v => {
            const key = new Date(v.gateInTime).toISOString().split('T')[0];
            if (dailyCounts[key] !== undefined) dailyCounts[key]++;
        });

        const daily = Object.entries(dailyCounts).map(([date, count]) => ({ date, count }));

        // Weekly totals (last 4 weeks)
        const weekly = [];
        for (let w = 3; w >= 0; w--) {
            const weekStart = new Date(now);
            weekStart.setDate(weekStart.getDate() - (w + 1) * 7);
            weekStart.setHours(0, 0, 0, 0);
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() - w * 7);
            weekEnd.setHours(23, 59, 59, 999);

            const count = await prisma.vehicleLog.count({
                where: {
                    plantId,
                    status: 'COMPLETED',
                    gateInTime: { gte: weekStart, lte: weekEnd }
                }
            });

            const label = `W${4 - w}`;
            weekly.push({ week: label, count });
        }

        res.json({
            todayTotal,
            todayCompleted,
            activeVehicles,
            daily,   // last 30 days
            weekly   // last 4 weeks
        });
    } catch (error) {
        console.error('Vehicle stats error:', error);
        res.status(500).json({ error: 'Failed to fetch vehicle stats' });
    }
};

// Get Vehicle TAT Analytics
exports.getVehicleTAT = async (req, res) => {
    try {
        if (!req.user.plantId) {
            return res.json({ kpis: {}, trend: [], stageBreakdown: [] });
        }
        const plantId = req.user.plantId;
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);
        thirtyDaysAgo.setHours(0, 0, 0, 0);

        // Get completed vehicles for last 30 days
        const vehicles = await prisma.vehicleLog.findMany({
            where: {
                plantId,
                status: 'COMPLETED',
                gateInTime: { gte: thirtyDaysAgo }
            },
            select: {
                gateInTime: true,
                dockReportTime: true,
                loadingTime: true,
                invoiceTime: true,
                gateExitTime: true,
            }
        });

        // Compute per-vehicle stage times (in minutes)
        const computeMinutes = (start, end) => {
            if (!start || !end) return 0;
            return Math.max(0, (new Date(end) - new Date(start)) / 60000);
        };

        const tatData = vehicles.map(v => {
            const gateToDock = computeMinutes(v.gateInTime, v.dockReportTime);
            const dockToLoading = computeMinutes(v.dockReportTime, v.loadingTime);
            const loadingToInvoice = computeMinutes(v.loadingTime, v.invoiceTime);
            const invoiceToExit = computeMinutes(v.invoiceTime, v.gateExitTime);
            const total = gateToDock + dockToLoading + loadingToInvoice + invoiceToExit;
            const dateStr = new Date(v.gateInTime).toISOString().split('T')[0];
            return { gateToDock, dockToLoading, loadingToInvoice, invoiceToExit, total, dateStr };
        });

        // Overall KPIs (average of all 30 days)
        const avg = (key) => tatData.length ? Math.round(tatData.reduce((s, d) => s + d[key], 0) / tatData.length) : 0;
        const kpis = {
            gateToDock: avg('gateToDock'),
            dockToLoading: avg('dockToLoading'),
            loadingToInvoice: avg('loadingToInvoice'),
            invoiceToExit: avg('invoiceToExit'),
            total: avg('total')
        };

        // Daily aggregation (last 14 days)
        const fourteenDaysAgo = new Date(now);
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        fourteenDaysAgo.setHours(0, 0, 0, 0);

        const dailyMap = {};
        for (let i = 0; i < 14; i++) {
            const d = new Date(fourteenDaysAgo);
            d.setDate(d.getDate() + i);
            dailyMap[d.toISOString().split('T')[0]] = {
                count: 0,
                gateToDock: 0, dockToLoading: 0, loadingToInvoice: 0, invoiceToExit: 0, total: 0
            };
        }

        tatData.forEach(d => {
            if (dailyMap[d.dateStr]) {
                dailyMap[d.dateStr].count++;
                dailyMap[d.dateStr].gateToDock += d.gateToDock;
                dailyMap[d.dateStr].dockToLoading += d.dockToLoading;
                dailyMap[d.dateStr].loadingToInvoice += d.loadingToInvoice;
                dailyMap[d.dateStr].invoiceToExit += d.invoiceToExit;
                dailyMap[d.dateStr].total += d.total;
            }
        });

        const trend = [];
        const stageBreakdown = [];

        Object.entries(dailyMap).sort((a, b) => a[0].localeCompare(b[0])).forEach(([date, aggs]) => {
            const formattedDate = new Date(date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
            if (aggs.count > 0) {
                trend.push({ date: formattedDate, avgTotal: Math.round(aggs.total / aggs.count) });
                stageBreakdown.push({
                    date: formattedDate,
                    'Gate Entry': Math.round(aggs.gateToDock / aggs.count),
                    'Loading': Math.round(aggs.dockToLoading / aggs.count),
                    'Invoice': Math.round(aggs.loadingToInvoice / aggs.count),
                    'Exit': Math.round(aggs.invoiceToExit / aggs.count),
                });
            } else {
                trend.push({ date: formattedDate, avgTotal: 0 });
                stageBreakdown.push({
                    date: formattedDate,
                    'Gate Entry': 0, 'Loading': 0, 'Invoice': 0, 'Exit': 0
                });
            }
        });

        res.json({ kpis, trend, stageBreakdown });
    } catch (error) {
        console.error('Vehicle TAT error:', error);
        res.status(500).json({ error: 'Failed to fetch TAT analytics' });
    }
};
