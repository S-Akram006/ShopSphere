const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  sku: {
    type: String,
    required: true,
    trim: true,
  },
  attributes: {
    type: Map,
    of: String, // e.g., { "color": "Midnight Black", "size": "XL", "storage": "256GB" }
    default: {},
  },
  price: {
    type: Number,
    required: true,
    min: [0, 'Variant price must be non-negative'],
  },
  stock: {
    type: Number,
    required: true,
    min: [0, 'Variant stock must be non-negative'],
    default: 0,
  },
});

const productSchema = new mongoose.Schema(
  {
    storeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Store',
      required: [true, 'Store ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Product title is required'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    price: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price must be non-negative'],
    },
    discountPrice: {
      type: Number,
      default: 0,
      min: [0, 'Discount price must be non-negative'],
    },
    stock: {
      type: Number,
      required: [true, 'Product stock is required'],
      min: [0, 'Stock must be non-negative'],
      default: 0,
    },
    variants: [variantSchema],
    images: {
      type: [String],
      default: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'],
    },
    features: [String],
    ratingAverage: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
    isApproved: {
      type: Boolean,
      default: true, // Approved by default or moderated by admin
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    originCity: {
      type: String,
      default: 'New York, NY',
      trim: true,
    },
    deliveryZones: {
      type: [String],
      default: ['Nationwide'],
      index: true,
    },
    estimatedDeliveryDays: {
      type: Number,
      default: 3,
      min: [1, 'Estimated delivery days must be at least 1'],
    },
    shippingRate: {
      type: Number,
      default: 0,
      min: [0, 'Shipping rate cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound text index for title, description, and tags
productSchema.index({ title: 'text', description: 'text', tags: 'text' });
productSchema.index({ category: 1, price: 1 });

module.exports = mongoose.model('Product', productSchema);
