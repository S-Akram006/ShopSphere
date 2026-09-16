const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config({ path: __dirname + '/../.env' });

const User = require('../models/User');
const Store = require('../models/Store');
const Product = require('../models/Product');
const Order = require('../models/Order');
const SubOrder = require('../models/SubOrder');
const Review = require('../models/Review');

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/shopsphere';
    console.log(`[Seed Script] Connecting to MongoDB: ${mongoUri}`);
    await mongoose.connect(mongoUri);

    console.log('[Seed Script] Clearing existing collections...');
    await User.deleteMany({});
    await Store.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await SubOrder.deleteMany({});
    await Review.deleteMany({});

    console.log('[Seed Script] Hashing default passwords...');
    const defaultPassword = await bcrypt.hash('password123', 10);

    // 1. Create Core Users for all 5 Roles
    console.log('[Seed Script] Seeding 5 primary role users...');
    const users = await User.create([
      {
        name: 'Alex Johnson (Customer)',
        email: 'customer@shopsphere.com',
        passwordHash: defaultPassword,
        role: 'Customer',
        phone: '+1 (555) 234-5678',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'Marcus Vance (TechSphere Seller)',
        email: 'seller@shopsphere.com',
        passwordHash: defaultPassword,
        role: 'Seller',
        phone: '+1 (555) 345-6789',
        avatar: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'Elena Rostova (EcoVibe Seller)',
        email: 'seller2@shopsphere.com',
        passwordHash: defaultPassword,
        role: 'Seller',
        phone: '+1 (555) 456-7890',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'David Chen (NovaSound Pending Seller)',
        email: 'seller3@shopsphere.com',
        passwordHash: defaultPassword,
        role: 'Seller',
        phone: '+1 (555) 567-8901',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'Sarah Connor (Platform Admin)',
        email: 'admin@shopsphere.com',
        passwordHash: defaultPassword,
        role: 'Platform Admin',
        phone: '+1 (555) 987-6543',
        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'Michael Scott (Support Agent)',
        email: 'support@shopsphere.com',
        passwordHash: defaultPassword,
        role: 'Support Agent',
        phone: '+1 (555) 678-1234',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80',
      },
      {
        name: 'Jordan Sparks (Delivery Partner)',
        email: 'delivery@shopsphere.com',
        passwordHash: defaultPassword,
        role: 'Delivery Partner',
        phone: '+1 (555) 789-2345',
        avatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&w=150&q=80',
      },
    ]);

    const [customer, seller1, seller2, seller3, admin, support, delivery] = users;

    // 2. Create Stores
    console.log('[Seed Script] Seeding vendor stores...');
    const stores = await Store.create([
      {
        sellerId: seller1._id,
        storeName: 'TechSphere Official',
        description: 'Pioneering cutting-edge electronics, pro workstations, and audio gear for digital visionaries.',
        logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        isApproved: true,
        balance: 14250.0,
        totalSales: 48900.0,
        ratingAverage: 4.9,
        contactEmail: 'contact@techsphere.io',
      },
      {
        sellerId: seller2._id,
        storeName: 'EcoVibe Studio',
        description: 'Sustainable organic apparel, minimalist lifestyle goods, and carbon-neutral daily essentials.',
        logo: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&w=1200&q=80',
        isApproved: true,
        balance: 6840.5,
        totalSales: 21300.0,
        ratingAverage: 4.8,
        contactEmail: 'hello@ecovibestudio.com',
      },
      {
        sellerId: seller3._id,
        storeName: 'NovaSound Audio',
        description: 'Audiophile grade studio monitors and electrostatic acoustic headphones.',
        logo: 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=200&q=80',
        banner: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=1200&q=80',
        isApproved: false, // Pending Admin Approval
        balance: 0,
        totalSales: 0,
        ratingAverage: 4.5,
        contactEmail: 'info@novasound.com',
      },
    ]);

    const [techStore, ecoStore, pendingStore] = stores;

    // 3. Create Products with Variants
    console.log('[Seed Script] Seeding products with variants and tags...');
    const products = await Product.create([
      {
        storeId: techStore._id,
        title: 'QuantumBook Pro M3 16-inch Workstation',
        description: 'Ultimate power for engineers, creators, and AI researchers with neural engine accelerators, Liquid Retina XDR 120Hz display, and 24-hour battery endurance.',
        category: 'Electronics',
        tags: ['laptop', 'workstation', 'm3', 'apple', 'developer', 'electronics', 'pro'],
        price: 2499.0,
        discountPrice: 2299.0,
        stock: 35,
        images: [
          'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?auto=format&fit=crop&w=800&q=80',
        ],
        variants: [
          { sku: 'QBK-16-512GB-SPACE', attributes: { color: 'Space Gray', storage: '512GB' }, price: 2299.0, stock: 15 },
          { sku: 'QBK-16-1TB-SPACE', attributes: { color: 'Space Gray', storage: '1TB' }, price: 2599.0, stock: 12 },
          { sku: 'QBK-16-1TB-SILVER', attributes: { color: 'Silver', storage: '1TB' }, price: 2599.0, stock: 8 },
        ],
        features: ['16.2-inch Liquid Retina XDR Display', '36GB Unified Memory', 'Hardware-accelerated ray tracing', 'MagSafe fast charging'],
        ratingAverage: 4.9,
        ratingCount: 18,
        isApproved: true,
      },
      {
        storeId: techStore._id,
        title: 'Aura ANC Wireless Noise-Cancelling Headphones',
        description: 'Immersive spatial audio with custom 40mm titanium dynamic drivers, hybrid active noise cancellation, and plush memory foam headband for all-day focus.',
        category: 'Audio',
        tags: ['headphones', 'anc', 'wireless', 'bluetooth', 'audio', 'noise-cancelling', 'music'],
        price: 349.0,
        discountPrice: 299.0,
        stock: 60,
        images: [
          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1484704849700-f032a568e944?auto=format&fit=crop&w=800&q=80',
        ],
        variants: [
          { sku: 'AURA-BLK', attributes: { color: 'Matte Black' }, price: 299.0, stock: 30 },
          { sku: 'AURA-WHT', attributes: { color: 'Ivory White' }, price: 299.0, stock: 20 },
          { sku: 'AURA-SLV', attributes: { color: 'Silver Luxe' }, price: 319.0, stock: 10 },
        ],
        features: ['45-hour playback on single charge', 'Hybrid Active Noise Cancellation with Transparency Mode', 'Hi-Res Audio LDAC certification'],
        ratingAverage: 4.8,
        ratingCount: 42,
        isApproved: true,
      },
      {
        storeId: techStore._id,
        title: 'ApexErgo Mechanical Wireless Keyboard (Hot-Swap)',
        description: 'Precision typing instrument with aircraft-grade aluminum chassis, south-facing RGB per-key illumination, and lubed mechanical switches for buttery acoustics.',
        category: 'Electronics',
        tags: ['keyboard', 'mechanical', 'rgb', 'gadget', 'wireless', 'accessories'],
        price: 189.0,
        discountPrice: 159.0,
        stock: 45,
        images: [
          'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?auto=format&fit=crop&w=800&q=80',
        ],
        variants: [
          { sku: 'APX-RED-LUBED', attributes: { switch: 'Linear Red', color: 'Stealth Black' }, price: 159.0, stock: 25 },
          { sku: 'APX-BRN-LUBED', attributes: { switch: 'Tactile Brown', color: 'Retro White' }, price: 159.0, stock: 20 },
        ],
        features: ['Hot-swappable PCB (3/5-pin compatible)', 'Gasket mounted sound dampening', 'Tri-mode connection (Bluetooth 5.2 / 2.4GHz / USB-C)'],
        ratingAverage: 4.7,
        ratingCount: 29,
        isApproved: true,
      },
      {
        storeId: ecoStore._id,
        title: 'Organic Heavyweight French Terry Hoodie',
        description: 'Crafted from 100% GOTS-certified organic cotton with double-needle construction, pre-shrunk finish, and a relaxed contemporary drape.',
        category: 'Apparel',
        tags: ['hoodie', 'organic', 'cotton', 'clothing', 'fashion', 'streetwear', 'comfort'],
        price: 110.0,
        discountPrice: 88.0,
        stock: 80,
        images: [
          'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?auto=format&fit=crop&w=800&q=80',
        ],
        variants: [
          { sku: 'HD-ORG-S-OAT', attributes: { size: 'S', color: 'Oatmeal' }, price: 88.0, stock: 20 },
          { sku: 'HD-ORG-M-OAT', attributes: { size: 'M', color: 'Oatmeal' }, price: 88.0, stock: 30 },
          { sku: 'HD-ORG-L-OAT', attributes: { size: 'L', color: 'Oatmeal' }, price: 88.0, stock: 20 },
          { sku: 'HD-ORG-XL-OAT', attributes: { size: 'XL', color: 'Oatmeal' }, price: 88.0, stock: 10 },
        ],
        features: ['450 GSM Heavyweight French Terry', '100% GOTS-Certified Organic Cotton', 'Fair Trade Certified sewing facility'],
        ratingAverage: 4.9,
        ratingCount: 35,
        isApproved: true,
      },
      {
        storeId: ecoStore._id,
        title: 'Aerotrail Zero-Gravity Minimalist Trail Sneakers',
        description: 'Engineered breathable knit upper, ultra-responsive bio-foam midsole, and multi-directional Vibram rubber lugs for seamless transitions from urban sidewalks to alpine trails.',
        category: 'Footwear',
        tags: ['shoes', 'sneakers', 'trail', 'running', 'footwear', 'sports', 'sustainable'],
        price: 165.0,
        discountPrice: 139.0,
        stock: 50,
        images: [
          'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80',
          'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=800&q=80',
        ],
        variants: [
          { sku: 'AT-RED-US9', attributes: { size: 'US 9', color: 'Crimson Red' }, price: 139.0, stock: 15 },
          { sku: 'AT-RED-US10', attributes: { size: 'US 10', color: 'Crimson Red' }, price: 139.0, stock: 20 },
          { sku: 'AT-RED-US11', attributes: { size: 'US 11', color: 'Crimson Red' }, price: 139.0, stock: 15 },
        ],
        features: ['Recycled ocean plastic knit construction', 'High traction Vibram outsole', 'Ortholite antimicrobial footbed'],
        ratingAverage: 4.7,
        ratingCount: 22,
        isApproved: true,
      },
      {
        storeId: pendingStore._id,
        title: 'StudioReference X800 Open-Back Acoustic Monitors',
        description: 'Professional mixing and mastering reference headphones with planar magnetic transducers and velvet ear cushions.',
        category: 'Audio',
        tags: ['audio', 'studio', 'planar', 'headphones', 'reference'],
        price: 599.0,
        discountPrice: 0,
        stock: 12,
        images: [
          'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&w=800&q=80',
        ],
        variants: [],
        features: ['Planar Magnetic Drivers', 'Open-back soundstage', 'Detachable silver-plated copper cable'],
        ratingAverage: 4.5,
        ratingCount: 4,
        isApproved: false, // Moderate listing testing
      },
    ]);

    const [laptop, headphones, keyboard, hoodie, shoes] = products;

    // 4. Create Reviews
    console.log('[Seed Script] Seeding verified product reviews...');
    await Review.create([
      {
        productId: laptop._id,
        customerId: customer._id,
        customerName: customer.name,
        rating: 5,
        comment: 'This workstation is an absolute beast for software architecture and heavy Docker containers. Silent fans and insane battery life!',
        verifiedPurchase: true,
      },
      {
        productId: headphones._id,
        customerId: customer._id,
        customerName: customer.name,
        rating: 5,
        comment: 'The active noise cancellation creates an oasis of silence in noisy coffee shops. Incredible dynamic depth.',
        verifiedPurchase: true,
      },
      {
        productId: hoodie._id,
        customerId: customer._id,
        customerName: customer.name,
        rating: 5,
        comment: 'Unbelievable fabric weight and softness. You can tell immediately this was made sustainably without shortcuts.',
        verifiedPurchase: true,
      },
    ]);

    // 5. Create Realistic Sample Multi-Vendor Orders
    console.log('[Seed Script] Seeding multi-vendor parent and split sub-orders across statuses...');

    // Order 1: Multi-Vendor Order (TechStore + EcoStore), delivered with tracking
    const order1 = await Order.create({
      orderNumber: 'ORD-849201',
      customerId: customer._id,
      items: [
        {
          productId: headphones._id,
          storeId: techStore._id,
          title: headphones.title,
          price: 299.0,
          quantity: 1,
          variantSku: 'AURA-BLK',
          image: headphones.images[0],
        },
        {
          productId: hoodie._id,
          storeId: ecoStore._id,
          title: hoodie.title,
          price: 88.0,
          quantity: 1,
          variantSku: 'HD-ORG-M-OAT',
          image: hoodie.images[0],
        },
      ],
      totalAmount: 396.99, // 299 + 88 + 9.99 shipping for ecoStore
      paymentStatus: 'Paid',
      paymentMethod: 'Credit Card (Stripe Mock)',
      shippingAddress: {
        fullName: 'Alex Johnson',
        address: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'USA',
        phone: '+1 (555) 234-5678',
      },
    });

    const subOrder1A = await SubOrder.create({
      subOrderNumber: 'SUB-104921',
      parentOrderId: order1._id,
      customerId: customer._id,
      storeId: techStore._id,
      items: [
        {
          productId: headphones._id,
          title: headphones.title,
          price: 299.0,
          quantity: 1,
          variantSku: 'AURA-BLK',
          image: headphones.images[0],
        },
      ],
      subTotal: 299.0,
      shippingFee: 0, // Free over $100
      totalAmount: 299.0,
      status: 'Delivered',
      trackingNumber: 'SPH-TRK-99214012',
      deliveryPartnerId: delivery._id,
      statusHistory: [
        { status: 'Placed', note: 'Order placed by customer', timestamp: new Date(Date.now() - 4 * 86400000) },
        { status: 'Confirmed', note: 'Confirmed by TechSphere Official', timestamp: new Date(Date.now() - 3 * 86400000) },
        { status: 'Packed', note: 'Package sealed and barcoded', timestamp: new Date(Date.now() - 2 * 86400000) },
        { status: 'Shipped', note: 'Courier in transit', timestamp: new Date(Date.now() - 1 * 86400000) },
        { status: 'Out for Delivery', note: 'Driver on local dispatch route', timestamp: new Date(Date.now() - 4 * 3600000) },
        { status: 'Delivered', note: 'Delivered to front porch safely', timestamp: new Date(Date.now() - 1 * 3600000) },
      ],
    });

    const subOrder1B = await SubOrder.create({
      subOrderNumber: 'SUB-104922',
      parentOrderId: order1._id,
      customerId: customer._id,
      storeId: ecoStore._id,
      items: [
        {
          productId: hoodie._id,
          title: hoodie.title,
          price: 88.0,
          quantity: 1,
          variantSku: 'HD-ORG-M-OAT',
          image: hoodie.images[0],
        },
      ],
      subTotal: 88.0,
      shippingFee: 9.99,
      totalAmount: 97.99,
      status: 'Packed', // Ready for courier pickup
      trackingNumber: '',
      deliveryPartnerId: null,
      statusHistory: [
        { status: 'Placed', note: 'Order placed by customer', timestamp: new Date(Date.now() - 24 * 3600000) },
        { status: 'Confirmed', note: 'Confirmed by EcoVibe Studio', timestamp: new Date(Date.now() - 18 * 3600000) },
        { status: 'Packed', note: 'Eco-friendly cardboard packaged & ready for pickup', timestamp: new Date(Date.now() - 6 * 3600000) },
      ],
    });

    order1.subOrders = [subOrder1A._id, subOrder1B._id];
    await order1.save();

    // Order 2: Order with an Active Dispute (for Support Agent demo)
    const order2 = await Order.create({
      orderNumber: 'ORD-723190',
      customerId: customer._id,
      items: [
        {
          productId: keyboard._id,
          storeId: techStore._id,
          title: keyboard.title,
          price: 159.0,
          quantity: 1,
          variantSku: 'APX-RED-LUBED',
          image: keyboard.images[0],
        },
      ],
      totalAmount: 159.0,
      paymentStatus: 'Paid',
      paymentMethod: 'Credit Card (Stripe Mock)',
      shippingAddress: {
        fullName: 'Alex Johnson',
        address: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'USA',
        phone: '+1 (555) 234-5678',
      },
    });

    const subOrder2 = await SubOrder.create({
      subOrderNumber: 'SUB-723191',
      parentOrderId: order2._id,
      customerId: customer._id,
      storeId: techStore._id,
      items: [
        {
          productId: keyboard._id,
          title: keyboard.title,
          price: 159.0,
          quantity: 1,
          variantSku: 'APX-RED-LUBED',
          image: keyboard.images[0],
        },
      ],
      subTotal: 159.0,
      shippingFee: 0,
      totalAmount: 159.0,
      status: 'Delivered',
      trackingNumber: 'SPH-TRK-44120938',
      deliveryPartnerId: delivery._id,
      statusHistory: [
        { status: 'Placed', note: 'Order placed by customer', timestamp: new Date(Date.now() - 5 * 86400000) },
        { status: 'Confirmed', note: 'Confirmed by TechSphere Official', timestamp: new Date(Date.now() - 4 * 86400000) },
        { status: 'Packed', note: 'Packed', timestamp: new Date(Date.now() - 3 * 86400000) },
        { status: 'Shipped', note: 'Shipped', timestamp: new Date(Date.now() - 2 * 86400000) },
        { status: 'Delivered', note: 'Delivered', timestamp: new Date(Date.now() - 1 * 86400000) },
      ],
      dispute: {
        isDisputed: true,
        reason: 'Damaged Goods',
        customerNote: 'The spacebar key stabilizer came loose during shipping and one keycap was scratched.',
        refundAmount: 159.0,
        status: 'Open', // Ready for Support Agent review
        requestedAt: new Date(Date.now() - 12 * 3600000),
      },
    });

    order2.subOrders = [subOrder2._id];
    await order2.save();

    // Order 3: Placed / Confirmed Order for Seller fulfillment testing
    const order3 = await Order.create({
      orderNumber: 'ORD-991044',
      customerId: customer._id,
      items: [
        {
          productId: shoes._id,
          storeId: ecoStore._id,
          title: shoes.title,
          price: 139.0,
          quantity: 1,
          variantSku: 'AT-RED-US10',
          image: shoes.images[0],
        },
      ],
      totalAmount: 139.0,
      paymentStatus: 'Paid',
      paymentMethod: 'Instant Bank Transfer',
      shippingAddress: {
        fullName: 'Alex Johnson',
        address: '742 Evergreen Terrace',
        city: 'Springfield',
        state: 'OR',
        postalCode: '97477',
        country: 'USA',
        phone: '+1 (555) 234-5678',
      },
    });

    const subOrder3 = await SubOrder.create({
      subOrderNumber: 'SUB-991045',
      parentOrderId: order3._id,
      customerId: customer._id,
      storeId: ecoStore._id,
      items: [
        {
          productId: shoes._id,
          title: shoes.title,
          price: 139.0,
          quantity: 1,
          variantSku: 'AT-RED-US10',
          image: shoes.images[0],
        },
      ],
      subTotal: 139.0,
      shippingFee: 0,
      totalAmount: 139.0,
      status: 'Placed', // Seller can advance: Placed -> Confirmed -> Packed
      statusHistory: [
        { status: 'Placed', note: 'Order placed by customer, awaiting seller confirmation', timestamp: new Date() },
      ],
    });

    order3.subOrders = [subOrder3._id];
    await order3.save();

    console.log('\n======================================================');
    console.log('✅ SHOPSPHERE DATABASE SEEDED SUCCESSFULLY!');
    console.log('======================================================');
    console.log('\n🔑 PRE-CONFIGURED DEMO ACCOUNTS (Password: "password123"):');
    console.log('1. Customer:        customer@shopsphere.com');
    console.log('2. Seller:          seller@shopsphere.com     (TechSphere Official)');
    console.log('   Seller 2:        seller2@shopsphere.com    (EcoVibe Studio)');
    console.log('   Seller 3:        seller3@shopsphere.com    (NovaSound Labs - Pending Approval)');
    console.log('3. Platform Admin:  admin@shopsphere.com');
    console.log('4. Support Agent:   support@shopsphere.com');
    console.log('5. Delivery Partner:delivery@shopsphere.com');
    console.log('======================================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('❌ [Seed Script Error]:', err);
    process.exit(1);
  }
};

seedDatabase();
