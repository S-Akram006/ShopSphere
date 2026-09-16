const express = require('express');
const router = express.Router();
const {
  getProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  addReview,
} = require('../controllers/productController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.get('/', getProducts);
router.get('/:id', getProductById);
router.post('/', protect, authorizeRoles('Seller', 'Platform Admin'), createProduct);
router.put('/:id', protect, authorizeRoles('Seller', 'Platform Admin'), updateProduct);
router.delete('/:id', protect, authorizeRoles('Seller', 'Platform Admin'), deleteProduct);
router.post('/:id/reviews', protect, authorizeRoles('Customer', 'Platform Admin'), addReview);

module.exports = router;
