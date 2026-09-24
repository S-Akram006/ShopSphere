import React, { createContext, useContext, useState, useEffect } from 'react';

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

  useEffect(() => {
    localStorage.setItem('shopsphere_cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (product, quantity = 1, selectedVariant = null) => {
    setCartItems((prev) => {
      const variantSku = selectedVariant ? selectedVariant.sku : null;
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
        updated[existingIndex].quantity += quantity;
        return updated;
      } else {
        return [
          ...prev,
          {
            productId: product._id,
            title: product.title,
            price,
            quantity,
            variantSku,
            variantAttributes: selectedVariant?.attributes || {},
            image: product.images?.[0] || '',
            storeId,
            storeName,
          },
        ];
      }
    });
  };

  const updateQuantity = (productId, variantSku, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantSku);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.productId === productId && item.variantSku === variantSku
          ? { ...item, quantity }
          : item
      )
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

  // Group items by vendor storeId
  const vendorGroups = cartItems.reduce((acc, item) => {
    const sId = item.storeId?.toString() || 'unknown';
    if (!acc[sId]) {
      acc[sId] = {
        storeId: sId,
        storeName: item.storeName,
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

  const vendorsList = Object.values(vendorGroups);
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const itemsSubtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalShipping = vendorsList.reduce((sum, v) => sum + v.shippingFee, 0);
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
