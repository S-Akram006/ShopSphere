const express = require('express');
const router = express.Router();
const {
  getSellerDashboard,
  getSellerOrders,
  updateSubOrderStatus,
  getSellerProducts,
} = require('../controllers/sellerController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.use(authorizeRoles('Seller', 'Platform Admin'));

router.get('/dashboard', getSellerDashboard);
router.get('/orders', getSellerOrders);
router.put('/orders/:subOrderId/status', updateSubOrderStatus);
router.get('/products', getSellerProducts);

module.exports = router;
