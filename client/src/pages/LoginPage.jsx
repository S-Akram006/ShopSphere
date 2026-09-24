import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  ShoppingBag,
  LogIn,
  AlertCircle,
  User,
  ShieldCheck,
  Store,
  Headphones,
  Truck,
  Sparkles,
} from 'lucide-react';

const DEMO_PERSONAS = [
  {
    role: 'Customer',
    email: 'customer@shopsphere.com',
    name: 'Alex Johnson',
    badge: 'Buyer / Orders / Disputes',
    icon: User,
    color: 'border-blue-200 bg-blue-50/50 hover:bg-blue-50 text-blue-700',
  },
  {
    role: 'Seller',
    email: 'seller@shopsphere.com',
    name: 'Marcus Vance',
    badge: 'TechSphere Store / Catalog',
    icon: Store,
    color: 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 text-emerald-700',
  },
  {
    role: 'Platform Admin',
    email: 'admin@shopsphere.com',
    name: 'Sarah Connor',
    badge: 'GMV Analytics & Moderation',
    icon: ShieldCheck,
    color: 'border-purple-200 bg-purple-50/50 hover:bg-purple-50 text-purple-700',
  },
  {
    role: 'Support Agent',
    email: 'support@shopsphere.com',
    name: 'Michael Scott',
    badge: 'Disputes & Refund Desk',
    icon: Headphones,
    color: 'border-amber-200 bg-amber-50/50 hover:bg-amber-50 text-amber-700',
  },
  {
    role: 'Delivery Partner',
    email: 'delivery@shopsphere.com',
    name: 'Jordan Sparks',
    badge: 'Shipment Tracking Feed',
    icon: Truck,
    color: 'border-cyan-200 bg-cyan-50/50 hover:bg-cyan-50 text-cyan-700',
  },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const cleanEmail = typeof email === 'string' ? email.trim().toLowerCase() : '';
      const user = await login(cleanEmail, password);
      redirectByRole(user.role);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleQuickDemoLogin = async (persona) => {
    setEmail(persona.email);
    setPassword('password123');
    setSubmitting(true);
    setErrorMsg(null);
    try {
      const user = await login(persona.email, 'password123');
      redirectByRole(user.role);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const redirectByRole = (role) => {
    if (role === 'Seller') navigate('/seller/dashboard');
    else if (role === 'Platform Admin') navigate('/admin/analytics');
    else if (role === 'Support Agent') navigate('/support/disputes');
    else if (role === 'Delivery Partner') navigate('/delivery/feed');
    else navigate('/');
  };

  return (
    <div className="max-w-md mx-auto my-10 space-y-8 pb-16">
      <div className="text-center space-y-2">
        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white mx-auto shadow-md shadow-indigo-200">
          <ShoppingBag className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-slate-900 font-outfit">
          Sign In to ShopSphere
        </h1>
        <p className="text-xs text-slate-500">
          Access your account with your registered email and password.
        </p>
      </div>

      {/* 1-Click Demo Accounts Quick-Picker */}
      <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>1-Click Demo Sign In</span>
          <span className="ml-auto text-[10px] text-slate-400 font-normal">Password: password123</span>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {DEMO_PERSONAS.map((p) => {
            const Icon = p.icon;
            return (
              <button
                key={p.role}
                type="button"
                disabled={submitting}
                onClick={() => handleQuickDemoLogin(p)}
                className={`w-full text-left p-2.5 rounded-xl border transition-all flex items-center justify-between group cursor-pointer ${p.color}`}
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-white/80 flex items-center justify-center shadow-xs">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="font-bold text-xs leading-none">{p.name}</div>
                    <div className="text-[10px] opacity-75 mt-0.5">{p.email}</div>
                  </div>
                </div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/80 border border-current shadow-2xs">
                  {p.role}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Manual Login Form */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4">
        {errorMsg && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="customer@shopsphere.com"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <LogIn className="w-4 h-4" />
            {submitting ? 'Authenticating...' : 'Sign In with Email'}
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          Don't have an account?{' '}
          <Link to="/register" className="text-indigo-600 font-bold hover:underline">
            Register Here
          </Link>
        </div>
      </div>
    </div>
  );
}
