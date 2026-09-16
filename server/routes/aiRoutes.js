const express = require('express');
const router = express.Router();
const {
  generateDescription,
  semanticSearch,
} = require('../controllers/aiController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.post('/generate-description', protect, authorizeRoles('Seller', 'Platform Admin'), generateDescription);
router.get('/semantic-search', semanticSearch);

module.exports = router;
