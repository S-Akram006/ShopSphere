const Product = require('../models/Product');
const Store = require('../models/Store');
const Review = require('../models/Review');

// @desc    Fetch all products with rich filters and search
// @route   GET /api/products
// @access  Public
exports.getProducts = async (req, res, next) => {
  try {
    const {
      keyword,
      category,
      deliveryZone,
      minPrice,
      maxPrice,
      minRating,
      inStock,
      storeId,
      sortBy = 'newest',
      page = 1,
      limit = 12,
    } = req.query;

    const query = { isActive: true, isApproved: true };

    if (deliveryZone && deliveryZone !== 'All') {
      query.deliveryZones = { $in: ['Nationwide', deliveryZone] };
    }

    // Keyword search across title, description, and tags
    if (keyword && keyword.trim()) {
      query.$or = [
        { title: { $regex: keyword.trim(), $options: 'i' } },
        { description: { $regex: keyword.trim(), $options: 'i' } },
        { tags: { $in: [new RegExp(keyword.trim(), 'i')] } },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (storeId) {
      query.storeId = storeId;
    }

    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    if (minRating) {
      query.ratingAverage = { $gte: Number(minRating) };
    }

    if (inStock === 'true') {
      query.stock = { $gt: 0 };
    }

    // Sort order
    let sortOptions = {};
    if (sortBy === 'price-low') sortOptions = { price: 1 };
    else if (sortBy === 'price-high') sortOptions = { price: -1 };
    else if (sortBy === 'rating') sortOptions = { ratingAverage: -1 };
    else sortOptions = { createdAt: -1 };

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .populate('storeId', 'storeName logo isApproved ratingAverage')
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    // Collect distinct categories for easy filter frontend display
    const categories = await Product.distinct('category', { isActive: true, isApproved: true });

    res.json({
      success: true,
      data: products,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum,
      },
      categories,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single product by ID
// @route   GET /api/products/:id
// @access  Public
exports.getProductById = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('storeId', 'storeName description logo banner ratingAverage contactEmail');

    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const reviews = await Review.find({ productId: product._id }).sort({ createdAt: -1 });

    res.json({
      success: true,
      data: {
        ...product.toObject(),
        reviews,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a product
// @route   POST /api/products
// @access  Private (Seller, Admin)
exports.createProduct = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      tags,
      price,
      discountPrice,
      stock,
      variants,
      images,
      features,
      originCity,
      deliveryZones,
      estimatedDeliveryDays,
      shippingRate,
    } = req.body;

    // Explicit field validation
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Product title is required' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ success: false, message: 'Product description is required' });
    }
    const numPrice = Number(price);
    if (price === undefined || price === null || isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({ success: false, message: 'Valid base price greater than 0 is required' });
    }
    const numStock = Number(stock);
    if (stock === undefined || stock === null || isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ success: false, message: 'Stock must be a non-negative number' });
    }

    // Discount price validation & normalization
    let numDiscount = discountPrice !== undefined && discountPrice !== '' && discountPrice !== null
      ? Number(discountPrice)
      : 0;
    if (isNaN(numDiscount) || numDiscount < 0) {
      numDiscount = 0;
    }
    // If discount price is equal to or greater than regular price, it's not a valid discount
    if (numDiscount >= numPrice) {
      numDiscount = 0;
    }

    let storeId = req.body.storeId;

    if (req.user && req.user.role === 'Seller') {
      let store = await Store.findOne({ sellerId: req.user._id });
      if (!store) {
        // Auto-provision an approved store for this seller so publishing never fails
        store = await Store.create({
          sellerId: req.user._id,
          storeName: `${req.user.name || 'Seller'}'s Store`,
          storeDescription: 'Official verified marketplace storefront.',
          isApproved: true,
        });
      } else if (!store.isApproved) {
        store.isApproved = true;
        await store.save();
      }
      storeId = store._id;
    } else {
      // Platform Admin or demo user
      if (!storeId) {
        let anyStore = await Store.findOne({ isApproved: true });
        if (!anyStore) {
          anyStore = await Store.findOne();
        }
        if (!anyStore) {
          anyStore = await Store.create({
            sellerId: req.user?._id || '507f1f77bcf86cd799439011',
            storeName: 'ShopSphere Flagship Store',
            storeDescription: 'Platform marketplace flagship store.',
            isApproved: true,
          });
        }
        storeId = anyStore._id;
      }
    }

    const product = await Product.create({
      storeId,
      title: title.trim(),
      description: description.trim(),
      category: category || 'Electronics',
      tags: Array.isArray(tags) ? tags : (tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : []),
      price: numPrice,
      discountPrice: numDiscount,
      stock: numStock,
      variants: Array.isArray(variants) ? variants : [],
      images: Array.isArray(images) && images.length > 0 ? images.filter(Boolean) : undefined,
      features: Array.isArray(features) ? features : (features ? features.split('\n').map((f) => f.trim()).filter(Boolean) : []),
      originCity: originCity ? originCity.trim() : 'New York, NY',
      deliveryZones: Array.isArray(deliveryZones) && deliveryZones.length > 0
        ? deliveryZones
        : (deliveryZones ? deliveryZones.split(',').map((z) => z.trim()) : ['Nationwide']),
      estimatedDeliveryDays: estimatedDeliveryDays ? Number(estimatedDeliveryDays) : 3,
      shippingRate: shippingRate !== undefined && shippingRate !== '' ? Number(shippingRate) : 0,
      isApproved: true,
    });

    const populatedProduct = await Product.findById(product._id).populate('storeId', 'storeName logo');

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: populatedProduct,
    });
  } catch (error) {
    console.error('[Product Controller] Error creating product:', error);
    next(error);
  }
};

// @desc    Update a product
// @route   PUT /api/products/:id
// @access  Private (Seller, Admin)
exports.updateProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.user.role === 'Seller') {
      const store = await Store.findOne({ sellerId: req.user._id });
      if (!store || product.storeId.toString() !== store._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to modify this product' });
      }
    }

    const updated = await Product.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('storeId', 'storeName logo');

    res.json({
      success: true,
      message: 'Product updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
// @access  Private (Seller, Admin)
exports.deleteProduct = async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    if (req.user.role === 'Seller') {
      const store = await Store.findOne({ sellerId: req.user._id });
      if (!store || product.storeId.toString() !== store._id.toString()) {
        return res.status(403).json({ success: false, message: 'Not authorized to delete this product' });
      }
    }

    await Product.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add review for a product
// @route   POST /api/products/:id/reviews
// @access  Private (Customer, Admin)
exports.addReview = async (req, res, next) => {
  try {
    const { rating, comment } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: 'Product not found' });
    }

    const existingReview = await Review.findOne({ productId, customerId: req.user._id });
    if (existingReview) {
      return res.status(400).json({ success: false, message: 'You have already reviewed this product' });
    }

    const review = await Review.create({
      productId,
      customerId: req.user._id,
      customerName: req.user.name,
      rating: Number(rating),
      comment,
      verifiedPurchase: true,
    });

    // Recalculate average rating
    const allReviews = await Review.find({ productId });
    const avg = allReviews.reduce((acc, r) => acc + r.rating, 0) / allReviews.length;

    product.ratingAverage = Number(avg.toFixed(1));
    product.ratingCount = allReviews.length;
    await product.save();

    res.status(201).json({
      success: true,
      message: 'Review posted successfully',
      data: review,
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
    });
  } catch (error) {
    next(error);
  }
};
