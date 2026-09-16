const assert = require('assert');

const BASE_URL = 'http://localhost:5000/api';
const CLIENT_URL = 'http://localhost:5173';

async function request(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch (e) {
    return { status: res.status, ok: res.ok, data: text };
  }
}

async function runFullE2ETests() {
  console.log('======================================================');
  console.log('🚀 RUNNING COMPREHENSIVE SHOPSPHERE E2E TEST SUITE');
  console.log('======================================================\n');

  // Test 1: Frontend & Backend Health
  console.log('1. Checking Services Health...');
  const frontendRes = await request(CLIENT_URL);
  assert.strictEqual(frontendRes.status, 200, 'Frontend Vite dev server is responding');
  assert(frontendRes.data.includes('ShopSphere'), 'Frontend serves ShopSphere application');
  console.log('   ✅ Frontend Vite Server: 200 OK (Serving React SPA)');

  const healthRes = await request(`${BASE_URL}/health`);
  assert.strictEqual(healthRes.status, 200, 'Backend healthcheck');
  assert.strictEqual(healthRes.data.status, 'online');
  console.log('   ✅ Backend Express API: 200 OK (Status: online)\n');

  // Test 2: Authenticate all 5 Distinct Roles
  console.log('2. Authenticating 5 Distinct User Roles (RBAC)...');
  const tokens = {};
  const users = {};

  const demoLogins = [
    { role: 'Customer', email: 'customer@shopsphere.com' },
    { role: 'Seller', email: 'seller@shopsphere.com' },
    { role: 'Platform Admin', email: 'admin@shopsphere.com' },
    { role: 'Support Agent', email: 'support@shopsphere.com' },
    { role: 'Delivery Partner', email: 'delivery@shopsphere.com' },
  ];

  for (const demo of demoLogins) {
    const loginRes = await request(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ email: demo.email, password: 'password123' }),
    });
    assert.strictEqual(loginRes.status, 200, `Login for ${demo.role}`);
    assert.strictEqual(loginRes.data.data.user.role, demo.role);
    tokens[demo.role] = loginRes.data.data.accessToken;
    users[demo.role] = loginRes.data.data.user;
    console.log(`   ✅ ${demo.role.padEnd(16)}: Authenticated (${demo.email})`);
  }
  console.log('');

  // Test 3: Catalog & AI Capabilities
  console.log('3. Validating Catalog & AI Capabilities...');
  const productsRes = await request(`${BASE_URL}/products`);
  assert.strictEqual(productsRes.status, 200);
  assert(productsRes.data.data.length > 0, 'Products catalog returned');
  const products = productsRes.data.data;
  console.log(`   ✅ Fetched ${products.length} catalog products with categories [${productsRes.data.categories.join(', ')}]`);

  // AI Semantic Search
  const aiSearchRes = await request(`${BASE_URL}/ai/semantic-search?query=headphones`);
  assert.strictEqual(aiSearchRes.status, 200);
  assert(aiSearchRes.data.data.length > 0, 'AI Semantic search found matching items');
  console.log(`   ✅ AI Semantic Search Query: "headphones" matched ${aiSearchRes.data.data.length} items (Top match: "${aiSearchRes.data.data[0].title}", Confidence: ${aiSearchRes.data.data[0].matchConfidence}%)`);

  // AI Description Generator (invoked as Seller)
  const aiGenRes = await request(`${BASE_URL}/ai/generate-description`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['Seller']}` },
    body: JSON.stringify({
      title: 'AeroGlide Wireless Ergonomic Trackball Mouse',
      category: 'Electronics',
      keywords: ['ergonomic', 'bluetooth', 'trackball'],
      specs: { DPI: '4000 Sensor', Connection: 'Tri-mode Bluetooth 5.3' },
    }),
  });
  assert.strictEqual(aiGenRes.status, 200);
  assert(aiGenRes.data.data.description.length > 50, 'AI generated rich description');
  console.log(`   ✅ AI Copy Generation: Generated "${aiGenRes.data.data.tagline}" with ${aiGenRes.data.data.keyFeatures.length} key specs\n`);

  // Test 4: Multi-Vendor Atomic Checkout Engine
  console.log('4. Testing Atomic Multi-Vendor Checkout Engine...');
  // Pick two products from different stores
  const productA = products.find((p) => p.storeId.storeName.includes('TechSphere'));
  const productB = products.find((p) => p.storeId.storeName.includes('EcoVibe'));

  assert(productA && productB, 'Found products from separate vendor stores');

  const initialStockA = productA.stock;
  const initialStockB = productB.stock;

  const checkoutPayload = {
    items: [
      {
        productId: productA._id,
        quantity: 1,
        variantSku: productA.variants?.[0]?.sku || undefined,
        title: productA.title,
      },
      {
        productId: productB._id,
        quantity: 2,
        variantSku: productB.variants?.[0]?.sku || undefined,
        title: productB.title,
      },
    ],
    shippingAddress: {
      fullName: 'Alex Johnson',
      address: '742 Evergreen Terrace',
      city: 'Springfield',
      state: 'OR',
      postalCode: '97477',
      country: 'USA',
      phone: '+1 (555) 234-5678',
    },
    paymentMethod: 'Instant Credit Card (Mock)',
  };

  const checkoutRes = await request(`${BASE_URL}/orders/checkout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['Customer']}` },
    body: JSON.stringify(checkoutPayload),
  });

  assert.strictEqual(checkoutRes.status, 201, 'Checkout succeeds with 201 Created');
  const parentOrder = checkoutRes.data.data;
  assert.strictEqual(parentOrder.subOrders.length, 2, 'Parent Order cleanly split into 2 SubOrders');
  console.log(`   ✅ Created Parent Order #${parentOrder.orderNumber} ($${parentOrder.totalAmount})`);
  console.log(`   ✅ Split into ${parentOrder.subOrders.length} SubOrders:`);

  for (const sub of parentOrder.subOrders) {
    console.log(`      • Sub-Order #${sub.subOrderNumber} (${sub.storeId.storeName}): Subtotal $${sub.subTotal} + Shipping $${sub.shippingFee} = Total $${sub.totalAmount} (Status: ${sub.status})`);
  }

  // Verify atomic stock decrement
  const updatedProductA = (await request(`${BASE_URL}/products/${productA._id}`)).data.data;
  assert.strictEqual(updatedProductA.stock, initialStockA - 1, 'Product A stock atomically decremented');
  console.log(`   ✅ Atomic Inventory Guard: Stock updated from ${initialStockA} -> ${updatedProductA.stock}\n`);

  // Test 5: State Machine Lifecycle Progression
  console.log('5. Testing State Machine Lifecycle & Role Authorization...');
  const testSubOrder = parentOrder.subOrders[0];

  // 5a. Unauthorized transition check: Delivery partner cannot mark Placed -> Delivered directly!
  const illegalTransitionRes = await request(`${BASE_URL}/delivery/orders/${testSubOrder._id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens['Delivery Partner']}` },
    body: JSON.stringify({ targetStatus: 'Delivered' }),
  });
  assert.strictEqual(illegalTransitionRes.status, 400, 'Illegal transition is guarded and rejected');
  console.log(`   ✅ State Machine Guard: Blocked illegal transition (Placed -> Delivered): "${illegalTransitionRes.data.message}"`);

  // 5b. Seller confirms order: Placed -> Confirmed
  const confirmRes = await request(`${BASE_URL}/seller/orders/${testSubOrder._id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens['Seller']}` },
    body: JSON.stringify({ targetStatus: 'Confirmed', note: 'Order accepted by TechSphere warehouse' }),
  });
  assert.strictEqual(confirmRes.status, 200);
  assert.strictEqual(confirmRes.data.data.status, 'Confirmed');
  console.log(`   ✅ Seller Action: Transitioned to "Confirmed"`);

  // 5c. Seller packs order: Confirmed -> Packed
  const packRes = await request(`${BASE_URL}/seller/orders/${testSubOrder._id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens['Seller']}` },
    body: JSON.stringify({ targetStatus: 'Packed', note: 'Boxed and taped with security seal' }),
  });
  assert.strictEqual(packRes.status, 200);
  assert.strictEqual(packRes.data.data.status, 'Packed');
  console.log(`   ✅ Seller Action: Transitioned to "Packed"`);

  // 5d. Delivery partner claims shipment: Packed -> Shipped (Generates carrier waybill)
  const claimRes = await request(`${BASE_URL}/delivery/claim/${testSubOrder._id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens['Delivery Partner']}` },
  });
  assert.strictEqual(claimRes.status, 200);
  assert.strictEqual(claimRes.data.data.status, 'Shipped');
  const trackingNum = claimRes.data.data.trackingNumber;
  assert(trackingNum.startsWith('SPH-TRK-'), 'Carrier tracking number generated');
  console.log(`   ✅ Courier Action: Claimed shipment -> "Shipped" with Tracking Waybill: ${trackingNum}`);

  // 5e. Delivery partner updates milestone: Shipped -> Out for Delivery
  const outRes = await request(`${BASE_URL}/delivery/orders/${testSubOrder._id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens['Delivery Partner']}` },
    body: JSON.stringify({ targetStatus: 'Out for Delivery', note: 'Loaded onto courier delivery van' }),
  });
  assert.strictEqual(outRes.status, 200);
  assert.strictEqual(outRes.data.data.status, 'Out for Delivery');
  console.log(`   ✅ Courier Action: Transitioned to "Out for Delivery"`);

  // 5f. Delivery partner completes delivery: Out for Delivery -> Delivered
  const deliverRes = await request(`${BASE_URL}/delivery/orders/${testSubOrder._id}/status`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens['Delivery Partner']}` },
    body: JSON.stringify({ targetStatus: 'Delivered', note: 'Handed directly to recipient' }),
  });
  assert.strictEqual(deliverRes.status, 200);
  assert.strictEqual(deliverRes.data.data.status, 'Delivered');
  console.log(`   ✅ Courier Action: Transitioned to "Delivered"\n`);

  // Test 6: Support Agent Dispute & Refund
  console.log('6. Testing Customer Dispute Filing & Support Mediation...');
  // Customer files dispute on the delivered suborder
  const disputeRes = await request(`${BASE_URL}/orders/suborders/${testSubOrder._id}/dispute`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokens['Customer']}` },
    body: JSON.stringify({
      reason: 'Defective Product',
      customerNote: 'Item arrived with audio crackle on left channel.',
      refundAmount: testSubOrder.totalAmount,
    }),
  });
  assert.strictEqual(disputeRes.status, 201);
  assert.strictEqual(disputeRes.data.data.dispute.status, 'Open');
  console.log(`   ✅ Customer Action: Dispute opened (Reason: Defective Product, Refund: $${testSubOrder.totalAmount})`);

  // Support Agent inspects dispute queue
  const supportQueueRes = await request(`${BASE_URL}/support/disputes`, {
    headers: { Authorization: `Bearer ${tokens['Support Agent']}` },
  });
  assert.strictEqual(supportQueueRes.status, 200);
  assert(supportQueueRes.data.data.length > 0, 'Dispute found in support queue');
  console.log(`   ✅ Support Agent Action: Fetched dispute queue (${supportQueueRes.data.metrics.openCount} Open Cases)`);

  // Support Agent issues refund
  const resolveRes = await request(`${BASE_URL}/support/disputes/${testSubOrder._id}/resolve`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokens['Support Agent']}` },
    body: JSON.stringify({
      action: 'Refunded',
      resolutionNotes: 'Refund approved by support agent after merchant verification.',
      refundAmount: testSubOrder.totalAmount,
    }),
  });
  assert.strictEqual(resolveRes.status, 200);
  assert.strictEqual(resolveRes.data.data.status, 'Refunded');
  console.log(`   ✅ Support Agent Action: Refund authorized ($${testSubOrder.totalAmount}), SubOrder marked "Refunded"\n`);

  // Test 7: Platform Admin Governance & GMV Oversight
  console.log('7. Testing Platform Admin GMV & Moderation...');
  const analyticsRes = await request(`${BASE_URL}/admin/analytics`, {
    headers: { Authorization: `Bearer ${tokens['Platform Admin']}` },
  });
  assert.strictEqual(analyticsRes.status, 200);
  const stats = analyticsRes.data.data;
  assert(stats.platformGMV > 0, 'Platform GMV calculated from settled orders');
  console.log(`   ✅ Admin GMV Analytics: Platform GMV: $${stats.platformGMV.toFixed(2)} | Marketplace Commission (8%): $${stats.platformCommission.toFixed(2)} | Total Orders: ${stats.totalOrders}`);

  // Test Store Approval
  const adminStoresRes = await request(`${BASE_URL}/admin/stores?status=pending`, {
    headers: { Authorization: `Bearer ${tokens['Platform Admin']}` },
  });
  assert.strictEqual(adminStoresRes.status, 200);
  if (adminStoresRes.data.data.length > 0) {
    const pendingStore = adminStoresRes.data.data[0];
    const approveRes = await request(`${BASE_URL}/admin/stores/${pendingStore._id}/approval`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${tokens['Platform Admin']}` },
      body: JSON.stringify({ isApproved: true }),
    });
    assert.strictEqual(approveRes.status, 200);
    console.log(`   ✅ Admin Action: Approved merchant store "${pendingStore.storeName}"`);
  }

  console.log('\n======================================================');
  console.log('🎉 ALL SHOPSPHERE E2E TESTS PASSED WITH 100% SUCCESS!');
  console.log('======================================================\n');
}

runFullE2ETests().catch((err) => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
