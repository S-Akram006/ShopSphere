const mongoose = require('mongoose');

const subOrderItemSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  variantSku: {
    type: String,
    default: null,
  },
  image: {
    type: String,
    default: '',
  },
});

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  note: {
    type: String,
    default: '',
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const disputeSchema = new mongoose.Schema({
  isDisputed: {
    type: Boolean,
    default: false,
  },
  reason: {
    type: String,
    enum: ['Item Not Received', 'Damaged Goods', 'Wrong Item Sent', 'Defective Product', 'Other'],
  },
  customerNote: {
    type: String,
    default: '',
  },
  refundAmount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: ['None', 'Open', 'Under Review', 'Refunded', 'Resolved', 'Rejected'],
    default: 'None',
  },
  resolutionNotes: {
    type: String,
    default: '',
  },
  requestedAt: {
    type: Date,
  },
  resolvedAt: {
    type: Date,
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
});

const subOrderSchema = new mongoose.Schema(
  {
    subOrderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    parentOrderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: true,
      index: true,
    },
    items: [subOrderItemSchema],
    subTotal: {
      type: Number,
      required: true,
      min: 0,
    },
    shippingFee: {
      type: Number,
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: [
        'Placed',
        'Confirmed',
        'Packed',
        'Shipped',
        'Out for Delivery',
        'Delivered',
        'Cancelled',
        'Returned',
        'Refunded',
      ],
      default: 'Placed',
      index: true,
    },
    trackingNumber: {
      type: String,
      default: '',
    },
    deliveryPartnerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    statusHistory: [statusHistorySchema],
    dispute: {
      type: disputeSchema,
      default: () => ({ isDisputed: false, status: 'None' }),
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate sub-order number
subOrderSchema.pre('save', function (next) {
  if (!this.subOrderNumber) {
    this.subOrderNumber = 'SUB-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('SubOrder', subOrderSchema);
