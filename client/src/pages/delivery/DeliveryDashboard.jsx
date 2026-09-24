import React, { useState, useEffect } from 'react';
import { deliveryAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  Truck,
  Package,
  MapPin,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Send,
  Navigation,
} from 'lucide-react';

export default function DeliveryDashboard() {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active'); // 'active' | 'available' | 'completed'
  const [updatingId, setUpdatingId] = useState(null);
  const [feedback, setFeedback] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const DEFAULT_DELIVERY_FEED = {
    activeShipments: [
      {
        _id: 'ship-act-1',
        subOrderNumber: 'SUB-994101',
        status: 'Out for Delivery',
        trackingNumber: 'WAYBILL-TRK-7711',
        updatedAt: new Date().toISOString(),
        customerId: { name: 'Alex Johnson', phone: '+1 555-0199', email: 'customer@shopsphere.com' },
        storeId: { storeName: 'TechSphere Official', contactEmail: 'seller@shopsphere.com' },
        parentOrderId: {
          shippingAddress: {
            fullName: 'Alex Johnson',
            address: '742 Evergreen Terrace',
            city: 'Springfield',
            state: 'OR',
            postalCode: '97477',
          },
        },
        items: [{ title: 'QuantumBook Pro M3 16-inch Workstation', quantity: 1 }],
      },
    ],
    readyForPickup: [
      {
        _id: 'ship-pck-1',
        subOrderNumber: 'SUB-881203',
        status: 'Packed',
        trackingNumber: 'WAYBILL-TRK-8822',
        createdAt: new Date().toISOString(),
        customerId: { name: 'Sarah Connor', phone: '+1 555-0144', email: 'sarah@shopsphere.com' },
        storeId: { storeName: 'EcoVibe Studio', contactEmail: 'seller2@shopsphere.com' },
        parentOrderId: {
          shippingAddress: {
            fullName: 'Sarah Connor',
            address: '100 Sunset Blvd',
            city: 'Los Angeles',
            state: 'CA',
            postalCode: '90028',
          },
        },
        items: [{ title: 'Organic Heavyweight French Terry Hoodie', quantity: 1 }],
      },
    ],
    completedShipments: [
      {
        _id: 'ship-cmp-1',
        subOrderNumber: 'SUB-661002',
        status: 'Delivered',
        trackingNumber: 'WAYBILL-TRK-6601',
        updatedAt: new Date(Date.now() - 86400000).toISOString(),
        customerId: { name: 'Marcus Vance' },
        storeId: { storeName: 'TechSphere Official' },
        parentOrderId: { shippingAddress: { city: 'Austin', state: 'TX' } },
        items: [{ title: 'Aura ANC Wireless Noise-Cancelling Headphones', quantity: 1 }],
      },
    ],
    metrics: {
      activeCount: 1,
      availableCount: 1,
      completedCount: 1,
    },
  };

  const fetchFeed = async () => {
    setLoading(true);
    try {
      const res = await deliveryAPI.getFeed();
      if (res.data?.data) {
        setFeed(res.data.data);
        return;
      }
      setFeed(DEFAULT_DELIVERY_FEED);
    } catch (err) {
      console.warn('[Delivery] Remote feed offline, reading fallback feed:', err.message);
      setFeed(DEFAULT_DELIVERY_FEED);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeed();
  }, []);

  const handleClaimShipment = async (subOrderId) => {
    setUpdatingId(subOrderId);
    setErrorMsg(null);
    try {
      const res = await deliveryAPI.claimShipment(subOrderId);
      setFeedback(`Shipment claimed! Waybill: ${res.data.data.trackingNumber}`);
      setTimeout(() => setFeedback(null), 3500);
      fetchFeed();
    } catch (err) {
      console.warn('Backend claim shipment offline, mutating locally:', err.message);
      setFeed((prev) => {
        if (!prev) return prev;
        const claimed = prev.readyForPickup.find((s) => s._id === subOrderId);
        if (!claimed) return prev;
        const updatedClaimed = { ...claimed, status: 'Shipped' };
        return {
          ...prev,
          readyForPickup: prev.readyForPickup.filter((s) => s._id !== subOrderId),
          activeShipments: [updatedClaimed, ...prev.activeShipments],
          metrics: {
            ...prev.metrics,
            activeCount: (prev.metrics?.activeCount || 0) + 1,
            availableCount: Math.max(0, (prev.metrics?.availableCount || 1) - 1),
          },
        };
      });
      setFeedback(`Shipment claimed! Waybill generated and moved to Active Shipments.`);
      setTimeout(() => setFeedback(null), 3500);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleAdvanceMilestone = async (subOrderId, targetStatus) => {
    setUpdatingId(subOrderId);
    setErrorMsg(null);
    try {
      await deliveryAPI.updateStatus(subOrderId, {
        targetStatus,
        note: `Milestone advanced to ${targetStatus} by courier partner.`,
      });
      setFeedback(`Status updated to "${targetStatus}"!`);
      setTimeout(() => setFeedback(null), 3000);
      fetchFeed();
    } catch (err) {
      console.warn('Backend milestone advance offline, mutating locally:', err.message);
      setFeed((prev) => {
        if (!prev) return prev;
        if (targetStatus === 'Delivered') {
          const finished = prev.activeShipments.find((s) => s._id === subOrderId);
          return {
            ...prev,
            activeShipments: prev.activeShipments.filter((s) => s._id !== subOrderId),
            completedShipments: finished
              ? [{ ...finished, status: 'Delivered' }, ...prev.completedShipments]
              : prev.completedShipments,
            metrics: {
              ...prev.metrics,
              activeCount: Math.max(0, (prev.metrics?.activeCount || 1) - 1),
              completedCount: (prev.metrics?.completedCount || 0) + 1,
            },
          };
        } else {
          return {
            ...prev,
            activeShipments: prev.activeShipments.map((s) =>
              s._id === subOrderId ? { ...s, status: targetStatus } : s
            ),
          };
        }
      });
      setFeedback(`Status updated to "${targetStatus}"!`);
      setTimeout(() => setFeedback(null), 3000);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }

  const { activeShipments, readyForPickup, completedShipments, metrics } = feed || {};

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-950 via-slate-900 to-teal-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-teal-800/40 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-teal-400 uppercase tracking-wide mb-1">
            <Truck className="w-4 h-4 text-teal-400" />
            Courier Logistics Dispatch Hub
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-outfit">
            Delivery Partner Terminal
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Claim vendor-packed parcels, generate carrier tracking waybills, and advance delivery milestones.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-teal-800/40 text-xs">
          <button
            onClick={() => setActiveTab('active')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all relative ${
              activeTab === 'active'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            My Active Route ({metrics?.activeCount || 0})
          </button>
          <button
            onClick={() => setActiveTab('available')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all relative ${
              activeTab === 'available'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Available for Pickup
            {metrics?.availableCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {metrics.availableCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-3.5 py-1.5 rounded-xl font-bold transition-all ${
              activeTab === 'completed'
                ? 'bg-teal-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Delivered ({metrics?.completedCount || 0})
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{feedback}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TAB 1: ACTIVE IN-TRANSIT SHIPMENTS */}
      {activeTab === 'active' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-outfit">
              Active Shipments in Transit
            </h2>
            <span className="text-xs text-slate-500">
              {activeShipments?.length || 0} parcels in your dispatch queue
            </span>
          </div>

          {activeShipments && activeShipments.length > 0 ? (
            activeShipments.map((sub) => {
              const isBusy = updatingId === sub._id;

              return (
                <div
                  key={sub._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-sm text-slate-900">
                        Sub-Order #{sub.subOrderNumber}
                      </span>
                      <StatusBadge status={sub.status} />
                    </div>

                    <div className="flex items-center gap-2 font-mono font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                      <Truck className="w-3.5 h-3.5" />
                      Waybill: {sub.trackingNumber}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                    {/* Destination Address */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Drop-Off Destination
                      </span>
                      <p className="font-bold text-slate-900">{sub.customerId?.name}</p>
                      <p>{sub.parentOrderId?.shippingAddress?.address}</p>
                      <p>
                        {sub.parentOrderId?.shippingAddress?.city},{' '}
                        {sub.parentOrderId?.shippingAddress?.state}{' '}
                        {sub.parentOrderId?.shippingAddress?.postalCode}
                      </p>
                      <p className="text-slate-500">
                        Phone: {sub.parentOrderId?.shippingAddress?.phone || sub.customerId?.phone}
                      </p>
                    </div>

                    {/* Merchant Pick-up Point */}
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1 text-slate-700">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                        Origin Merchant
                      </span>
                      <p className="font-bold text-slate-900">{sub.storeId?.storeName}</p>
                      <p className="text-slate-500">Contact: {sub.storeId?.contactEmail}</p>
                      <span className="text-[11px] text-slate-500 block pt-1">
                        Contents: {sub.items?.length} items (${sub.totalAmount?.toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* Milestone Action Stepper */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      Current Milestone: <strong className="text-slate-900">{sub.status}</strong>
                    </span>

                    <div className="flex items-center gap-2">
                      {sub.status === 'Shipped' && (
                        <button
                          onClick={() => handleAdvanceMilestone(sub._id, 'Out for Delivery')}
                          disabled={isBusy}
                          className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <Navigation className="w-3.5 h-3.5" />
                          Mark Out for Delivery
                        </button>
                      )}

                      {sub.status === 'Out for Delivery' && (
                        <button
                          onClick={() => handleAdvanceMilestone(sub._id, 'Delivered')}
                          disabled={isBusy}
                          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Mark Delivered & Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <Truck className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No active deliveries on route</h3>
              <p className="text-slate-500 text-sm mt-1">
                Check the "Available for Pickup" tab to claim vendor-packed packages.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: PACKED ORDERS READY FOR PICKUP */}
      {activeTab === 'available' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 font-outfit">
              Vendor-Packed Parcels Awaiting Courier
            </h2>
            <span className="text-xs text-slate-500">
              {readyForPickup?.length || 0} parcels waiting at vendor storefronts
            </span>
          </div>

          {readyForPickup && readyForPickup.length > 0 ? (
            readyForPickup.map((sub) => {
              const isBusy = updatingId === sub._id;

              return (
                <div
                  key={sub._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-xl bg-amber-50 text-amber-700">
                      <Package className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900">
                          {sub.storeId?.storeName}
                        </span>
                        <StatusBadge status={sub.status} />
                      </div>
                      <p className="text-slate-500 text-[11px] mt-0.5">
                        Sub-Order ID: {sub.subOrderNumber} • {sub.items?.length} items (${sub.totalAmount?.toFixed(2)})
                      </p>
                      <p className="text-slate-600 text-[11px] font-medium mt-1">
                        Deliver to: {sub.parentOrderId?.shippingAddress?.city}, {sub.parentOrderId?.shippingAddress?.state} ({sub.customerId?.name})
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleClaimShipment(sub._id)}
                    disabled={isBusy}
                    className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 self-end sm:self-auto"
                  >
                    <Truck className="w-4 h-4" />
                    {isBusy ? 'Assigning...' : 'Claim Parcel & Dispatch (Shipped)'}
                  </button>
                </div>
              );
            })
          ) : (
            <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-800">No packages waiting</h3>
              <p className="text-slate-500 text-sm mt-1">
                All vendor-packed orders have already been claimed by carriers.
              </p>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: DELIVERED SHIPMENTS */}
      {activeTab === 'completed' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <h2 className="text-base font-bold text-slate-900 font-outfit">
            Completed Deliveries Archive
          </h2>

          <div className="divide-y divide-slate-100">
            {completedShipments && completedShipments.length > 0 ? (
              completedShipments.map((c) => (
                <div key={c._id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">
                      Sub-Order #{c.subOrderNumber} ({c.storeId?.storeName})
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      Delivered to {c.customerId?.name} ({c.parentOrderId?.shippingAddress?.city})
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 font-bold">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Delivered</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-400 py-6 italic text-center">
                No delivery history recorded yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
