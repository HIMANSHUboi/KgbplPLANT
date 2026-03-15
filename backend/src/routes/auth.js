const router = require('express').Router();
const { login, refresh, logout, me, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');

router.post('/login', [
  body('phone').notEmpty().withMessage('Phone number is required'),
  body('password').notEmpty(),
], validate, login);

router.post('/refresh', refresh);
router.post('/logout', logout);
router.get('/me', authenticate, me);
router.post('/change-password', authenticate, [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 6 }),
], validate, changePassword);

module.exports = router;