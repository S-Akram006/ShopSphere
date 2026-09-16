const express = require('express');
const router = express.Router();
const {
  getDisputeQueue,
  resolveDispute,
} = require('../controllers/supportController');
const { protect, authorizeRoles } = require('../middleware/auth');

router.use(protect);
router.use(authorizeRoles('Support Agent', 'Platform Admin'));

router.get('/disputes', getDisputeQueue);
router.put('/disputes/:subOrderId/resolve', resolveDispute);

module.exports = router;
