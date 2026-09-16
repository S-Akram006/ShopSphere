import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { ordersAPI } from '../services/api';
import {
  CreditCard,
  ShieldCheck,
  Truck,
  Store,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Package,
} from 'lucide-react';

export default function CheckoutPage() {
  const { cartItems, vendorsList, itemsSubtotal, totalShipping, grandTotal, clearCart } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [shippingAddress, setShippingAddress] = useState({
    fullName: user?.name || 'Alex Johnson',
    address: '742 Evergreen Terrace',
    city: 'Springfield',
    state: 'OR',
    postalCode: '97477',
    country: 'USA',
    phone: user?.phone || '+1 (555) 234-5678',
  });

  const [paymentMethod, setPaymentMethod] = useState('Instant Credit Card (Mock)');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [createdOrder, setCreatedOrder] = useState(null);

  const handleInputChange = (e) => {
    setShippingAddress({ ...shippingAddress, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please sign in as a customer to place an order.');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const itemsPayload = cartItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        variantSku: item.variantSku || undefined,
        title: item.title,
      }));

      const res = await ordersAPI.checkout({
        items: itemsPayload,
        shippingAddress,
        paymentMethod,
      });

      const orderData = res.data.data;
      setCreatedOrder(orderData);
      clearCart();
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.message || 'Checkout failed. Stock may have been depleted.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Order Success Screen
  if (createdOrder) {
    return (
      <div className="max-w-3xl mx-auto my-12 p-8 sm:p-12 bg-white rounded-3xl border border-slate-200 shadow-lg text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
            Order Confirmed & Payment Authorized!
          </h1>
          <p className="text-slate-500 text-xs mt-1">
            Parent Order Number: <strong className="text-slate-800">{createdOrder.orderNumber}</strong>
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-left text-xs text-indigo-900 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Store className="w-4 h-4 text-indigo-600" />
            <span>Multi-Vendor Split Accomplished:</span>
          </div>
          <p>
            Your order has been split into <strong>{createdOrder.subOrders?.length || 1} independent vendor sub-orders</strong>. Each seller will pack and dispatch their items directly.
          </p>
        </div>

        {/* Sub-orders List */}
        <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden text-left">
          {createdOrder.subOrders?.map((sub) => (
            <div key={sub._id} className="p-4 bg-white flex items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-slate-900">
                  {sub.storeId?.storeName || 'Vendor Store'}
                </span>
                <span className="block text-[11px] text-slate-500">
                  Sub-Order: {sub.subOrderNumber} • Status: <strong className="text-amber-600">{sub.status}</strong>
                </span>
              </div>
              <Link
                to={`/orders/tracking/${sub._id}`}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 transition-all flex items-center gap-1.5"
              >
                <Truck className="w-3.5 h-3.5" /> Track Sub-Order
              </Link>
            </div>
          ))}
        </div>

        <div className="pt-4 flex justify-center gap-4">
          <Link
            to="/orders/my"
            className="px-6 py-3 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-all"
          >
            View All My Orders
          </Link>
          <Link
            to="/"
            className="px-6 py-3 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 transition-all"
          >
            Back to Marketplace
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
          Checkout & Split Order Allocation
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review shipping address, select simulated payment, and verify multi-vendor dispatch.
        </p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handlePlaceOrder} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Shipping and Payment */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Form */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              1. Delivery Shipping Address
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Recipient Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  required
                  value={shippingAddress.fullName}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  required
                  value={shippingAddress.address}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  required
                  value={shippingAddress.city}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">State / Province</label>
                <input
                  type="text"
                  name="state"
                  required
                  value={shippingAddress.state}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  required
                  value={shippingAddress.postalCode}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  required
                  value={shippingAddress.phone}
                  onChange={handleInputChange}
                  className="w-full p-2.5 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              2. Payment Authorization
            </h3>

            <div className="space-y-3">
              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-indigo-600 bg-indigo-50/50 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Instant Credit Card (Mock)'}
                  onChange={() => setPaymentMethod('Instant Credit Card (Mock)')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Instant Credit Card (Simulated Stripe)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Pre-authorized for demo evaluation with zero latency.
                  </span>
                </div>
              </label>

              <label className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 cursor-pointer">
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'Direct Enterprise Transfer'}
                  onChange={() => setPaymentMethod('Direct Enterprise Transfer')}
                  className="text-indigo-600 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Corporate ACH / Wire Simulation
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Immediate ledger confirmation.
                  </span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Right Col: Split SubOrders Preview & Total */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Split Sub-Orders ({vendorsList.length} Vendors)
            </h3>

            <div className="space-y-3">
              {vendorsList.map((vendor, idx) => (
                <div key={vendor.storeId} className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-900 mb-1">
                    <span>SubOrder #{idx + 1}: {vendor.storeName}</span>
                    <span>${(vendor.subTotal + vendor.shippingFee).toFixed(2)}</span>
                  </div>
                  <div className="text-[11px] text-slate-500 space-y-0.5">
                    {vendor.items.map((it, i) => (
                      <div key={i} className="flex justify-between">
                        <span className="truncate max-w-[170px]">{it.quantity}x {it.title}</span>
                        <span>${(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-slate-400 pt-1 border-t border-slate-200">
                      <span>Shipping Fee:</span>
                      <span>{vendor.shippingFee === 0 ? 'FREE' : `$${vendor.shippingFee}`}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal</span>
                <span className="font-bold text-slate-900">${itemsSubtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Multi-Store Shipping</span>
                <span className="font-bold text-slate-900">
                  {totalShipping === 0 ? 'FREE' : `$${totalShipping.toFixed(2)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-100">
                <span>Total Amount</span>
                <span className="font-black text-indigo-600 text-base">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-md shadow-indigo-600/25 transition-all flex items-center justify-center gap-2"
            >
              {submitting ? 'Executing Atomic Checkout...' : `Authorize & Pay $${grandTotal.toFixed(2)}`}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
