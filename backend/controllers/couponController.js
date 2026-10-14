const Coupon = require('../models/Coupon');
const Store = require('../models/Store');

// @desc    Validate and calculate coupon discount for cart
// @route   POST /api/coupons/apply
// @access  Public (Guest & Customers)
exports.validateAndApplyCoupon = async (req, res, next) => {
  try {
    const { code, cartItems = [], subTotal } = req.body;

    if (!code || typeof code !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid coupon code.',
      });
    }

    if (!Array.isArray(cartItems) || cartItems.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty. Add products before applying coupons.',
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const coupon = await Coupon.findOne({ code: cleanCode });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: `Coupon code "${cleanCode}" was not found. Please verify the code and try again.`,
      });
    }

    // Check base validity (isActive, expiration, usageLimit)
    const validity = coupon.isValid();
    if (!validity.valid) {
      return res.status(400).json({
        success: false,
        message: validity.reason,
      });
    }

    // Calculate applicable cart amount based on scope
    let applicableItems = [];
    let applicableSubtotal = 0;

    if (coupon.scope === 'platform') {
      applicableItems = cartItems;
      applicableSubtotal = cartItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );
    } else if (coupon.scope === 'vendor') {
      if (!coupon.vendorId) {
        return res.status(400).json({
          success: false,
          message: 'Vendor-scoped coupon is misconfigured.',
        });
      }

      const targetStoreId = coupon.vendorId.toString();

      applicableItems = cartItems.filter((item) => {
        const itemStoreId =
          item.storeId?._id || item.storeId?.storeId || item.storeId;
        return itemStoreId && itemStoreId.toString() === targetStoreId;
      });

      if (applicableItems.length === 0) {
        const store = await Store.findById(coupon.vendorId);
        const storeName = store ? store.storeName : 'this specific vendor';
        return res.status(400).json({
          success: false,
          message: `This coupon is exclusively valid for products from "${storeName}". Your cart does not currently contain qualifying items from this store.`,
        });
      }

      applicableSubtotal = applicableItems.reduce(
        (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
        0
      );
    }

    // Verify minimum order requirement
    if (applicableSubtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Order requirement not met. This coupon requires a minimum spend of $${coupon.minOrderAmount.toFixed(
          2
        )} on eligible items (current eligible total: $${applicableSubtotal.toFixed(2)}).`,
      });
    }

    // Calculate discount amount with rounding and safety checks
    let discountAmount = 0;
    if (coupon.discountType === 'percentage') {
      discountAmount = (applicableSubtotal * coupon.discountValue) / 100;
    } else if (coupon.discountType === 'fixed') {
      discountAmount = Math.min(coupon.discountValue, applicableSubtotal);
    }

    // Round to 2 decimal places and cap at applicableSubtotal
    discountAmount = Math.min(Math.round(discountAmount * 100) / 100, applicableSubtotal);

    // Compute itemized savings breakdown per product
    const itemizedSavings = applicableItems.map((item) => {
      const itemTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
      const ratio = applicableSubtotal > 0 ? itemTotal / applicableSubtotal : 0;
      const itemDiscount = Math.round(discountAmount * ratio * 100) / 100;
      return {
        productId: item.productId || item._id,
        title: item.title,
        originalPrice: item.price,
        quantity: item.quantity,
        itemDiscount,
      };
    });

    const cartTotalAmount =
      typeof subTotal === 'number'
        ? subTotal
        : cartItems.reduce(
            (sum, item) => sum + (Number(item.price) || 0) * (Number(item.quantity) || 1),
            0
          );

    const finalTotal = Math.max(0, Math.round((cartTotalAmount - discountAmount) * 100) / 100);

    return res.json({
      success: true,
      message: `Coupon "${cleanCode}" applied successfully! You saved $${discountAmount.toFixed(2)}.`,
      data: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: coupon.discountValue,
        scope: coupon.scope,
        discountAmount,
        applicableSubtotal,
        finalTotal,
        itemizedSavings,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get active public coupons
// @route   GET /api/coupons
// @access  Public
exports.getActiveCoupons = async (req, res, next) => {
  try {
    const coupons = await Coupon.find({
      isActive: true,
      expirationDate: { $gt: new Date() },
    })
      .select('code description discountType discountValue minOrderAmount scope vendorId')
      .populate('vendorId', 'storeName logo')
      .limit(10);

    res.json({
      success: true,
      data: coupons,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create new coupon
// @route   POST /api/coupons
// @access  Private (Seller or Platform Admin)
exports.createCoupon = async (req, res, next) => {
  try {
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      expirationDate,
      usageLimit,
      scope,
    } = req.body;

    if (!code || !discountType || discountValue === undefined || !expirationDate) {
      return res.status(400).json({
        success: false,
        message: 'Code, discountType, discountValue, and expirationDate are required.',
      });
    }

    let vendorId = null;
    let actualScope = scope || 'platform';

    if (req.user.role === 'Seller') {
      const store = await Store.findOne({ sellerId: req.user._id });
      if (!store) {
        return res.status(404).json({ success: false, message: 'Seller store not found' });
      }
      actualScope = 'vendor';
      vendorId = store._id;
    } else if (req.user.role === 'Platform Admin') {
      if (req.body.vendorId) {
        vendorId = req.body.vendorId;
        actualScope = 'vendor';
      }
    }

    const cleanCode = code.trim().toUpperCase();
    const existing = await Coupon.findOne({ code: cleanCode });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Coupon code "${cleanCode}" already exists.`,
      });
    }

    const coupon = await Coupon.create({
      code: cleanCode,
      description: description || '',
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: Number(minOrderAmount) || 0,
      expirationDate: new Date(expirationDate),
      usageLimit: usageLimit ? Number(usageLimit) : null,
      scope: actualScope,
      vendorId,
      createdBy: req.user._id,
    });

    res.status(201).json({
      success: true,
      message: `Coupon "${cleanCode}" created successfully.`,
      data: coupon,
    });
  } catch (error) {
    next(error);
  }
};

// Seed default platform and vendor coupons
exports.seedDefaultCoupons = async () => {
  try {
    const count = await Coupon.countDocuments();
    if (count > 0) return;

    const oneYearFromNow = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
    const store = await Store.findOne();

    const defaults = [
      {
        code: 'SPHERE10',
        description: '10% OFF all marketplace products across all stores',
        discountType: 'percentage',
        discountValue: 10,
        minOrderAmount: 20,
        expirationDate: oneYearFromNow,
        scope: 'platform',
      },
      {
        code: 'SAVE25',
        description: '$25 OFF on premium orders over $150',
        discountType: 'fixed',
        discountValue: 25,
        minOrderAmount: 150,
        expirationDate: oneYearFromNow,
        scope: 'platform',
      },
    ];

    if (store) {
      defaults.push({
        code: 'TECH15',
        description: `15% OFF official store gear at ${store.storeName}`,
        discountType: 'percentage',
        discountValue: 15,
        minOrderAmount: 50,
        expirationDate: oneYearFromNow,
        scope: 'vendor',
        vendorId: store._id,
      });
    }

    await Coupon.insertMany(defaults);
    console.log('[Coupons] Default marketplace coupons seeded successfully.');
  } catch (err) {
    console.warn('[Coupons] Seeding coupons skipped:', err.message);
  }
};
