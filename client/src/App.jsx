import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { LocationProvider } from './context/LocationContext';

// Shared Components
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Public & Customer Pages
import HomePage from './pages/HomePage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import CustomerOrdersPage from './pages/CustomerOrdersPage';
import OrderTrackingPage from './pages/OrderTrackingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';

// Role-Specific Pages
import SellerDashboard from './pages/seller/SellerDashboard';
import SellerProducts from './pages/seller/SellerProducts';
import SellerOrders from './pages/seller/SellerOrders';
import AdminDashboard from './pages/admin/AdminDashboard';
import SupportDashboard from './pages/support/SupportDashboard';
import DeliveryDashboard from './pages/delivery/DeliveryDashboard';

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <LocationProvider>
            <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-indigo-500 selection:text-white">
            {/* Navigation Header */}
            <Navbar />

            {/* Main Application Routes Viewport */}
            <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-8">
              <Routes>
                {/* Marketplace & Catalog */}
                <Route path="/" element={<HomePage />} />
                <Route path="/products/:id" element={<ProductDetailPage />} />
                <Route path="/cart" element={<CartPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Customer Checkout & Tracking */}
                <Route
                  path="/checkout"
                  element={
                    <ProtectedRoute allowedRoles={['Customer', 'Platform Admin']}>
                      <CheckoutPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/my"
                  element={
                    <ProtectedRoute allowedRoles={['Customer', 'Platform Admin']}>
                      <CustomerOrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/orders/tracking/:subOrderId"
                  element={<OrderTrackingPage />}
                />

                {/* Seller Workspace */}
                <Route
                  path="/seller/dashboard"
                  element={
                    <ProtectedRoute allowedRoles={['Seller', 'Platform Admin']}>
                      <SellerDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/products"
                  element={
                    <ProtectedRoute allowedRoles={['Seller', 'Platform Admin']}>
                      <SellerProducts />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/seller/orders"
                  element={
                    <ProtectedRoute allowedRoles={['Seller', 'Platform Admin']}>
                      <SellerOrders />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Control Center */}
                <Route
                  path="/admin/analytics"
                  element={
                    <ProtectedRoute allowedRoles={['Platform Admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/stores"
                  element={
                    <ProtectedRoute allowedRoles={['Platform Admin']}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Support Agent Resolution Queue */}
                <Route
                  path="/support/disputes"
                  element={
                    <ProtectedRoute allowedRoles={['Support Agent', 'Platform Admin']}>
                      <SupportDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Courier Delivery Terminal */}
                <Route
                  path="/delivery/feed"
                  element={
                    <ProtectedRoute allowedRoles={['Delivery Partner', 'Platform Admin']}>
                      <DeliveryDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </main>

            {/* Footer */}
            <Footer />
          </div>
          </LocationProvider>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}
