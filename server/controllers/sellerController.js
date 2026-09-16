const SubOrder = require('../models/SubOrder');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { validateTransition } = require('../services/stateMachine');

// @desc    Get seller dashboard statistics and earnings
// @route   GET /api/seller/dashboard
// @access  Private (Seller)
exports.getSellerDashboard = async (req, res, next) => {
  try {
    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Seller store not found' });
    }

    const totalProducts = await Product.countDocuments({ storeId: store._id });
    const lowStockCount = await Product.countDocuments({ storeId: store._id, stock: { $lte: 5 } });

    const totalOrders = await SubOrder.countDocuments({ storeId: store._id });
    const pendingFulfillment = await SubOrder.countDocuments({
      storeId: store._id,
      status: { $in: ['Placed', 'Confirmed'] },
    });
    const shippedOrders = await SubOrder.countDocuments({
      storeId: store._id,
      status: { $in: ['Packed', 'Shipped', 'Out for Delivery'] },
    });
    const deliveredOrders = await SubOrder.countDocuments({
      storeId: store._id,
      status: 'Delivered',
    });

    const recentSubOrders = await SubOrder.find({ storeId: store._id })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('customerId', 'name email');

    res.json({
      success: true,
      data: {
        store,
        metrics: {
          balance: store.balance,
          totalSales: store.totalSales,
          totalProducts,
          lowStockCount,
          totalOrders,
          pendingFulfillment,
          shippedOrders,
          deliveredOrders,
        },
        recentOrders: recentSubOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all vendor sub-orders for seller
// @route   GET /api/seller/orders
// @access  Private (Seller)
exports.getSellerOrders = async (req, res, next) => {
  try {
    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const { status } = req.query;
    const filter = { storeId: store._id };
    if (status && status !== 'All') {
      filter.status = status;
    }

    const orders = await SubOrder.find(filter)
      .sort({ createdAt: -1 })
      .populate('customerId', 'name email phone')
      .populate('deliveryPartnerId', 'name phone')
      .populate('parentOrderId', 'shippingAddress paymentMethod');

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Transition sub-order status (Seller actions: Confirm, Pack, Ship)
// @route   PUT /api/seller/orders/:subOrderId/status
// @access  Private (Seller)
exports.updateSubOrderStatus = async (req, res, next) => {
  try {
    const { targetStatus, note, trackingNumber } = req.body;

    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const subOrder = await SubOrder.findOne({
      _id: req.params.subOrderId,
      storeId: store._id,
    });

    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Sub-order not found under your store' });
    }

    // State Machine verification
    const validation = validateTransition(subOrder.status, targetStatus, req.user.role);
    if (!validation.isValid) {
      return res.status(400).json({ success: false, message: validation.reason });
    }

    subOrder.status = targetStatus;
    if (trackingNumber) {
      subOrder.trackingNumber = trackingNumber;
    }

    subOrder.statusHistory.push({
      status: targetStatus,
      note: note || `Order advanced to ${targetStatus} by seller (${store.storeName})`,
      updatedBy: req.user._id,
      timestamp: new Date(),
    });

    await subOrder.save();

    res.json({
      success: true,
      message: `Sub-order transitioned to "${targetStatus}"`,
      data: subOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for logged-in seller
// @route   GET /api/seller/products
// @access  Private (Seller)
exports.getSellerProducts = async (req, res, next) => {
  try {
    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const products = await Product.find({ storeId: store._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};
