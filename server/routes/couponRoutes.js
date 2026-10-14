const express = require('express');
const router = express.Router();
const {
  validateAndApplyCoupon,
  getActiveCoupons,
  createCoupon,
} = require('../controllers/couponController');
const { protect, authorizeRoles } = require('../middleware/auth');

// Public validation and retrieval
router.post('/apply', validateAndApplyCoupon);
router.get('/', getActiveCoupons);

// Protected coupon creation (Seller or Platform Admin)
router.post('/', protect, authorizeRoles('Seller', 'Platform Admin'), createCoupon);

module.exports = router;
