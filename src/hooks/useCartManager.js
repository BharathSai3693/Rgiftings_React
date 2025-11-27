import { useCallback, useMemo, useState } from 'react';

export function useCartManager(setToast) {
  const [cartItems, setCartItems] = useState([]);

  const addItemToCart = useCallback(
    (item) => {
      const quantity = Math.max(1, Number(item.quantity || 1));
      const cartItemId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
      setCartItems((previous) => [...previous, { quantity, ...item, cartItemId }]);
      setToast({ type: 'success', message: 'Added to cart.' });
    },
    [setToast],
  );

  const removeItemFromCart = useCallback((cartItemId) => {
    setCartItems((previous) => previous.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const updateItemQuantity = useCallback((cartItemId, quantity) => {
    const safeQuantity = Math.max(1, Number(quantity) || 1);
    setCartItems((previous) =>
      previous.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: safeQuantity } : item)),
    );
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartValue = useMemo(
    () => ({
      items: cartItems,
      addItem: addItemToCart,
      removeItem: removeItemFromCart,
      updateQuantity: updateItemQuantity,
      clearCart,
      total: cartItems.reduce((sum, item) => {
        const quantity = Number(item.quantity || 1);
        const base = Number(item.basePrice || 0);
        const extras = (item.selectedAttributes || []).reduce(
          (extraSum, attr) => extraSum + Number(attr.extraPrice || 0),
          0,
        );
        const lineSubtotal = (base + extras) * quantity;
        const lineTax = lineSubtotal * Number(item.taxRate || 0);
        return sum + lineSubtotal + lineTax;
      }, 0),
    }),
    [addItemToCart, cartItems, clearCart, removeItemFromCart, updateItemQuantity],
  );

  return { cartItems, cartValue, updateItemQuantity };
}
