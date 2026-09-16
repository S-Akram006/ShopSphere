import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import OrderTimeline from '../components/OrderTimeline';
import StatusBadge from '../components/StatusBadge';
import {
  Truck,
  Store,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  ShieldAlert,
  ArrowLeft,
  Send,
} from 'lucide-react';

export default function OrderTrackingPage() {
  const { subOrderId } = useParams();
  const [subOrder, setSubOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Dispute form state
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState('Damaged Goods');
  const [customerNote, setCustomerNote] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [disputeMessage, setDisputeMessage] = useState(null);

  const fetchSubOrder = async () => {
    setLoading(true);
    try {
      const res = await ordersAPI.getSubOrderById(subOrderId);
      setSubOrder(res.data.data);
      setRefundAmount(res.data.data.totalAmount);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubOrder();
  }, [subOrderId]);

  const handleRaiseDispute = async (e) => {
    e.preventDefault();
    setSubmittingDispute(true);
    try {
      await ordersAPI.raiseDispute(subOrderId, {
        reason: disputeReason,
        customerNote,
        refundAmount: Number(refundAmount),
      });
      setShowDisputeModal(false);
      setDisputeMessage('Dispute submitted successfully! Our support team will review your case.');
      fetchSubOrder();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit dispute');
    } finally {
      setSubmittingDispute(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!subOrder) {
    return (
      <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
        <h2 className="text-lg font-bold text-slate-800">Sub-order not found</h2>
        <Link to="/orders/my" className="mt-4 inline-block text-indigo-600 font-semibold">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-16">
      {/* Back link */}
      <Link
        to="/orders/my"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-indigo-600 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Orders
      </Link>

      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Vendor Fulfillment Tracker
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 font-outfit mt-0.5">
              Sub-Order #{subOrder.subOrderNumber}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Store: <strong className="text-slate-800">{subOrder.storeId?.storeName}</strong>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <StatusBadge status={subOrder.status} className="text-sm px-3.5 py-1.5" />
          </div>
        </div>

        {/* Tracking Number Callout */}
        {subOrder.trackingNumber && (
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span className="text-slate-600">Carrier Waybill:</span>
              <strong className="text-slate-900 font-mono font-bold">
                {subOrder.trackingNumber}
              </strong>
            </div>
            {subOrder.deliveryPartnerId && (
              <span className="text-slate-500 text-[11px]">
                Assigned Courier: <strong>{subOrder.deliveryPartnerId.name}</strong>
              </span>
            )}
          </div>
        )}

        {/* Interactive Progress Timeline */}
        <div className="pt-2">
          <OrderTimeline
            currentStatus={subOrder.status}
            statusHistory={subOrder.statusHistory}
          />
        </div>
      </div>

      {/* Dispute Notice or Button */}
      {subOrder.dispute && subOrder.dispute.isDisputed ? (
        <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 space-y-3">
          <div className="flex items-center gap-2 font-bold text-amber-800 text-sm">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
            <span>Active Dispute Case ({subOrder.dispute.status})</span>
          </div>
          <p className="text-xs text-amber-900">
            <strong>Reason:</strong> {subOrder.dispute.reason}
          </p>
          <p className="text-xs text-amber-800">
            <strong>Customer Claim:</strong> {subOrder.dispute.customerNote}
          </p>
          {subOrder.dispute.resolutionNotes && (
            <div className="pt-2 border-t border-amber-200/60 text-xs text-amber-900 font-medium">
              <strong>Support Resolution:</strong> {subOrder.dispute.resolutionNotes}
            </div>
          )}
        </div>
      ) : (
        <div className="flex justify-end">
          <button
            onClick={() => setShowDisputeModal(true)}
            className="text-xs text-amber-700 hover:text-amber-800 font-semibold border border-amber-200 bg-amber-50/50 hover:bg-amber-100 px-4 py-2 rounded-xl transition-all flex items-center gap-1.5"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            Issue with this delivery? File a Dispute
          </button>
        </div>
      )}

      {/* Items in this suborder */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
          Package Contents
        </h3>

        <div className="divide-y divide-slate-100">
          {subOrder.items?.map((it, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <img
                  src={it.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                  alt={it.title}
                  className="w-12 h-12 rounded-lg object-cover border border-slate-100"
                />
                <div>
                  <span className="font-bold text-slate-900 block">{it.title}</span>
                  {it.variantSku && (
                    <span className="text-[10px] text-indigo-600 bg-indigo-50 px-1.5 rounded">
                      Variant: {it.variantSku}
                    </span>
                  )}
                  <span className="text-slate-400 block text-[11px]">Qty: {it.quantity}</span>
                </div>
              </div>
              <span className="font-bold text-slate-900 font-outfit">
                ${(it.price * it.quantity).toFixed(2)}
              </span>
            </div>
          ))}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-900">
          <span>Sub-Order Total (incl. shipping)</span>
          <span className="text-indigo-600 text-sm font-outfit">${subOrder.totalAmount?.toFixed(2)}</span>
        </div>
      </div>

      {/* Raise Dispute Modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 font-outfit">
                File a Dispute with Support
              </h3>
              <button
                onClick={() => setShowDisputeModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleRaiseDispute} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Dispute Reason
                </label>
                <select
                  value={disputeReason}
                  onChange={(e) => setDisputeReason(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="Damaged Goods">Damaged Goods</option>
                  <option value="Item Not Received">Item Not Received</option>
                  <option value="Wrong Item Sent">Wrong Item Sent</option>
                  <option value="Defective Product">Defective Product</option>
                  <option value="Other">Other Query</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Describe the Issue
                </label>
                <textarea
                  rows={3}
                  required
                  value={customerNote}
                  onChange={(e) => setCustomerNote(e.target.value)}
                  placeholder="Detail the package condition, missing items, or defects..."
                  className="w-full p-3 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Requested Refund Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  max={subOrder.totalAmount}
                  value={refundAmount}
                  onChange={(e) => setRefundAmount(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowDisputeModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDispute}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  {submittingDispute ? 'Submitting...' : 'Submit Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
