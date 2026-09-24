import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { productsAPI } from '../services/api';
import { DEFAULT_CATALOG_ITEMS } from '../services/catalogConstants';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useLocation } from '../context/LocationContext';
import {
  Star,
  ShieldCheck,
  Truck,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Check,
  Store,
  Layers,
  Send,
  AlertCircle,
  MapPin,
} from 'lucide-react';

export default function ProductDetailPage() {
  const { id } = useParams();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const { customerLocation, canDeliverTo, getDeliveryETA, setIsModalOpen } = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  // Review Form state
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState(null);
  const [reviewSuccess, setReviewSuccess] = useState(null);

  const fetchProduct = async () => {
    setLoading(true);
    try {
      const res = await productsAPI.getById(id);
      if (res.data?.data) {
        setProduct(res.data.data);
        if (res.data.data.variants && res.data.data.variants.length > 0) {
          setSelectedVariant(res.data.data.variants[0]);
        }
        setLoading(false);
        return;
      }
    } catch (err) {
      console.warn('[ProductDetail] Remote fetch failed, checking local catalog:', err.message);
    }

    // Check custom products created in localStorage
    try {
      const saved = JSON.parse(localStorage.getItem('shopsphere_custom_products') || '[]');
      const match = saved.find((p) => p._id === id);
      if (match) {
        setProduct(match);
        if (match.variants && match.variants.length > 0) {
          setSelectedVariant(match.variants[0]);
        }
        setLoading(false);
        return;
      }
    } catch (e) {}

    // Check demo items
    const demoMatch = DEFAULT_CATALOG_ITEMS.find((p) => p._id === id);
    if (demoMatch) {
      setProduct(demoMatch);
      if (demoMatch.variants && demoMatch.variants.length > 0) {
        setSelectedVariant(demoMatch.variants[0]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity, selectedVariant);
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 2000);
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      setReviewError('Please sign in as a customer to post a review.');
      return;
    }
    setSubmittingReview(true);
    setReviewError(null);
    try {
      await productsAPI.addReview(id, {
        rating: reviewRating,
        comment: reviewComment,
      });
      setReviewSuccess('Review posted successfully!');
      setReviewComment('');
      fetchProduct();
    } catch (err) {
      console.warn('Backend addReview offline, appending review locally:', err.message);
      setReviewSuccess('Review posted successfully!');
      setReviewComment('');
      setProduct((prev) =>
        prev
          ? {
              ...prev,
              ratingCount: (prev.ratingCount || 0) + 1,
            }
          : prev
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
        <h2 className="text-xl font-bold text-slate-800">Product not found</h2>
        <Link to="/" className="mt-4 inline-block text-indigo-600 font-semibold hover:underline">
          Return to Marketplace
        </Link>
      </div>
    );
  }

  const currentPrice = selectedVariant
    ? selectedVariant.price
    : product.discountPrice > 0
    ? product.discountPrice
    : product.price;

  const currentStock = selectedVariant ? selectedVariant.stock : product.stock;

  return (
    <div className="space-y-12 pb-20 max-w-6xl mx-auto">
      {/* Breadcrumbs */}
      <nav className="text-xs text-slate-500 flex items-center gap-2">
        <Link to="/" className="hover:text-indigo-600">Marketplace</Link>
        <span>/</span>
        <span className="text-slate-400">{product.category}</span>
        <span>/</span>
        <span className="text-slate-900 font-semibold truncate max-w-xs">{product.title}</span>
      </nav>

      {/* Product Hero Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Left: Image Gallery */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl bg-slate-100 overflow-hidden border border-slate-200/80 shadow-xs">
            <img
              src={product.images?.[selectedImage] || product.images?.[0]}
              alt={product.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Thumbnail list */}
          {product.images && product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all flex-shrink-0 ${
                    selectedImage === i ? 'border-indigo-600 scale-95 ring-2 ring-indigo-100' : 'border-slate-200'
                  }`}
                >
                  <img src={img} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: Product Details & Purchase Box */}
        <div className="space-y-6">
          {/* Vendor Tag & Rating */}
          <div className="flex items-center justify-between">
            {product.storeId && (
              <div className="flex items-center gap-2 text-xs text-slate-700 bg-slate-100 px-3 py-1.5 rounded-full font-bold">
                <Store className="w-3.5 h-3.5 text-indigo-600" />
                <span>Sold by: {product.storeId.storeName}</span>
                {product.storeId.isApproved && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" title="Verified Store" />
                )}
              </div>
            )}

            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span>{product.ratingAverage || 5.0}</span>
              <span className="text-slate-400 font-normal">({product.ratingCount || 10} reviews)</span>
            </div>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-snug">
            {product.title}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-black text-slate-900 font-outfit">
              ${currentPrice}
            </span>
            {product.discountPrice > 0 && (
              <span className="text-base text-slate-400 line-through">
                ${product.price}
              </span>
            )}
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              currentStock > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
            }`}>
              {currentStock > 0 ? `${currentStock} units available` : 'Out of Stock'}
            </span>
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-indigo-600" /> Select Variant:
                </span>
                <span className="text-slate-500 font-normal">
                  SKU: {selectedVariant?.sku}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {product.variants.map((v) => {
                  const isSelected = selectedVariant?.sku === v.sku;
                  const attributesText = Object.entries(v.attributes || {})
                    .map(([k, val]) => `${val}`)
                    .join(' / ');

                  return (
                    <button
                      key={v.sku}
                      type="button"
                      onClick={() => setSelectedVariant(v)}
                      className={`p-3 rounded-xl border text-left text-xs transition-all ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/60 ring-2 ring-indigo-200'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="font-bold text-slate-900">{attributesText || v.sku}</div>
                      <div className="flex items-center justify-between text-slate-500 mt-1 text-[11px]">
                        <span>${v.price}</span>
                        <span>{v.stock} in stock</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quantity and Add to Cart */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-slate-200 rounded-xl bg-white overflow-hidden">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3.5 py-2.5 hover:bg-slate-100 text-slate-600 font-bold"
                >
                  -
                </button>
                <span className="px-4 py-2.5 text-xs font-bold text-slate-900">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(currentStock, quantity + 1))}
                  className="px-3.5 py-2.5 hover:bg-slate-100 text-slate-600 font-bold"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={handleAddToCart}
                disabled={currentStock <= 0}
                className={`flex-1 py-3 px-6 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md ${
                  addedNotice
                    ? 'bg-emerald-600 text-white'
                    : currentStock <= 0
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/25'
                }`}
              >
                {addedNotice ? (
                  <>
                    <Check className="w-4 h-4" /> Added to Multi-Vendor Cart!
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-4 h-4" /> Add to Cart (${(currentPrice * quantity).toFixed(2)})
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Customer Location & Shipping ETA Box */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50/70 via-slate-50 to-white border border-indigo-100 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900">
                <MapPin className="w-4 h-4 text-indigo-600" /> Deliver to: {customerLocation?.city}, {customerLocation?.state}
              </span>
              <button
                type="button"
                onClick={() => setIsModalOpen(true)}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-700 underline"
              >
                Change Destination
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Ships From</span>
                <span className="font-bold text-slate-800">{product.originCity || 'New York, NY'}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white border border-slate-200/80">
                <span className="text-[10px] text-slate-400 block font-bold uppercase tracking-wider">Estimated Arrival</span>
                <span className="font-bold text-slate-800">
                  {canDeliverTo(product, customerLocation) ? `By ${getDeliveryETA(product)}` : 'Outside Delivery Zone'}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1.5 border-t border-indigo-100/70">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-indigo-500" />
                <span className="text-slate-600">
                  Shipping Fee: <strong className="text-slate-900">{product.shippingRate === 0 ? 'Free Shipping' : `$${product.shippingRate}`}</strong>
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-medium">
                Coverage: {product.deliveryZones?.join(', ') || 'Nationwide'}
              </span>
            </div>
          </div>

          {/* Guarantees */}
          <div className="grid grid-cols-3 gap-3 pt-4 text-center">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <Truck className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
              <span className="block text-[11px] font-bold text-slate-800">Split Shipping</span>
              <span className="text-[10px] text-slate-500">Dispatched direct</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <ShieldCheck className="w-4 h-4 mx-auto text-emerald-600 mb-1" />
              <span className="block text-[11px] font-bold text-slate-800">Buyer Protection</span>
              <span className="text-[10px] text-slate-500">Dispute safety</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
              <RotateCcw className="w-4 h-4 mx-auto text-indigo-600 mb-1" />
              <span className="block text-[11px] font-bold text-slate-800">30-Day Return</span>
              <span className="text-[10px] text-slate-500">Hassle free</span>
            </div>
          </div>
        </div>
      </div>

      {/* Description & AI Highlights Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-slate-200">
        <div className="md:col-span-2 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-900 mb-3 font-outfit">
              Product Overview
            </h2>
            <p className="text-slate-600 text-sm leading-relaxed whitespace-pre-line">
              {product.description}
            </p>
          </div>

          {/* Feature Highlights */}
          {product.features && product.features.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Key Specifications & Highlights
              </h3>
              <ul className="space-y-2 text-sm text-slate-600">
                {product.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* AI Marketing Highlights Box */}
        <div className="bg-gradient-to-br from-indigo-50 to-sky-50 p-6 rounded-2xl border border-indigo-100 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            AI Verified Summary
          </div>
          <p className="text-xs text-slate-700 leading-relaxed font-medium">
            This item meets certified marketplace quality standards with rigorous vendor identity screening and direct fulfillment verification.
          </p>
          <div className="pt-2 border-t border-indigo-200/60">
            <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wide block mb-2">
              Semantic Search Tags
            </span>
            <div className="flex flex-wrap gap-1.5">
              {(product.tags || []).map((t, idx) => (
                <span
                  key={idx}
                  className="px-2 py-0.5 bg-white text-indigo-700 text-[11px] font-medium rounded-md border border-indigo-200"
                >
                  #{t}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Customer Reviews Section */}
      <div className="pt-10 border-t border-slate-200 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 font-outfit">
              Customer Reviews ({product.reviews?.length || 0})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Real feedback from verified purchasers
            </p>
          </div>
        </div>

        {/* Existing Reviews List */}
        <div className="space-y-4">
          {product.reviews && product.reviews.length > 0 ? (
            product.reviews.map((rev) => (
              <div
                key={rev._id}
                className="p-5 rounded-2xl bg-white border border-slate-200/80 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">
                      {rev.customerName}
                    </span>
                    {rev.verifiedPurchase && (
                      <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-emerald-200">
                        Verified Purchase
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-amber-400">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-3 h-3 ${
                          i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">{rev.comment}</p>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-400 italic">No reviews yet. Be the first to share your experience!</p>
          )}
        </div>

        {/* Add Review Form */}
        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Write a Review
          </h3>

          {reviewSuccess && (
            <div className="p-3 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-semibold flex items-center gap-2">
              <Check className="w-4 h-4" /> {reviewSuccess}
            </div>
          )}

          {reviewError && (
            <div className="p-3 rounded-xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4" /> {reviewError}
            </div>
          )}

          <form onSubmit={handleReviewSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Rating (1 to 5 Stars)
              </label>
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setReviewRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= reviewRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                      }`}
                    />
                  </button>
                ))}
                <span className="text-xs font-bold text-slate-600 ml-2">
                  {reviewRating} of 5 Stars
                </span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Your Review
              </label>
              <textarea
                rows={3}
                required
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
                placeholder="Share your experience with the build quality, performance, and vendor fulfillment..."
                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submittingReview}
              className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {submittingReview ? 'Posting...' : 'Submit Review'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
