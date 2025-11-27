import { useState } from 'react';
import { API_BASE } from '../config/api';

export function useOrderCheckout({ cartItems, clearCart, setToast }) {
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [isPlacing, setIsPlacing] = useState(false);

  const calculateLineTotals = (item) => {
    const quantity = Number(item.quantity || 1);
    const base = Number(item.basePrice || 0);
    const extras = (item.selectedAttributes || []).reduce(
      (extraSum, attr) => extraSum + Number(attr.extraPrice || 0),
      0,
    );
    const lineSubtotal = (base + extras) * quantity;
    const lineTax = lineSubtotal * Number(item.taxRate || 0);
    return { quantity, base, extras, lineSubtotal, lineTax, lineTotal: lineSubtotal + lineTax };
  };

  const placeOrder = async () => {
    if (cartItems.length === 0) return;
    if (!guestEmail.trim() || !guestPhone.trim()) {
      setToast({ type: 'error', message: 'Guest email and phone are required.' });
      return;
    }
    setIsPlacing(true);
    try {
      const orderItems = cartItems.map((item) => {
        const { quantity, base, extras, lineSubtotal, lineTax } = calculateLineTotals(item);
        return {
          productId: item.productId,
          quantity,
          basePrice: base,
          extraPrice: extras,
          lineTotalPrice: lineSubtotal,
          lineTax,
          taxRate: Number(item.taxRate || 0),
          orderItemAttributeRequestList: (item.selectedAttributes || []).map((attr) => ({
            productAttributeId: attr.productAttributeId ?? null,
            orderItemAttributeValueRequestList: [
              {
                productAttributeValueId: attr.productAttributeValueId ?? null,
                customText: null,
                fileUrl: null,
                extraPrice: Number(attr.extraPrice || 0),
              },
            ],
          })),
        };
      });

      const totalPrice = orderItems.reduce(
        (sum, line) => sum + Number(line.lineTotalPrice || 0) + Number(line.lineTax || 0),
        0,
      );

      const payload = {
        userId: null,
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        orderItems,
        totalPrice,
      };

      console.log('Placing order payload', payload);
      const response = await fetch(`${API_BASE}/order/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Unable to place order.');
      }
      clearCart?.();
      setGuestEmail('');
      setGuestPhone('');
      setToast({ type: 'success', message: 'Order placed.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to place order.' });
    } finally {
      setIsPlacing(false);
    }
  };

  return {
    guestEmail,
    setGuestEmail,
    guestPhone,
    setGuestPhone,
    isPlacing,
    placeOrder,
    calculateLineTotals,
  };
}
