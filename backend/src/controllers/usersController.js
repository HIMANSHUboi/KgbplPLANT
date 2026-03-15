const prisma = require('../utils/prisma');
const bcrypt = require('bcryptjs');
const logger = require('../utils/logger');

exports.getUsers = async (req, res) => {
  try {
    const where = {};
    // Scope to plant unless GLOBAL_ADMIN
    if (req.user.role !== 'GLOBAL_ADMIN' && req.user.plantId) {
      where.plantId = req.user.plantId;
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true, empId: true, name: true, phone: true, email: true, role: true,
        designation: true, department: true, contactNo: true,
        plantId: true, plant: { select: { id: true, name: true, code: true } },
        status: true, isHR: true, createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch (err) {
    logger.error(`getUsers: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { name, phone, email, password, role, department, empId, plantId, designation, contactNo, isHR } = req.body;

    if (!phone) return res.status(400).json({ error: 'Phone number is required' });

    const exists = await prisma.user.findUnique({ where: { phone } });
    if (exists) return res.status(400).json({ error: 'Phone number already in use' });

    // Check empId uniqueness if provided
    if (empId) {
      const empExists = await prisma.user.findUnique({ where: { empId } });
      if (empExists) return res.status(400).json({ error: 'Employee ID already in use' });
    }

    const hashed = await bcrypt.hash(password, 12);
    const resolvedPlantId = plantId ? parseInt(plantId)
      : (req.user.role !== 'GLOBAL_ADMIN' ? req.user.plantId : null);

    const user = await prisma.user.create({
      data: {
        name, phone, email: email || null, password: hashed, role,
        department: department || null,
        empId: empId || null,
        plantId: resolvedPlantId,
        designation: designation || null,
        contactNo: contactNo || null,
        isHR: isHR || false,
      },
      select: {
        id: true, empId: true, name: true, phone: true, email: true, role: true,
        designation: true, department: true, contactNo: true,
        plantId: true, plant: { select: { id: true, name: true, code: true } },
        status: true, isHR: true,
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, plantId: resolvedPlantId, action: 'USER_CREATED', targetId: user.id },
    });

    logger.info(`User created: ${phone} by admin ${req.user.id}`);
    res.status(201).json(user);
  } catch (err) {
    logger.error(`createUser: ${err.message}`);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, role, department, status, password, empId, plantId, designation, contactNo, isHR } = req.body;

    const data = {};
    if (name !== undefined) data.name = name;
    if (role !== undefined) data.role = role;
    if (department !== undefined) data.department = department;
    if (status !== undefined) data.status = status;
    if (empId !== undefined) data.empId = empId || null;
    if (plantId !== undefined) data.plantId = plantId ? parseInt(plantId) : null;
    if (designation !== undefined) data.designation = designation || null;
    if (contactNo !== undefined) data.contactNo = contactNo || null;
    if (isHR !== undefined) data.isHR = isHR;
    if (password) data.password = await bcrypt.hash(password, 12);

    const user = await prisma.user.update({
      where: { id: parseInt(id) },
      data,
      select: {
        id: true, empId: true, name: true, phone: true, email: true, role: true,
        designation: true, department: true, contactNo: true,
        plantId: true, plant: { select: { id: true, name: true, code: true } },
        status: true, isHR: true,
      },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'USER_UPDATED', targetId: user.id },
    });

    res.json(user);
  } catch (err) {
    logger.error(`updateUser: ${err.message}`);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.id)
      return res.status(400).json({ error: 'Cannot delete your own account' });

    await prisma.user.update({
      where: { id: parseInt(id) },
      data: { status: 'INACTIVE' },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, action: 'USER_DEACTIVATED', targetId: parseInt(id) },
    });

    res.json({ message: 'User deactivated successfully' });
  } catch (err) {
    logger.error(`deleteUser: ${err.message}`);
    res.status(500).json({ error: 'Failed to deactivate user' });
  }
};

// Bulk upload users from Excel
exports.bulkUpload = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    const ExcelJS = require('exceljs');
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);

    const sheet = workbook.worksheets[0];
    if (!sheet) return res.status(400).json({ error: 'Empty worksheet' });

    const rows = [];
    const results = { success: 0, failed: 0, errors: [] };

    // Read rows (skip header row)
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // skip header
      rows.push({
        rowNumber,
        name: String(row.getCell(1).value || '').trim(),
        phone: String(row.getCell(2).value || '').trim(),
        password: String(row.getCell(3).value || '').trim(),
        role: String(row.getCell(4).value || 'OPERATOR').trim().toUpperCase(),
        department: String(row.getCell(5).value || '').trim() || null,
        empId: String(row.getCell(6).value || '').trim() || null,
        designation: String(row.getCell(7).value || '').trim() || null,
        contactNo: String(row.getCell(8).value || '').trim() || null,
      });
    });

    if (rows.length === 0) return res.status(400).json({ error: 'No data rows found' });

    const validRoles = ['OPERATOR', 'SHIFT_SUPERVISOR', 'PLANT_MANAGER', 'ADMIN', 'GLOBAL_ADMIN'];
    const resolvedPlantId = req.user.role !== 'GLOBAL_ADMIN' ? req.user.plantId : null;

    for (const row of rows) {
      try {
        // Validate required fields
        if (!row.name || !row.phone || !row.password) {
          results.errors.push({ row: row.rowNumber, error: 'Name, phone, and password are required' });
          results.failed++;
          continue;
        }

        if (!validRoles.includes(row.role)) {
          results.errors.push({ row: row.rowNumber, error: `Invalid role: ${row.role}` });
          results.failed++;
          continue;
        }

        // Check existing phone
        const exists = await prisma.user.findUnique({ where: { phone: row.phone } });
        if (exists) {
          results.errors.push({ row: row.rowNumber, error: `Phone already exists: ${row.phone}` });
          results.failed++;
          continue;
        }

        // Check existing empId
        if (row.empId) {
          const empExists = await prisma.user.findUnique({ where: { empId: row.empId } });
          if (empExists) {
            results.errors.push({ row: row.rowNumber, error: `Employee ID already exists: ${row.empId}` });
            results.failed++;
            continue;
          }
        }

        const hashed = await bcrypt.hash(row.password, 12);
        await prisma.user.create({
          data: {
            name: row.name,
            phone: row.phone,
            password: hashed,
            role: row.role,
            department: row.department,
            empId: row.empId,
            plantId: resolvedPlantId,
            designation: row.designation,
            contactNo: row.contactNo,
          },
        });
        results.success++;
      } catch (rowErr) {
        results.errors.push({ row: row.rowNumber, error: rowErr.message });
        results.failed++;
      }
    }

    logger.info(`Bulk upload: ${results.success} created, ${results.failed} failed by admin ${req.user.id}`);
    res.json({ message: `${results.success} users created, ${results.failed} failed`, ...results });
  } catch (err) {
    logger.error(`bulkUpload: ${err.message}`);
    res.status(500).json({ error: 'Failed processing upload' });
  }
};