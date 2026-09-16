import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  TrendingUp,
  DollarSign,
  Store,
  Package,
  ShieldCheck,
  ShieldAlert,
  Check,
  X,
  Clock,
  AlertCircle,
  Users,
  Eye,
} from 'lucide-react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchAllAdminData = async () => {
    setLoading(true);
    try {
      const [statsRes, storesRes, productsRes, disputesRes] = await Promise.all([
        adminAPI.getAnalytics(),
        adminAPI.getStores(),
        adminAPI.getProducts(),
        adminAPI.getDisputes(),
      ]);
      setStats(statsRes.data.data);
      setStores(storesRes.data.data);
      setProducts(productsRes.data.data);
      setDisputes(disputesRes.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllAdminData();
  }, []);

  const handleToggleStoreApproval = async (storeId, newStatus) => {
    try {
      await adminAPI.toggleStoreApproval(storeId, { isApproved: newStatus });
      setActionMsg(`Store approval status updated.`);
      setTimeout(() => setActionMsg(null), 3000);
      fetchAllAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleModerateProduct = async (productId, isApproved, isActive) => {
    try {
      await adminAPI.moderateProduct(productId, { isApproved, isActive });
      setActionMsg(`Product listing status updated.`);
      setTimeout(() => setActionMsg(null), 3000);
      fetchAllAdminData();
    } catch (err) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-purple-900/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wide mb-1">
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            Global Platform Governance & Analytics
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-outfit">
            Enterprise Admin Control Center
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Monitor GMV velocity, moderate storefronts, inspect disputes, and ensure catalog integrity.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-purple-800/40 text-xs overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'overview'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Overview & GMV
          </button>
          <button
            onClick={() => setActiveTab('stores')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all relative ${
              activeTab === 'stores'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Store Approvals
            {stats?.pendingStoresCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {stats.pendingStoresCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all ${
              activeTab === 'products'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Listing Moderation
          </button>
          <button
            onClick={() => setActiveTab('disputes')}
            className={`px-3.5 py-2 rounded-xl font-bold transition-all relative ${
              activeTab === 'disputes'
                ? 'bg-purple-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Disputes
            {stats?.activeDisputesCount > 0 && (
              <span className="ml-1.5 bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {stats.activeDisputesCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {actionMsg && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 text-xs font-semibold flex items-center gap-2">
          <Check className="w-4 h-4" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* TAB 1: OVERVIEW & GMV */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          {/* GMV KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Platform GMV
                </span>
                <span className="text-2xl font-black text-slate-900 font-outfit">
                  ${stats?.platformGMV?.toFixed(2) || '0.00'}
                </span>
                <span className="text-[10px] text-purple-600 font-medium block">
                  Total settled merchandise volume
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Marketplace Take (8%)
                </span>
                <span className="text-2xl font-black text-slate-900 font-outfit">
                  ${stats?.platformCommission?.toFixed(2) || '0.00'}
                </span>
                <span className="text-[10px] text-emerald-600 font-medium block">
                  Commission earned
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Merchant Stores
                </span>
                <span className="text-2xl font-black text-slate-900 font-outfit">
                  {stats?.totalStores || 0}
                </span>
                <span className="text-[10px] text-slate-500 font-medium block">
                  {stats?.pendingStoresCount} awaiting review
                </span>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active Disputes
                </span>
                <span className="text-2xl font-black text-slate-900 font-outfit">
                  {stats?.activeDisputesCount || 0}
                </span>
                <span className="text-[10px] text-amber-600 font-medium block">
                  Handled by Support Team
                </span>
              </div>
            </div>
          </div>

          {/* SubOrder Status Breakdown */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider font-outfit">
              Sub-Order Lifecycle Distribution
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
              {stats?.statusCounts?.map((st) => (
                <div key={st._id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <span className="text-[11px] font-bold text-slate-600 block">{st._id}</span>
                  <span className="text-xl font-black text-slate-900 font-outfit mt-1 block">
                    {st.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: STORE APPROVALS */}
      {activeTab === 'stores' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Vendor Store Approvals & Oversight
            </h3>
            <span className="text-xs text-slate-500">
              {stores.length} Total Merchant Stores
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {stores.map((s) => (
              <div
                key={s._id}
                className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={s.logo || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=150&q=80'}
                    alt={s.storeName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{s.storeName}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        s.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {s.isApproved ? 'Approved' : 'Pending Review'}
                      </span>
                    </div>
                    <p className="text-slate-500 text-[11px] max-w-md line-clamp-1 mt-0.5">
                      {s.description}
                    </p>
                    <span className="text-slate-400 text-[10px] block mt-1">
                      Owner: {s.sellerId?.name} ({s.sellerId?.email}) • Balance: ${s.balance?.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  {s.isApproved ? (
                    <button
                      onClick={() => handleToggleStoreApproval(s._id, false)}
                      className="px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs"
                    >
                      Suspend Store
                    </button>
                  ) : (
                    <button
                      onClick={() => handleToggleStoreApproval(s._id, true)}
                      className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                    >
                      Approve Merchant
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: LISTING MODERATION */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Product Listing Moderation
            </h3>
            <span className="text-xs text-slate-500">
              {products.length} Active Platform Listings
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {products.map((p) => (
              <div
                key={p._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-center gap-3">
                  <img
                    src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                    alt={p.title}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div>
                    <span className="font-bold text-slate-900 block max-w-sm truncate">
                      {p.title}
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Store: {p.storeId?.storeName || 'Vendor'} • Category: {p.category} • Price: ${p.price}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                  <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                    p.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                  }`}>
                    {p.isApproved ? 'Active on Marketplace' : 'Hidden / Moderated'}
                  </span>
                  <button
                    onClick={() => handleModerateProduct(p._id, !p.isApproved, p.isActive)}
                    className="px-3 py-1 rounded-xl border border-slate-200 hover:bg-slate-50 font-semibold text-slate-700 text-xs"
                  >
                    {p.isApproved ? 'Moderate / Hide' : 'Approve Listing'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DISPUTES OVERSIGHT */}
      {activeTab === 'disputes' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 font-outfit">
              Platform Dispute Oversight
            </h3>
            <span className="text-xs text-slate-500">
              {disputes.length} Disputes on Record
            </span>
          </div>

          <div className="divide-y divide-slate-100">
            {disputes.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 italic text-center">
                No disputes on record across the platform.
              </p>
            ) : (
              disputes.map((d) => (
                <div key={d._id} className="py-4 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">
                      Sub-Order #{d.subOrderNumber} ({d.storeId?.storeName})
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      d.dispute?.status === 'Open'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : d.dispute?.status === 'Refunded'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}>
                      {d.dispute?.status}
                    </span>
                  </div>
                  <p className="text-slate-600">
                    <strong>Reason:</strong> {d.dispute?.reason} — "{d.dispute?.customerNote}"
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Customer: {d.customerId?.name} • Refund Claim: ${d.dispute?.refundAmount?.toFixed(2)}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
