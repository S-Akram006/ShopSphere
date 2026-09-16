const mongoose = require('mongoose');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Product = require('../models/Product');
const Store = require('../models/Store');
const { validateTransition } = require('../services/stateMachine');

// @desc    Atomic Checkout Engine
// @route   POST /api/orders/checkout
// @access  Private (Customer)
exports.checkout = async (req, res, next) => {
  const reservedItems = []; // Tracking for rollback in case of race condition

  try {
    const { items, shippingAddress, paymentMethod } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required for checkout' });
    }

    if (!shippingAddress || !shippingAddress.fullName || !shippingAddress.address || !shippingAddress.city) {
      return res.status(400).json({ success: false, message: 'Complete shipping address is required' });
    }

    // Step 1: Atomic Stock Verification & Reservation
    const verifiedItems = [];

    for (const item of items) {
      const { productId, quantity, variantSku } = item;
      const qty = parseInt(quantity, 10);

      if (!qty || qty <= 0) {
        throw new Error('Invalid item quantity');
      }

      const product = await Product.findById(productId);
      if (!product || !product.isActive || !product.isApproved) {
        throw new Error(`Product "${item.title || productId}" is no longer available.`);
      }

      let itemPrice = product.discountPrice > 0 ? product.discountPrice : product.price;
      let variantName = null;

      // If variant was chosen, check variant stock
      if (variantSku) {
        const variant = product.variants.find((v) => v.sku === variantSku);
        if (!variant) {
          throw new Error(`Selected variant "${variantSku}" not found for product "${product.title}"`);
        }
        itemPrice = variant.price;
        variantName = variant.sku;

        // Atomic decrement variant stock AND overall product stock
        const reserveResult = await Product.updateOne(
          {
            _id: product._id,
            'variants.sku': variantSku,
            'variants.stock': { $gte: qty },
            stock: { $gte: qty },
          },
          {
            $inc: {
              'variants.$.stock': -qty,
              stock: -qty,
            },
          }
        );

        if (reserveResult.modifiedCount === 0) {
          throw new Error(
            `Insufficient stock for "${product.title}" (Variant: ${variantSku}). Only ${variant.stock} available.`
          );
        }

        reservedItems.push({
          productId: product._id,
          variantSku,
          quantity: qty,
        });
      } else {
        // Atomic decrement standard product stock
        const reserveResult = await Product.updateOne(
          {
            _id: product._id,
            stock: { $gte: qty },
          },
          {
            $inc: { stock: -qty },
          }
        );

        if (reserveResult.modifiedCount === 0) {
          throw new Error(
            `Insufficient stock for "${product.title}". Only ${product.stock} units remaining.`
          );
        }

        reservedItems.push({
          productId: product._id,
          variantSku: null,
          quantity: qty,
        });
      }

      verifiedItems.push({
        productId: product._id,
        storeId: product.storeId,
        title: product.title,
        price: itemPrice,
        quantity: qty,
        variantSku: variantName,
        image: product.images && product.images.length > 0 ? product.images[0] : '',
      });
    }

    // Step 2: Multi-vendor Item Grouping by storeId
    const storeBuckets = {};
    for (const vItem of verifiedItems) {
      const sId = vItem.storeId.toString();
      if (!storeBuckets[sId]) {
        storeBuckets[sId] = [];
      }
      storeBuckets[sId].push(vItem);
    }

    // Calculate total order amount
    let overallTotal = 0;
    const subOrderDataList = [];

    for (const [sId, sItems] of Object.entries(storeBuckets)) {
      const subTotal = sItems.reduce((acc, curr) => acc + curr.price * curr.quantity, 0);
      const shippingFee = subTotal >= 100 ? 0 : 9.99; // Standard multi-vendor shipping calculation
      const vendorTotal = subTotal + shippingFee;
      overallTotal += vendorTotal;

      subOrderDataList.push({
        storeId: sId,
        items: sItems,
        subTotal,
        shippingFee,
        totalAmount: vendorTotal,
      });
    }

    // Step 3: Create Parent Order
    const parentOrder = new Order({
      customerId: req.user._id,
      items: verifiedItems,
      totalAmount: Math.round(overallTotal * 100) / 100,
      paymentStatus: 'Paid',
      paymentMethod: paymentMethod || 'Instant Credit Card (Mock)',
      shippingAddress,
      subOrders: [],
    });

    await parentOrder.save();

    // Step 4: Create SubOrders linked to Parent Order
    const createdSubOrders = [];
    for (const sData of subOrderDataList) {
      const subOrder = await SubOrder.create({
        parentOrderId: parentOrder._id,
        customerId: req.user._id,
        storeId: sData.storeId,
        items: sData.items,
        subTotal: sData.subTotal,
        shippingFee: sData.shippingFee,
        totalAmount: sData.totalAmount,
        status: 'Placed',
        statusHistory: [
          {
            status: 'Placed',
            note: 'Order placed by customer and payment authorized.',
            updatedBy: req.user._id,
          },
        ],
      });

      createdSubOrders.push(subOrder._id);

      // Update store sales and balance
      await Store.findByIdAndUpdate(sData.storeId, {
        $inc: { balance: sData.subTotal, totalSales: sData.subTotal },
      });
    }

    parentOrder.subOrders = createdSubOrders;
    await parentOrder.save();

    // Populate response
    const populatedOrder = await Order.findById(parentOrder._id).populate({
      path: 'subOrders',
      populate: { path: 'storeId', select: 'storeName logo contactEmail' },
    });

    res.status(201).json({
      success: true,
      message: 'Checkout completed successfully! Order split across vendors.',
      data: populatedOrder,
    });
  } catch (error) {
    // Step 5: Automatic Rollback on Stock Failure
    if (reservedItems.length > 0) {
      console.warn('[Checkout Rollback] Releasing atomically reserved items due to failure:', error.message);
      for (const resItem of reservedItems) {
        if (resItem.variantSku) {
          await Product.updateOne(
            { _id: resItem.productId, 'variants.sku': resItem.variantSku },
            {
              $inc: {
                'variants.$.stock': resItem.quantity,
                stock: resItem.quantity,
              },
            }
          );
        } else {
          await Product.updateOne(
            { _id: resItem.productId },
            { $inc: { stock: resItem.quantity } }
          );
        }
      }
    }

    res.status(400).json({
      success: false,
      message: error.message || 'Checkout failed due to stock or validation issues',
    });
  }
};

// @desc    Get logged-in customer's orders
// @route   GET /api/orders/my
// @access  Private (Customer)
exports.getMyOrders = async (req, res, next) => {
  try {
    const orders = await Order.find({ customerId: req.user._id })
      .populate({
        path: 'subOrders',
        populate: [
          { path: 'storeId', select: 'storeName logo' },
          { path: 'deliveryPartnerId', select: 'name phone' },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order details by ID
// @route   GET /api/orders/:id
// @access  Private
exports.getOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate({
      path: 'subOrders',
      populate: [
        { path: 'storeId', select: 'storeName logo banner contactEmail' },
        { path: 'deliveryPartnerId', select: 'name phone' },
      ],
    });

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    // Customer can only see their own order; Admins/Support can see all
    if (
      req.user.role === 'Customer' &&
      order.customerId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ success: false, message: 'Not authorized to view this order' });
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get specific SubOrder details & tracking timeline
// @route   GET /api/orders/suborders/:subOrderId
// @access  Private
exports.getSubOrderById = async (req, res, next) => {
  try {
    const subOrder = await SubOrder.findById(req.params.subOrderId)
      .populate('storeId', 'storeName logo contactEmail')
      .populate('customerId', 'name email phone')
      .populate('deliveryPartnerId', 'name phone email')
      .populate('parentOrderId', 'shippingAddress paymentMethod paymentStatus totalAmount');

    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Sub-order not found' });
    }

    res.json({
      success: true,
      data: subOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel sub-order (Restores stock atomically)
// @route   PUT /api/orders/suborders/:subOrderId/cancel
// @access  Private (Customer before shipped, Seller, Admin)
exports.cancelSubOrder = async (req, res, next) => {
  try {
    const subOrder = await SubOrder.findById(req.params.subOrderId);
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Sub-order not found' });
    }

    // Check state machine guard
    const transitionCheck = validateTransition(subOrder.status, 'Cancelled', req.user.role);
    if (!transitionCheck.isValid) {
      return res.status(400).json({ success: false, message: transitionCheck.reason });
    }

    // Restore stock atomically
    for (const item of subOrder.items) {
      if (item.variantSku) {
        await Product.updateOne(
          { _id: item.productId, 'variants.sku': item.variantSku },
          {
            $inc: {
              'variants.$.stock': item.quantity,
              stock: item.quantity,
            },
          }
        );
      } else {
        await Product.updateOne(
          { _id: item.productId },
          { $inc: { stock: item.quantity } }
        );
      }
    }

    // Reverse store balance
    await Store.findByIdAndUpdate(subOrder.storeId, {
      $inc: { balance: -subOrder.subTotal, totalSales: -subOrder.subTotal },
    });

    subOrder.status = 'Cancelled';
    subOrder.statusHistory.push({
      status: 'Cancelled',
      note: `Cancelled by ${req.user.role} (${req.user.name}). Stock restored.`,
      updatedBy: req.user._id,
    });

    await subOrder.save();

    res.json({
      success: true,
      message: 'Sub-order cancelled and inventory restored.',
      data: subOrder,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Customer raises a dispute on a sub-order
// @route   POST /api/orders/suborders/:subOrderId/dispute
// @access  Private (Customer)
exports.raiseDispute = async (req, res, next) => {
  try {
    const { reason, customerNote, refundAmount } = req.body;

    const subOrder = await SubOrder.findById(req.params.subOrderId);
    if (!subOrder) {
      return res.status(404).json({ success: false, message: 'Sub-order not found' });
    }

    if (subOrder.customerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'You can only dispute your own orders' });
    }

    if (subOrder.dispute && subOrder.dispute.isDisputed && subOrder.dispute.status !== 'Rejected') {
      return res.status(400).json({ success: false, message: 'A dispute is already active on this order' });
    }

    subOrder.dispute = {
      isDisputed: true,
      reason,
      customerNote,
      refundAmount: refundAmount ? Number(refundAmount) : subOrder.totalAmount,
      status: 'Open',
      requestedAt: new Date(),
    };

    subOrder.statusHistory.push({
      status: subOrder.status,
      note: `Dispute opened by customer: Reason - ${reason}`,
      updatedBy: req.user._id,
    });

    await subOrder.save();

    res.status(201).json({
      success: true,
      message: 'Dispute filed successfully. Support team will review your claim.',
      data: subOrder,
    });
  } catch (error) {
    next(error);
  }
};
