const express = require('express');
const router = express.Router();
const {
  checkout,
  getMyOrders,
  getOrderById,
  getSubOrderById,
  cancelSubOrder,
  raiseDispute,
} = require('../controllers/orderController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/checkout', protect, authorizeRoles('Customer', 'Platform Admin'), checkout);
router.get('/my', protect, authorizeRoles('Customer', 'Platform Admin'), getMyOrders);
router.get('/:id', protect, getOrderById);
router.get('/suborders/:subOrderId', protect, getSubOrderById);
router.put('/suborders/:subOrderId/cancel', protect, cancelSubOrder);
router.post('/suborders/:subOrderId/dispute', protect, authorizeRoles('Customer', 'Platform Admin'), raiseDispute);

module.exports = router;
