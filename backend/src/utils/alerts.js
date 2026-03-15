const { PrismaClient } = require('@prisma/client');
const logger = require('./logger');
const prisma = new PrismaClient();

/**
 * Check shift log data and create alerts when thresholds are exceeded.
 */
async function checkAndCreateAlerts(logData) {
    const alerts = [];

    const { plantId, userId, oeeScore, unplannedDowntime, grossProduction, targetQty } = logData;

    // HIGH_DOWNTIME: unplanned downtime > 60 minutes
    if (unplannedDowntime > 60) {
        alerts.push({
            plantId,
            userId,
            type: 'HIGH_DOWNTIME',
            severity: unplannedDowntime > 120 ? 'CRITICAL' : 'HIGH',
            title: 'High Unplanned Downtime',
            message: `Unplanned downtime of ${unplannedDowntime} minutes recorded on line ${logData.departmentName || 'Unknown'}.`,
        });
    }

    // LOW_OEE: OEE score below 65%
    if (oeeScore !== null && oeeScore !== undefined && oeeScore < 65) {
        alerts.push({
            plantId,
            userId,
            type: 'LOW_OEE',
            severity: oeeScore < 50 ? 'CRITICAL' : 'HIGH',
            title: 'Low OEE Score',
            message: `OEE score of ${oeeScore}% is below the 65% threshold.`,
        });
    }

    // TARGET_MISSED: production < 80% of target
    if (targetQty > 0 && grossProduction < targetQty * 0.8) {
        const achievement = ((grossProduction / targetQty) * 100).toFixed(1);
        alerts.push({
            plantId,
            userId,
            type: 'TARGET_MISSED',
            severity: grossProduction < targetQty * 0.5 ? 'CRITICAL' : 'MEDIUM',
            title: 'Production Target Missed',
            message: `Only ${achievement}% of target achieved (${grossProduction}/${targetQty}).`,
        });
    }

    // Create all alerts
    for (const alert of alerts) {
        try {
            await prisma.alert.create({ data: alert });
        } catch (err) {
            logger.error(`Failed to create alert: ${err.message}`);
        }
    }

    return alerts;
}

module.exports = { checkAndCreateAlerts };
