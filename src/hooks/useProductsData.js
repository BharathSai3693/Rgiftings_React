import { useCallback, useState } from 'react';
import { API_BASE } from '../config/api';
import { normalizeProduct } from '../utils/products';

export function useProductsData(setToast) {
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  const loadProducts = useCallback(async () => {
    setLoadingProducts(true);
    try {
      console.log('[ProductsData] Fetching products…');
      const response = await fetch(`${API_BASE}/products`);
      const rawBody = await response.text();
      if (!response.ok) {
        throw new Error(rawBody || 'Unable to fetch products.');
      }
      let data;
      try {
        data = JSON.parse(rawBody);
        if (typeof data === 'string') {
          data = JSON.parse(data);
        }
      } catch (parseError) {
        console.error('Products raw response (first 500 chars):', rawBody.slice(0, 500));
        throw new Error('Products response was not valid JSON.');
      }
      console.log('Fetched products response', data);
      const normalized = Array.isArray(data) ? data.map((item) => normalizeProduct(item)) : [];
      setProducts(normalized);
      setToast({ type: 'success', message: 'Products loaded.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to fetch products.' });
    } finally {
      setLoadingProducts(false);
    }
  }, [setToast]);

  return { products, setProducts, loadingProducts, loadProducts };
}
