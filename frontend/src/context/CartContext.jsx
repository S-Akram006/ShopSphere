import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

const CartContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('shopsphere_cart');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [toast, setToast] = useState(null);
  const [badgePulse, setBadgePulse] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('shopsphere_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const triggerToast = useCallback((toastData) => {
    setToast({
      id: Date.now(),
      ...toastData,
    });
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    const variantSku = selectedVariant ? selectedVariant.sku : null;
    const availableStock = selectedVariant
      ? (typeof selectedVariant.stock === 'number' ? selectedVariant.stock : 10)
      : (typeof product.stock === 'number' ? product.stock : 10);

    if (availableStock <= 0) {
      triggerToast({
        type: 'error',
        title: 'Item Out of Stock',
        message: `"${product.title}" is currently unavailable for purchase.`,
      });
      return { success: false, reason: 'out_of_stock' };
    }

    let resultingQty = quantity;
    let cappedAtMax = false;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.productId === product._id && item.variantSku === variantSku
      );

      const price = selectedVariant
        ? selectedVariant.price
        : product.discountPrice > 0 && product.discountPrice < product.price
        ? product.discountPrice
        : product.price;

      const storeId = product.storeId?._id || product.storeId;
      const storeName = product.storeId?.storeName || 'Verified Vendor';

      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        const requestedTotal = currentQty + quantity;

        if (requestedTotal > availableStock) {
          cappedAtMax = true;
          resultingQty = availableStock;
          updated[existingIndex].quantity = availableStock;
        } else {
          resultingQty = requestedTotal;
          updated[existingIndex].quantity = requestedTotal;
        }
        // Ensure stock is up to date on existing item
        updated[existingIndex].stock = availableStock;
        return updated;
      } else {
        const safeQuantity = Math.min(quantity, availableStock);
        if (quantity > availableStock) cappedAtMax = true;
        resultingQty = safeQuantity;

        return [
          ...prev,
          {
            productId: product._id,
            title: product.title,
            price,
            quantity: safeQuantity,
            stock: availableStock,
            variantSku,
            variantAttributes: selectedVariant?.attributes || {},
            image: product.images?.[0] || '',
            storeId,
            storeName,
          },
        ];
      }
    });

    // Animate navbar badge
    setBadgePulse(true);
    setTimeout(() => setBadgePulse(false), 800);

    // Immediate rich feedback toast notification
    if (cappedAtMax) {
      triggerToast({
        type: 'warning',
        title: 'Quantity Capped at Stock',
        product: {
          title: product.title,
          image: product.images?.[0],
          price: selectedVariant ? selectedVariant.price : (product.discountPrice > 0 ? product.discountPrice : product.price),
        },
        message: `Cart adjusted to maximum available stock (${availableStock} units).`,
      });
    } else {
      triggerToast({
        type: 'success',
        title: 'Added to Cart!',
        product: {
          title: product.title,
          image: product.images?.[0],
          price: selectedVariant ? selectedVariant.price : (product.discountPrice > 0 ? product.discountPrice : product.price),
        },
        quantity,
        message: `Added ${quantity} unit${quantity > 1 ? 's' : ''} to multi-vendor cart.`,
      });
    }

    return { success: true, cappedAtMax, resultingQty };
  };

  const updateQuantity = (productId, variantSku, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantSku);
      return;
    }

    setCartItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId && item.variantSku === variantSku) {
          const maxStock = item.stock || 99;
          if (quantity > maxStock) {
            triggerToast({
              type: 'warning',
              title: 'Stock Limit Reached',
              message: `Maximum available inventory for this item is ${maxStock} units.`,
            });
            return { ...item, quantity: maxStock };
          }
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId, variantSku) => {
    setCartItems((prev) =>
      prev.filter(
        (item) => !(item.productId === productId && item.variantSku === variantSku)
      )
    );
  };

  const clearCart = () => {
    setCartItems([]);
  };

  // Group items by vendor storeId with distinct sub-summaries
  const vendorGroups = cartItems.reduce((acc, item) => {
    const sId = item.storeId?.toString() || 'unknown';
    if (!acc[sId]) {
      acc[sId] = {
        storeId: sId,
        storeName: item.storeName || 'Verified Independent Merchant',
        items: [],
        subTotal: 0,
        shippingFee: 0,
      };
    }
    acc[sId].items.push(item);
    acc[sId].subTotal += item.price * item.quantity;
    acc[sId].shippingFee = acc[sId].subTotal >= 100 ? 0 : 9.99;
    return acc;
  }, {});

  const vendorsList = Object.values(vendorGroups).map((vg) => ({
    ...vg,
    subTotal: Math.round(vg.subTotal * 100) / 100,
    total: Math.round((vg.subTotal + vg.shippingFee) * 100) / 100,
    itemsCount: vg.items.reduce((s, it) => s + it.quantity, 0),
  }));

  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSubtotal = Math.round(cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;
  const totalShipping = Math.round(vendorsList.reduce((sum, v) => sum + v.shippingFee, 0) * 100) / 100;
  const grandTotal = Math.round((itemsSubtotal + totalShipping) * 100) / 100;

  return (
    <CartContext.Provider
      value={{
        cartItems,
        totalItems,
        itemsSubtotal,
        totalShipping,
        grandTotal,
        vendorsList,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        toast,
        hideToast,
        badgePulse,
        isDrawerOpen,
        openDrawer,
        closeDrawer,
        setIsDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
