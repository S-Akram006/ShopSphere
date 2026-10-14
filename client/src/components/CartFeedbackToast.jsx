import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { CheckCircle2, AlertTriangle, X, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartFeedbackToast() {
  const { toast, hideToast, openDrawer } = useCart();

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      hideToast();
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast, hideToast]);

  if (!toast) return null;

  const isWarning = toast.type === 'warning';
  const isError = toast.type === 'error';

  return (
    <div
      id="cart-feedback-toast"
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-white/95 backdrop-blur-md border border-slate-200/90 rounded-2xl shadow-2xl p-4 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
    >
      <div className="flex items-start gap-3">
        {/* Status Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {isError ? (
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : isWarning ? (
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-xs">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <h4 className="text-xs font-bold text-slate-900 leading-tight">
              {toast.title || 'Cart Updated'}
            </h4>
            <button
              onClick={hideToast}
              className="text-slate-400 hover:text-slate-600 p-1 -mr-1 rounded-lg"
              aria-label="Close notification"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">
            {toast.message}
          </p>

          {/* Product Snapshot if provided */}
          {toast.product && (
            <div className="mt-2.5 flex items-center gap-2.5 p-2 bg-slate-50/90 rounded-xl border border-slate-100">
              {toast.product.image && (
                <img
                  src={toast.product.image}
                  alt={toast.product.title}
                  className="w-10 h-10 object-cover rounded-lg border border-slate-200 flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold text-slate-900 truncate">
                  {toast.product.title}
                </p>
                <p className="text-[11px] text-indigo-600 font-bold">
                  ${toast.product.price}
                </p>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-3 flex items-center gap-2">
            <Link
              to="/cart"
              onClick={hideToast}
              className="flex-1 py-1.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs text-center transition-all shadow-xs flex items-center justify-center gap-1"
            >
              <ShoppingBag className="w-3.5 h-3.5" /> View Cart
            </Link>
            <Link
              to="/checkout"
              onClick={hideToast}
              className="flex-1 py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs text-center transition-all flex items-center justify-center gap-1"
            >
              Checkout <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
