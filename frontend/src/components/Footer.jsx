import React from 'react';
import { ShoppingBag, ShieldCheck, Zap, Heart, GitBranch } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight font-outfit">
                Shop<span className="text-indigo-400">Sphere</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Production-grade enterprise multi-vendor e-commerce platform built with MERN stack, state machine sub-order fulfillment, and atomic inventory checkout.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Role Architecture
            </h4>
            <ul className="space-y-2 text-xs">
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Customer Experience
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Multi-Vendor Stores & Variants
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400" /> Platform Admin & GMV Oversight
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" /> Dispute & Support Center
              </li>
              <li className="flex items-center gap-1.5 text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400" /> Delivery Dispatch Milestones
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              Core Technical Highlights
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• Atomic Stock Check & Decrement</li>
              <li>• Automated Rollback on Race Condition</li>
              <li>• Parent-to-Vendor Split SubOrders</li>
              <li>• State Machine Lifecycle Guards</li>
              <li>• AI Marketing Copy Generator</li>
              <li>• Semantic Intent Search Engine</li>
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200 mb-3">
              System Health
            </h4>
            <div className="p-3 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs space-y-2">
              <div className="flex items-center justify-between text-slate-300">
                <span>API Gateway:</span>
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Online (:5000)
                </span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>Database:</span>
                <span className="text-emerald-400 font-semibold">MongoDB Active</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span>RBAC Enforcement:</span>
                <span className="text-indigo-400 font-semibold">5 Strict Roles</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© 2026 ShopSphere Enterprise Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span>React 18</span>
            <span>•</span>
            <span>Vite</span>
            <span>•</span>
            <span>Tailwind CSS</span>
            <span>•</span>
            <span>Express.js</span>
            <span>•</span>
            <span>MongoDB</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
