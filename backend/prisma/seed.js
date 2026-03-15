const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Coca-Cola PlantFlow...\n');

  // ── Company ──────────────────────────────────────────────────────────────
  const company = await prisma.company.upsert({
    where: { code: 'HCCB' },
    update: {},
    create: { name: 'Hindustan Coca-Cola Beverages Pvt. Ltd.', code: 'HCCB' },
  });
  console.log(`✓ Company: ${company.name}`);

  // ── Plants ───────────────────────────────────────────────────────────────
  const plantsData = [
    { name: 'Dinanagar Plant', code: 'DNN', location: 'Dinanagar, Punjab', timezone: 'Asia/Kolkata' },
    { name: 'Jandiala Plant', code: 'JDL', location: 'Jandiala, Punjab', timezone: 'Asia/Kolkata' },
    { name: 'Sanand Plant', code: 'SND', location: 'Sanand, Gujarat', timezone: 'Asia/Kolkata' },
  ];

  const plants = {};
  for (const p of plantsData) {
    const plant = await prisma.plant.upsert({
      where: { code: p.code },
      update: {},
      create: { ...p, companyId: company.id },
    });
    plants[p.code] = plant;
    console.log(`✓ Plant: ${plant.name} (${plant.code})`);
  }

  // ── Production Lines ──────────────────────────────────────────────────────
  // DNN → 3 lines, JDL → 1 line, SND → configurable (add 1 placeholder)
  const linesData = [
    { plantCode: 'DNN', name: 'KHS PDW Line', code: 'KHS-PDW', ratedSpeed: 36000 },
    { plantCode: 'DNN', name: 'Line B/E', code: 'LINE-BE', ratedSpeed: 24000 },
    { plantCode: 'DNN', name: 'ASSD Line', code: 'ASSD', ratedSpeed: 18000 },
    { plantCode: 'JDL', name: 'KHS PDW Line', code: 'KHS-PDW', ratedSpeed: 36000 },
    { plantCode: 'SND', name: 'Line 1', code: 'LINE-1', ratedSpeed: 24000 },
  ];

  const lines = {};
  for (const l of linesData) {
    const line = await prisma.line.upsert({
      where: { plantId_code: { plantId: plants[l.plantCode].id, code: l.code } },
      update: {},
      create: { name: l.name, code: l.code, plantId: plants[l.plantCode].id, ratedSpeed: l.ratedSpeed },
    });
    lines[`${l.plantCode}-${l.code}`] = line;
    console.log(`  ✓ Line: ${l.name} @ ${l.plantCode}`);
  }

  // ── Equipment per Line ────────────────────────────────────────────────────
  const equipmentData = [
    { name: 'Preform Dryer', code: 'PFDRY', category: 'PRODUCTION' },
    { name: 'Labeller', code: 'LBL', category: 'PRODUCTION' },
    { name: 'Conveyor System', code: 'CONV', category: 'PRODUCTION' },
    { name: 'Shrink Wrapper', code: 'SHRWRP', category: 'PRODUCTION' },
    { name: 'Strapper', code: 'STRP', category: 'PRODUCTION' },
    { name: 'Date Coder', code: 'DTCDR', category: 'PRODUCTION' },
    { name: 'Boiler', code: 'BOLR', category: 'UTILITY' },
  ];

  let equipCount = 0;
  for (const lineKey of Object.keys(lines)) {
    const line = lines[lineKey];
    for (const eq of equipmentData) {
      await prisma.equipment.create({
        data: { name: eq.name, code: eq.code, lineId: line.id, category: eq.category },
      });
      equipCount++;
    }
  }
  console.log(`✓ Created ${equipCount} equipment records`);

  // ── Users ─────────────────────────────────────────────────────────────────
  const usersData = [
    // Global Admin
    { empId: 'EMP001', name: 'Rajesh Kumar', email: 'rajesh@hccb.com', phone: '9876543210', password: 'admin123', role: 'GLOBAL_ADMIN', plantCode: null, designation: 'IT Head', department: 'IT' },
    // Plant Managers
    { empId: 'EMP002', name: 'Suresh Mehta', email: 'suresh@hccb.com', phone: '9876543211', password: 'mgr123', role: 'PLANT_MANAGER', plantCode: 'DNN', designation: 'Plant Manager', department: 'Management' },
    { empId: 'EMP003', name: 'Harpreet Singh', email: 'harpreet@hccb.com', phone: '9876543214', password: 'mgr456', role: 'PLANT_MANAGER', plantCode: 'JDL', designation: 'Plant Manager', department: 'Management' },
    { empId: 'EMP004', name: 'Amit Shah', email: 'amit@hccb.com', phone: '9876543215', password: 'mgr789', role: 'PLANT_MANAGER', plantCode: 'SND', designation: 'Plant Manager', department: 'Management' },
    // Shift Supervisors
    { empId: 'EMP005', name: 'Gurpreet Kaur', email: 'gurpreet@hccb.com', phone: '9876543212', password: 'sup123', role: 'SHIFT_SUPERVISOR', plantCode: 'DNN', designation: 'Shift Supervisor', department: 'Production' },
    { empId: 'EMP006', name: 'Vikram Yadav', email: 'vikram@hccb.com', phone: '9876543216', password: 'sup456', role: 'SHIFT_SUPERVISOR', plantCode: 'DNN', designation: 'Shift Supervisor', department: 'Production' },
    { empId: 'EMP007', name: 'Mandeep Gill', email: 'mandeep@hccb.com', phone: '9876543217', password: 'sup789', role: 'SHIFT_SUPERVISOR', plantCode: 'JDL', designation: 'Shift Supervisor', department: 'Production' },
    // Operators
    { empId: 'EMP008', name: 'Balwinder Singh', email: 'balwinder@hccb.com', phone: '9876543213', password: 'op123', role: 'OPERATOR', plantCode: 'DNN', designation: 'Line Operator', department: 'Production' },
    { empId: 'EMP009', name: 'Ramesh Patel', email: 'ramesh@hccb.com', phone: '9876543218', password: 'op456', role: 'OPERATOR', plantCode: 'DNN', designation: 'Line Operator', department: 'Production' },
    { empId: 'EMP010', name: 'Jaswant Kumar', email: 'jaswant@hccb.com', phone: '9876543219', password: 'op789', role: 'OPERATOR', plantCode: 'JDL', designation: 'Line Operator', department: 'Production' },
    // HR
    { empId: 'EMP011', name: 'Priya Sharma', email: 'priya@hccb.com', phone: '9876543220', password: 'hr123', role: 'ADMIN', plantCode: 'DNN', designation: 'HR Manager', department: 'HR', isHR: true },
  ];

  const users = {};
  for (const u of usersData) {
    const hashed = await bcrypt.hash(u.password, 12);
    const user = await prisma.user.upsert({
      where: { empId: u.empId },
      update: { phone: u.phone },
      create: {
        empId: u.empId,
        name: u.name,
        email: u.email,
        phone: u.phone,
        password: hashed,
        role: u.role,
        designation: u.designation,
        department: u.department,
        plantId: u.plantCode ? plants[u.plantCode].id : null,
        isHR: u.isHR || false,
        contactNo: u.phone,
      },
    });
    users[u.empId] = user;
    console.log(`  ✓ ${u.role}: ${u.name} (${u.phone}) @ ${u.plantCode || 'GLOBAL'}`);
  }

  // ── SKUs ──────────────────────────────────────────────────────────────────
  // Placeholder — admin adds real SKUs from the UI
  const skuData = [
    { name: 'Coke 500ml PET', code: 'CK-500', sizeML: 500, packageType: 'PET' },
    { name: 'Coke 1.25L PET', code: 'CK-1250', sizeML: 1250, packageType: 'PET' },
    { name: 'Coke 2L PET', code: 'CK-2000', sizeML: 2000, packageType: 'PET' },
    { name: 'Sprite 500ml PET', code: 'SP-500', sizeML: 500, packageType: 'PET' },
    { name: 'Limca 250ml PET', code: 'LM-250', sizeML: 250, packageType: 'PET' },
  ];

  for (const plantCode of ['DNN', 'JDL', 'SND']) {
    for (const sku of skuData) {
      await prisma.sKU.upsert({
        where: { plantId_code: { plantId: plants[plantCode].id, code: sku.code } },
        update: {},
        create: { ...sku, plantId: plants[plantCode].id },
      });
    }
  }
  console.log(`✓ SKUs seeded for all plants`);

  // ── Sample Shift Logs ─────────────────────────────────────────────────────
  const calcOEE = (grossProduction, targetQty, unplannedDowntime, plannedDowntime, goodQty, shiftDuration = 480) => {
    const availableTime = shiftDuration - plannedDowntime;
    const runTime = Math.max(availableTime - unplannedDowntime, 0);
    const availability = availableTime > 0 ? (runTime / availableTime) * 100 : 0;
    const ratedOutput = targetQty;
    const performance = ratedOutput > 0 ? Math.min((grossProduction / ratedOutput) * 100, 100) : 100;
    const quality = grossProduction > 0 ? (goodQty / grossProduction) * 100 : 100;
    const oeeScore = (availability * performance * quality) / 10000;
    return {
      oeeAvailability: +availability.toFixed(1),
      oeePerformance: +performance.toFixed(1),
      oeeQuality: +quality.toFixed(1),
      oeeScore: +oeeScore.toFixed(1),
      runTime: runTime,
    };
  };

  const shifts = ['A', 'B', 'C'];
  const dnnLines = Object.values(lines).filter(l => Object.keys(lines).find(k => k.startsWith('DNN') && lines[k].id === l.id));
  const allLines = Object.values(lines);
  const dnnSkus = await prisma.sKU.findMany({ where: { plantId: plants['DNN'].id } });
  const operators = [users['EMP008'], users['EMP009']].filter(Boolean);
  const supervisor = users['EMP005'];

  let logCount = 0;
  for (let day = 0; day < 14; day++) {
    const date = new Date();
    date.setDate(date.getDate() - day);

    for (const line of allLines.slice(0, 3)) {
      for (const shift of shifts) {
        const grossProduction = Math.floor(Math.random() * 5000 + 15000);
        const targetQty = 20000;
        const rejectedQty = Math.floor(Math.random() * 300);
        const goodQty = grossProduction - rejectedQty;
        const plannedDowntime = 30;
        const unplannedDowntime = Math.floor(Math.random() * 60);
        const changeoverTime = Math.floor(Math.random() * 20);
        const sku = dnnSkus[Math.floor(Math.random() * dnnSkus.length)];
        const oee = calcOEE(grossProduction, targetQty, unplannedDowntime, plannedDowntime, goodQty);
        const status = day > 2 ? (Math.random() > 0.2 ? 'APPROVED' : 'REJECTED') : 'PENDING';
        const operator = operators[Math.floor(Math.random() * operators.length)];

        const shiftLog = await prisma.shiftLog.create({
          data: {
            date: date,
            shift: shift,
            plantId: line.plantId,
            lineId: line.id,
            skuId: sku?.id,
            skuName: sku?.name,
            targetQty,
            grossProduction,
            goodQty,
            rejectedQty,
            shiftDuration: 480,
            plannedDowntime,
            unplannedDowntime,
            changeoverTime,
            runTime: oee.runTime,
            oeeAvailability: oee.oeeAvailability,
            oeePerformance: oee.oeePerformance,
            oeeQuality: oee.oeeQuality,
            oeeScore: oee.oeeScore,
            status,
            userId: operator?.id || users['EMP008'].id,
            reviewerId: status !== 'PENDING' ? supervisor?.id : null,
            reviewedAt: status !== 'PENDING' ? new Date() : null,
            remarks: day % 5 === 0 ? 'Shift ran within normal parameters' : null,
          },
        });

        // Downtime logs per shift
        const equipList = await prisma.equipment.findMany({ where: { lineId: line.id } });
        const numDowntimes = Math.floor(Math.random() * 3) + 1;
        for (let d = 0; d < numDowntimes; d++) {
          const equip = equipList[Math.floor(Math.random() * equipList.length)];
          if (!equip) continue;
          await prisma.downtimeLog.create({
            data: {
              shiftLogId: shiftLog.id,
              lineId: line.id,
              equipmentId: equip.id,
              type: Math.random() > 0.4 ? 'UNPLANNED' : 'PLANNED',
              durationMins: Math.floor(Math.random() * 25) + 5,
              reason: ['Mechanical failure', 'Sensor fault', 'Jam at conveyor', 'Label jam', 'Preform stuck', 'Scheduled PM', 'Operator break'][Math.floor(Math.random() * 7)],
              actionTaken: ['Cleared manually', 'Reset done', 'Technician called', 'PM completed'][Math.floor(Math.random() * 4)],
            },
          });
        }

        // Quality log
        if (rejectedQty > 0) {
          await prisma.qualityLog.create({
            data: {
              shiftLogId: shiftLog.id,
              lineId: line.id,
              skuId: sku?.id,
              rejectQty: rejectedQty,
              rejectReason: ['Underfill', 'Label misalign', 'Cap defect', 'Foreign matter', 'Deformed bottle'][Math.floor(Math.random() * 5)],
              rejectStage: ['Blowing', 'Filling', 'Labelling', 'Packaging'][Math.floor(Math.random() * 4)],
            },
          });
        }

        // Utility log (boiler)
        await prisma.utilityLog.create({
          data: {
            shiftLogId: shiftLog.id,
            lineId: line.id,
            utilityType: 'BOILER_PRESSURE',
            reading: +(6 + Math.random() * 2).toFixed(2),
            unit: 'bar',
            notes: null,
          },
        });

        logCount++;
      }
    }
  }

  console.log(`✓ Created ${logCount} shift logs with downtime, quality & utility data`);

  console.log('\n✅ Seeding complete!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('  PLANTFLOW — HCCB LOGIN CREDENTIALS (Phone Login)');
  console.log('═══════════════════════════════════════════════════');
  console.log('  GLOBAL ADMIN   9876543210   admin123');
  console.log('  PLANT MGR DNN  9876543211   mgr123');
  console.log('  PLANT MGR JDL  9876543214   mgr456');
  console.log('  PLANT MGR SND  9876543215   mgr789');
  console.log('  SUPERVISOR DNN 9876543212   sup123');
  console.log('  SUPERVISOR DNN 9876543216   sup456');
  console.log('  SUPERVISOR JDL 9876543217   sup789');
  console.log('  OPERATOR DNN   9876543213   op123');
  console.log('  OPERATOR DNN   9876543218   op456');
  console.log('  OPERATOR JDL   9876543219   op789');
  console.log('  HR ADMIN DNN   9876543220   hr123');
  console.log('═══════════════════════════════════════════════════');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());