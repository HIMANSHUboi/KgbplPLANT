const prisma = require('../utils/prisma');
const logger = require('../utils/logger');

exports.getEmployeePerformance = async (req, res) => {
    try {
        const { days = 30 } = req.query;
        const since = new Date();
        since.setDate(since.getDate() - parseInt(days));

        const plantId = req.user.role === 'GLOBAL_ADMIN'
            ? (req.query.plantId ? parseInt(req.query.plantId) : null)
            : req.user.plantId;

        // Get all active users for this plant
        const userWhere = { status: 'ACTIVE' };
        if (plantId) userWhere.plantId = plantId;

        const users = await prisma.user.findMany({
            where: userWhere,
            select: {
                id: true, name: true, empId: true, role: true,
                designation: true, department: true,
            },
        });

        const userIds = users.map(u => u.id);

        // Fetch shift logs for these users within the date range
        const shiftLogWhere = {
            userId: { in: userIds },
            date: { gte: since },
        };
        if (plantId) shiftLogWhere.plantId = plantId;

        const shiftLogs = await prisma.shiftLog.findMany({
            where: shiftLogWhere,
            select: {
                id: true, userId: true, date: true, shift: true, status: true,
                grossProduction: true, goodQty: true, targetQty: true,
                oeeScore: true, oeeAvailability: true, oeePerformance: true, oeeQuality: true,
                unplannedDowntime: true,
            },
        });

        // Fetch DMS production entries
        const prodWhere = {
            userId: { in: userIds },
            date: { gte: since },
        };
        if (plantId) prodWhere.plantId = plantId;

        const prodEntries = await prisma.productionDailyEntry.findMany({
            where: prodWhere,
            select: {
                id: true, userId: true, date: true, shift: true, status: true,
                volumeKhsPdw: true, volumeKronesCsd: true, volumeTetra: true,
            },
        });

        // Aggregate per user
        const performance = users.map(user => {
            const userShiftLogs = shiftLogs.filter(l => l.userId === user.id);
            const userProdEntries = prodEntries.filter(e => e.userId === user.id);

            const totalLogs = userShiftLogs.length;
            const totalDmsEntries = userProdEntries.length;
            const totalEntries = totalLogs + totalDmsEntries;

            // Shift log stats
            const approvedLogs = userShiftLogs.filter(l => l.status === 'APPROVED').length;
            const rejectedLogs = userShiftLogs.filter(l => l.status === 'REJECTED').length;
            const pendingLogs = userShiftLogs.filter(l => l.status === 'PENDING').length;

            // DMS entry stats
            const approvedDms = userProdEntries.filter(e => e.status === 'APPROVED').length;
            const rejectedDms = userProdEntries.filter(e => e.status === 'REJECTED').length;

            const totalApproved = approvedLogs + approvedDms;
            const totalSubmitted = totalLogs + totalDmsEntries;
            const approvalRate = totalSubmitted > 0 ? +((totalApproved / totalSubmitted) * 100).toFixed(1) : 0;

            // OEE stats (from shift logs only)
            const oeeEntries = userShiftLogs.filter(l => l.oeeScore != null);
            const avgOEE = oeeEntries.length
                ? +(oeeEntries.reduce((s, l) => s + l.oeeScore, 0) / oeeEntries.length).toFixed(1)
                : null;
            const avgAvailability = oeeEntries.length
                ? +(oeeEntries.reduce((s, l) => s + (l.oeeAvailability || 0), 0) / oeeEntries.length).toFixed(1)
                : null;
            const avgPerformance = oeeEntries.length
                ? +(oeeEntries.reduce((s, l) => s + (l.oeePerformance || 0), 0) / oeeEntries.length).toFixed(1)
                : null;
            const avgQuality = oeeEntries.length
                ? +(oeeEntries.reduce((s, l) => s + (l.oeeQuality || 0), 0) / oeeEntries.length).toFixed(1)
                : null;

            // Production stats
            const totalGross = userShiftLogs.reduce((s, l) => s + (l.grossProduction || 0), 0);
            const totalGood = userShiftLogs.reduce((s, l) => s + (l.goodQty || 0), 0);
            const totalTarget = userShiftLogs.reduce((s, l) => s + (l.targetQty || 0), 0);
            const targetAchievement = totalTarget > 0 ? +((totalGross / totalTarget) * 100).toFixed(1) : 0;
            const totalDowntime = userShiftLogs.reduce((s, l) => s + (l.unplannedDowntime || 0), 0);

            // DMS volume totals
            const dmsVolumeTotal = userProdEntries.reduce((s, e) =>
                s + (e.volumeKhsPdw || 0) + (e.volumeKronesCsd || 0) + (e.volumeTetra || 0), 0);

            // Shift distribution
            const shiftDist = {};
            userShiftLogs.forEach(l => {
                shiftDist[l.shift] = (shiftDist[l.shift] || 0) + 1;
            });

            // Entries per day (unique dates)
            const uniqueDates = new Set([
                ...userShiftLogs.map(l => l.date.toISOString().split('T')[0]),
                ...userProdEntries.map(e => e.date.toISOString().split('T')[0]),
            ]);
            const activeDays = uniqueDates.size;
            const entriesPerDay = activeDays > 0 ? +(totalEntries / activeDays).toFixed(1) : 0;

            // Efficiency score — composite score (0-100)
            // weighted: approvalRate(30%) + targetAchievement(30%) + avgOEE(40%)
            const effOEE = avgOEE != null ? avgOEE : 0;
            const efficiencyScore = +(
                (approvalRate * 0.3) +
                (Math.min(targetAchievement, 100) * 0.3) +
                (effOEE * 0.4)
            ).toFixed(1);

            return {
                user,
                totalEntries,
                totalShiftLogs: totalLogs,
                totalDmsEntries,
                approvedLogs,
                rejectedLogs,
                pendingLogs,
                approvedDms,
                rejectedDms,
                totalApproved,
                approvalRate,
                avgOEE,
                avgAvailability,
                avgPerformance,
                avgQuality,
                totalGross,
                totalGood,
                totalTarget,
                targetAchievement,
                totalDowntime,
                dmsVolumeTotal,
                shiftDist,
                activeDays,
                entriesPerDay,
                efficiencyScore,
            };
        });

        // Filter out employees with 0 entries, then sort by efficiency score descending
        const activeEmployees = performance.filter(p => p.totalEntries > 0);
        activeEmployees.sort((a, b) => b.efficiencyScore - a.efficiencyScore);

        // Overall stats
        const totalShiftLogs = shiftLogs.length;
        const totalProdEntries = prodEntries.length;
        const overallApproved = shiftLogs.filter(l => l.status === 'APPROVED').length
            + prodEntries.filter(e => e.status === 'APPROVED').length;
        const overallTotal = totalShiftLogs + totalProdEntries;
        const overallApprovalRate = overallTotal > 0 ? +((overallApproved / overallTotal) * 100).toFixed(1) : 0;

        const oeeAll = shiftLogs.filter(l => l.oeeScore != null);
        const overallAvgOEE = oeeAll.length
            ? +(oeeAll.reduce((s, l) => s + l.oeeScore, 0) / oeeAll.length).toFixed(1) : 0;

        const bestPerformer = activeEmployees.length > 0 ? activeEmployees[0] : null;

        res.json({
            employees: activeEmployees,
            lastUpdated: new Date().toISOString(),
            summary: {
                totalEmployees: users.length,
                totalShiftLogs,
                totalProdEntries,
                overallApprovalRate,
                overallAvgOEE,
                bestPerformer: bestPerformer ? {
                    name: bestPerformer.user.name,
                    score: bestPerformer.efficiencyScore,
                } : null,
            },
        });
    } catch (err) {
        logger.error(`getEmployeePerformance: ${err.message}`);
        res.status(500).json({ error: 'Failed to fetch performance data' });
    }
};
