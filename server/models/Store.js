const mongoose = require('mongoose');

const storeSchema = new mongoose.Schema(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Seller ID is required'],
      unique: true,
      index: true,
    },
    storeName: {
      type: String,
      required: [true, 'Store name is required'],
      trim: true,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Store description is required'],
      trim: true,
    },
    logo: {
      type: String,
      default: 'https://images.unsplash.com/photo-1472851294608-062f824d29cc?auto=format&fit=crop&w=300&q=80',
    },
    banner: {
      type: String,
      default: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&w=1200&q=80',
    },
    isApproved: {
      type: Boolean,
      default: false,
      index: true,
    },
    balance: {
      type: Number,
      default: 0,
      min: [0, 'Balance cannot be negative'],
    },
    totalSales: {
      type: Number,
      default: 0,
    },
    contactEmail: {
      type: String,
      default: '',
    },
    ratingAverage: {
      type: Number,
      default: 4.8,
      min: 0,
      max: 5,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Store', storeSchema);
