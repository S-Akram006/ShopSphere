const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Review = require('../models/Review');

const clearDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere';
    console.log(`[Clear Script] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Clear Script] Deleting all users, stores, products, orders, suborders, reviews...');
    const delUsers = await User.deleteMany({});
    const delStores = await Store.deleteMany({});
    const delProducts = await Product.deleteMany({});
    const delOrders = await Order.deleteMany({});
    const delSubOrders = await SubOrder.deleteMany({});
    const delReviews = await Review.deleteMany({});

    console.log(`Cleared:
- Users: ${delUsers.deletedCount}
- Stores: ${delStores.deletedCount}
- Products: ${delProducts.deletedCount}
- Orders: ${delOrders.deletedCount}
- SubOrders: ${delSubOrders.deletedCount}
- Reviews: ${delReviews.deletedCount}
`);

    console.log('All sample data and users have been permanently deleted from the database.');
    process.exit(0);
  } catch (err) {
    console.error('[Clear Script] Error clearing database:', err);
    process.exit(1);
  }
};

clearDatabase();
