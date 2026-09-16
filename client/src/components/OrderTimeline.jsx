import React from 'react';
import { CheckCircle2, Clock, PackageCheck, Truck, MapPin, CheckCircle, AlertTriangle } from 'lucide-react';

const STEPS = [
  { key: 'Placed', label: 'Placed', icon: Clock },
  { key: 'Confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'Packed', label: 'Packed', icon: PackageCheck },
  { key: 'Shipped', label: 'Shipped', icon: Truck },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: MapPin },
  { key: 'Delivered', label: 'Delivered', icon: CheckCircle },
];

export default function OrderTimeline({ currentStatus, statusHistory = [] }) {
  const isCancelled = currentStatus === 'Cancelled';
  const isRefunded = currentStatus === 'Refunded';

  if (isCancelled || isRefunded) {
    return (
      <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-700">
        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
        <div>
          <span className="font-semibold block">Order status: {currentStatus}</span>
          <span className="text-xs text-rose-600">
            {isCancelled
              ? 'This sub-order was cancelled and inventory was returned to stock.'
              : 'This sub-order was refunded following dispute resolution.'}
          </span>
        </div>
      </div>
    );
  }

  const currentIndex = STEPS.findIndex((s) => s.key === currentStatus);

  return (
    <div className="w-full py-4">
      <div className="relative flex items-center justify-between">
        {/* Progress Bar Background */}
        <div className="absolute top-1/2 left-0 w-full -translate-y-1/2 h-1 bg-slate-200 z-0" />
        {/* Active Progress Bar */}
        <div
          className="absolute top-1/2 left-0 -translate-y-1/2 h-1 bg-indigo-600 transition-all duration-500 z-0"
          style={{
            width: `${Math.max(0, (currentIndex / (STEPS.length - 1)) * 100)}%`,
          }}
        />

        {STEPS.map((step, idx) => {
          const isPassed = idx <= currentIndex;
          const isCurrent = idx === currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="relative z-10 flex flex-col items-center group">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all shadow-sm ${
                  isCurrent
                    ? 'bg-indigo-600 text-white ring-4 ring-indigo-100 scale-110 font-bold'
                    : isPassed
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-slate-400 border-2 border-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={`mt-2 text-xs font-medium text-center whitespace-nowrap ${
                  isCurrent
                    ? 'text-indigo-600 font-bold'
                    : isPassed
                    ? 'text-slate-800'
                    : 'text-slate-400'
                }`}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* History Log */}
      {statusHistory && statusHistory.length > 0 && (
        <div className="mt-6 border-t border-slate-100 pt-3">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">
            Activity Log
          </span>
          <div className="space-y-1.5">
            {statusHistory.slice(-3).reverse().map((h, i) => (
              <div key={i} className="text-xs text-slate-600 flex items-center justify-between">
                <span>• {h.note || `Status marked as ${h.status}`}</span>
                <span className="text-slate-400">
                  {new Date(h.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
