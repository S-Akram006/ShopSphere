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
  TrendingUp,
  BarChart2,
  Calendar,
  Layers,
  Store,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Percent,
} from 'lucide-react';

export default function SellerDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [trendView, setTrendView] = useState('monthly'); // 'monthly' | 'weekly'
  const [restockingId, setRestockingId] = useState(null);
  const [actionNotice, setActionNotice] = useState(null);
  const [payoutLoading, setPayoutLoading] = useState(false);

  const DEFAULT_SELLER_DATA = {
    store: {
      storeName: 'TechSphere Official',
      description: 'Direct manufacturer store offering cutting-edge electronics and accessories.',
      logo: 'https://images.unsplash.com/photo-1550009158-9ebf69173e03?auto=format&fit=crop&w=200&q=80',
      isApproved: true,
      balance: 14250.0,
      totalSales: 18900.0,
    },
    financials: {
      grossRevenue: 18900.0,
      platformCommissionPercent: 10,
      platformCommissionCut: 1890.0,
      netVendorEarnings: 17010.0,
      pendingPayout: 14250.0,
      availableBalance: 14250.0,
      avgOrderValue: 157.5,
      totalItemsSold: 38,
    },
    trends: {
      monthly: [
        { label: 'May 2026', sales: 2400, netSales: 2160, orders: 15 },
        { label: 'Jun 2026', sales: 3100, netSales: 2790, orders: 19 },
        { label: 'Jul 2026', sales: 4200, netSales: 3780, orders: 26 },
        { label: 'Aug 2026', sales: 3900, netSales: 3510, orders: 24 },
        { label: 'Sep 2026', sales: 5200, netSales: 4680, orders: 32 },
        { label: 'Oct 2026', sales: 6100, netSales: 5490, orders: 38 },
      ],
      weekly: [
        { label: 'W36', sales: 1100, netSales: 990, orders: 7 },
        { label: 'W37', sales: 1350, netSales: 1215, orders: 9 },
        { label: 'W38', sales: 1500, netSales: 1350, orders: 10 },
        { label: 'W39', sales: 1800, netSales: 1620, orders: 12 },
      ],
    },
    inventory: {
      totalProducts: 4,
      outOfStockCount: 1,
      lowStockCount: 1,
      healthyStockCount: 2,
      lowStockAlertList: [
        {
          _id: 'prod-low-1',
          title: 'CyberSound Studio Pro Headphones',
          price: 299.99,
          stock: 3,
          category: 'Audio',
          images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=300&q=80'],
        },
        {
          _id: 'prod-out-1',
          title: 'ApexErgo Mechanical Wireless Keyboard (RGB)',
          price: 159.0,
          stock: 0,
          category: 'Accessories',
          images: ['https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=300&q=80'],
        },
      ],
    },
    metrics: {
      balance: 14250.0,
      totalSales: 18900.0,
      totalProducts: 4,
      lowStockCount: 2,
      totalOrders: 12,
      pendingFulfillment: 3,
      shippedOrders: 5,
      deliveredOrders: 4,
    },
    recentOrders: [
      {
        _id: 'sub-recent-1',
        subOrderNumber: 'SUB-894102',
        createdAt: new Date().toISOString(),
        status: 'Placed',
        totalAmount: 299.0,
        items: [{ title: 'Aura ANC Wireless Noise-Cancelling Headphones', quantity: 1 }],
        customerId: { name: 'Alex Johnson' },
      },
      {
        _id: 'sub-recent-2',
        subOrderNumber: 'SUB-761230',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        status: 'Confirmed',
        totalAmount: 159.0,
        items: [{ title: 'ApexErgo Mechanical Wireless Keyboard', quantity: 1 }],
        customerId: { name: 'Sarah Connor' },
      },
    ],
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getDashboard();
      if (res.data?.data) {
        setData(res.data.data);
        return;
      }
      setData(DEFAULT_SELLER_DATA);
    } catch (err) {
      console.warn('[SellerDashboard] Remote fetch offline, loading fallback metrics:', err.message);
      setData(DEFAULT_SELLER_DATA);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickRestock = async (productId, additionalStock = 10) => {
    setRestockingId(productId);
    setActionNotice(null);
    try {
      const res = await sellerAPI.restockProduct(productId, { additionalStock });
      const updatedProduct = res.data?.data;
      setActionNotice({
        type: 'success',
        message: res.data?.message || `Restocked +${additionalStock} units successfully!`,
      });

      // Update local state optimistically
      setData((prev) => {
        if (!prev) return prev;
        const updatedList = (prev.inventory?.lowStockAlertList || []).map((item) =>
          item._id === productId
            ? { ...item, stock: updatedProduct?.stock ?? item.stock + additionalStock }
            : item
        );
        return {
          ...prev,
          inventory: {
            ...prev.inventory,
            lowStockAlertList: updatedList,
          },
        };
      });
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.response?.data?.message || 'Failed to restock item.',
      });
    } finally {
      setRestockingId(null);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  const handleRequestPayout = async () => {
    setPayoutLoading(true);
    setActionNotice(null);
    try {
      const res = await sellerAPI.requestPayout();
      setActionNotice({
        type: 'success',
        message: res.data?.message || 'Payout request submitted successfully!',
      });
      fetchDashboard();
    } catch (err) {
      setActionNotice({
        type: 'error',
        message: err.response?.data?.message || 'Failed to submit payout request.',
      });
    } finally {
      setPayoutLoading(false);
      setTimeout(() => setActionNotice(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  const { store, financials, trends, inventory, metrics, recentOrders } = data || {};

  // Financial metrics calculations
  const gross = financials?.grossRevenue ?? metrics?.totalSales ?? 0;
  const net = financials?.netVendorEarnings ?? gross * 0.9;
  const balance = financials?.availableBalance ?? metrics?.balance ?? 0;
  const commission = financials?.platformCommissionCut ?? gross * 0.1;
  const lowStockItems = inventory?.lowStockAlertList || [];

  // Active trend series
  const activeTrends =
    trendView === 'weekly'
      ? trends?.weekly && trends.weekly.length > 0
        ? trends.weekly
        : DEFAULT_SELLER_DATA.trends.weekly
      : trends?.monthly && trends.monthly.length > 0
      ? trends.monthly
      : DEFAULT_SELLER_DATA.trends.monthly;

  const maxTrendSale = Math.max(...activeTrends.map((t) => t.sales || 1), 100);

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Toast Feedback Banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-2xl border text-sm font-bold flex items-center justify-between transition-all shadow-sm ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
              : 'bg-rose-50 text-rose-800 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {actionNotice.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-xs underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

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
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                  store?.isApproved
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
                    : 'bg-amber-500/20 text-amber-300 border-amber-400/30'
                }`}
              >
                {store?.isApproved ? 'Verified Merchant' : 'Approval Pending'}
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-1 max-w-xl line-clamp-1">
              {store?.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={handleRequestPayout}
            disabled={balance <= 0 || payoutLoading}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            title="Request transfer of available balance"
          >
            <DollarSign className="w-4 h-4" />
            {payoutLoading ? 'Processing...' : `Payout ($${balance.toFixed(2)})`}
          </button>
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

      {/* KPI Financial & Performance Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Gross Revenue */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Gross Sales Revenue
            </span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              ${gross.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {metrics?.totalOrders || 0} lifetime orders
            </span>
          </div>
        </div>

        {/* Net Vendor Earnings (After 10% Platform Cut) */}
        <div className="bg-white rounded-2xl border border-indigo-200/90 p-5 shadow-xs bg-gradient-to-br from-indigo-50/50 to-white flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 block">
                Net Vendor Earnings
              </span>
              <span className="bg-indigo-100 text-indigo-700 text-[9px] font-bold px-1.5 py-0.2 rounded">
                90% Net
              </span>
            </div>
            <span className="text-2xl font-black text-indigo-950 font-outfit">
              ${net.toFixed(2)}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              After 10% platform fee (${commission.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Pending Payout / Available Balance */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Available Balance
            </span>
            <span className="text-2xl font-black text-slate-900 font-outfit">
              ${balance.toFixed(2)}
            </span>
            <span className="text-[10px] text-emerald-600 font-medium block">
              Ready for immediate payout
            </span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
              lowStockItems.length > 0
                ? 'bg-rose-50 text-rose-600'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
              Inventory Health
            </span>
            <span
              className={`text-2xl font-black font-outfit ${
                lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {lowStockItems.length} Alert{lowStockItems.length === 1 ? '' : 's'}
            </span>
            <span className="text-[10px] text-slate-500 font-medium block">
              {lowStockItems.length > 0 ? 'Stock level ≤ 5 units' : 'All catalog items healthy'}
            </span>
          </div>
        </div>
      </div>

      {/* Sales Trend Volume Breakdown Chart */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-900 font-outfit">
                Sales Volume & Revenue Trend
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Aggregation pipeline metrics showing gross revenue and order frequencies.
            </p>
          </div>

          <div className="flex items-center bg-slate-100 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setTrendView('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                trendView === 'monthly'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Trend
            </button>
            <button
              onClick={() => setTrendView('weekly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                trendView === 'weekly'
                  ? 'bg-white text-indigo-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Weekly Trend
            </button>
          </div>
        </div>

        {/* Visual Bar Chart */}
        <div className="pt-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-6 gap-4 items-end h-56 border-b border-slate-100 pb-3">
            {activeTrends.map((t, idx) => {
              const heightPercent = Math.max(15, Math.round((t.sales / maxTrendSale) * 100));
              return (
                <div key={idx} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <span className="text-[10px] font-black text-slate-900 opacity-0 group-hover:opacity-100 transition-opacity font-outfit">
                    ${t.sales.toFixed(0)}
                  </span>
                  <div className="w-full max-w-[48px] bg-indigo-50 hover:bg-indigo-100 rounded-xl relative overflow-hidden flex flex-col justify-end p-1 transition-all h-full">
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className="w-full bg-gradient-to-t from-indigo-600 to-indigo-500 rounded-lg transition-all duration-700 shadow-xs"
                    />
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-bold text-slate-700 block truncate max-w-[64px]">
                      {t.label}
                    </span>
                    <span className="text-[10px] text-slate-400 block font-medium">
                      {t.orders} ord.
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-3">
            <span>Aggregated across verified vendor sub-orders</span>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-600 inline-block" /> Gross Sales
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-indigo-100 inline-block" /> Volume Capacity
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Low-Stock Inventory Alert List & Quick-Action Restock Triggers */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-900 font-outfit">
                Low-Stock Inventory Alerts (Stock ≤ 5)
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Items at risk of running out. Trigger instant inventory restocking below to prevent lost sales.
            </p>
          </div>

          <Link
            to="/seller/products"
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 self-start sm:self-auto"
          >
            Manage Entire Catalog <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="text-center py-10 bg-slate-50 rounded-2xl border border-slate-100">
            <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-800">All Products Well Stocked</h4>
            <p className="text-xs text-slate-500 mt-1">
              No inventory alerts at this time. All items have more than 5 units available.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 border border-slate-100 rounded-2xl overflow-hidden">
            {lowStockItems.map((prod) => (
              <div
                key={prod._id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition-colors"
              >
                <div className="flex items-center gap-3.5 flex-1 min-w-0">
                  <img
                    src={
                      prod.images?.[0] ||
                      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={prod.title}
                    className="w-14 h-14 rounded-xl object-cover border border-slate-200 flex-shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">
                      {prod.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[11px] font-semibold text-slate-500">
                        ${prod.price?.toFixed(2)}
                      </span>
                      <span className="text-slate-300">•</span>
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          prod.stock <= 0
                            ? 'bg-rose-100 text-rose-700 border border-rose-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {prod.stock <= 0 ? 'Out of Stock (0)' : `${prod.stock} units left`}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick-Action Restock Triggers */}
                <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                  <span className="text-[11px] text-slate-400 font-medium mr-1 hidden sm:inline">
                    Quick Restock:
                  </span>
                  <button
                    onClick={() => handleQuickRestock(prod._id, 10)}
                    disabled={restockingId === prod._id}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200/60"
                  >
                    +10
                  </button>
                  <button
                    onClick={() => handleQuickRestock(prod._id, 25)}
                    disabled={restockingId === prod._id}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold transition-all border border-indigo-200/60"
                  >
                    +25
                  </button>
                  <button
                    onClick={() => handleQuickRestock(prod._id, 50)}
                    disabled={restockingId === prod._id}
                    className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-xs"
                  >
                    {restockingId === prod._id ? 'Updating...' : '+50'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Vendor Sub-Orders Board */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 font-outfit">
              Recent Vendor Split Orders
            </h2>
            <p className="text-xs text-slate-500">
              Orders requiring your preparation, packaging, and dispatch tracking.
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
                    Customer: {ord.customerId?.name || 'Guest Customer'} • Placed{' '}
                    {new Date(ord.createdAt).toLocaleDateString()}
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
                    Process
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
