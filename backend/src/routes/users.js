const router = require('express').Router();
const multer = require('multer');
const { authenticate, requireRole } = require('../middleware/auth');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { getUsers, createUser, updateUser, deleteUser, bulkUpload } = require('../controllers/usersController');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), getUsers);
router.post('/', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), [
  body('name').notEmpty(),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('role').isIn(['OPERATOR', 'SHIFT_SUPERVISOR', 'PLANT_MANAGER', 'ADMIN', 'GLOBAL_ADMIN']),
], validate, createUser);
router.post('/bulk-upload', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), upload.single('file'), bulkUpload);
router.patch('/:id', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), updateUser);
router.delete('/:id', authenticate, requireRole('ADMIN', 'GLOBAL_ADMIN'), deleteUser);

module.exports = router;