import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useLocation as useCustomerLocation } from '../context/LocationContext';
import LocationModal from './LocationModal';
import {
  ShoppingBag,
  ShoppingCart,
  LayoutDashboard,
  ShieldAlert,
  Headphones,
  Truck,
  LogOut,
  LogIn,
  Store,
  User,
  Menu,
  X,
  Package,
  MapPin,
} from 'lucide-react';

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const { totalItems } = useCart();
  const { customerLocation, setIsModalOpen } = useCustomerLocation();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Delivery Location */}
          <div className="flex items-center gap-4 sm:gap-6">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-500 flex items-center justify-center text-white shadow-md shadow-indigo-200 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-1 font-outfit">
                  Shop<span className="text-indigo-600">Sphere</span>
                </span>
                <span className="block text-[10px] tracking-wider uppercase font-bold text-slate-400 -mt-1">
                  Enterprise Multi-Vendor
                </span>
              </div>
            </Link>

            {/* Customer Location Pill */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1 rounded-xl border border-slate-200/80 bg-slate-50/90 hover:bg-indigo-50/70 hover:border-indigo-300 transition-all text-left group"
              title="Change delivery destination"
            >
              <div className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <MapPin className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                  Deliver to
                </span>
                <span className="block text-xs font-bold text-slate-800 truncate max-w-[120px]">
                  {customerLocation ? `${customerLocation.city}, ${customerLocation.state}` : 'Select City'}
                </span>
              </div>
            </button>

            {/* Desktop Navigation Links by Role */}
            <nav className="hidden md:flex items-center gap-1">
              <Link
                to="/"
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/')
                    ? 'text-indigo-600 bg-indigo-50 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Marketplace
              </Link>

              {/* Customer Links */}
              {(!user || role === 'Customer') && (
                <Link
                  to="/orders/my"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive('/orders/my')
                      ? 'text-indigo-600 bg-indigo-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  My Orders
                </Link>
              )}

              {/* Seller Links */}
              {(role === 'Seller' || role === 'Platform Admin') && (
                <>
                  <Link
                    to="/seller/dashboard"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/seller/dashboard')
                        ? 'text-indigo-600 bg-indigo-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                    Seller Hub
                  </Link>
                  <Link
                    to="/seller/products"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/seller/products')
                        ? 'text-indigo-600 bg-indigo-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Catalog & Variants
                  </Link>
                  <Link
                    to="/seller/orders"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/seller/orders')
                        ? 'text-indigo-600 bg-indigo-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Fulfillment Board
                  </Link>
                </>
              )}

              {/* Admin Links */}
              {role === 'Platform Admin' && (
                <>
                  <Link
                    to="/admin/analytics"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                      isActive('/admin/analytics')
                        ? 'text-purple-700 bg-purple-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldAlert className="w-4 h-4 text-purple-600" />
                    Admin GMV
                  </Link>
                  <Link
                    to="/admin/stores"
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive('/admin/stores')
                        ? 'text-purple-700 bg-purple-50 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Store Approvals
                  </Link>
                </>
              )}

              {/* Support Links */}
              {(role === 'Support Agent' || role === 'Platform Admin') && (
                <Link
                  to="/support/disputes"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/support/disputes')
                      ? 'text-amber-700 bg-amber-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Headphones className="w-4 h-4 text-amber-600" />
                  Support Queue
                </Link>
              )}

              {/* Delivery Links */}
              {(role === 'Delivery Partner' || role === 'Platform Admin') && (
                <Link
                  to="/delivery/feed"
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    isActive('/delivery/feed')
                      ? 'text-teal-700 bg-teal-50 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <Truck className="w-4 h-4 text-teal-600" />
                  Delivery Dispatch
                </Link>
              )}
            </nav>
          </div>

          {/* Right Action Icons: Cart & Profile */}
          <div className="flex items-center gap-3">
            {/* Cart Button */}
            <Link
              to="/cart"
              className="relative p-2.5 rounded-xl text-slate-700 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm animate-scale">
                  {totalItems}
                </span>
              )}
            </Link>

            {/* User Dropdown / Auth Actions */}
            {user ? (
              <div className="flex items-center gap-2">
                <div className="hidden sm:flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-900 leading-tight">
                    {user.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm transition-all"
              >
                <LogIn className="w-4 h-4" />
                Sign In
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-100 space-y-1">
            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                setIsModalOpen(true);
              }}
              className="w-full text-left px-3 py-2 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-between text-sm"
            >
              <span className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-indigo-600" />
                Deliver to: {customerLocation ? `${customerLocation.city}, ${customerLocation.state}` : 'Select City'}
              </span>
              <span className="text-xs bg-white px-2 py-0.5 rounded border border-indigo-200">Change</span>
            </button>
            <Link
              to="/"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Marketplace
            </Link>
            <Link
              to="/orders/my"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              My Orders
            </Link>
            <Link
              to="/seller/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Seller Dashboard
            </Link>
            <Link
              to="/admin/analytics"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Admin Analytics
            </Link>
            <Link
              to="/support/disputes"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Support Queue
            </Link>
            <Link
              to="/delivery/feed"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 rounded-lg text-base font-medium text-slate-700 hover:bg-slate-50"
            >
              Delivery Feed
            </Link>
          </div>
        )}
      </div>

      {/* Customer Location Selector Modal */}
      <LocationModal />
    </header>
  );
}
