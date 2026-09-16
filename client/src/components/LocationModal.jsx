import React, { useState } from 'react';
import { useLocation } from '../context/LocationContext';
import { MapPin, X, Check, Navigation, Sparkles } from 'lucide-react';

export default function LocationModal() {
  const { customerLocation, updateLocation, isModalOpen, setIsModalOpen, popularLocations } = useLocation();

  const [customCity, setCustomCity] = useState(customerLocation?.city || '');
  const [customState, setCustomState] = useState(customerLocation?.state || '');
  const [customZip, setCustomZip] = useState(customerLocation?.zip || '');

  if (!isModalOpen) return null;

  const handleSelectPopular = (loc) => {
    updateLocation(loc);
  };

  const handleSaveCustom = (e) => {
    e.preventDefault();
    if (!customCity.trim() || !customState.trim()) return;

    // Detect general US zone from state
    const st = customState.trim().toUpperCase();
    let zone = 'Nationwide';
    if (['NY', 'NJ', 'PA', 'MA', 'FL', 'NC', 'SC', 'GA', 'VA', 'MD', 'DE', 'CT', 'RI', 'NH', 'VT', 'ME'].includes(st)) {
      zone = 'East Coast';
    } else if (['CA', 'WA', 'OR', 'NV', 'AZ', 'ID'].includes(st)) {
      zone = 'West Coast';
    } else if (['IL', 'OH', 'MI', 'IN', 'WI', 'MN', 'IA', 'MO', 'ND', 'SD', 'NE', 'KS'].includes(st)) {
      zone = 'Midwest';
    } else if (['TX', 'OK', 'AR', 'LA', 'TN', 'MS', 'AL'].includes(st)) {
      zone = 'South';
    }

    const cityCapitalized = customCity.trim().charAt(0).toUpperCase() + customCity.trim().slice(1);
    updateLocation({
      city: cityCapitalized,
      state: st,
      zip: customZip.trim() || '00000',
      zone,
      label: `${cityCapitalized}, ${st}${customZip.trim() ? ` (${customZip.trim()})` : ''}`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600/60 border border-indigo-400/40 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-indigo-300" />
            </div>
            <div>
              <h3 className="text-sm font-bold font-outfit">Choose Delivery Destination</h3>
              <p className="text-[11px] text-indigo-200/80">Tailors product availability and delivery ETAs</p>
            </div>
          </div>
          <button
            onClick={() => setIsModalOpen(false)}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-5 text-xs">
          {/* Active Location Banner */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/80 border border-indigo-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Current Destination</span>
                <p className="font-bold text-slate-900 text-sm">{customerLocation?.label || `${customerLocation?.city}, ${customerLocation?.state}`}</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-indigo-200 text-indigo-700">
              {customerLocation?.zone || 'Active'}
            </span>
          </div>

          {/* Quick Select Popular Metro Areas */}
          <div>
            <label className="block font-bold text-slate-700 mb-2">Quick Select Popular Metros:</label>
            <div className="grid grid-cols-2 gap-2">
              {popularLocations.map((loc) => {
                const isSelected = customerLocation?.city === loc.city && customerLocation?.state === loc.state;
                return (
                  <button
                    key={loc.label}
                    onClick={() => handleSelectPopular(loc)}
                    className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/60 font-bold text-indigo-900 shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <div>
                      <span className="block font-semibold text-xs">{loc.city}, {loc.state}</span>
                      <span className="text-[10px] text-slate-400 font-normal">{loc.zone}</span>
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom Address Input */}
          <form onSubmit={handleSaveCustom} className="pt-3 border-t border-slate-100 space-y-3">
            <label className="block font-bold text-slate-700">Or Enter Custom City & Zip:</label>
            <div className="grid grid-cols-3 gap-2">
              <div className="col-span-2">
                <input
                  type="text"
                  required
                  placeholder="City (e.g. Denver)"
                  value={customCity}
                  onChange={(e) => setCustomCity(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
                />
              </div>
              <div>
                <input
                  type="text"
                  required
                  maxLength={2}
                  placeholder="State (CO)"
                  value={customState}
                  onChange={(e) => setCustomState(e.target.value.toUpperCase())}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium text-center uppercase"
                />
              </div>
            </div>
            <div>
              <input
                type="text"
                placeholder="ZIP Code (Optional, e.g. 80201)"
                value={customZip}
                onChange={(e) => setCustomZip(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-medium"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold transition-all shadow-sm shadow-indigo-200"
            >
              Apply Location
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
