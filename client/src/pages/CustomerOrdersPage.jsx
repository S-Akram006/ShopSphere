import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import {
  Package,
  Calendar,
  Store,
  Truck,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

export default function CustomerOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getMyOrders();
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancelSubOrder = async (subOrderId) => {
    if (!window.confirm('Are you sure you want to cancel this vendor sub-order? Reserved stock will be restored.')) return;
    try {
      await ordersAPI.cancelSubOrder(subOrderId);
      fetchOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Cancellation failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-16">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
          My Order History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review all your multi-vendor orders, track dispatch milestones, and manage returns or disputes.
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No orders yet</h3>
          <p className="text-slate-500 text-sm mt-1">
            Browse our catalog to place your first multi-vendor order.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 shadow-xs"
          >
            Start Shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs"
            >
              {/* Parent Order Bar */}
              <div className="bg-slate-50/90 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Order Reference
                    </span>
                    <span className="font-bold text-slate-900">{order.orderNumber}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Date Placed
                    </span>
                    <span className="text-slate-700 font-medium">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">
                      Total Billed
                    </span>
                    <span className="font-bold text-slate-900 font-outfit">
                      ${order.totalAmount.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
                    Payment: {order.paymentStatus}
                  </span>
                  <span className="text-slate-500 text-[11px]">
                    ({order.subOrders?.length || 1} Split Shipments)
                  </span>
                </div>
              </div>

              {/* SubOrders Split List */}
              <div className="p-6 space-y-4 divide-y divide-slate-100">
                {order.subOrders?.map((sub) => (
                  <div
                    key={sub._id}
                    className="pt-4 first:pt-0 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600 mt-1">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-xs text-slate-900">
                            {sub.storeId?.storeName || 'Vendor Partner'}
                          </h4>
                          <StatusBadge status={sub.status} />
                        </div>
                        <span className="text-[11px] text-slate-400 block">
                          Sub-Order ID: {sub.subOrderNumber}
                        </span>

                        {/* Items preview */}
                        <div className="text-xs text-slate-600 pt-1 space-y-0.5">
                          {sub.items?.map((it, i) => (
                            <div key={i} className="flex items-center gap-2">
                              <span>• {it.quantity}x {it.title}</span>
                              {it.variantSku && (
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 rounded">
                                  {it.variantSku}
                                </span>
                              )}
                              <span className="text-slate-400">(${it.price})</span>
                            </div>
                          ))}
                        </div>

                        {/* Dispute alert if active */}
                        {sub.dispute && sub.dispute.isDisputed && (
                          <div className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                            <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                            Dispute Active: {sub.dispute.reason} ({sub.dispute.status})
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 self-end md:self-center">
                      {sub.status === 'Placed' && (
                        <button
                          onClick={() => handleCancelSubOrder(sub._id)}
                          className="px-3 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                        >
                          Cancel Sub-Order
                        </button>
                      )}

                      <Link
                        to={`/orders/tracking/${sub._id}`}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs"
                      >
                        <Truck className="w-3.5 h-3.5" /> Track Shipment
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
