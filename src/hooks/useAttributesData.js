import { useCallback, useState } from 'react';
import { API_BASE } from '../config/api';
import { normalizeAttributeType } from '../utils/attributes';

export function useAttributesData(setToast) {
  const [attributes, setAttributes] = useState([]);
  const [loadingAttributes, setLoadingAttributes] = useState(false);

  const loadAttributes = useCallback(async () => {
    setLoadingAttributes(true);
    try {
      const response = await fetch(`${API_BASE}/attribute`);
      if (!response.ok) {
        throw new Error('Unable to fetch attributes.');
      }
      const data = await response.json();
      console.log('Fetched attributes response', data);
      const normalized = Array.isArray(data)
        ? data.map((attribute) => normalizeAttributeType(attribute))
        : [];
      setAttributes(normalized);
      setToast({ type: 'success', message: 'Attributes loaded.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoadingAttributes(false);
    }
  }, [setToast]);

  return { attributes, setAttributes, loadingAttributes, loadAttributes };
}
