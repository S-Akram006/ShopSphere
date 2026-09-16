import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productsAPI, aiAPI } from '../services/api';
import { useCart } from '../context/CartContext';
import { useLocation } from '../context/LocationContext';
import {
  Search,
  Sparkles,
  Star,
  Tag,
  Filter,
  ArrowUpDown,
  ShoppingBag,
  Check,
  ShieldCheck,
  Zap,
  Layers,
  ArrowRight,
  MapPin,
  Truck,
} from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categories, setCategories] = useState([]);
  const [sortBy, setSortBy] = useState('newest');
  const [isAiSearch, setIsAiSearch] = useState(false);
  const [aiIntents, setAiIntents] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const [onlyDeliverable, setOnlyDeliverable] = useState(false);

  const { addToCart } = useCart();
  const { customerLocation, canDeliverTo, getDeliveryETA, setIsModalOpen } = useLocation();

  const fetchProducts = async () => {
    setLoading(true);
    try {
      if (isAiSearch && keyword.trim()) {
        const res = await aiAPI.semanticSearch(keyword.trim());
        setProducts(res.data.data);
        setAiIntents(res.data.detectedIntents || []);
      } else {
        const res = await productsAPI.getAll({
          keyword: keyword.trim() || undefined,
          category: selectedCategory !== 'All' ? selectedCategory : undefined,
          sortBy,
        });
        setProducts(res.data.data);
        if (res.data.categories) {
          setCategories(['All', ...res.data.categories]);
        }
        setAiIntents([]);
      }
    } catch (err) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchProducts();
  };

  const handleQuickAdd = (product, e) => {
    e.preventDefault();
    e.stopPropagation();
    const defaultVariant = product.variants && product.variants.length > 0 ? product.variants[0] : null;
    addToCart(product, 1, defaultVariant);
    setAddedId(product._id);
    setTimeout(() => setAddedId(null), 1500);
  };

  return (
    <div className="space-y-10 pb-16">
      {/* Hero Banner */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-8 sm:p-14 shadow-2xl border border-indigo-900/50">
        <div className="absolute -right-16 -top-16 w-96 h-96 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-96 h-96 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 text-xs font-semibold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            Enterprise Multi-Vendor Commerce Platform
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Curated gear from verified independent brands.
          </h1>

          <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-2xl">
            Shop directly from certified tech labs, sustainable artisan studios, and premium workshops. Single unified checkout atomically splits into independent vendor orders.
          </p>

          {/* Search Bar & AI Semantic Search Toggle */}
          <form onSubmit={handleSearchSubmit} className="pt-2">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    isAiSearch
                      ? "Describe what you need (e.g. 'comfortable wireless sound for office work')..."
                      : "Search products, tech specs, or tags..."
                  }
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-400 text-sm"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAiSearch(!isAiSearch)}
                  className={`px-4 py-3.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 border ${
                    isAiSearch
                      ? 'bg-gradient-to-r from-indigo-500 to-sky-500 text-white border-transparent shadow-lg shadow-indigo-500/25'
                      : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
                  }`}
                  title="Enable AI semantic query intent matching"
                >
                  <Sparkles className={`w-4 h-4 ${isAiSearch ? 'animate-spin' : ''}`} />
                  {isAiSearch ? 'AI Match ON' : 'AI Match'}
                </button>

                <button
                  type="submit"
                  className="px-6 py-3.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all flex items-center gap-2"
                >
                  Search
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Detected intent indicator */}
            {aiIntents.length > 0 && (
              <div className="mt-3 flex items-center gap-2 text-xs text-indigo-300">
                <span className="font-semibold">AI Identified Intents:</span>
                {aiIntents.map((intent, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md bg-indigo-500/30 border border-indigo-400/30 capitalize"
                  >
                    #{intent}
                  </span>
                ))}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Categories & Sorting Filter Bar */}
      <section className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {['All', 'Electronics', 'Audio', 'Apparel', 'Footwear'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Location Destination Filter & Sort Controls */}
        <div className="flex items-center gap-3 flex-wrap self-end">
          {/* Customer Location Pill */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 bg-indigo-50/80 hover:bg-indigo-100 text-indigo-800 text-xs font-bold transition-all shadow-xs"
            title="Change delivery destination"
          >
            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
            <span>Delivering to {customerLocation?.city || 'Your Area'}</span>
            <span className="text-[10px] text-indigo-500 font-normal underline">Edit</span>
          </button>

          {/* Area Delivery Toggle */}
          <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 cursor-pointer bg-white px-3 py-1.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
            <input
              type="checkbox"
              checked={onlyDeliverable}
              onChange={(e) => setOnlyDeliverable(e.target.checked)}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Deliverable to me</span>
          </label>

          <label htmlFor="product-sort-select" className="text-xs text-slate-500 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
          </label>
          <select
            id="product-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-xs font-semibold bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          >
            <option value="newest">Featured & Newest</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Highest Rated</option>
          </select>
        </div>
      </section>

      {/* Product Catalog Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-slate-200 animate-pulse space-y-4">
              <div className="w-full h-52 bg-slate-200 rounded-xl" />
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="h-3 bg-slate-200 rounded w-1/2" />
              <div className="h-6 bg-slate-200 rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <ShoppingBag className="w-14 h-14 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">
            {keyword || selectedCategory !== 'All' ? 'No products match your filter' : 'No products in the catalog yet'}
          </h3>
          <p className="text-slate-500 text-sm mt-1 max-w-md mx-auto">
            {keyword || selectedCategory !== 'All'
              ? 'Try adjusting your search criteria or resetting filters to see more results.'
              : 'The marketplace database is currently empty. Register a seller account to list your first product.'}
          </p>
          <div className="mt-5 flex items-center justify-center gap-3">
            {keyword || selectedCategory !== 'All' ? (
              <button
                onClick={() => {
                  setKeyword('');
                  setSelectedCategory('All');
                  setIsAiSearch(false);
                }}
                className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-colors"
              >
                Reset Filters
              </button>
            ) : (
              <Link
                to="/register"
                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-colors shadow-sm shadow-indigo-200"
              >
                Register as Seller
              </Link>
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {(onlyDeliverable ? products.filter((p) => canDeliverTo(p, customerLocation)) : products).map((product) => {
            const hasVariants = product.variants && product.variants.length > 0;
            const isDiscounted = product.discountPrice > 0 && product.discountPrice < product.price;
            const isDeliverable = canDeliverTo(product, customerLocation);

            return (
              <div
                key={product._id}
                className="group bg-white rounded-2xl border border-slate-200/80 hover:border-indigo-300 hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden"
              >
                {/* Product Image Container */}
                <Link to={`/products/${product._id}`} className="relative block h-56 bg-slate-100 overflow-hidden">
                  <img
                    src={product.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80'}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />

                  {/* Vendor Store Tag */}
                  {product.storeId && (
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-800 shadow-xs border border-white/50 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      {product.storeId.storeName}
                    </div>
                  )}

                  {/* Match Confidence pill if AI search */}
                  {product.matchConfidence && (
                    <div className="absolute top-3 right-3 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow-sm">
                      <Sparkles className="w-2.5 h-2.5" />
                      {product.matchConfidence}% Match
                    </div>
                  )}

                  {/* Out of stock badge */}
                  {product.stock <= 0 && (
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center">
                      <span className="bg-rose-600 text-white font-bold text-xs px-3 py-1.5 rounded-xl uppercase tracking-wider">
                        Sold Out
                      </span>
                    </div>
                  )}
                </Link>

                {/* Body Details */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                      <span className="font-semibold text-indigo-600 uppercase tracking-wide text-[10px]">
                        {product.category}
                      </span>
                      <div className="flex items-center gap-1 text-slate-600 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span>{product.ratingAverage || 5.0}</span>
                        <span className="text-slate-400 font-normal">({product.ratingCount || 12})</span>
                      </div>
                    </div>

                    <Link to={`/products/${product._id}`}>
                      <h3 className="text-sm font-bold text-slate-900 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {product.title}
                      </h3>
                    </Link>

                    {hasVariants && (
                      <div className="mt-2 flex items-center gap-1 text-[11px] text-slate-500 font-medium">
                        <Layers className="w-3 h-3 text-slate-400" />
                        <span>{product.variants.length} options available</span>
                      </div>
                    )}

                    {/* Shipping Origin & Customer Delivery ETA */}
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] gap-2">
                      <div className="flex items-center gap-1 text-slate-500 truncate" title={`Ships from ${product.originCity || 'New York, NY'}`}>
                        <Truck className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        <span className="truncate text-[10px]">From {product.originCity || 'New York, NY'}</span>
                      </div>
                      {isDeliverable ? (
                        <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] flex-shrink-0">
                          <Check className="w-2.5 h-2.5 text-emerald-600" />
                          {product.shippingRate === 0 ? 'Free' : `$${product.shippingRate}`} by {getDeliveryETA(product)}
                        </span>
                      ) : (
                        <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full text-[10px] flex-shrink-0">
                          Outside area
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Pricing and Action */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-black text-slate-900 font-outfit">
                          ${isDiscounted ? product.discountPrice : product.price}
                        </span>
                        {isDiscounted && (
                          <span className="text-xs text-slate-400 line-through">
                            ${product.price}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                      </span>
                    </div>

                    <button
                      onClick={(e) => handleQuickAdd(product, e)}
                      disabled={product.stock <= 0}
                      className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                        addedId === product._id
                          ? 'bg-emerald-600 text-white'
                          : product.stock <= 0
                          ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                          : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                      }`}
                      title="Add to Cart"
                    >
                      {addedId === product._id ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <ShoppingBag className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
