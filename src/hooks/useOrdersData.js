import { useState } from 'react';
import { API_BASE } from '../config/api';

export function useOrdersData(setToast) {
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [userId, setUserId] = useState('');

  const loadOrders = async (providedUserId) => {
    const targetUserId = providedUserId ?? userId;
    if (!targetUserId) {
      setToast({ type: 'error', message: 'Enter a user ID to load orders.' });
      return;
    }
    setLoadingOrders(true);
    try {
      const response = await fetch(`${API_BASE}/orders/user/${targetUserId}`);
      if (!response.ok) {
        throw new Error('Unable to fetch orders.');
      }
      const data = await response.json();
      console.log('Fetched orders response', data);
      setOrders(Array.isArray(data) ? data : []);
      setToast({ type: 'success', message: 'Orders loaded.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to fetch orders.' });
    } finally {
      setLoadingOrders(false);
    }
  };

  return { orders, loadingOrders, userId, setUserId, loadOrders };
}
