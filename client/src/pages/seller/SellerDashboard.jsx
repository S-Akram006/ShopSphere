import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { sellerAPI } from '../../services/api';
import StatusBadge from '../../components/StatusBadge';
import {
  DollarSign,
  Package,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  PlusCircle,
  Clock,
  CheckCircle,
  Truck,
  Layers,
  Store,
} from 'lucide-react';

export default function SellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getDashboard();
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { store, metrics, recentOrders } = data || {};

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Header & Store Profile Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-xl border border-indigo-900/50">
        <div className="flex items-center gap-4">
          <img
            src={store?.logo || 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80'}
            alt={store?.storeName}
            className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-400/40 shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-outfit">
                {store?.storeName}
              </h1>
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                store?.isApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                  : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
              }`}>
                {store?.isApproved ? 'Verified Merchant' : 'Approval Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl line-clamp-1">
              {store?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to="/seller/products"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
          >
            <PlusCircle className="w-4 h-4" /> Manage Catalog
          </Link>
          <Link
            to="/seller/orders"
            className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20"
          >
            <Truck className="w-4 h-4" /> Fulfillment Board
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Store Balance
            </span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              ${metrics?.balance?.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block">
              Available for withdrawal
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <ShoppingBag className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Gross Sales
            </span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              ${metrics?.totalSales?.toFixed(2) || '0.00'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {metrics?.totalOrders || 0} lifetime orders
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Awaiting Fulfillment
            </span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              {metrics?.pendingFulfillment || 0}
            </span>
            <span className="text-[10px] text-amber-600 font-medium block">
              Requires confirmation/packing
            </span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Catalog Items
            </span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              {metrics?.totalProducts || 0}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {metrics?.lowStockCount > 0 ? (
                <strong className="text-rose-600">{metrics.lowStockCount} low stock</strong>
              ) : (
                'Healthy stock'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Vendor Sub-Orders Board */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-outfit">
              Recent Vendor Split Orders
            </h2>
            <p className="text-xs text-slate-500">
              Orders requiring your preparation and packaging dispatch.
            </p>
          </div>

          <Link
            to="/seller/orders"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
          >
            Fulfillment Board <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {recentOrders && recentOrders.length > 0 ? (
            recentOrders.map((ord) => (
              <div
                key={ord._id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">
                      Sub-Order #{ord.subOrderNumber}
                    </span>
                    <StatusBadge status={ord.status} />
                  </div>
                  <span className="text-slate-400 block text-[11px]">
                    Customer: {ord.customerId?.name} • Placed {new Date(ord.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center gap-4 self-end sm:self-auto">
                  <span className="font-bold text-slate-900 font-outfit text-sm">
                    ${ord.totalAmount?.toFixed(2)}
                  </span>
                  <Link
                    to="/seller/orders"
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition-colors"
                  >
                    Action
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 py-4 italic">No incoming orders yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
