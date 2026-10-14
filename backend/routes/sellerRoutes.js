const express = require('express');
const router = express.Router();
const {
  getSellerDashboard,
  getSellerOrders,
  updateSubOrderStatus,
  getSellerProducts,
  restockProduct,
  requestPayout,
} = require('../controllers/sellerController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.use(authorizeRoles('Seller', 'Platform Admin'));

// Analytics & Dashboard
router.get('/dashboard', getSellerDashboard);
router.get('/analytics', getSellerDashboard);

// Restock quick-action trigger
router.put('/products/:productId/restock', restockProduct);

// Payout request
router.post('/payout', requestPayout);

// Orders & Products
router.get('/orders', getSellerOrders);
router.put('/orders/:subOrderId/status', updateSubOrderStatus);
router.get('/products', getSellerProducts);

module.exports = router;
