import React, { useState, useEffect } from 'react';
import { sellerAPI, productsAPI, aiAPI, uploadAPI } from '../../services/api';
import {
  Plus,
  Trash2,
  Edit,
  Sparkles,
  Layers,
  Check,
  AlertCircle,
  Package,
  X,
  Tag,
  Upload,
  Image as ImageIcon,
  MapPin,
  Truck,
  Globe,
} from 'lucide-react';

export default function SellerProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Electronics',
    price: '',
    discountPrice: '',
    stock: '',
    tags: 'electronics, gadget, pro',
    features: '',
    images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
    originCity: 'New York, NY',
    deliveryZones: ['Nationwide'],
    estimatedDeliveryDays: 3,
    shippingRate: 0,
    variants: [],
  });

  const [uploadingImage, setUploadingImage] = useState(false);
  const [customImageUrl, setCustomImageUrl] = useState('');

  // Variant input row
  const [varSku, setVarSku] = useState('');
  const [varAttrKey, setVarAttrKey] = useState('Color');
  const [varAttrVal, setVarAttrVal] = useState('Space Gray');
  const [varPrice, setVarPrice] = useState('');
  const [varStock, setVarStock] = useState('');

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await sellerAPI.getProducts();
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // AI Description Generator
  const handleGenerateAiCopy = async () => {
    if (!formData.title) {
      setErrorMsg('Please enter a product title first before invoking AI copy generation.');
      return;
    }
    setGeneratingAi(true);
    setErrorMsg(null);
    try {
      const res = await aiAPI.generateDescription({
        title: formData.title,
        category: formData.category,
        keywords: formData.tags.split(',').map((t) => t.trim()),
      });

      const aiData = res.data.data;
      setFormData((prev) => ({
        ...prev,
        description: aiData.description,
        features: aiData.keyFeatures ? aiData.keyFeatures.join('\n') : prev.features,
        tags: aiData.seoKeywords ? aiData.seoKeywords.join(', ') : prev.tags,
      }));
      setSuccessMsg('AI marketing copy generated and inserted!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'AI copy generation failed');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAddVariant = () => {
    if (!varSku || !varPrice || !varStock) {
      alert('Please fill SKU, Price, and Stock for variant');
      return;
    }
    const newVariant = {
      sku: varSku,
      attributes: { [varAttrKey.toLowerCase()]: varAttrVal },
      price: Number(varPrice),
      stock: Number(varStock),
    };

    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, newVariant],
    }));

    setVarSku('');
    setVarPrice('');
    setVarStock('');
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  // Image Upload Handlers
  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('Image size cannot exceed 10MB');
      return;
    }

    setUploadingImage(true);
    setErrorMsg(null);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result;
        const res = await uploadAPI.uploadImage({
          data: base64Data,
          filename: file.name,
          contentType: file.type,
        });
        const uploadedUrl = res.data.url;
        setFormData((prev) => ({
          ...prev,
          images: [...prev.images, uploadedUrl],
        }));
        setSuccessMsg('Image uploaded successfully from local device!');
        setTimeout(() => setSuccessMsg(null), 2500);
      } catch (uploadErr) {
        setErrorMsg(uploadErr.response?.data?.message || 'Failed to upload image file');
      } finally {
        setUploadingImage(false);
      }
    };
    reader.onerror = () => {
      setErrorMsg('Failed to read image file from device');
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  const handleAddImageUrl = () => {
    if (!customImageUrl.trim()) return;
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, customImageUrl.trim()],
    }));
    setCustomImageUrl('');
  };

  const handleRemoveImage = (index) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleSetPrimaryImage = (index) => {
    setFormData((prev) => {
      const selected = prev.images[index];
      const remaining = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: [selected, ...remaining],
      };
    });
  };

  const handleToggleZone = (zone) => {
    setFormData((prev) => {
      let updated;
      if (zone === 'Nationwide') {
        updated = ['Nationwide'];
      } else {
        const withoutNationwide = prev.deliveryZones.filter((z) => z !== 'Nationwide');
        if (withoutNationwide.includes(zone)) {
          updated = withoutNationwide.filter((z) => z !== zone);
          if (updated.length === 0) updated = ['Nationwide'];
        } else {
          updated = [...withoutNationwide, zone];
        }
      }
      return { ...prev, deliveryZones: updated };
    });
  };

  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!formData.images || formData.images.length === 0) {
      setErrorMsg('Please provide at least one product image');
      return;
    }

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        category: formData.category,
        price: Number(formData.price),
        discountPrice: formData.discountPrice ? Number(formData.discountPrice) : 0,
        stock: Number(formData.stock),
        tags: typeof formData.tags === 'string' ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : formData.tags,
        features: typeof formData.features === 'string' ? formData.features.split('\n').map((f) => f.trim()).filter(Boolean) : formData.features,
        images: Array.isArray(formData.images) ? formData.images.filter(Boolean) : [formData.images],
        originCity: formData.originCity || 'New York, NY',
        deliveryZones: formData.deliveryZones && formData.deliveryZones.length > 0 ? formData.deliveryZones : ['Nationwide'],
        estimatedDeliveryDays: Number(formData.estimatedDeliveryDays) || 3,
        shippingRate: Number(formData.shippingRate) || 0,
        variants: formData.variants,
      };

      await productsAPI.create(payload);
      setShowModal(false);
      // Reset form
      setFormData({
        title: '',
        description: '',
        category: 'Electronics',
        price: '',
        discountPrice: '',
        stock: '',
        tags: 'electronics, gadget, pro',
        features: '',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80'],
        originCity: 'New York, NY',
        deliveryZones: ['Nationwide'],
        estimatedDeliveryDays: 3,
        shippingRate: 0,
        variants: [],
      });
      fetchProducts();
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to create product');
    }
  };

  const handleDeleteProduct = async (id) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await productsAPI.delete(id);
      fetchProducts();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete product');
    }
  };

  return (
    <div className="space-y-8 pb-16 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 font-outfit">
            Store Product Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your storefront listings, atomic variant stock, and AI marketing copy.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-600/20 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {/* Catalog Table */}
      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200 p-8 shadow-xs">
          <Package className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-800">No products in your catalog</h3>
          <p className="text-slate-500 text-sm mt-1">
            Click "Add New Product" to create your first listing using AI copy synthesis.
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3.5 px-4">Product Details</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Price</th>
                  <th className="py-3.5 px-4">Total Stock</th>
                  <th className="py-3.5 px-4">Variants</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {products.map((p) => (
                  <tr key={p._id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=100&q=80'}
                          alt={p.title}
                          className="w-10 h-10 rounded-lg object-cover border border-slate-100 flex-shrink-0"
                        />
                        <div>
                          <span className="font-bold text-slate-900 block truncate max-w-xs">
                            {p.title}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            Rating: ★ {p.ratingAverage || 5.0} ({p.ratingCount || 0})
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium">{p.category}</td>
                    <td className="py-3.5 px-4 font-bold font-outfit text-slate-900">
                      ${p.price}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-bold px-2 py-0.5 rounded-full text-[10px] ${
                        p.stock <= 5 ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      }`}>
                        {p.stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      {p.variants?.length > 0 ? (
                        <span className="bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-md text-[10px] font-semibold">
                          {p.variants.length} Variants
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Standard</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        p.isApproved ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        {p.isApproved ? 'Approved' : 'Pending'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                        title="Delete product"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] sm:max-h-[85vh] overflow-hidden my-auto">
            {/* Fixed Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0 bg-white">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900 font-outfit">
                  Add New Product to Storefront
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitProduct} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {successMsg && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold flex items-center gap-2">
                    <Check className="w-4 h-4 flex-shrink-0" />
                    <span>{successMsg}</span>
                  </div>
                )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-bold text-slate-700">Product Title</label>
                    <button
                      type="button"
                      onClick={handleGenerateAiCopy}
                      disabled={generatingAi}
                      className="text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 text-[11px] bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-all"
                      title="Generates professional copy, bullet points, and SEO tags from title"
                    >
                      <Sparkles className="w-3 h-3 text-indigo-600 animate-pulse" />
                      {generatingAi ? 'Generating AI Copy...' : 'AI Generate Copy'}
                    </button>
                  </div>
                  <input
                    type="text"
                    name="title"
                    required
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. UltraSonic Studio Monitor X9"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Audio">Audio</option>
                    <option value="Apparel">Apparel</option>
                    <option value="Footwear">Footwear</option>
                    <option value="Smart Home">Smart Home</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Total Base Stock</label>
                  <input
                    type="number"
                    name="stock"
                    required
                    value={formData.stock}
                    onChange={handleInputChange}
                    placeholder="e.g. 50"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Base Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="price"
                    required
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="e.g. 299.00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Discount Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    name="discountPrice"
                    value={formData.discountPrice}
                    onChange={handleInputChange}
                    placeholder="Optional, e.g. 249.00"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Description</label>
                  <textarea
                    name="description"
                    rows={3}
                    required
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Describe product highlights or click 'AI Generate Copy' above..."
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Key Specs / Features (one per line)</label>
                  <textarea
                    name="features"
                    rows={2}
                    value={formData.features}
                    onChange={handleInputChange}
                    placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white"
                  />
                </div>
              </div>

              {/* Product Images & Media Manager */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-indigo-600" /> Product Images & Media
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold">
                    {formData.images.length} {formData.images.length === 1 ? 'image' : 'images'} added
                  </span>
                </div>

                {/* Local File Upload Box */}
                <div className="p-3 rounded-xl bg-white border border-dashed border-indigo-200 hover:border-indigo-400 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
                      <Upload className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="block font-bold text-slate-800 text-xs">Upload from Local Device</span>
                      <span className="block text-[10px] text-slate-400">Select PNG, JPG, or WEBP (Max 10MB)</span>
                    </div>
                  </div>
                  <label className="cursor-pointer px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 flex-shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    {uploadingImage ? 'Uploading Image...' : 'Browse Image File'}
                    <input
                      type="file"
                      accept="image/*"
                      disabled={uploadingImage}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                  </label>
                </div>

                {/* Custom Image URL Input */}
                <div className="flex gap-2">
                  <input
                    type="url"
                    placeholder="Or paste external image URL (e.g. https://...)"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="flex-1 p-2 rounded-xl border border-slate-200 bg-white text-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={handleAddImageUrl}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition-colors"
                  >
                    Add URL
                  </button>
                </div>

                {/* Curated Presets Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Quick Preset Suggestions ({formData.category}):
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { label: 'Smart Device', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Audio Pro', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Modern Apparel', url: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Urban Sneaker', url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=80' },
                      { label: 'Smart Home', url: 'https://images.unsplash.com/photo-1518444065439-e933c06ce9cd?auto=format&fit=crop&w=800&q=80' },
                    ].map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        onClick={() => {
                          if (!formData.images.includes(preset.url)) {
                            setFormData((prev) => ({
                              ...prev,
                              images: [...prev.images, preset.url],
                            }));
                          }
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white hover:bg-indigo-50 border border-slate-200 hover:border-indigo-300 text-slate-600 text-[11px] font-medium transition-all"
                      >
                        + {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Image Gallery Previews */}
                {formData.images.length > 0 && (
                  <div className="pt-2 border-t border-slate-200/80">
                    <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Active Image Gallery (First image is Catalog Hero):
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                      {formData.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className={`group relative rounded-xl border overflow-hidden bg-white shadow-xs ${
                            idx === 0 ? 'border-indigo-500 ring-2 ring-indigo-200' : 'border-slate-200'
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt={`Preview ${idx + 1}`}
                            className="w-full h-24 object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=600&q=80';
                            }}
                          />
                          {idx === 0 && (
                            <span className="absolute top-1 left-1 bg-indigo-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-xs">
                              Primary
                            </span>
                          )}
                          <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 p-1">
                            {idx !== 0 && (
                              <button
                                type="button"
                                onClick={() => handleSetPrimaryImage(idx)}
                                className="px-1.5 py-1 bg-white/90 hover:bg-white text-slate-900 text-[10px] font-bold rounded shadow-xs"
                                title="Set as primary hero image"
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveImage(idx)}
                              className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded shadow-xs"
                              title="Delete image"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Shipping Origin & Customer Delivery Coverage */}
              <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Truck className="w-4 h-4 text-indigo-600" /> Shipping Origin & Delivery Zones
                  </span>
                  <span className="text-[10px] text-indigo-700 font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                    Location Engine
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-indigo-500" /> Ships From (Origin)
                    </label>
                    <input
                      type="text"
                      name="originCity"
                      required
                      value={formData.originCity}
                      onChange={handleInputChange}
                      placeholder="e.g. Austin, TX"
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Delivery ETA (Days)
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={30}
                      name="estimatedDeliveryDays"
                      required
                      value={formData.estimatedDeliveryDays}
                      onChange={handleInputChange}
                      placeholder="3"
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">
                      Shipping Rate ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min={0}
                      name="shippingRate"
                      value={formData.shippingRate}
                      onChange={handleInputChange}
                      placeholder="0.00 (Free)"
                      className="w-full p-2 rounded-xl border border-slate-200 bg-white font-medium text-xs"
                    />
                  </div>
                </div>

                {/* Delivery Zone Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1.5">
                    Covered Customer Delivery Zones:
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Nationwide', 'East Coast', 'West Coast', 'Midwest', 'South'].map((zone) => {
                      const isSelected = formData.deliveryZones.includes(zone);
                      return (
                        <button
                          key={zone}
                          type="button"
                          onClick={() => handleToggleZone(zone)}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                            isSelected
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3 text-white" />}
                          {zone}
                        </button>
                      );
                    })}
                  </div>
                  <span className="block text-[10px] text-slate-400 mt-1">
                    Customers outside your selected zones will see an out-of-area delivery badge.
                  </span>
                </div>
              </div>

              {/* Variant Support Section */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-indigo-600" /> Optional Product Variants
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {formData.variants.length} added
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <input
                    type="text"
                    placeholder="SKU (e.g. BLK-XL)"
                    value={varSku}
                    onChange={(e) => setVarSku(e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Attr Key (Color)"
                    value={varAttrKey}
                    onChange={(e) => setVarAttrKey(e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Attr Val (Midnight)"
                    value={varAttrVal}
                    onChange={(e) => setVarAttrVal(e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-[11px]"
                  />
                  <input
                    type="number"
                    placeholder="Price ($)"
                    value={varPrice}
                    onChange={(e) => setVarPrice(e.target.value)}
                    className="p-2 rounded-lg border border-slate-200 bg-white text-[11px]"
                  />
                  <div className="flex gap-1 col-span-2 sm:col-span-1">
                    <input
                      type="number"
                      placeholder="Stock"
                      value={varStock}
                      onChange={(e) => setVarStock(e.target.value)}
                      className="p-2 rounded-lg border border-slate-200 bg-white text-[11px] w-full"
                    />
                    <button
                      type="button"
                      onClick={handleAddVariant}
                      className="px-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700"
                    >
                      +
                    </button>
                  </div>
                </div>

                {formData.variants.length > 0 && (
                  <div className="space-y-1 pt-1">
                    {formData.variants.map((v, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-white border border-slate-200 text-[11px]"
                      >
                        <span className="font-bold">{v.sku} ({JSON.stringify(v.attributes)})</span>
                        <div className="flex items-center gap-3">
                          <span>${v.price}</span>
                          <span>{v.stock} in stock</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariant(idx)}
                            className="text-rose-500 font-bold"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              </div>

              {/* Fixed Modal Action Footer */}
              <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-100 bg-slate-50/80 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 font-semibold cursor-pointer transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md shadow-indigo-600/20 cursor-pointer transition-all"
                >
                  Publish Product Listing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
