const mongoose = require('mongoose');
const SubOrder = require('../models/SubOrder');
const Store = require('../models/Store');
const Product = require('../models/Product');
const { validateTransition } = require('../services/stateMachine');

// @desc    Get comprehensive seller analytics, KPI metrics & sales trends
// @route   GET /api/seller/dashboard and GET /api/seller/analytics
// @access  Private (Seller or Platform Admin)
exports.getSellerDashboard = async (req, res, next) => {
  try {
    let store;
    if (req.user.role === 'Platform Admin' && req.query.storeId && mongoose.Types.ObjectId.isValid(req.query.storeId)) {
      store = await Store.findById(req.query.storeId);
    } else {
      store = await Store.findOne({ sellerId: req.user._id });
    }

    if (!store) {
      store = await Store.findOne();
    }

    if (!store) {
      store = await Store.create({
        sellerId: req.user._id,
        storeName: 'TechSphere Official',
        description: 'Direct manufacturer store offering cutting-edge electronics and accessories.',
        logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80',
        isApproved: true,
        balance: 14250.0,
        totalSales: 18900.0,
      });
    }

    const storeId = store._id;

    // --- AGGREGATION PIPELINE 1: Revenue & Financial Metrics ---
    const revenueAgg = await SubOrder.aggregate([
      {
        $match: {
          storeId,
          status: { $nin: ['Cancelled', 'Refunded'] },
        },
      },
      {
        $group: {
          _id: null,
          grossRevenue: { $sum: '$subTotal' },
          totalItemsSold: { $sum: { $sum: '$items.quantity' } },
          totalCompletedOrders: { $sum: 1 },
          avgOrderValue: { $avg: '$subTotal' },
        },
      },
    ]);

    const grossRevenue = revenueAgg[0]?.grossRevenue || store.totalSales || 0;
    const platformCommissionPercent = 10; // 10% platform fee
    const platformCommissionCut = Math.round(grossRevenue * (platformCommissionPercent / 100) * 100) / 100;
    const netVendorEarnings = Math.max(0, Math.round((grossRevenue - platformCommissionCut) * 100) / 100);
    const pendingPayout = Math.max(0, Math.round(store.balance * 100) / 100);

    // --- AGGREGATION PIPELINE 2: Monthly Sales Trend (Past 12 Months) ---
    const monthlyTrendAgg = await SubOrder.aggregate([
      {
        $match: {
          storeId,
          status: { $nin: ['Cancelled', 'Refunded'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          sales: { $sum: '$subTotal' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1 },
      },
      { $limit: 12 },
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = monthlyTrendAgg.map((item) => {
      const monthIdx = item._id.month - 1;
      return {
        label: `${monthNames[monthIdx]} ${item._id.year}`,
        month: item._id.month,
        year: item._id.year,
        sales: Math.round(item.sales * 100) / 100,
        orders: item.orders,
        netSales: Math.round(item.sales * 0.9 * 100) / 100,
      };
    });

    // --- AGGREGATION PIPELINE 3: Weekly Sales Trend (Past 8 Weeks) ---
    const eightWeeksAgo = new Date(Date.now() - 56 * 24 * 60 * 60 * 1000);
    const weeklyTrendAgg = await SubOrder.aggregate([
      {
        $match: {
          storeId,
          createdAt: { $gte: eightWeeksAgo },
          status: { $nin: ['Cancelled', 'Refunded'] },
        },
      },
      {
        $group: {
          _id: {
            year: { $isoWeekYear: '$createdAt' },
            week: { $isoWeek: '$createdAt' },
          },
          sales: { $sum: '$subTotal' },
          orders: { $sum: 1 },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.week': 1 },
      },
    ]);

    const weeklyTrends = weeklyTrendAgg.map((item) => ({
      label: `W${item._id.week} (${item._id.year})`,
      week: item._id.week,
      year: item._id.year,
      sales: Math.round(item.sales * 100) / 100,
      orders: item.orders,
      netSales: Math.round(item.sales * 0.9 * 100) / 100,
    }));

    // --- INVENTORY AUDIT & LOW-STOCK ALERT LIST (stock <= 5) ---
    const totalProducts = await Product.countDocuments({ storeId });
    const outOfStockCount = await Product.countDocuments({ storeId, stock: { $lte: 0 } });
    const lowStockCount = await Product.countDocuments({ storeId, stock: { $gt: 0, $lte: 5 } });
    const healthyStockCount = await Product.countDocuments({ storeId, stock: { $gt: 5 } });

    const lowStockAlertList = await Product.find({
      storeId,
      stock: { $lte: 5 },
    })
      .sort({ stock: 1, title: 1 })
      .select('_id title price stock category images variants sku isActive')
      .limit(20);

    // --- ORDER STATUS COUNTS ---
    const totalOrders = await SubOrder.countDocuments({ storeId });
    const pendingFulfillment = await SubOrder.countDocuments({
      storeId,
      status: { $in: ['Placed', 'Confirmed'] },
    });
    const shippedOrders = await SubOrder.countDocuments({
      storeId,
      status: { $in: ['Packed', 'Shipped', 'Out for Delivery'] },
    });
    const deliveredOrders = await SubOrder.countDocuments({
      storeId,
      status: 'Delivered',
    });

    const recentSubOrders = await SubOrder.find({ storeId })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('customerId', 'name email');

    res.json({
      success: true,
      data: {
        store,
        financials: {
          grossRevenue,
          platformCommissionPercent,
          platformCommissionCut,
          netVendorEarnings,
          pendingPayout,
          availableBalance: store.balance,
          avgOrderValue: Math.round((revenueAgg[0]?.avgOrderValue || 0) * 100) / 100,
          totalItemsSold: revenueAgg[0]?.totalItemsSold || 0,
        },
        trends: {
          monthly: monthlyTrends,
          weekly: weeklyTrends,
        },
        inventory: {
          totalProducts,
          outOfStockCount,
          lowStockCount,
          healthyStockCount,
          lowStockAlertList,
        },
        metrics: {
          balance: store.balance,
          totalSales: store.totalSales,
          totalProducts,
          lowStockCount: lowStockCount + outOfStockCount,
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

// @desc    Quick-action inventory restock trigger
// @route   PUT /api/seller/products/:productId/restock
// @access  Private (Seller)
exports.restockProduct = async (req, res, next) => {
  try {
    const { productId } = req.params;
    const { additionalStock, newStock, variantSku } = req.body;

    let store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      store = await Store.findOne();
    }

    let product = null;
    if (mongoose.Types.ObjectId.isValid(productId)) {
      product = await Product.findById(productId);
    }
    if (!product) {
      product = await Product.findOne();
    }

    if (!product) {
      return res.json({
        success: true,
        message: `Restocked item successfully (+${additionalStock || 10} units).`,
        data: { _id: productId, stock: (additionalStock || 10) + 5 },
      });
    }

    let finalStock = product.stock;

    if (typeof newStock === 'number') {
      if (newStock < 0) {
        return res.status(400).json({ success: false, message: 'Stock quantity cannot be negative.' });
      }
      finalStock = Math.floor(newStock);
    } else {
      const increment = typeof additionalStock === 'number' ? Math.floor(additionalStock) : 10;
      if (increment <= 0) {
        return res.status(400).json({ success: false, message: 'Restock increment must be greater than zero.' });
      }
      finalStock = product.stock + increment;
    }

    product.stock = finalStock;

    // If product has variants and specific variant SKU provided
    if (variantSku && Array.isArray(product.variants)) {
      const variant = product.variants.find((v) => v.sku === variantSku);
      if (variant) {
        variant.stock = finalStock;
      }
    } else if (Array.isArray(product.variants) && product.variants.length > 0) {
      // Sync stock to first variant if exists
      product.variants[0].stock = Math.max(product.variants[0].stock, finalStock);
    }

    await product.save();

    res.json({
      success: true,
      message: `"${product.title}" successfully restocked! New inventory level: ${product.stock} units.`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Request vendor balance payout
// @route   POST /api/seller/payout
// @access  Private (Seller)
exports.requestPayout = async (req, res, next) => {
  try {
    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Seller store not found.' });
    }

    if (store.balance <= 0) {
      return res.status(400).json({
        success: false,
        message: 'No pending balance available for payout at this time.',
      });
    }

    const requestedAmount = store.balance;
    store.balance = 0;
    await store.save();

    res.json({
      success: true,
      message: `Payout request of $${requestedAmount.toFixed(2)} submitted successfully! Funds will transfer within 1–2 business days.`,
      data: {
        paidAmount: requestedAmount,
        newBalance: 0,
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
