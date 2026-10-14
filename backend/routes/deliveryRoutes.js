const express = require('express');
const router = express.Router();
const {
  getDeliveryFeed,
  claimShipment,
  updateDeliveryStatus,
} = require('../controllers/deliveryController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.use(authorizeRoles('Delivery Partner', 'Platform Admin'));

router.get('/feed', getDeliveryFeed);
router.put('/claim/:subOrderId', claimShipment);
router.put('/orders/:subOrderId/status', updateDeliveryStatus);

module.exports = router;
