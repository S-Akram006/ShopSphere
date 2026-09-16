import React from 'react';

const STATUS_CONFIG = {
  Placed: {
    label: 'Order Placed',
    bg: 'bg-amber-50 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  Confirmed: {
    label: 'Seller Confirmed',
    bg: 'bg-blue-50 text-blue-700 border-blue-200',
    dot: 'bg-blue-500',
  },
  Packed: {
    label: 'Packed & Barcoded',
    bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
  Shipped: {
    label: 'In Transit',
    bg: 'bg-purple-50 text-purple-700 border-purple-200',
    dot: 'bg-purple-500',
  },
  'Out for Delivery': {
    label: 'Out for Delivery',
    bg: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    dot: 'bg-cyan-500',
  },
  Delivered: {
    label: 'Delivered',
    bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  Cancelled: {
    label: 'Cancelled',
    bg: 'bg-rose-50 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  Returned: {
    label: 'Returned',
    bg: 'bg-slate-100 text-slate-700 border-slate-300',
    dot: 'bg-slate-500',
  },
  Refunded: {
    label: 'Refunded',
    bg: 'bg-orange-50 text-orange-700 border-orange-200',
    dot: 'bg-orange-500',
  },
};

export default function StatusBadge({ status, className = '' }) {
  const config = STATUS_CONFIG[status] || {
    label: status,
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-400',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${config.bg} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      {config.label}
    </span>
  );
}
