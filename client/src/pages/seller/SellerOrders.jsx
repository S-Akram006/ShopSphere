import React, { useState, useEffect } from 'react';
import { sellerAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Package,
  Truck,
  CheckCircle2,
  AlertCircle,
  Filter,
  XCircle,
  ExternalLink,
  MapPin,
  Clock,
} from 'lucide-react';

export default function SellerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [updatingId, setUpdatingId] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getOrders({ status: statusFilter });
      setOrders(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const handleStatusTransition = async (subOrderId, targetStatus, note = '') => {
    setUpdatingId(subOrderId);
    setErrorMsg(null);
    try {
      await sellerAPI.updateOrderStatus(subOrderId, {
        targetStatus,
        note: note || `Order advanced to ${targetStatus} by merchant.`,
      });
      setSuccessMsg(`Sub-order transitioned to "${targetStatus}"!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchOrders();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Status transition failed');
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
            Vendor Fulfillment Board
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Advance order state machine steps from Placed to Confirmed and Packed for courier dispatch.
          </p>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none self-start sm:self-auto">
          {['All', 'Placed', 'Confirmed', 'Packed', 'Shipped', 'Delivered'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === st
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Orders List */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No incoming orders</h3>
          <p className="text-slate-500 text-sm mt-1">
            There are currently no orders under filter "{statusFilter}".
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((ord) => {
            const isProcessing = updatingId === ord._id;

            return (
              <div
                key={ord._id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-slate-900">
                      Sub-Order #{ord.subOrderNumber}
                    </span>
                    <StatusBadge status={ord.status} />
                  </div>

                  <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(ord.createdAt).toLocaleString()}
                    </span>
                    <span className="font-bold text-slate-900 font-outfit text-sm">
                      Total: ${ord.totalAmount?.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Body: Items and Shipping Info */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
                  {/* Items */}
                  <div className="md:col-span-2 space-y-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
                      Fulfillment Items ({ord.items?.length})
                    </span>
                    <div className="space-y-2">
                      {ord.items?.map((it, i) => (
                        <div key={i} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl">
                          <div className="flex items-center gap-3">
                            <img
                              src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                              alt={it.title}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200"
                            />
                            <div>
                              <span className="font-bold text-slate-900 block">{it.title}</span>
                              {it.variantSku && (
                                <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                                  Variant: {it.variantSku}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right font-bold text-slate-800">
                            {it.quantity} x ${it.price} = ${(it.quantity * it.price).toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer and Delivery Destination */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <span className="font-bold uppercase tracking-wider text-[10px] text-slate-400 block">
                      Delivery Destination
                    </span>
                    <div className="space-y-1 text-slate-700">
                      <p className="font-bold text-slate-900">{ord.customerId?.name}</p>
                      <p className="text-slate-500">{ord.parentOrderId?.shippingAddress?.address}</p>
                      <p className="text-slate-500">
                        {ord.parentOrderId?.shippingAddress?.city},{' '}
                        {ord.parentOrderId?.shippingAddress?.state}{' '}
                        {ord.parentOrderId?.shippingAddress?.postalCode}
                      </p>
                      <p className="text-slate-500">
                        Phone: {ord.parentOrderId?.shippingAddress?.phone || ord.customerId?.phone}
                      </p>
                    </div>
                  </div>
                </div>

                {/* State Machine Transition Actions */}
                <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-[11px] text-slate-500">
                    State Machine Lifecycle: <strong>{ord.status}</strong>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* If Placed -> Can Confirm or Cancel */}
                    {ord.status === 'Placed' && (
                      <>
                        <button
                          onClick={() => handleStatusTransition(ord._id, 'Confirmed')}
                          disabled={isProcessing}
                          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Confirm Order
                        </button>
                        <button
                          onClick={() => handleStatusTransition(ord._id, 'Cancelled', 'Cancelled by vendor')}
                          disabled={isProcessing}
                          className="px-3 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs"
                        >
                          Cancel
                        </button>
                      </>
                    )}

                    {/* If Confirmed -> Can Pack */}
                    {ord.status === 'Confirmed' && (
                      <button
                        onClick={() => handleStatusTransition(ord._id, 'Packed', 'Items packaged and ready for carrier')}
                        disabled={isProcessing}
                        className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                      >
                        <Package className="w-3.5 h-3.5" />
                        Mark Packed & Ready for Pickup
                      </button>
                    )}

                    {/* If Packed -> Waiting for Courier or Dispatch */}
                    {ord.status === 'Packed' && (
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-lg font-semibold">
                          Awaiting Courier Claim in Delivery Feed
                        </span>
                        <button
                          onClick={() => handleStatusTransition(ord._id, 'Shipped', 'Direct merchant dispatch')}
                          disabled={isProcessing}
                          className="px-3 py-1.5 rounded-xl border border-indigo-200 text-indigo-700 hover:bg-indigo-50 font-bold text-xs"
                        >
                          Self-Dispatch &rarr;
                        </button>
                      </div>
                    )}

                    {/* Dispatched / Out / Delivered */}
                    {['Shipped', 'Out for Delivery', 'Delivered'].includes(ord.status) && (
                      <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5">
                        <Truck className="w-3.5 h-3.5" />
                        Handled by Delivery Network ({ord.status})
                      </span>
                    )}

                    {ord.status === 'Cancelled' && (
                      <span className="text-rose-700 bg-rose-50 px-3 py-1 rounded-xl text-xs font-semibold">
                        Order Terminated & Stock Restored
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
