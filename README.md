# ShopSphere — Enterprise Multi-Vendor E-Commerce Platform

ShopSphere is a production-grade enterprise multi-vendor e-commerce marketplace built on the MERN stack (MongoDB, Express.js, React + Vite, Node.js) with Tailwind CSS and Lucide icons.

---

## 🌟 Architecture Overview

```
Shop/
├── server/                        # Express.js REST API & MongoDB Data Layer
│   ├── config/db.js              # Mongoose connection
│   ├── models/                   # Comprehensive Mongoose schemas with indexes
│   │   ├── User.js               # RBAC User schema
│   │   ├── Store.js              # Merchant store profile & balance
│   │   ├── Product.js            # Products with variant matrix and text search index
│   │   ├── Order.js              # Parent multi-vendor order snapshot
│   │   ├── SubOrder.js           # Split vendor sub-orders with state tracking & disputes
│   │   └── Review.js             # Customer verified reviews
│   ├── middleware/
│   │   ├── auth.js               # JWT verification & authorizeRoles(...)
│   │   └── errorHandler.js       # Centralized error handler
│   ├── controllers/              # Business logic controllers
│   ├── routes/                   # Modular Express routers
│   ├── services/
│   │   └── stateMachine.js       # Finite State Machine sub-order transition guards
│   ├── scripts/
│   │   ├── seed.js               # Database population script with 5 demo personas
│   │   └── test-e2e.js           # Automated end-to-end test suite
│   ├── server.js                 # Server entry point (Port 5000)
│   └── package.json
└── client/                       # React 18 SPA (Vite)
    ├── src/
    │   ├── context/
    │   │   ├── AuthContext.jsx   # Auth session & 1-click role switcher
    │   │   └── CartContext.jsx   # Multi-vendor cart aggregation & per-store shipping
    │   ├── services/
    │   │   └── api.js            # Axios client with auto refresh-token rotation
    │   ├── components/
    │   │   ├── Navbar.jsx        # Role-sensitive dynamic navigation
    │   │   ├── Footer.jsx        # Architecture overview & platform specs
    │   │   ├── RoleSwitcher.jsx  # 1-Click Demo Switcher bar for evaluators
    │   │   ├── StatusBadge.jsx   # Visual status indicators
    │   │   ├── OrderTimeline.jsx # Visual milestone stepper
    │   │   └── ProtectedRoute.jsx# Strict RBAC client route protection
    │   ├── pages/
    │   │   ├── HomePage.jsx             # Marketplace catalog + AI semantic search toggle
    │   │   ├── ProductDetailPage.jsx    # Variant selector, AI copy summary, reviews
    │   │   ├── CartPage.jsx             # Multi-vendor grouped cart & shipping rules
    │   │   ├── CheckoutPage.jsx         # Atomic checkout execution & suborder split preview
    │   │   ├── CustomerOrdersPage.jsx   # Order history & dispute actions
    │   │   ├── OrderTrackingPage.jsx    # Live milestone stepper & dispute modal
    │   │   ├── LoginPage.jsx            # Sign in with 1-click demo login cards
    │   │   ├── RegisterPage.jsx         # Customer or Vendor merchant onboarding
    │   │   ├── seller/
    │   │   │   ├── SellerDashboard.jsx  # Vendor KPIs, store balance, and recent sales
    │   │   │   ├── SellerProducts.jsx   # Catalog manager with AI Copy Generator & variants
    │   │   │   └── SellerOrders.jsx     # Order fulfillment board with state transitions
    │   │   ├── admin/AdminDashboard.jsx # Platform GMV analytics, store & listing moderation
    │   │   ├── support/SupportDashboard.jsx # Dispute mediation queue & instant refund desk
    │   │   └── delivery/DeliveryDashboard.jsx # Courier parcel feed & tracking milestones
    │   ├── App.jsx
    │   └── main.jsx
    ├── tailwind.config.js
    └── package.json
```

---

## 🔑 Pre-Configured Demo Accounts

Every role can be switched into with **1-click** from the top **Role Switcher Bar** in the web interface, or logged in manually with the password **`password123`**:

| Role | Email | Persona Details |
|---|---|---|
| **Customer** | `customer@shopsphere.com` | Alex Johnson (buyer, cart, orders, reviews, disputes) |
| **Seller** | `seller@shopsphere.com` | Marcus Vance (TechSphere Official store, balance, catalog, fulfillment) |
| **Seller 2** | `seller2@shopsphere.com` | Elena Rostova (EcoVibe Studio store) |
| **Seller 3** | `seller3@shopsphere.com` | David Chen (NovaSound Audio - Pending Admin Approval) |
| **Platform Admin** | `admin@shopsphere.com` | Sarah Connor (GMV analytics, seller approvals, moderation) |
| **Support Agent** | `support@shopsphere.com` | Michael Scott (Dispute queue mediation & refund issuance) |
| **Delivery Partner**| `delivery@shopsphere.com`| Jordan Sparks (Shipment feed, claiming parcels, delivery milestones) |

---

## 🚀 Getting Started

### 1. Start MongoDB
Ensure MongoDB is running locally on default port `27017` (`mongodb://127.0.0.1:27017/shopsphere`).

### 2. Run the Database Seed Script
```bash
cd server
npm run seed
```

### 3. Run Automated E2E Test Suite
```bash
cd server
node scripts/test-e2e.js
```

### 4. Run Servers Locally
- **Backend API:** `cd server && npm start` (Listening on `http://localhost:5000`)
- **Frontend SPA:** `cd client && npm run dev` (Serving on `http://localhost:5173`)

---

## 🛡️ Key Technical Implementations

1. **Atomic Inventory Checkout:** Atomically checks variant and base stock using `$inc` operators. If any item is unavailable due to concurrency, all previously reserved items are automatically rolled back.
2. **Parent & Vendor Sub-Orders:** Checkout automatically groups cart items by vendor `storeId`, generating 1 Parent Order and independent SubOrders for each vendor with separate fulfillment lifecycles.
3. **Finite State Machine Sub-Order Lifecycle:**
   `Placed` &rarr; `Confirmed` &rarr; `Packed` &rarr; `Shipped` &rarr; `Out for Delivery` &rarr; `Delivered`.
   Guards prevent out-of-order state transitions (e.g. jumping from `Placed` directly to `Delivered` triggers an immediate HTTP 400 rejection).
4. **AI Capabilities:**
   - `/api/ai/generate-description`: Generates high-converting marketing copy, key specs, and SEO tags from title and category attributes.
   - `/api/ai/semantic-search`: Matches query intent and category semantics against product catalog.
