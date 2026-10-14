# ShopSphere — Enterprise Multi-Vendor E-Commerce Platform

ShopSphere is a production-grade enterprise multi-vendor e-commerce marketplace built on the MERN stack (**MongoDB**, **Express.js**, **React 18 + Vite**, and **Node.js**) styled with **Tailwind CSS**, featuring real-time **Socket.io** buyer-seller messaging, an atomic inventory reservation engine, dynamic coupon discounting, and automated vendor order splitting.

---

## 📁 Repository Structure

The repository is organized into a clean decoupled architecture containing strictly the frontend client, backend server, root `.gitignore`, and comprehensive documentation:

```
ShopSphere/
├── .gitignore                     # Unified root gitignore (node_modules, envs, builds, logs)
├── README.md                      # Comprehensive architecture and developer guide
├── backend/                       # Node.js + Express.js REST API & MongoDB Data Layer
│   ├── .env.example               # Backend environment variable template
│   ├── package.json               # Backend dependencies and execution scripts
│   ├── server.js                  # Express application entry point & Socket.io server
│   ├── config/
│   │   └── db.js                  # MongoDB Atlas connection & Mongoose initialization
│   ├── controllers/
│   │   ├── authController.js      # JWT authentication, login, register, token refresh
│   │   ├── chatController.js      # Real-time chat history & message persistence
│   │   ├── couponController.js    # Coupon validation, discount computation, seeding
│   │   ├── orderController.js     # Atomic checkout, inventory locks, vendor order splitting
│   │   ├── productController.js   # Product discovery, filtering, text search, reviews
│   │   └── sellerController.js    # Vendor dashboard analytics, revenue, restock actions
│   ├── middleware/
│   │   ├── auth.js                # JWT verification & Role-Based Access Control (RBAC)
│   │   └── errorHandler.js        # Centralized async error handling & status mapping
│   ├── models/
│   │   ├── Coupon.js              # Coupon discount rules & expiration schema
│   │   ├── Message.js             # Real-time buyer-seller message schema
│   │   ├── Order.js               # Parent multi-vendor order snapshot schema
│   │   ├── Product.js             # Product catalog, variants matrix, text search index
│   │   ├── Review.js              # Customer verified purchase review schema
│   │   ├── Store.js               # Vendor store profile, wallet balance, commission rates
│   │   ├── SubOrder.js            # Independent vendor sub-orders with status tracking
│   │   └── User.js                # User identity & role permissions (Customer, Seller, Admin)
│   ├── routes/
│   │   ├── aiRoutes.js            # Semantic search & automated copy generation endpoints
│   │   ├── authRoutes.js          # Authentication & session router
│   │   ├── chatRoutes.js          # Chat history endpoints
│   │   ├── couponRoutes.js        # Coupon verification & application router
│   │   ├── orderRoutes.js         # Checkout, order tracking, and history routes
│   │   ├── productRoutes.js       # Product catalog & review routes
│   │   └── sellerRoutes.js        # Vendor dashboard, earnings, and stock replenishment
│   ├── scripts/
│   │   ├── seed.js                # Database seeder (5 user personas, stores, products)
│   │   └── test-e2e.js            # Backend API integration test runner
│   ├── services/
│   │   ├── socketService.js       # Socket.io room management & broadcast handlers
│   │   └── stateMachine.js        # Strict Finite State Machine order status validator
│   └── uploads/                   # Local static uploads directory (.gitkeep protected)
└── frontend/                      # React 18 Single Page Application (Vite + Tailwind CSS)
    ├── .env.example               # Frontend environment variable template
    ├── index.html                 # Single page application HTML shell
    ├── package.json               # Frontend dependencies and build scripts
    ├── postcss.config.js          # PostCSS configuration for Tailwind CSS
    ├── tailwind.config.js         # Tailwind typography, theme extensions, glassmorphism
    ├── test-deployed-suite.mjs    # Puppeteer E2E browser automated test suite
    ├── vercel.json                # Single page app client routing rewrites
    ├── vite.config.js             # Vite build & development server config
    ├── public/                    # Static assets & brand icons
    └── src/
        ├── App.jsx                # Application routing, layout wrappers, and providers
        ├── index.css              # Global styles, Tailwind directives, glassmorphic tokens
        ├── main.jsx               # React DOM root entry point
        ├── components/
        │   ├── CartFeedbackToast.jsx   # Non-blocking visual feedback for cart additions
        │   ├── FastCartDrawer.jsx      # Slide-over cart preview with instant stock caps
        │   ├── Footer.jsx              # Responsive footer with system health status
        │   ├── Navbar.jsx              # Role-aware navigation, cart badge, search trigger
        │   ├── OrderTimeline.jsx       # Milestone progression tracker for sub-orders
        │   ├── ProtectedRoute.jsx      # Route authorization guard for protected views
        │   ├── RoleSwitcher.jsx        # 1-Click Persona switch toolbar for demo evaluation
        │   ├── StatusBadge.jsx         # Color-coded status chip component
        │   └── chat/
        │       └── SellerChatModal.jsx # Real-time Socket.io buyer-seller messaging modal
        ├── context/
        │   ├── AuthContext.jsx         # Authentication session, tokens, and role switching
        │   ├── CartContext.jsx         # Multi-vendor cart state, stock caps, coupon discounts
        │   └── SocketContext.jsx       # Persistent WebSocket client connection
        ├── pages/
        │   ├── CartPage.jsx            # Multi-vendor grouped cart with store subtotals
        │   ├── CheckoutPage.jsx        # Frictionless guest checkout, inline validation, payment
        │   ├── CustomerOrdersPage.jsx  # Customer order history and split sub-order viewer
        │   ├── HomePage.jsx            # Product catalog, fuzzy/typo search, category filters
        │   ├── LoginPage.jsx           # Sign in with instant 1-click persona demo cards
        │   ├── OrderTrackingPage.jsx   # Live milestone progression and dispute management
        │   ├── ProductDetailPage.jsx   # Gallery, variant matrix, stock limits, alternatives
        │   ├── RegisterPage.jsx        # Buyer and merchant registration onboarding
        │   ├── admin/
        │   │   └── AdminDashboard.jsx  # Platform GMV analytics, vendor moderation
        │   ├── delivery/
        │   │   └── DeliveryDashboard.jsx # Courier package dispatch and tracking
        │   ├── seller/
        │   │   ├── SellerDashboard.jsx # Vendor KPIs, sales volume trend chart, restock actions
        │   │   ├── SellerOrders.jsx    # Vendor order fulfillment pipeline
        │   │   └── SellerProducts.jsx  # Product catalog management & stock restock
        │   └── support/
        │       └── SupportDashboard.jsx# Dispute mediation queue and refund center
        ├── services/
        │   └── api.js                  # Axios client configured with JWT auto-injection
        └── utils/
            └── fuzzySearch.js          # Typo-tolerant Levenshtein distance & plural matcher
```

---

## 🛠️ Complete Tech Stack

| Domain | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend Framework** | React 18 | Declarative component architecture with concurrent rendering |
| **Build Tool** | Vite 5 | Fast HMR dev server and optimized Rollup production bundler |
| **Styling** | Tailwind CSS 3 | Modern utility-first styling with custom glassmorphic tokens |
| **Icons** | Lucide React | Clean, responsive SVG iconography |
| **Routing** | React Router v6 | Client-side routing with nested layouts and role-based guards |
| **Real-Time Client** | Socket.io Client | Bidirectional WebSocket communication for buyer-seller chat |
| **HTTP Client** | Axios | REST API communication with automated token refresh interceptors |
| **Backend Runtime** | Node.js | Asynchronous event-driven JavaScript server environment |
| **Web Framework** | Express.js 4 | Modular routing, middleware pipeline, and RESTful controllers |
| **Database** | MongoDB Atlas / Community | NoSQL document database with flexible schema and aggregation |
| **ODM** | Mongoose 8 | Schema modeling, validation, indexes, and atomic updates |
| **Real-Time Server** | Socket.io 4 | Room-based WebSocket server keyed by conversation identifiers |
| **Authentication** | JSON Web Tokens (JWT) & bcryptjs | Stateless authorization with access/refresh token rotation |
| **Testing** | Puppeteer Core | Headless browser automation for end-to-end integration testing |

---

## 🏛️ Architecture & Core Workflows

### 1. Multi-Vendor Isolation & Catalog Governance
- Every product listing belongs to a verified vendor store (`storeId`).
- Products feature multi-tier attributes: variant matrices (size/color/SKU), inventory stock boundaries, category classification, and full-text search indexing.
- Merchants can monitor their store’s inventory independently via the Vendor Dashboard (`/seller/dashboard` or `/vendor/dashboard`).

### 2. Cart Aggregation & Vendor Grouping
- Items added to the cart are dynamically grouped by merchant store in both the **Fast Cart Drawer** and the dedicated **Cart Page** (`/cart`).
- Quantity steppers automatically enforce available inventory limits (`min: 1`, `max: product.stock`).
- Individual vendor sub-summaries display product subtotals per seller alongside platform-wide discount deductions.

### 3. Frictionless Checkout & Payment Simulation
- **Guest Checkout:** Customers can navigate directly to `/checkout` without an mandatory login barrier.
- **Real-Time Inline Validation:** Required inputs (full name, email, shipping address) validate on `blur` and dynamic typing, showing helper instructions and disabling progress until fields are valid.
- **Dynamic Coupon Engine:** Customers can enter promo codes (`SAVE10`, `SAVE20`, `FREESHIP`) or click pre-loaded promo chips to apply percentage or flat deductions.
- **Payment Simulation & Atomic Order Split:** Submitting an order triggers a processing overlay, invokes atomic stock verification via MongoDB `$inc` operators, and automatically generates:
  1. **One Parent Order (`ORD-XXXXX`):** Encapsulates the overall transaction, payment status, and grand total.
  2. **Multiple Vendor Sub-Orders (`SUB-XXXXX`):** Dedicated to each merchant store with isolated fulfillment milestones.

### 4. Finite State Machine (FSM) Order Fulfillment
Vendor sub-orders progress through a strict finite state machine:
$$\text{Placed} \longrightarrow \text{Confirmed} \longrightarrow \text{Packed} \longrightarrow \text{Shipped} \longrightarrow \text{Out for Delivery} \longrightarrow \text{Delivered}$$
Illegal status jumps (e.g. attempting to jump from `Placed` directly to `Delivered`) are rejected by backend transition guards.

### 5. Real-Time Buyer–Seller Chat
- A dedicated Socket.io gateway enables buyers to message sellers directly from product detail pages.
- Chat rooms are keyed by compound identifiers (`productId_buyerId_vendorId`), guaranteeing persistent message history and instant message delivery.

### 6. Typo-Tolerant & Fuzzy Discovery
- Client-side fuzzy search leverages Levenshtein distance and plural normalization (e.g., matching `"headphne"` to `"Headphones"` and `"keyboards"` to `"Keyboard"`), seamlessly falling back to full catalog discovery when exact keyword matches yield no documents.

---

## 🔑 Pre-Configured Demo Accounts

For rapid evaluation and feature testing, ShopSphere includes a **1-Click Role Switcher** at the top of the interface. All accounts share the password **`password123`**:

| Persona Role | Email Address | Access & Capabilities |
| :--- | :--- | :--- |
| **Customer (Buyer)** | `customer@shopsphere.com` | Product discovery, cart drawer, guest/authenticated checkout, order tracking, seller chat |
| **Seller 1 (TechSphere)** | `seller@shopsphere.com` | Primary vendor dashboard, store analytics, inventory management, quick restock |
| **Seller 2 (EcoVibe)** | `seller2@shopsphere.com` | Secondary vendor store, apparel catalog, fulfillment pipeline |
| **Seller 3 (NovaSound)** | `seller3@shopsphere.com` | Audio specialty store, pending moderation status |
| **Platform Admin** | `admin@shopsphere.com` | Platform GMV overview, merchant approval, listing moderation |
| **Support Agent** | `support@shopsphere.com` | Customer dispute mediation queue, instant refund issuance |
| **Courier / Delivery** | `delivery@shopsphere.com` | Package dispatch board, parcel claiming, transit milestone updates |

---

## ⚙️ Environment Variables

### Backend Configuration (`backend/.env`)

Copy `backend/.env.example` to `backend/.env`:
```bash
cp backend/.env.example backend/.env
```

| Key | Description | Default / Example Value |
| :--- | :--- | :--- |
| `PORT` | Port for the Express REST & Socket.io server | `5000` |
| `MONGODB_URI` | MongoDB connection string (Atlas URI or local instance) | `mongodb://127.0.0.1:27017/shopsphere` |
| `JWT_ACCESS_SECRET` | Secret key used to sign access tokens | `your_jwt_access_secret_key_here` |
| `JWT_REFRESH_SECRET` | Secret key used to sign refresh tokens | `your_jwt_refresh_secret_key_here` |
| `JWT_ACCESS_EXPIRES_IN` | Access token lifespan | `1d` |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifespan | `7d` |
| `CLIENT_URL` | Allowed frontend origin(s) for CORS (comma-separated) | `http://localhost:5173` |
| `NODE_ENV` | Runtime environment (`development` or `production`) | `development` |

### Frontend Configuration (`frontend/.env`)

Copy `frontend/.env.example` to `frontend/.env`:
```bash
cp frontend/.env.example frontend/.env
```

| Key | Description | Default / Example Value |
| :--- | :--- | :--- |
| `VITE_API_URL` | Base HTTP URL for the backend REST API | `http://localhost:5000/api` |
| `VITE_SOCKET_URL` | Base WebSocket URL for real-time buyer-seller chat | `http://localhost:5000` |

---

## 🚀 Local Setup & Development

### 1. Prerequisites
- **Node.js:** v18.0.0 or higher
- **npm:** v9.0.0 or higher
- **MongoDB:** Active MongoDB Atlas connection string or local MongoDB running on port 27017.

### 2. Clone Repository
```bash
git clone https://github.com/S-Akram006/ShopSphere.git
cd ShopSphere
```

### 3. Install Dependencies
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 4. Seed the Database
Populate the database with verified demo personas, stores, products, and default coupon codes:
```bash
cd backend
npm run seed
```

### 5. Spin Up Both Servers

**Terminal 1 — Backend API & Socket.io:**
```bash
cd backend
npm run dev
# Server listening on http://localhost:5000
```

**Terminal 2 — Frontend Single Page Application:**
```bash
cd frontend
npm run dev
# Vite dev server running on http://localhost:5173
```

Visit **`http://localhost:5173`** in your browser.

---

## 🧪 Automated Testing

### Frontend Production Build
```bash
cd frontend
npm run build
```

### Automated Browser E2E Interaction Test Suite
Run the comprehensive 37-check Puppeteer automated audit against local or deployed targets:
```bash
cd frontend
npm run test
# Or against a custom target:
# TEST_URL="https://shop-sphere-lovat-tau.vercel.app" npm run test
```

---

## 📖 API Reference

### Authentication (`/api/auth`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/register` | Register a new customer or vendor merchant | Public |
| `POST` | `/api/auth/login` | Authenticate user and receive JWT access token | Public |
| `POST` | `/api/auth/refresh` | Refresh an expired access token | Public |
| `GET` | `/api/auth/me` | Fetch authenticated profile details | Private |

### Products & Discovery (`/api/products`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Query products with keyword, category, and sort filters | Public |
| `GET` | `/api/products/:id` | Retrieve product details, variants, and stock | Public |
| `POST` | `/api/products` | Create a new vendor product listing | Seller / Admin |
| `PUT` | `/api/products/:id` | Update product details or inventory | Seller / Admin |
| `POST` | `/api/products/:id/reviews` | Submit a verified customer review | Customer |

### Coupons & Discounts (`/api/coupons`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/coupons` | List all currently active public coupons | Public |
| `POST` | `/api/coupons/apply` | Validate coupon code and compute discount deduction | Public |

### Orders & Checkout (`/api/orders`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/orders/checkout` | Execute atomic stock checkout & generate vendor split orders | Public / Guest |
| `GET` | `/api/orders/my-orders` | Retrieve authenticated customer order history | Private |
| `GET` | `/api/orders/tracking/:subOrderId`| Track real-time fulfillment milestones of a vendor sub-order | Public |
| `POST` | `/api/orders/suborders/:id/status`| Advance order milestone through Finite State Machine | Seller / Courier |
| `POST` | `/api/orders/suborders/:id/dispute`| Raise customer dispute ticket on a sub-order | Customer |

### Vendor & Merchant Dashboard (`/api/seller`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/seller/dashboard` | Fetch KPI metrics, net earnings, and sales volume trend | Seller |
| `GET` | `/api/seller/products` | List all listings under merchant's store | Seller |
| `PUT` | `/api/seller/products/:id/restock`| Quick action to replenish low-stock items | Seller |
| `GET` | `/api/seller/orders` | View merchant's incoming fulfillment sub-orders | Seller |

### Real-Time Chat (`/api/chat`)
| Method | Endpoint | Description | Access |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/chat/messages/:conversationId` | Fetch persistent chat message history | Public / Authenticated |
| `POST` | `/api/chat/messages` | Save chat message to database and broadcast | Public / Authenticated |

---

## 📄 License
This project is licensed under the [MIT License](LICENSE).
