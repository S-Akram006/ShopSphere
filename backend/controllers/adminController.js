const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');

// @desc    Get Global Platform Analytics and GMV
// @route   GET /api/admin/analytics
// @access  Private (Platform Admin)
exports.getPlatformStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCustomers = await User.countDocuments({ role: 'Customer' });
    const totalSellers = await User.countDocuments({ role: 'Seller' });
    const totalStores = await Store.countDocuments();
    const pendingStoresCount = await Store.countDocuments({ isApproved: false });

    const totalProducts = await Product.countDocuments();
    const pendingProductsCount = await Product.countDocuments({ isApproved: false });

    const totalOrders = await Order.countDocuments();
    const totalSubOrders = await SubOrder.countDocuments();

    // Calculate Platform GMV (Gross Merchandise Value)
    const gmvAggregate = await Order.aggregate([
      { $match: { paymentStatus: 'Paid' } },
      { $group: { _id: null, totalGMV: { $sum: '$totalAmount' } } },
    ]);
    const platformGMV = gmvAggregate.length > 0 ? Math.round(gmvAggregate[0].totalGMV * 100) / 100 : 0;

    // Platform fee revenue (assuming 8% marketplace commission)
    const platformCommission = Math.round(platformGMV * 0.08 * 100) / 100;

    // Sub-order breakdown by status
    const statusCounts = await SubOrder.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]);

    // Active disputes count
    const activeDisputesCount = await SubOrder.countDocuments({
      'dispute.isDisputed': true,
      'dispute.status': { $in: ['Open', 'Under Review'] },
    });

    // Recent orders
    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(6)
      .populate('customerId', 'name email');

    res.json({
      success: true,
      data: {
        platformGMV,
        platformCommission,
        totalUsers,
        totalCustomers,
        totalSellers,
        totalStores,
        pendingStoresCount,
        totalProducts,
        pendingProductsCount,
        totalOrders,
        totalSubOrders,
        activeDisputesCount,
        statusCounts,
        recentOrders,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all stores with filter for approval status
// @route   GET /api/admin/stores
// @access  Private (Platform Admin)
exports.getStores = async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status === 'pending') filter.isApproved = false;
    if (status === 'approved') filter.isApproved = true;

    const stores = await Store.find(filter)
      .populate('sellerId', 'name email phone createdAt')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Approve or reject seller store
// @route   PUT /api/admin/stores/:id/approval
// @access  Private (Platform Admin)
exports.toggleStoreApproval = async (req, res, next) => {
  try {
    const { isApproved } = req.body;

    const store = await Store.findByIdAndUpdate(
      req.params.id,
      { isApproved: Boolean(isApproved) },
      { new: true }
    ).populate('sellerId', 'name email');

    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    res.json({
      success: true,
      message: `Store "${store.storeName}" has been ${store.isApproved ? 'approved' : 'suspended'}.`,
      data: store,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all products for moderation
// @route   GET /api/admin/products
// @access  Private (Platform Admin)
exports.getAllProductsForAdmin = async (req, res, next) => {
  try {
    const products = await Product.find()
      .populate('storeId', 'storeName logo isApproved')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: products,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Moderate product (approve or suspend)
// @route   PUT /api/admin/products/:id/moderation
// @access  Private (Platform Admin)
exports.moderateProduct = async (req, res, next) => {
  try {
    const { isApproved, isActive } = req.body;

    const updateFields = {};
    if (typeof isApproved !== 'undefined') updateFields.isApproved = isApproved;
    if (typeof isActive !== 'undefined') updateFields.isActive = isActive;

    const product = await Product.findByIdAndUpdate(req.params.id, updateFields, {
      new: true,
    }).populate('storeId', 'storeName');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    res.json({
      success: true,
      message: `Product listing moderation updated.`,
      data: product,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Global dispute oversight
// @route   GET /api/admin/disputes
// @access  Private (Platform Admin, Support Agent)
exports.getDisputes = async (req, res, next) => {
  try {
    const disputes = await SubOrder.find({ 'dispute.isDisputed': true })
      .populate('customerId', 'name email phone')
      .populate('storeId', 'storeName logo')
      .populate('parentOrderId', 'shippingAddress paymentMethod totalAmount')
      .sort({ 'dispute.requestedAt': -1 });

    res.json({
      success: true,
      data: disputes,
    });
  } catch (error) {
    next(error);
  }
};
