const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');
const logger = require('../utils/logger');


const signTokens = (user) => {
  const payload = {
    id: user.id,
    phone: user.phone,
    role: user.role,
    name: user.name,
    empId: user.empId,
    plantId: user.plantId,
    department: user.department,
    designation: user.designation,
  };
  const access = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
  const refresh = jwt.sign({ id: user.id }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
  return { access, refresh };
};

exports.login = async (req, res) => {
  try {
    const { phone, password } = req.body;
    const user = await prisma.user.findUnique({
      where: { phone },
      include: { plant: { select: { id: true, name: true, code: true } } },
    });

    if (!user || user.status === 'INACTIVE')
      return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const { access, refresh } = signTokens(user);

    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    logger.info(`User logged in: ${phone} (${user.role} @ ${user.plant?.code || 'GLOBAL'})`);

    res.json({
      token: access,
      user: {
        id: user.id,
        empId: user.empId,
        name: user.name,
        phone: user.phone,
        email: user.email,
        role: user.role,
        designation: user.designation,
        department: user.department,
        plantId: user.plantId,
        plant: user.plant,
        isHR: user.isHR,
      },
    });
  } catch (err) {
    logger.error(`login: ${err.message}`);
    res.status(500).json({ error: `Login failed: ${err.message}` });
  }
};

exports.refresh = async (req, res) => {
  const token = req.cookies.refreshToken;
  if (!token) return res.status(401).json({ error: 'No refresh token' });
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { plant: { select: { id: true, name: true, code: true } } },
    });
    if (!user) return res.status(401).json({ error: 'User not found' });
    const { access, refresh } = signTokens(user);
    res.cookie('refreshToken', refresh, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.json({ token: access });
  } catch {
    res.status(401).json({ error: 'Invalid refresh token' });
  }
};

exports.logout = (req, res) => {
  res.clearCookie('refreshToken');
  res.json({ message: 'Logged out' });
};

exports.me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        empId: true,
        name: true,
        phone: true,
        email: true,
        role: true,
        designation: true,
        department: true,
        contactNo: true,
        plantId: true,
        plant: { select: { id: true, name: true, code: true, location: true } },
        status: true,
        isHR: true,
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    logger.error(`me: ${err.message}`);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword)
      return res.status(400).json({ error: 'Current and new password are required' });
    if (newPassword.length < 6)
      return res.status(400).json({ error: 'New password must be at least 6 characters' });

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashed },
    });

    await prisma.auditLog.create({
      data: { userId: req.user.id, plantId: req.user.plantId || null, action: 'PASSWORD_CHANGED' },
    });

    logger.info(`Password changed by user ${req.user.id} (${req.user.phone})`);
    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    logger.error(`changePassword: ${err.message}`);
    res.status(500).json({ error: 'Failed to change password' });
  }
};