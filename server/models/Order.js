const mongoose = require('mongoose');

const orderItemSnapshotSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  storeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Store',
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

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, default: 'USA' },
  phone: { type: String, required: true },
});

const orderSchema = new mongoose.Schema(
  {
    orderNumber: {
      type: String,
      unique: true,
      index: true,
    },
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSnapshotSchema],
    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Failed', 'Refunded'],
      default: 'Paid', // Simulated instant payment
    },
    paymentMethod: {
      type: String,
      default: 'Credit Card (Stripe Mock)',
    },
    paymentDetails: {
      transactionId: { type: String, default: () => 'TXN-' + Math.random().toString(36).substring(2, 10).toUpperCase() },
      paidAt: { type: Date, default: Date.now },
    },
    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },
    subOrders: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubOrder',
      },
    ],
  },
  {
    timestamps: true,
  }
);

// Auto-generate order number if not present
orderSchema.pre('save', function (next) {
  if (!this.orderNumber) {
    this.orderNumber = 'ORD-' + Math.floor(100000 + Math.random() * 900000);
  }
  next();
});

module.exports = mongoose.model('Order', orderSchema);
