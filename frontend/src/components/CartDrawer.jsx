import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  X,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Store,
  ShieldCheck,
  Truck,
} from 'lucide-react';

export default function CartDrawer() {
  const {
    isDrawerOpen,
    closeDrawer,
    cartItems,
    vendorsList,
    itemsSubtotal,
    totalShipping,
    grandTotal,
    updateQuantity,
    removeFromCart,
  } = useCart();

  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isDrawerOpen) {
        closeDrawer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isDrawerOpen, closeDrawer]);

  if (!isDrawerOpen) return null;

  const handleCheckoutClick = () => {
    closeDrawer();
    navigate('/checkout');
  };

  const handleViewCartClick = () => {
    closeDrawer();
    navigate('/cart');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        onClick={closeDrawer}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity duration-300 animate-in fade-in"
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
          {/* Header */}
          <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Multi-Vendor Cart</h3>
                <span className="text-[11px] text-slate-500">
                  {cartItems.reduce((acc, it) => acc + it.quantity, 0)} item(s) across {vendorsList.length} vendor(s)
                </span>
              </div>
            </div>

            <button
              onClick={closeDrawer}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              aria-label="Close cart drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Cart Items List */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5">
            {cartItems.length === 0 ? (
              <div className="text-center py-16 space-y-3">
                <ShoppingBag className="w-12 h-12 text-slate-300 mx-auto" />
                <p className="text-sm font-bold text-slate-800">Your cart is currently empty</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Browse products from verified sellers and add gear to your cart.
                </p>
              </div>
            ) : (
              vendorsList.map((vendor) => (
                <div
                  key={vendor.storeId}
                  className="rounded-2xl border border-slate-200 overflow-hidden bg-white shadow-xs"
                >
                  {/* Vendor Store Header */}
                  <div className="px-3.5 py-2.5 bg-slate-50/90 border-b border-slate-100 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800">
                      <Store className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{vendor.storeName}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {vendor.itemsCount} item{vendor.itemsCount > 1 ? 's' : ''}
                    </span>
                  </div>

                  {/* Vendor Items */}
                  <div className="divide-y divide-slate-100 p-2">
                    {vendor.items.map((item) => {
                      const maxStock = item.stock || 99;
                      const isMax = item.quantity >= maxStock;

                      return (
                        <div
                          key={`${item.productId}-${item.variantSku || 'base'}`}
                          className="py-3 px-2 flex items-center gap-3"
                        >
                          <img
                            src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'}
                            alt={item.title}
                            className="w-14 h-14 object-cover rounded-xl border border-slate-100 flex-shrink-0"
                          />

                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 truncate">
                              {item.title}
                            </h4>
                            {item.variantSku && (
                              <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-md inline-block mt-0.5 font-medium">
                                {item.variantSku}
                              </span>
                            )}
                            <div className="flex items-center justify-between mt-1 text-xs">
                              <span className="font-bold text-slate-900 font-outfit">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>

                              {/* Stepper with stock capping */}
                              <div className="flex items-center border border-slate-200 rounded-lg bg-slate-50">
                                <button
                                  type="button"
                                  onClick={() =>
                                    updateQuantity(item.productId, item.variantSku, item.quantity - 1)
                                  }
                                  className="px-2 py-0.5 text-xs font-bold text-slate-600 hover:bg-slate-200"
                                >
                                  -
                                </button>
                                <span className="px-2 text-xs font-bold text-slate-800">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  disabled={isMax}
                                  onClick={() =>
                                    updateQuantity(item.productId, item.variantSku, item.quantity + 1)
                                  }
                                  className={`px-2 py-0.5 text-xs font-bold ${
                                    isMax
                                      ? 'text-slate-300 cursor-not-allowed'
                                      : 'text-slate-600 hover:bg-slate-200'
                                  }`}
                                  title={isMax ? `Max available stock (${maxStock}) reached` : 'Add one'}
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {isMax && (
                              <span className="text-[10px] text-amber-600 font-semibold mt-0.5 block">
                                Capped at available stock ({maxStock})
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromCart(item.productId, item.variantSku)}
                            className="text-slate-300 hover:text-rose-600 p-1 transition-colors"
                            title="Remove from cart"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Vendor Subtotal footer */}
                  <div
                    data-testid="drawer-vendor-sub-summary"
                    className="bg-slate-50/60 px-3.5 py-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-600"
                  >
                    <span>Vendor Sub-Summary ({vendor.itemsCount} items):</span>
                    <span className="font-bold text-slate-900 font-outfit">
                      ${vendor.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Checkout Summary */}
          {cartItems.length > 0 && (
            <div className="p-5 border-t border-slate-200 bg-slate-50/80 space-y-3">
              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-900 font-outfit">${itemsSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping ({vendorsList.length} vendors):</span>
                  <span className="font-bold text-slate-900 font-outfit">
                    {totalShipping === 0 ? 'FREE' : `$${totalShipping.toFixed(2)}`}
                  </span>
                </div>
                <div className="flex justify-between text-sm pt-2 border-t border-slate-200 font-bold text-slate-900">
                  <span>Total Amount:</span>
                  <span className="font-black text-indigo-600 font-outfit text-base">
                    ${grandTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleViewCartClick}
                  className="flex-1 py-2.5 px-3 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs text-center transition-all"
                >
                  View Full Cart
                </button>
                <button
                  type="button"
                  onClick={handleCheckoutClick}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5"
                >
                  Checkout <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
