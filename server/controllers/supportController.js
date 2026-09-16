const SubOrder = require('../models/SubOrder');
const Store = require('../models/Store');
const Order = require('../models/Order');

// @desc    Get dispute cases for support queue
// @route   GET /api/support/disputes
// @access  Private (Support Agent, Platform Admin)
exports.getDisputeQueue = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = { 'dispute.isDisputed': true };

    if (status && status !== 'All') {
      filter['dispute.status'] = status;
    }

    const disputes = await SubOrder.find(filter)
      .populate('customerId', 'name email phone')
      .populate('storeId', 'storeName logo contactEmail balance')
      .populate('parentOrderId', 'shippingAddress paymentMethod')
      .sort({ 'dispute.requestedAt': -1 });

    const openCount = await SubOrder.countDocuments({
      'dispute.isDisputed': true,
      'dispute.status': 'Open',
    });
    const reviewCount = await SubOrder.countDocuments({
      'dispute.isDisputed': true,
      'dispute.status': 'Under Review',
    });
    const resolvedCount = await SubOrder.countDocuments({
      'dispute.isDisputed': true,
      'dispute.status': { $in: ['Resolved', 'Refunded', 'Rejected'] },
    });

    res.json({
      success: true,
      data: disputes,
      metrics: {
        openCount,
        reviewCount,
        resolvedCount,
        totalCases: openCount + reviewCount + resolvedCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resolve or update a dispute
// @route   PUT /api/support/disputes/:subOrderId/resolve
// @access  Private (Support Agent, Platform Admin)
exports.resolveDispute = async (req, res, next) => {
  try {
    const { action, resolutionNotes, refundAmount } = req.body;
    // action: 'Under Review' | 'Refunded' | 'Resolved' | 'Rejected'

    const subOrder = await SubOrder.findById(req.params.subOrderId).populate('storeId');
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Sub-order not found' });
    }

    if (!subOrder.dispute || !subOrder.dispute.isDisputed) {
      return res.status(400).json({ success: false, message: 'This sub-order does not have an active dispute' });
    }

    const effectiveRefund = refundAmount ? Number(refundAmount) : subOrder.dispute.refundAmount || subOrder.totalAmount;

    // Handle refund financial adjustment
    if (action === 'Refunded') {
      subOrder.status = 'Refunded';
      subOrder.dispute.status = 'Refunded';
      subOrder.dispute.refundAmount = effectiveRefund;

      // Deduct refund from store balance
      await Store.findByIdAndUpdate(subOrder.storeId._id, {
        $inc: { balance: -effectiveRefund },
      });

      // Update parent order payment status if all sub-orders refunded
      await Order.findByIdAndUpdate(subOrder.parentOrderId, {
        paymentStatus: 'Refunded',
      });
    } else {
      subOrder.dispute.status = action;
    }

    subOrder.dispute.resolutionNotes = resolutionNotes || `Case updated to ${action} by Support Agent.`;
    subOrder.dispute.resolvedAt = ['Refunded', 'Resolved', 'Rejected'].includes(action) ? new Date() : null;
    subOrder.dispute.resolvedBy = req.user._id;

    subOrder.statusHistory.push({
      status: subOrder.status,
      note: `Dispute ${action}: ${resolutionNotes || 'Processed by Support Agent'}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await subOrder.save();

    res.json({
      success: true,
      message: `Dispute successfully marked as "${action}".`,
      data: subOrder,
    });
  } catch (error) {
    next(error);
  }
};
