import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert } from 'lucide-react';

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const { user, role, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return (
      <div className="max-w-2xl mx-auto my-16 p-8 bg-white rounded-2xl border border-rose-200 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
          <ShieldAlert className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Access Denied (403 Forbidden)</h2>
        <p className="text-slate-600 mb-6 text-sm">
          Your current persona has the role <span className="font-semibold text-rose-600">[{role}]</span>, but this section requires one of: <span className="font-semibold text-slate-900">[{allowedRoles.join(', ')}]</span>.
        </p>
        <p className="text-xs text-slate-500 mb-6">
          Tip: You can use the top <strong className="text-indigo-600">Role Switcher Bar</strong> to switch into the permitted role with 1 click.
        </p>
      </div>
    );
  }

  return children;
}
