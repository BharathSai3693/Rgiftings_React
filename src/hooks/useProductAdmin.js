import { useCallback, useState } from 'react';
import { API_BASE } from '../config/api';
import { buildCreateProductPayload, buildUpdateProductPayload, createEmptyProduct } from '../utils/products';

export function useProductAdmin({ attributes, setToast, loadProducts, setProducts, navigate }) {
  const [productForm, setProductForm] = useState(createEmptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((previous) => ({ ...previous, [name]: value }));
  };

  const handleEditProduct = (product, { openForm } = {}) => {
    if (openForm) {
      navigate('products', product.id, 'edit');
    } else {
      navigate('products', product.id);
    }
    setEditingProductId(product.id);
    const safeAttributes =
      Array.isArray(product.attributes) && product.attributes.length > 0
        ? product.attributes.map((attribute) => ({
            productAttributeId: attribute.productAttributeId ?? attribute.id ?? null,
            attributeTypeId: attribute.attributeTypeId ?? attribute.attributeId ?? '',
            label: attribute.label || '',
            values: (attribute.values || []).map((value) => ({
              productAttributeValueId: value.productAttributeValueId ?? value.id ?? null,
              attributeValueId: value.attributeValueId ?? '',
              valueLabel: value.valueLabel || value.value || '',
              extraPrice: Number(value.extraPrice ?? 0),
            })),
          }))
        : [];
    setProductForm({
      name: product.name || '',
      description: product.description || '',
      basePrice: product.basePrice ?? '',
      stock: product.stock ?? '',
      taxRate: product.taxRate != null ? Number(product.taxRate) * 100 : '',
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      attributes: safeAttributes,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProductForm = useCallback(() => {
    setProductForm(createEmptyProduct());
    setEditingProductId(null);
    navigate('products');
  }, [navigate]);

  const startCreateProduct = useCallback(() => {
    setProductForm(createEmptyProduct());
    setEditingProductId(null);
    navigate('products', 'new', 'create');
  }, [navigate]);

  const submitProduct = async (event) => {
    event.preventDefault();
    const method = editingProductId ? 'PUT' : 'POST';
    const url = editingProductId ? `${API_BASE}/product/${editingProductId}` : `${API_BASE}/product`;
    const payload = editingProductId
      ? buildUpdateProductPayload(productForm, editingProductId)
      : buildCreateProductPayload(productForm);
    console.log('Submitting product payload', payload);

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to save product.');
      }

      await loadProducts();
      setToast({ type: 'success', message: editingProductId ? 'Product updated.' : 'Product created.' });
      resetProductForm();
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await fetch(`${API_BASE}/product/${productId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Unable to delete product.');
      }
      setProducts((previous) => previous.filter((product) => product.id !== productId));
      setToast({ type: 'success', message: 'Product deleted.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const addProductAttribute = () => {
    setProductForm((previous) => ({
      ...previous,
      attributes: [
        ...(previous.attributes || []),
        { productAttributeId: null, attributeTypeId: '', label: '', values: [] },
      ],
    }));
  };

  const removeProductAttribute = (index) => {
    setProductForm((previous) => ({
      ...previous,
      attributes: (previous.attributes || []).filter((_, idx) => idx !== index),
    }));
  };

  const updateProductAttributeType = (index, attributeTypeId) => {
    const normalizedId = attributeTypeId === '' ? '' : Number(attributeTypeId) || attributeTypeId;
    const attributeDef = attributes.find((item) => `${item.id}` === `${normalizedId}`);
    setProductForm((previous) => {
      const next = (previous.attributes || []).map((item, idx) =>
        idx === index
          ? {
              ...item,
              attributeTypeId: normalizedId,
              label: item.label || attributeDef?.type || '',
              values: [],
            }
          : item,
      );
      return { ...previous, attributes: next };
    });
  };

  const updateProductAttributeLabel = (index, label) => {
    setProductForm((previous) => {
      const next = (previous.attributes || []).map((item, idx) =>
        idx === index ? { ...item, label } : item,
      );
      return { ...previous, attributes: next };
    });
  };

  const toggleProductAttributeValue = (index, valueId, checked) => {
    setProductForm((previous) => {
      const next = (previous.attributes || []).map((item) => ({
        ...item,
        values: item.values ? [...item.values] : [],
      }));
      const target = next[index];
      if (!target) return previous;
      const valueIndex = (target.values || []).findIndex(
        (value) => `${value.attributeValueId}` === `${valueId}`,
      );
      if (checked && valueIndex === -1) {
        target.values.push({ productAttributeValueId: null, attributeValueId: valueId, extraPrice: 0 });
      } else if (!checked && valueIndex !== -1) {
        target.values.splice(valueIndex, 1);
      }
      next[index] = { ...target };
      return { ...previous, attributes: next };
    });
  };

  const updateProductAttributeExtraPrice = (index, valueId, extraPrice) => {
    setProductForm((previous) => {
      const next = (previous.attributes || []).map((item) => ({
        ...item,
        values: item.values ? [...item.values] : [],
      }));
      const target = next[index];
      if (!target) return previous;
      target.values = (target.values || []).map((value) =>
        `${value.attributeValueId}` === `${valueId}`
          ? { ...value, extraPrice: Number(extraPrice) || 0 }
          : value,
      );
      next[index] = { ...target };
      return { ...previous, attributes: next };
    });
  };

  return {
    productForm,
    editingProductId,
    startCreateProduct,
    handleProductChange,
    submitProduct,
    resetProductForm,
    handleEditProduct,
    deleteProduct,
    addProductAttribute,
    removeProductAttribute,
    updateProductAttributeType,
    updateProductAttributeLabel,
    toggleProductAttributeValue,
    updateProductAttributeExtraPrice,
  };
}
