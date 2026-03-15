const express = require('express');
const router = express.Router();
const vehicleController = require('../controllers/vehicleController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.post('/', vehicleController.createVehicleEntry);
router.get('/stats', vehicleController.getVehicleStats);
router.get('/tat', vehicleController.getVehicleTAT);
router.get('/', vehicleController.getVehicles);
router.patch('/:id/status', vehicleController.updateVehicleStatus);

module.exports = router;
