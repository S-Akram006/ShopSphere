const express = require('express');
const router = express.Router();
const {
  getStores,
  getStoreById,
  getMyStore,
  updateMyStore,
} = require('../controllers/storeController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getStores);
router.get('/my/profile', protect, authorizeRoles('Seller'), getMyStore);
router.put('/my/profile', protect, authorizeRoles('Seller'), updateMyStore);
router.get('/:id', getStoreById);

module.exports = router;
