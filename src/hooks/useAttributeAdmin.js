import { useCallback, useState } from 'react';
import { API_BASE } from '../config/api';
import { createEmptyAttribute, getAttributeTypeId } from '../utils/attributes';

export function useAttributeAdmin({ setToast, loadAttributes, setAttributes, navigate }) {
  const [attributeForm, setAttributeForm] = useState(createEmptyAttribute);
  const [editingAttributeId, setEditingAttributeId] = useState(null);

  const handleAttributeChange = (event) => {
    const { name, value } = event.target;
    setAttributeForm((previous) => ({ ...previous, [name]: value }));
  };

  const updateAttributeValue = (index, key, value) => {
    setAttributeForm((previous) => {
      const values = (previous.values || []).map((item, currentIndex) =>
        currentIndex === index ? { ...item, [key]: value } : item,
      );
      return { ...previous, values };
    });
  };

  const addAttributeValueRow = () => {
    setAttributeForm((previous) => ({
      ...previous,
      values: [...(previous.values || []), { id: null, value: '', displayCode: '' }],
    }));
  };

  const removeAttributeValueRow = (index) => {
    setAttributeForm((previous) => ({
      ...previous,
      values: (previous.values || []).filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const resetAttributeForm = useCallback(() => {
    setAttributeForm(createEmptyAttribute());
    setEditingAttributeId(null);
    navigate('attributes');
  }, [navigate]);

  const startCreateAttribute = useCallback(() => {
    setAttributeForm(createEmptyAttribute());
    setEditingAttributeId(null);
    navigate('attributes', 'new', 'create');
  }, [navigate]);

  const submitAttribute = async (event) => {
    event.preventDefault();
    const method = editingAttributeId ? 'PUT' : 'POST';
    const url = editingAttributeId ? `${API_BASE}/attribute/${editingAttributeId}` : `${API_BASE}/attribute`;
    const values = (attributeForm.values || [])
      .filter((item) => item.value?.trim() || item.displayCode?.trim())
      .map((item) => ({
        id: item.id ?? item.attributeValueId ?? item.valueId ?? null,
        value: item.value.trim(),
        displayCode: item.displayCode?.trim() || '',
      }));

    const basePayload = {
      id: editingAttributeId ?? null,
      type: attributeForm.type.trim(),
      description: attributeForm.description?.trim() || '',
    };

    const payload = editingAttributeId
      ? { ...basePayload, attributeValues: values }
      : { ...basePayload, id: undefined, attributeValueRequests: values };
    console.log('Submitting attribute payload', payload);
    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Unable to save attribute.');
      }
      await loadAttributes();
      setToast({ type: 'success', message: editingAttributeId ? 'Attribute updated.' : 'Attribute created.' });
      resetAttributeForm();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const handleEditAttribute = (attribute, { openForm } = {}) => {
    const attributeId = getAttributeTypeId(attribute);
    if (!attributeId) return;
    if (openForm) {
      navigate('attributes', attributeId, 'edit');
    }
    setEditingAttributeId(attributeId);
    const safeValues =
      Array.isArray(attribute.values) && attribute.values.length > 0
        ? attribute.values.map((value) => ({
            id: value.id ?? value.valueId ?? value.attributeValueId ?? null,
            value: value.value || '',
            displayCode: value.displayCode || '',
          }))
        : [{ id: null, value: '', displayCode: '' }];
    setAttributeForm({
      type: attribute.type || '',
      description: attribute.description || '',
      values: safeValues,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteAttribute = async (attribute) => {
    const attributeId = getAttributeTypeId(attribute);
    if (!attributeId) return;
    if (!window.confirm('Delete this attribute?')) return;

    try {
      const response = await fetch(`${API_BASE}/attribute/${attributeId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Unable to delete attribute.');
      }
      setAttributes((previous) => previous.filter((item) => getAttributeTypeId(item) !== attributeId));
      setToast({ type: 'success', message: 'Attribute deleted.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  return {
    attributeForm,
    editingAttributeId,
    startCreateAttribute,
    handleAttributeChange,
    updateAttributeValue,
    addAttributeValueRow,
    removeAttributeValueRow,
    submitAttribute,
    resetAttributeForm,
    handleEditAttribute,
    deleteAttribute,
  };
}
