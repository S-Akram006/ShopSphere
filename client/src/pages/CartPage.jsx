import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  Store,
  Truck,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

export default function CartPage() {
  const {
    cartItems,
    vendorsList,
    itemsSubtotal,
    totalShipping,
    grandTotal,
    updateQuantity,
    removeFromCart,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-12 bg-white rounded-3xl border border-slate-200 text-center shadow-xs">
        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-900 font-outfit mb-2">
          Your Cart is Empty
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Explore multi-vendor gear from verified independent brands and add items to your cart.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all"
        >
          Browse Marketplace <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-16">
      {/* Title & Multi-vendor Notice */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
            Multi-Vendor Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Items are automatically separated by vendor for independent fulfillment & tracking.
          </p>
        </div>

        <button
          onClick={clearCart}
          className="text-xs text-rose-600 hover:text-rose-700 font-semibold self-start sm:self-auto"
        >
          Clear Cart
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Vendor Groups */}
        <div className="lg:col-span-2 space-y-6">
          {vendorsList.map((vendor) => (
            <div
              key={vendor.storeId}
              className="bg-white rounded-2xl border border-slate-200/90 overflow-hidden shadow-xs"
            >
              {/* Vendor Header */}
              <div className="bg-slate-50/80 px-5 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900">
                      Fulfillment Store: {vendor.storeName}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      Dispatches direct from vendor facility
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-semibold text-slate-700">
                    Vendor Subtotal: ${vendor.subTotal.toFixed(2)}
                  </span>
                  <div className="text-[10px] text-slate-500 flex items-center gap-1">
                    <Truck className="w-3 h-3 text-slate-400" />
                    <span>
                      Shipping:{' '}
                      {vendor.shippingFee === 0 ? (
                        <strong className="text-emerald-600">FREE (Orders $100+)</strong>
                      ) : (
                        `$${vendor.shippingFee.toFixed(2)}`
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/* Items List */}
              <div className="divide-y divide-slate-100">
                {vendor.items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantSku || 'base'}`}
                    className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <img
                        src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=200&q=80'}
                        alt={item.title}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100 flex-shrink-0"
                      />
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-900 line-clamp-1">
                          {item.title}
                        </h4>
                        {item.variantSku && (
                          <div className="text-[11px] text-indigo-600 font-medium bg-indigo-50 px-2 py-0.5 rounded-md inline-block">
                            Variant: {item.variantSku}
                          </div>
                        )}
                        <div className="text-xs font-semibold text-slate-700 font-outfit">
                          ${item.price} each
                        </div>
                      </div>
                    </div>

                    {/* Quantity Adjustment & Subtotal */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                      <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantSku, item.quantity - 1)
                          }
                          className="px-2.5 py-1 text-xs hover:bg-slate-100 font-bold"
                        >
                          -
                        </button>
                        <span className="px-3 py-1 text-xs font-bold text-slate-800">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(item.productId, item.variantSku, item.quantity + 1)
                          }
                          className="px-2.5 py-1 text-xs hover:bg-slate-100 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right min-w-[70px]">
                        <span className="text-sm font-black text-slate-900 font-outfit">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      <button
                        onClick={() => removeFromCart(item.productId, item.variantSku)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Remove item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Right: Order Summary Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Order Summary
            </h3>

            <div className="space-y-2.5 text-xs text-slate-600 pt-2 border-t border-slate-100">
              <div className="flex justify-between">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900 font-outfit">
                  ${itemsSubtotal.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Multi-Vendor Shipping ({vendorsList.length} stores)</span>
                <span className="font-bold text-slate-900 font-outfit">
                  {totalShipping === 0 ? 'FREE' : `$${totalShipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between pt-3 border-t border-slate-100 text-sm">
                <span className="font-bold text-slate-900">Grand Total</span>
                <span className="font-black text-indigo-600 font-outfit text-base">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => navigate('/checkout')}
                className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2"
              >
                Proceed to Checkout <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Atomic Multi-Vendor Checkout</span>
              </div>
              <p>
                Stocks are atomically reserved across all items. A single payment creates separate vendor fulfillment sub-orders automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
