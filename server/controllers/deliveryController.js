const SubOrder = require('../models/SubOrder');
const { validateTransition } = require('../services/stateMachine');

// @desc    Get delivery feed (shipments available for pickup or assigned to courier)
// @route   GET /api/delivery/feed
// @access  Private (Delivery Partner, Admin)
exports.getDeliveryFeed = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Assigned active shipments
    const activeShipments = await SubOrder.find({
      deliveryPartnerId: userId,
      status: { $in: ['Shipped', 'Out for Delivery'] },
    })
      .populate('storeId', 'storeName logo contactEmail')
      .populate('customerId', 'name phone email')
      .populate('parentOrderId', 'shippingAddress')
      .sort({ updatedAt: -1 });

    // Packed orders available to claim
    const readyForPickup = await SubOrder.find({
      status: 'Packed',
      deliveryPartnerId: null,
    })
      .populate('storeId', 'storeName logo contactEmail')
      .populate('customerId', 'name phone email')
      .populate('parentOrderId', 'shippingAddress')
      .sort({ createdAt: -1 });

    // Completed deliveries by this partner
    const completedShipments = await SubOrder.find({
      deliveryPartnerId: userId,
      status: 'Delivered',
    })
      .populate('storeId', 'storeName')
      .populate('customerId', 'name')
      .populate('parentOrderId', 'shippingAddress')
      .sort({ updatedAt: -1 })
      .limit(10);

    res.json({
      success: true,
      data: {
        activeShipments,
        readyForPickup,
        completedShipments,
        metrics: {
          activeCount: activeShipments.length,
          availableCount: readyForPickup.length,
          completedCount: completedShipments.length,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Claim a shipment and advance to 'Shipped'
// @route   PUT /api/delivery/claim/:subOrderId
// @access  Private (Delivery Partner)
exports.claimShipment = async (req, res, next) => {
  try {
    const subOrder = await SubOrder.findById(req.params.subOrderId);
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Sub-order not found' });
    }

    if (subOrder.status !== 'Packed') {
      return res.status(400).json({
        success: false,
        message: `Order must be in "Packed" status to be claimed for delivery. Current status: ${subOrder.status}`,
      });
    }

    const trackingNum = 'SPH-TRK-' + Math.floor(10000000 + Math.random() * 90000000);

    subOrder.deliveryPartnerId = req.user._id;
    subOrder.status = 'Shipped';
    subOrder.trackingNumber = trackingNum;
    subOrder.statusHistory.push({
      status: 'Shipped',
      note: `Shipment claimed and picked up by Courier Partner (${req.user.name}). Tracking: ${trackingNum}`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await subOrder.save();

    res.json({
      success: true,
      message: `Shipment claimed and dispatched with tracking #${trackingNum}`,
      data: subOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update delivery milestone status (Out for Delivery, Delivered)
// @route   PUT /api/delivery/orders/:subOrderId/status
// @access  Private (Delivery Partner, Admin)
exports.updateDeliveryStatus = async (req, res, next) => {
  try {
    const { targetStatus, note, location } = req.body;
    // targetStatus: 'Out for Delivery' | 'Delivered'

    const subOrder = await SubOrder.findById(req.params.subOrderId);
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Sub-order not found' });
    }

    // Verify state machine transition
    const validation = validateTransition(subOrder.status, targetStatus, req.user.role);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    subOrder.status = targetStatus;
    subOrder.statusHistory.push({
      status: targetStatus,
      note: note || `Status updated to ${targetStatus}${location ? ` at ${location}` : ''} by Courier`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await subOrder.save();

    res.json({
      success: true,
      message: `Shipment updated to "${targetStatus}"`,
      data: subOrder,
    });
  } catch (error) {
    next(error);
  }
};
