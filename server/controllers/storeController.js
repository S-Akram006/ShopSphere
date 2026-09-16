const Store = require('../models/Store');
const Product = require('../models/Product');

// @desc    Get list of all approved stores
// @route   GET /api/stores
// @access  Public
exports.getStores = async (req, res, next) => {
  try {
    const stores = await Store.find({ isApproved: true })
      .populate('sellerId', 'name email')
      .sort({ ratingAverage: -1 });

    res.json({
      success: true,
      data: stores,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get store profile with products
// @route   GET /api/stores/:id
// @access  Public
exports.getStoreById = async (req, res, next) => {
  try {
    const store = await Store.findById(req.params.id).populate('sellerId', 'name email');
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    const products = await Product.find({ storeId: store._id, isActive: true, isApproved: true });

    res.json({
      success: true,
      data: {
        store,
        products,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get seller's own store profile
// @route   GET /api/stores/my/profile
// @access  Private (Seller)
exports.getMyStore = async (req, res, next) => {
  try {
    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'No store profile found for this seller' });
    }

    const productCount = await Product.countDocuments({ storeId: store._id });

    res.json({
      success: true,
      data: {
        ...store.toObject(),
        productCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update seller store
// @route   PUT /api/stores/my/profile
// @access  Private (Seller)
exports.updateMyStore = async (req, res, next) => {
  try {
    const { storeName, description, logo, banner, contactEmail } = req.body;

    const store = await Store.findOne({ sellerId: req.user._id });
    if (!store) {
      return res.status(404).json({ success: false, message: 'Store not found' });
    }

    if (storeName) store.storeName = storeName;
    if (description) store.description = description;
    if (logo) store.logo = logo;
    if (banner) store.banner = banner;
    if (contactEmail) store.contactEmail = contactEmail;

    await store.save();

    res.json({
      success: true,
      message: 'Store profile updated successfully',
      data: store,
    });
  } catch (error) {
    next(error);
  }
};
