const express = require('express');
const router = express.Router();
const {
  getPlatformStats,
  getStores,
  toggleStoreApproval,
  getAllProductsForAdmin,
  moderateProduct,
  getDisputes,
} = require('../controllers/adminController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.use(authorizeRoles('Platform Admin'));

router.get('/analytics', getPlatformStats);
router.get('/stores', getStores);
router.put('/stores/:id/approval', toggleStoreApproval);
router.get('/products', getAllProductsForAdmin);
router.put('/products/:id/moderation', moderateProduct);
router.get('/disputes', getDisputes);

module.exports = router;
