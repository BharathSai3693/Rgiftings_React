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
      const attributeValues = (previous.attributeValues || []).map((item, currentIndex) =>
        currentIndex === index ? { ...item, [key]: value } : item,
      );
      return { ...previous, attributeValues };
    });
  };

  const addAttributeValueRow = () => {
    setAttributeForm((previous) => ({
      ...previous,
      attributeValues: [...(previous.attributeValues || []), { id: null, value: '' }],
    }));
  };

  const removeAttributeValueRow = (index) => {
    setAttributeForm((previous) => ({
      ...previous,
      attributeValues: (previous.attributeValues || []).filter((_, currentIndex) => currentIndex !== index),
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
    const attributeValues = (attributeForm.attributeValues || [])
      .filter((item) => item.value?.trim())
      .map((item) => ({
        id: item.id ?? null,
        value: item.value.trim(),
      }));

    const payload = editingAttributeId
      ? {
          id: editingAttributeId,
          name: attributeForm.name.trim(),
          inputType: attributeForm.inputType || 'TEXT',
          attributeValues,
        }
      : {
          name: attributeForm.name.trim(),
          inputType: attributeForm.inputType || 'TEXT',
          attributeValues,
        };
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
      Array.isArray(attribute.attributeValues) && attribute.attributeValues.length > 0
        ? attribute.attributeValues.map((value) => ({
            id: value.id ?? null,
            value: value.value || '',
          }))
        : [{ id: null, value: '' }];
    setAttributeForm({
      id: attributeId,
      name: attribute.name || '',
      inputType: attribute.inputType || 'TEXT',
      attributeValues: safeValues,
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
