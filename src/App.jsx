import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

const CartContext = createContext(null);

const useCart = () => useContext(CartContext);

const createEmptyProduct = () => ({
  name: '',
  description: '',
  basePrice: '',
  stock: '',
  category: '',
  imageUrl: '',
  attributes: [],
});

const createEmptyAttribute = () => ({ type: '', description: '', values: [{ id: null, value: '', displayCode: '' }] });

const parseHashRoute = () => {
  const cleaned = window.location.hash.replace('#', '').replace(/^\//, '');
  const [pageSegment, idSegment, actionSegment] = cleaned.split('/').filter(Boolean);
  const allowedPages = ['shop', 'products', 'attributes', 'cart'];
  const page = allowedPages.includes(pageSegment) ? pageSegment : 'shop';
  return { page, id: idSegment || null, action: actionSegment || null };
};

const getAttributeTypeId = (attribute) =>
  attribute?.attributeTypeId ?? attribute?.attributeId ?? attribute?.typeId ?? attribute?.id ?? null;

const normalizeAttributeType = (attribute) => ({
  id: getAttributeTypeId(attribute),
  type: attribute?.type || attribute?.name || '',
  description: attribute?.description || '',
  values: (attribute?.attributeValues || attribute?.values || []).map((value) => ({
    id: value?.id ?? value?.attributeValueId ?? value?.valueId ?? null,
    displayCode: value?.displayCode || '',
    value: value?.value || value?.name || value?.valueName || '',
  })),
});

const normalizeProductAttributeValue = (value) => ({
  productAttributeValueId: value?.id ?? value?.productAttributeValueId ?? null,
  attributeValueId: value?.attributeValueId ?? value?.valueId ?? value?.id ?? null,
  valueLabel: value?.value || value?.name || value?.valueName || '',
  extraPrice: Number(value?.extraPrice ?? 0),
});

const normalizeProductAttribute = (attribute) => {
  const attributeTypeId = getAttributeTypeId(attribute);
  return {
    productAttributeId: attribute?.id ?? attribute?.productAttributeId ?? null,
    attributeTypeId,
    label: attribute?.label || attribute?.type || attribute?.name || '',
    values: (attribute?.values || attribute?.attributeValues || [])
      .map((value) => normalizeProductAttributeValue(value))
      .filter((value) => value.attributeValueId),
  };
};

const normalizeProduct = (product) => ({
  id: product?.id ?? product?.productId ?? null,
  name: product?.name ?? product?.productName ?? '',
  description: product?.description ?? product?.productDescription ?? '',
  basePrice: Number(product?.basePrice ?? product?.productPrice ?? 0),
  stock: Number(product?.stock ?? product?.productStock ?? 0),
  category: product?.category ?? product?.productCategory ?? '',
  imageUrl: product?.imageUrl ?? product?.productImageUrl ?? '',
  attributes: (product?.attributes ?? product?.productAttributes ?? []).map((attribute) =>
    normalizeProductAttribute(attribute),
  ),
  createdAt: product?.createdAt,
  updatedAt: product?.updatedAt,
});

const buildBaseProductPayload = (productForm) => ({
  name: productForm.name.trim(),
  description: productForm.description?.trim() || '',
  basePrice: Number(productForm.basePrice) || 0,
  stock: Number(productForm.stock) || 0,
  category: productForm.category?.trim() || '',
  imageUrl: productForm.imageUrl?.trim() || '',
});

const buildCreateProductPayload = (productForm) => {
  const attributes = (productForm.attributes || [])
    .filter((attribute) => attribute.attributeTypeId)
    .map((attribute) => ({
      attributeTypeId: Number(attribute.attributeTypeId) || attribute.attributeTypeId,
      label: attribute.label?.trim() || '',
      values: (attribute.values || [])
        .filter((value) => value.attributeValueId)
        .map((value) => ({
          attributeValueId: Number(value.attributeValueId) || value.attributeValueId,
          extraPrice: Number(value.extraPrice) || 0,
        })),
    }))
    .filter((attribute) => (attribute.values || []).length > 0);

  return { ...buildBaseProductPayload(productForm), attributes };
};

const buildUpdateProductPayload = (productForm, productId) => {
  const productAttributeRequestList = (productForm.attributes || [])
    .filter((attribute) => attribute.attributeTypeId || attribute.productAttributeId)
    .map((attribute) => {
      const productAttributeValueRequestList = (attribute.values || [])
        .filter((value) => value.attributeValueId)
        .map((value) => ({
          id: value.productAttributeValueId ?? null,
          AttributeValueId:
            value.productAttributeValueId != null
              ? undefined
              : Number(value.attributeValueId) || value.attributeValueId,
          extraPrice: Number(value.extraPrice) || 0,
        }));

      return {
        id: attribute.productAttributeId ?? null,
        attributeTypeId:
          attribute.productAttributeId != null ? undefined : Number(attribute.attributeTypeId) || attribute.attributeTypeId,
        label: attribute.label?.trim() || '',
        productAttributeValueRequestList,
      };
    })
    .filter(
      (attribute) =>
        attribute.id != null ||
        attribute.attributeTypeId != null ||
        (attribute.productAttributeValueRequestList || []).length > 0,
    );

  return {
    ...buildBaseProductPayload(productForm),
    id: productId,
    updatedAt: new Date().toISOString(),
    productAttributeRequestList,
  };
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [attributes, setAttributes] = useState([]);
  const [productForm, setProductForm] = useState(createEmptyProduct);
  const [attributeForm, setAttributeForm] = useState(createEmptyAttribute);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingAttributeId, setEditingAttributeId] = useState(null);
  const [toast, setToast] = useState({ type: 'info', message: 'Loading…' });
  const [cartItems, setCartItems] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingAttributes, setLoadingAttributes] = useState(false);
  const [route, setRoute] = useState(parseHashRoute);

  const addItemToCart = useCallback((item) => {
    const cartItemId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    setCartItems((previous) => [...previous, { ...item, cartItemId }]);
    setToast({ type: 'success', message: 'Added to cart.' });
  }, []);

  const removeItemFromCart = useCallback((cartItemId) => {
    setCartItems((previous) => previous.filter((item) => item.cartItemId !== cartItemId));
  }, []);

  const clearCart = useCallback(() => setCartItems([]), []);

  const cartValue = useMemo(
    () => ({
      items: cartItems,
      addItem: addItemToCart,
      removeItem: removeItemFromCart,
      clearCart,
      total: cartItems.reduce((sum, item) => sum + Number(item.totalPrice || 0), 0),
    }),
    [addItemToCart, cartItems, clearCart, removeItemFromCart],
  );

  useEffect(() => {
    loadProducts();
    loadAttributes();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setToast((previous) => ({ ...previous, message: '' })), 3000);
    return () => clearTimeout(timeout);
  }, [toast.message]);

  useEffect(() => {
    const handlePopState = () => setRoute(parseHashRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page, id = null, action = null) => {
    const parts = [page];
    if (id) parts.push(id);
    if (action) parts.push(action);
    const hash = `#/${parts.join('/')}`;
    window.history.pushState({ page, id, action }, '', hash);
    setRoute({ page, id, action });
  };

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
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
      const normalized = Array.isArray(data) ? data.map((item) => normalizeProduct(item)) : [];
      setProducts(normalized);
      setToast({ type: 'success', message: 'Products loaded.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message || 'Unable to fetch products.' });
    } finally {
      setLoadingProducts(false);
    }
  };

  const loadAttributes = async () => {
    setLoadingAttributes(true);
    try {
      const response = await fetch(`${API_BASE}/attribute`);
      if (!response.ok) {
        throw new Error('Unable to fetch attributes.');
      }
      const data = await response.json();
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
  };

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
      category: product.category || '',
      imageUrl: product.imageUrl || '',
      attributes: safeAttributes,
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const resetProductForm = () => {
    setProductForm(createEmptyProduct());
    setEditingProductId(null);
    navigate('products');
  };

  const startCreateProduct = () => {
    setProductForm(createEmptyProduct());
    setEditingProductId(null);
    navigate('products', 'new', 'create');
  };

  const resetAttributeForm = () => {
    setAttributeForm(createEmptyAttribute());
    setEditingAttributeId(null);
    navigate('attributes');
  };

  const startCreateAttribute = () => {
    setAttributeForm(createEmptyAttribute());
    setEditingAttributeId(null);
    navigate('attributes', 'new', 'create');
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const method = editingProductId ? 'PUT' : 'POST';
    const url = editingProductId ? `${API_BASE}/product/${editingProductId}` : `${API_BASE}/product`;
    const payload = editingProductId
      ? buildUpdateProductPayload(productForm, editingProductId)
      : buildCreateProductPayload(productForm);

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

  const handleAttributeChange = (event) => {
    const { name, value } = event.target;
    setAttributeForm((previous) => ({ ...previous, [name]: value }));
  };

  const updateAttributeValue = (index, key, value) => {
    setAttributeForm((previous) => {
      const values = previous.values.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [key]: value } : item,
      );
      return { ...previous, values };
    });
  };

  const addAttributeValueRow = () => {
    setAttributeForm((previous) => ({
      ...previous,
      values: [...previous.values, { id: null, value: '', displayCode: '' }],
    }));
  };

  const removeAttributeValueRow = (index) => {
    setAttributeForm((previous) => ({
      ...previous,
      values: previous.values.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

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

  const renderPage = () => {
    if (route.page === 'shop') {
      return (
        <ShopPage
          products={products}
          route={route}
          navigate={navigate}
          loadingProducts={loadingProducts}
          reloadProducts={loadProducts}
        />
      );
    }

    if (route.page === 'cart') {
      return <CartPage navigate={navigate} />;
    }

    if (route.page === 'attributes') {
      return (
        <AttributesPage
          route={route}
          navigate={navigate}
          startCreateAttribute={startCreateAttribute}
          attributeForm={attributeForm}
          handleAttributeChange={handleAttributeChange}
          updateAttributeValue={updateAttributeValue}
          addAttributeValueRow={addAttributeValueRow}
          removeAttributeValueRow={removeAttributeValueRow}
          submitAttribute={submitAttribute}
          resetAttributeForm={resetAttributeForm}
          attributes={attributes}
          handleEditAttribute={handleEditAttribute}
          deleteAttribute={deleteAttribute}
          editingAttributeId={editingAttributeId}
          loadingAttributes={loadingAttributes}
          reloadAttributes={loadAttributes}
        />
      );
    }

    return (
      <ProductAdminPage
        route={route}
        navigate={navigate}
        startCreateProduct={startCreateProduct}
        productForm={productForm}
        handleProductChange={handleProductChange}
        submitProduct={submitProduct}
        resetProductForm={resetProductForm}
        products={products}
        handleEditProduct={handleEditProduct}
        deleteProduct={deleteProduct}
        editingProductId={editingProductId}
        loadingProducts={loadingProducts}
        reloadProducts={loadProducts}
        attributes={attributes}
        addProductAttribute={addProductAttribute}
        removeProductAttribute={removeProductAttribute}
        updateProductAttributeType={updateProductAttributeType}
        updateProductAttributeLabel={updateProductAttributeLabel}
        toggleProductAttributeValue={toggleProductAttributeValue}
        updateProductAttributeExtraPrice={updateProductAttributeExtraPrice}
      />
    );
  };

  return (
    <CartContext.Provider value={cartValue}>
      <div className="page">
        <SiteHeader toast={toast} navigate={navigate} route={route} />
        {renderPage()}
      </div>
    </CartContext.Provider>
  );
}

function ProductForm({
  productForm,
  handleProductChange,
  submitProduct,
  resetProductForm,
  attributes,
  addProductAttribute,
  removeProductAttribute,
  updateProductAttributeType,
  updateProductAttributeLabel,
  toggleProductAttributeValue,
  updateProductAttributeExtraPrice,
  editingProductId,
  selectedProduct,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Products</p>
          <h2>{editingProductId ? 'Edit product' : 'Add new product'}</h2>
        </div>
        {editingProductId && (
          <button className="ghost" type="button" onClick={resetProductForm}>
            Cancel edit
          </button>
        )}
      </div>
      <div className="product-preview">
        <div className="detail-media">
          {productForm.imageUrl ? (
            <img src={productForm.imageUrl} alt={productForm.name || 'Product image'} />
          ) : selectedProduct?.imageUrl ? (
            <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
          ) : (
            <div className="placeholder">Image preview</div>
          )}
        </div>
        <div className="detail-content">
          <p className="eyebrow">Selected</p>
          <h3>{productForm.name || selectedProduct?.name || 'New product'}</h3>
          <p className="muted">{productForm.description || selectedProduct?.description || '—'}</p>
          <div className="product-stats">
            <span>ID: {selectedProduct?.id || '—'}</span>
            <span>${Number(productForm.basePrice || selectedProduct?.basePrice || 0).toFixed(2)}</span>
            <span>{productForm.stock || selectedProduct?.stock || 0} in stock</span>
          </div>
        </div>
      </div>
      <form className="form" onSubmit={submitProduct}>
        <label>
          <span>Name</span>
          <input
            required
            name="name"
            value={productForm.name}
            onChange={handleProductChange}
            placeholder="Rose & Candle Gift Set"
          />
        </label>
        <label>
          <span>Description</span>
          <textarea
            required
            name="description"
            value={productForm.description}
            onChange={handleProductChange}
            placeholder="Cozy gifting bundle with rose-scented candle and greeting card."
          />
        </label>
        <div className="form-row">
          <label>
            <span>Price ($)</span>
            <input
              required
              name="basePrice"
              type="number"
              min="0"
              step="0.01"
              value={productForm.basePrice}
              onChange={handleProductChange}
            />
          </label>
          <label>
            <span>Stock</span>
            <input
              required
              name="stock"
              type="number"
              min="0"
              step="1"
              value={productForm.stock}
              onChange={handleProductChange}
            />
          </label>
        </div>
        <label>
          <span>Category</span>
          <input
            name="category"
            value={productForm.category}
            onChange={handleProductChange}
            placeholder="Home decor"
          />
        </label>
        <label>
          <span>Image URL</span>
          <input
            name="imageUrl"
            value={productForm.imageUrl}
            onChange={handleProductChange}
            placeholder="https://example.com/gift.jpg"
          />
        </label>
        <div className="order-items">
          <div className="order-items-header">
            <div>
              <p className="eyebrow">Attributes</p>
              <p className="muted">Add one or more attribute sets. You can reuse types with different labels.</p>
            </div>
            <button type="button" className="ghost" onClick={addProductAttribute}>
              Add attribute
            </button>
          </div>
          {attributes.length === 0 && <p className="muted">No attributes available yet.</p>}
          {(productForm.attributes || []).length === 0 && attributes.length > 0 && (
            <button type="button" className="ghost" onClick={addProductAttribute}>
              Add first attribute
            </button>
          )}
          {(productForm.attributes || []).map((attributeEntry, index) => {
            const attributeDef = attributes.find(
              (attribute) => `${attribute.id}` === `${attributeEntry.attributeTypeId}`,
            );
            return (
              <div
                key={attributeEntry.productAttributeId ?? attributeEntry.attributeTypeId ?? index}
                className="attribute-block"
              >
                <div className="attribute-block__header">
                  <div className="form-row">
                    <label>
                      <span>
                        Attribute type {attributeEntry.attributeTypeId ? `(ID: ${attributeEntry.attributeTypeId})` : ''}
                      </span>
                      <select
                        value={attributeEntry.attributeTypeId}
                        onChange={(event) => updateProductAttributeType(index, event.target.value)}
                      >
                        <option value="">Select attribute</option>
                        {attributes.map((attribute) => (
                          <option key={attribute.id} value={attribute.id}>
                            {attribute.type} (ID: {attribute.id})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Label (optional)</span>
                      <input
                        value={attributeEntry.label}
                        onChange={(event) => updateProductAttributeLabel(index, event.target.value)}
                        placeholder={attributeDef?.type || 'Color, Size, etc.'}
                      />
                    </label>
                  </div>
                  <div className="card-actions">
                    <button className="ghost" type="button" onClick={() => removeProductAttribute(index)}>
                      Remove
                    </button>
                  </div>
                </div>
                {attributeEntry.attributeTypeId ? (
                  <div className="value-grid">
                    {(attributeDef?.values || []).map((value) => {
                      const selectedValue = (attributeEntry.values || []).find(
                        (item) => `${item.attributeValueId}` === `${value.id}`,
                      );
                      const checked = Boolean(selectedValue);
                      return (
                        <div key={value.id} className={`value-card ${checked ? 'active' : ''}`}>
                          <label className="checkbox-inline">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(event) =>
                                toggleProductAttributeValue(index, value.id, event.target.checked)
                              }
                            />
                            <div className="value-meta">
                              <div className="value-row">
                                <span className="value-code">{value.displayCode || '—'}</span>
                                <span className="value-name">{value.value || 'Value'}</span>
                              </div>
                              <p className="value-ids">
                                TypeValID: {value.id ?? '—'} · AttrValID: {value.attributeValueId ?? value.id ?? '—'}
                              </p>
                            </div>
                          </label>
                          {checked && (
                            <div className="extra-price">
                              <span>Extra price</span>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={selectedValue?.extraPrice ?? 0}
                                onChange={(event) =>
                                  updateProductAttributeExtraPrice(index, value.id, event.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {(attributeDef?.values || []).length === 0 && (
                      <span className="pill muted">No values available for this attribute type</span>
                    )}
                  </div>
                ) : (
                  <p className="muted">Select an attribute type to pick values.</p>
                )}
              </div>
            );
          })}
        </div>
        <div className="form-actions">
          <button className="primary" type="submit">
            {editingProductId ? 'Update product' : 'Create product'}
          </button>
          <button className="ghost" type="button" onClick={resetProductForm}>
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}
function SiteHeader({ toast, navigate, route }) {
  const cart = useCart();
  const cartCount = cart?.items?.length || 0;

  return (
    <header className="site-header">
      <div className="brand" role="button" tabIndex={0} onClick={() => navigate('shop')}>
        <span className="dot" />
        <div>
          <p className="eyebrow">RGiftings</p>
          <strong>Shop & Admin</strong>
        </div>
      </div>
      <nav>
        <button
          type="button"
          className={route.page === 'shop' ? 'primary' : 'ghost'}
          onClick={() => navigate('shop')}
        >
          Shop
        </button>
        <button
          type="button"
          className={route.page === 'cart' ? 'primary' : 'ghost'}
          onClick={() => navigate('cart')}
        >
          Cart {cartCount > 0 ? `(${cartCount})` : ''}
        </button>
        <button
          type="button"
          className={route.page === 'products' ? 'primary' : 'ghost'}
          onClick={() => navigate('products')}
        >
          Admin: Products
        </button>
        <button
          type="button"
          className={route.page === 'attributes' ? 'primary' : 'ghost'}
          onClick={() => navigate('attributes')}
        >
          Admin: Attributes
        </button>
      </nav>
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </header>
  );
}

function ShopPage({ products, route, navigate, loadingProducts, reloadProducts }) {
  const selectedProduct = products.find((product) => `${product.id}` === `${route.id || ''}`) || null;

  if (route.id && selectedProduct) {
    return <ProductDetailPage product={selectedProduct} navigate={navigate} />;
  }

  return (
    <div className="stacked-columns">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Storefront</p>
            <h2>Available gifts</h2>
          </div>
          <div className="card-actions">
            <button className="ghost" type="button" onClick={reloadProducts} disabled={loadingProducts}>
              {loadingProducts ? 'Refreshing…' : 'Refresh'}
            </button>
            <button type="button" onClick={() => navigate('cart')}>
              View cart
            </button>
          </div>
        </div>
        {loadingProducts && <p className="muted">Loading products…</p>}
        {!loadingProducts && products.length === 0 && <p className="muted">No products yet.</p>}
        <div className="tile-grid shop-grid">
          {products.map((product) => (
            <article
              key={product.id}
              className="tile-card"
              onClick={() => navigate('shop', product.id)}
            >
              <div className="tile-cover">
                {product.imageUrl ? (
                  <img src={product.imageUrl} alt={product.name} />
                ) : (
                  <div className="placeholder small">No image</div>
                )}
              </div>
              <div className="tile-content">
                <p className="eyebrow">ID: {product.id}</p>
                <h3>{product.name}</h3>
                <p className="muted one-line">{product.description || 'No description provided.'}</p>
                <div className="price-row">
                  <span className="price-chip">${Number(product.basePrice || 0).toFixed(2)}</span>
                  <span className="pill muted">{product.category || 'General'}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        {route.id && !loadingProducts && !selectedProduct && <p className="muted">Product not found.</p>}
      </section>
    </div>
  );
}

function ProductDetailPage({ product, navigate }) {
  const cart = useCart();

  const getAttributeKey = (attribute, index) =>
    `${attribute.productAttributeId ?? attribute.attributeTypeId ?? attribute.id ?? index}`;

  const buildDefaultSelections = (currentProduct) => {
    const defaults = {};
    (currentProduct.attributes || []).forEach((attribute, index) => {
      const key = getAttributeKey(attribute, index);
      const firstValue = (attribute.values || [])[0];
      if (!firstValue) return;
      defaults[key] = {
        attributeTypeId: attribute.attributeTypeId ?? attribute.productAttributeId ?? attribute.id ?? key,
        attributeValueId: firstValue.attributeValueId ?? firstValue.id ?? null,
        valueLabel: firstValue.valueLabel || firstValue.value || '',
        extraPrice: Number(firstValue.extraPrice || 0),
      };
    });
    return defaults;
  };

  const [selectedValues, setSelectedValues] = useState(buildDefaultSelections(product));

  useEffect(() => {
    setSelectedValues(buildDefaultSelections(product));
  }, [product.id]);

  const handleSelectValue = (attribute, value, index) => {
    const attributeKey = getAttributeKey(attribute, index);
    setSelectedValues((previous) => ({
      ...previous,
      [attributeKey]: {
        attributeTypeId: attribute.attributeTypeId ?? attribute.productAttributeId ?? attribute.id ?? attributeKey,
        attributeValueId: value.attributeValueId ?? value.id ?? null,
        valueLabel: value.valueLabel || value.value || '',
        extraPrice: Number(value.extraPrice || 0),
      },
    }));
  };

  const selectedAttributes = useMemo(
    () =>
      (product.attributes || [])
        .map((attribute, index) => {
          const key = getAttributeKey(attribute, index);
          const selected = selectedValues[key];
          if (!selected) return null;
          return {
            attributeTypeId: selected.attributeTypeId ?? attribute.attributeTypeId ?? attribute.id ?? attribute.productAttributeId,
            attributeValueId: selected.attributeValueId,
            valueLabel: selected.valueLabel,
            extraPrice: Number(selected.extraPrice || 0),
          };
        })
        .filter(Boolean),
    [product.attributes, selectedValues],
  );

  const finalPrice = useMemo(
    () => Number(product.basePrice || 0) + selectedAttributes.reduce((sum, item) => sum + Number(item.extraPrice || 0), 0),
    [product.basePrice, selectedAttributes],
  );

  const handleAddToCart = () => {
    if (!cart?.addItem) return;
    cart.addItem({
      productId: product.id,
      name: product.name,
      basePrice: Number(product.basePrice || 0),
      selectedAttributes,
      totalPrice: finalPrice,
      imageUrl: product.imageUrl,
      description: product.description,
    });
  };

  return (
    <div className="stacked-columns">
      <section className="panel wide detail-page">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Product detail</p>
            <h2>{product.name}</h2>
            <p className="muted">{product.description || 'No description provided.'}</p>
          </div>
          <div className="card-actions">
            <button className="ghost" type="button" onClick={() => navigate('shop')}>
              Back to products
            </button>
            <button className="ghost" type="button" onClick={() => navigate('cart')}>
              Cart {cart?.items?.length ? `(${cart.items.length})` : ''}
            </button>
          </div>
        </div>
        <div className="product-detail shopper">
          <div className="detail-media">
            {product.imageUrl ? (
              <img src={product.imageUrl} alt={product.name} />
            ) : (
              <div className="placeholder">No image</div>
            )}
          </div>
          <div className="detail-body">
            <div className="detail-meta">
              <span className="pill">Base: ${Number(product.basePrice || 0).toFixed(2)}</span>
              <span className="pill muted">Category: {product.category || '—'}</span>
              <span className="pill muted">ID: {product.id ?? '—'}</span>
            </div>
            {(product.attributes || []).length > 0 ? (
              <div className="attribute-values detailed">
                {(product.attributes || []).map((attribute, index) => (
                  <div key={attribute.attributeTypeId ?? index} className="attribute-block">
                    <div className="attribute-block__header">
                      <div>
                        <p className="eyebrow">{attribute.label || attribute.type || 'Attribute'}</p>
                        <strong>{attribute.attributeTypeId ? `Type ID: ${attribute.attributeTypeId}` : ''}</strong>
                      </div>
                    </div>
                    <div className="value-grid">
                      {(attribute.values || []).map((value) => {
                        const attributeKey = getAttributeKey(attribute, index);
                        const selected = selectedValues[attributeKey];
                        const isSelected =
                          selected && `${selected.attributeValueId}` === `${value.attributeValueId ?? value.id ?? ''}`;
                        return (
                          <label
                            key={value.attributeValueId ?? value.id}
                            className={`value-card selectable ${isSelected ? 'active' : ''}`}
                          >
                            <div className="checkbox-inline">
                              <input
                                type="radio"
                                name={`attribute-${attribute.productAttributeId ?? attributeKey}`}
                                checked={isSelected}
                                onChange={() => handleSelectValue(attribute, value, index)}
                              />
                              <div className="value-meta">
                                <div className="value-row">
                                  <span className="value-name">{value.valueLabel || value.value || 'Value'}</span>
                                  {value.extraPrice ? (
                                    <span className="price-chip small">+${Number(value.extraPrice).toFixed(2)}</span>
                                  ) : (
                                    <span className="pill muted">Included</span>
                                  )}
                                </div>
                                <p className="value-ids">
                                  Value ID: {value.attributeValueId ?? value.id ?? '—'}
                                </p>
                              </div>
                            </div>
                          </label>
                        );
                      })}
                      {(attribute.values || []).length === 0 && (
                        <span className="pill muted">No values for this attribute</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="muted">No attributes available for this product.</p>
            )}
            <div className="detail-actions">
              <div className="price-row">
                <div>
                  <p className="eyebrow">Final price</p>
                  <h3>${finalPrice.toFixed(2)}</h3>
                </div>
              </div>
              <button className="primary" type="button" onClick={handleAddToCart} disabled={!cart?.addItem}>
                Add to cart
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function CartPage({ navigate }) {
  const cart = useCart();
  const items = cart?.items || [];

  return (
    <div className="stacked-columns">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Cart</p>
            <h2>Your items</h2>
          </div>
          <div className="card-actions">
            <button className="ghost" type="button" onClick={() => navigate('shop')}>
              Continue shopping
            </button>
            <span className="pill">Total: ${Number(cart?.total || 0).toFixed(2)}</span>
          </div>
        </div>
        {items.length === 0 && <p className="muted">Your cart is empty.</p>}
        <div className="stacked-list">
          {items.map((item) => (
            <article key={item.cartItemId} className="list-card cart-card">
              <div className="cart-card__content">
                <div className="cart-card__media">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} />
                  ) : (
                    <div className="placeholder small">No image</div>
                  )}
                </div>
                <div className="cart-card__body">
                  <p className="eyebrow">ID: {item.productId ?? '—'}</p>
                  <h3>{item.name}</h3>
                  <p className="muted one-line">{item.description || 'No description.'}</p>
                  <div className="mini-pills">
                    <span className="pill muted">Base: ${Number(item.basePrice || 0).toFixed(2)}</span>
                    <span className="pill">Final: ${Number(item.totalPrice || 0).toFixed(2)}</span>
                  </div>
                  {(item.selectedAttributes || []).length > 0 && (
                    <div className="attribute-values">
                      {item.selectedAttributes.map((attr) => (
                        <span key={`${attr.attributeTypeId}-${attr.attributeValueId}`} className="pill">
                          {attr.valueLabel || 'Value'} {attr.extraPrice ? `(+$${Number(attr.extraPrice).toFixed(2)})` : ''}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="cart-card__actions">
                  <button className="ghost" type="button" onClick={() => cart?.removeItem?.(item.cartItemId)}>
                    Remove
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
        {items.length > 0 && (
          <div className="cart-summary">
            <div>
              <p className="eyebrow">Cart total</p>
              <h3>${Number(cart?.total || 0).toFixed(2)}</h3>
            </div>
            <div className="card-actions">
              <button className="ghost" type="button" onClick={cart?.clearCart}>
                Clear cart
              </button>
              <button className="primary" type="button">
                Checkout (demo)
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

function ProductAdminPage({
  route,
  navigate,
  startCreateProduct,
  productForm,
  handleProductChange,
  submitProduct,
  resetProductForm,
  products,
  handleEditProduct,
  deleteProduct,
  editingProductId,
  loadingProducts,
  reloadProducts,
  attributes,
  addProductAttribute,
  removeProductAttribute,
  updateProductAttributeType,
  updateProductAttributeLabel,
  toggleProductAttributeValue,
  updateProductAttributeExtraPrice,
}) {
  const selectedProduct =
    products.find((product) => `${product.id}` === `${route.id || editingProductId || ''}`) || null;
  const isCreate = route.id === 'new' || route.action === 'create';
  const isEditingPage = route.action === 'edit';

  if (isCreate || isEditingPage) {
    return (
      <div className="stacked-columns">
        <section className="panel wide detail-page">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{isCreate ? 'Create product' : 'Edit product'}</p>
              <h2>{isCreate ? 'New product' : selectedProduct?.name || 'Edit product'}</h2>
            </div>
            <div className="card-actions">
              <button className="ghost" type="button" onClick={() => navigate('products')}>
                Back to list
              </button>
            </div>
          </div>
          <ProductForm
            productForm={productForm}
            handleProductChange={handleProductChange}
            submitProduct={submitProduct}
            resetProductForm={resetProductForm}
            attributes={attributes}
            addProductAttribute={addProductAttribute}
            removeProductAttribute={removeProductAttribute}
            updateProductAttributeType={updateProductAttributeType}
            updateProductAttributeLabel={updateProductAttributeLabel}
            toggleProductAttributeValue={toggleProductAttributeValue}
            updateProductAttributeExtraPrice={updateProductAttributeExtraPrice}
            editingProductId={isCreate ? null : editingProductId}
          />
        </section>
      </div>
    );
  }

  if (route.id && selectedProduct) {
    return (
      <div className="stacked-columns">
        <section className="panel wide detail-page">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Product detail</p>
              <h2>
                {selectedProduct.name} (ID: {selectedProduct.id})
              </h2>
              <p className="muted">{selectedProduct.description}</p>
            </div>
            <div className="card-actions">
              <button className="ghost" type="button" onClick={() => navigate('products')}>
                Back to products
              </button>
              <button type="button" onClick={() => handleEditProduct(selectedProduct, { openForm: true })}>
                Edit
              </button>
              <button className="danger" type="button" onClick={() => deleteProduct(selectedProduct.id)}>
                Delete
              </button>
            </div>
          </div>
          <div className="product-detail">
            <div className="detail-media">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
              ) : (
                <div className="placeholder">No image</div>
              )}
            </div>
            <div className="detail-body">
              <div className="detail-meta">
                <span className="pill">Price: ${Number(selectedProduct.basePrice || 0).toFixed(2)}</span>
                <span className="pill muted">Stock: {selectedProduct.stock}</span>
                <span className="pill muted">Category: {selectedProduct.category || '—'}</span>
              </div>
              {(selectedProduct.attributes || []).length > 0 ? (
                <div className="attribute-values detailed">
                  {(selectedProduct.attributes || []).map((attr, idx) => (
                    <div
                      key={attr.productAttributeId ?? attr.attributeTypeId ?? idx}
                      className="attribute-chip"
                    >
                      <p className="eyebrow">
                        ProdAttrID: {attr.productAttributeId ?? '—'} · TypeID: {attr.attributeTypeId ?? '—'} ·{' '}
                        {attr.label || 'Attribute'}
                      </p>
                      <div className="pill-row">
                        {(attr.values || []).map((value, valIdx) => (
                          <span
                            key={value.productAttributeValueId ?? value.attributeValueId ?? valIdx}
                            className="pill"
                          >
                            AttrValID: {value.attributeValueId ?? '—'} · ProdAttrValID:{' '}
                            {value.productAttributeValueId ?? '—'}
                            {value.valueLabel || value.value ? ` · ${value.valueLabel || value.value}` : ''}
                            {value.extraPrice ? ` (+$${Number(value.extraPrice).toFixed(2)})` : ''}
                          </span>
                        ))}
                        {(attr.values || []).length === 0 && <span className="pill muted">No values</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No attributes on this product.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  if (route.id && selectedProduct) {
    return (
      <div className="stacked-columns">
        <section className="panel wide detail-page">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Product detail</p>
              <h2>
                {selectedProduct.name} (ID: {selectedProduct.id})
              </h2>
              <p className="muted">{selectedProduct.description}</p>
            </div>
            <div className="card-actions">
              <button className="ghost" type="button" onClick={() => navigate('products')}>
                Back to products
              </button>
              <button type="button" onClick={() => handleEditProduct(selectedProduct, { openForm: true })}>
                Edit
              </button>
              <button className="danger" type="button" onClick={() => deleteProduct(selectedProduct.id)}>
                Delete
              </button>
            </div>
          </div>
          <div className="product-detail">
            <div className="detail-media">
              {selectedProduct.imageUrl ? (
                <img src={selectedProduct.imageUrl} alt={selectedProduct.name} />
              ) : (
                <div className="placeholder">No image</div>
              )}
            </div>
            <div className="detail-body">
              <div className="detail-meta">
                <span className="pill">Price: ${Number(selectedProduct.basePrice || 0).toFixed(2)}</span>
                <span className="pill muted">Stock: {selectedProduct.stock}</span>
                <span className="pill muted">Category: {selectedProduct.category || '—'}</span>
              </div>
              {(selectedProduct.attributes || []).length > 0 ? (
                <div className="attribute-values detailed">
                  {(selectedProduct.attributes || []).map((attr, idx) => (
                    <div
                      key={attr.productAttributeId ?? attr.attributeTypeId ?? idx}
                      className="attribute-chip"
                    >
                      <p className="eyebrow">
                        ProdAttrID: {attr.productAttributeId ?? '—'} · TypeID: {attr.attributeTypeId ?? '—'} ·{' '}
                        {attr.label || 'Attribute'}
                      </p>
                      <div className="pill-row">
                        {(attr.values || []).map((value, valIdx) => (
                          <span
                            key={value.productAttributeValueId ?? value.attributeValueId ?? valIdx}
                            className="pill"
                          >
                            AttrValID: {value.attributeValueId ?? '—'} · ProdAttrValID:{' '}
                            {value.productAttributeValueId ?? '—'}
                            {value.valueLabel || value.value ? ` · ${value.valueLabel || value.value}` : ''}
                            {value.extraPrice ? ` (+$${Number(value.extraPrice).toFixed(2)})` : ''}
                          </span>
                        ))}
                        {(attr.values || []).length === 0 && <span className="pill muted">No values</span>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="muted">No attributes on this product.</p>
              )}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="stacked-columns">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Products</h2>
          </div>
          <div className="card-actions">
            <button className="ghost" type="button" onClick={startCreateProduct}>
              Add product
            </button>
            <button className="ghost" type="button" onClick={reloadProducts} disabled={loadingProducts}>
              {loadingProducts ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        {loadingProducts && <p className="muted">Loading products…</p>}
        {!loadingProducts && products.length === 0 && <p className="muted">No products yet.</p>}
        <div className="tile-grid">
          {products.map((product) => {
            const active = `${route.id}` === `${product.id}`;
            return (
              <article
                key={product.id}
                className={`tile-card ${active ? 'active' : ''}`}
                onClick={() => navigate('products', product.id)}
              >
                <div className="tile-cover">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} />
                  ) : (
                    <div className="placeholder small">No image</div>
                  )}
                </div>
                <div className="tile-content">
                  <p className="eyebrow">ID: {product.id}</p>
                  <h3>{product.name}</h3>
                  <p className="muted one-line">{product.description}</p>
                  <div className="product-stats inline">
                    <span>${Number(product.basePrice || 0).toFixed(2)}</span>
                    <span>{product.stock} in stock</span>
                  </div>
                  <div className="mini-pills">
                    <span className="pill muted">Type: {product.category || '—'}</span>
                    <span className="pill muted">
                      Attrs: {(product.attributes || []).length}
                    </span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {route.id && !selectedProduct && <p className="muted">Product not found.</p>}
      </section>
    </div>
  );
}

function AttributesPage({
  route,
  navigate,
  startCreateAttribute,
  attributeForm,
  handleAttributeChange,
  updateAttributeValue,
  addAttributeValueRow,
  removeAttributeValueRow,
  submitAttribute,
  resetAttributeForm,
  attributes,
  handleEditAttribute,
  deleteAttribute,
  editingAttributeId,
  loadingAttributes,
  reloadAttributes,
}) {
  const selectedAttribute =
    attributes.find((attribute) => `${getAttributeTypeId(attribute)}` === `${route.id || ''}`) || null;
  const isCreate = route.id === 'new' || route.action === 'create';
  const isEditingPage = route.action === 'edit';

  if (isCreate || isEditingPage) {
    return (
      <div className="stacked-columns">
        <section className="panel wide detail-page">
          <div className="panel-header">
            <div>
              <p className="eyebrow">{isCreate ? 'Create attribute' : 'Edit attribute'}</p>
              <h2>{isCreate ? 'New attribute' : selectedAttribute?.type || 'Edit attribute'}</h2>
            </div>
            <div className="card-actions">
              <button className="ghost" type="button" onClick={() => navigate('attributes')}>
                Back to list
              </button>
            </div>
          </div>
          <AttributesForm
            attributeForm={attributeForm}
            handleAttributeChange={handleAttributeChange}
            updateAttributeValue={updateAttributeValue}
            addAttributeValueRow={addAttributeValueRow}
            removeAttributeValueRow={removeAttributeValueRow}
            submitAttribute={submitAttribute}
            resetAttributeForm={resetAttributeForm}
            editingAttributeId={isCreate ? null : editingAttributeId}
          />
        </section>
      </div>
    );
  }

  if (route.id && selectedAttribute && !route.action) {
    return (
      <div className="stacked-columns">
        <section className="panel wide detail-page">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Attribute detail</p>
              <h2>
                {selectedAttribute.type || 'Untitled attribute'} (ID: {getAttributeTypeId(selectedAttribute) ?? '—'})
              </h2>
              <p className="muted">{selectedAttribute.description || 'No description provided.'}</p>
            </div>
            <div className="card-actions">
              <button className="ghost" type="button" onClick={() => navigate('attributes')}>
                Back to attributes
              </button>
              <button type="button" onClick={() => handleEditAttribute(selectedAttribute, { openForm: true })}>
                Edit
              </button>
              <button className="danger" type="button" onClick={() => deleteAttribute(selectedAttribute)}>
                Delete
              </button>
            </div>
          </div>
          <div className="attribute-values">
            {(selectedAttribute.values || []).map((value, index) => (
              <span key={value.displayCode || value.value || index} className="pill">
                ID: {value.id || value.valueId || value.attributeValueId || '—'} · {value.displayCode || '—'} ·{' '}
                {value.value || 'Value'}
              </span>
            ))}
            {(selectedAttribute.values || []).length === 0 && <span className="pill muted">No values</span>}
          </div>
        </section>
      </div>
    );
  }
  return (
    <div className="stacked-columns">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Attribute library</p>
            <h2>Manage attributes</h2>
          </div>
          <div className="card-actions">
            <button className="ghost" type="button" onClick={startCreateAttribute}>
              Add attribute
            </button>
            <button className="ghost" type="button" onClick={reloadAttributes} disabled={loadingAttributes}>
              {loadingAttributes ? 'Refreshing…' : 'Refresh'}
            </button>
          </div>
        </div>
        {loadingAttributes && <p className="muted">Loading attributes…</p>}
        {!loadingAttributes && attributes.length === 0 && <p className="muted">No attributes yet.</p>}
        <div className="tile-grid">
          {attributes.map((attribute) => {
            const attributeId = getAttributeTypeId(attribute);
            const active = `${route.id}` === `${attributeId}`;
            return (
              <article
                key={attributeId || attribute.type}
                className={`tile-card ${active ? 'active' : ''}`}
                onClick={() => navigate('attributes', attributeId)}
              >
                <div className="tile-content">
                  <p className="eyebrow">ID: {attributeId ?? '—'}</p>
                  <h3>{attribute.type || 'Untitled attribute'}</h3>
                  <p className="muted one-line">{attribute.description || 'No description provided.'}</p>
                  <div className="mini-pills">
                    <span className="pill muted">Values: {(attribute.values || []).length}</span>
                  </div>
                  <div className="card-actions">
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleEditAttribute(attribute, { openForm: true });
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="danger"
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        deleteAttribute(attribute);
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
        {route.id && !selectedAttribute && <p className="muted">Attribute not found.</p>}
      </section>

    </div>
  );
}

function AttributesForm({
  attributeForm,
  handleAttributeChange,
  updateAttributeValue,
  addAttributeValueRow,
  removeAttributeValueRow,
  submitAttribute,
  resetAttributeForm,
  editingAttributeId,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Attributes</p>
          <h2>{editingAttributeId ? 'Edit attribute' : 'Create attribute'}</h2>
        </div>
        {editingAttributeId && (
          <button type="button" className="ghost" onClick={resetAttributeForm}>
            Cancel edit
          </button>
        )}
      </div>
      <form className="form" onSubmit={submitAttribute}>
        <label>
          <span>Type</span>
          <input
            required
            name="type"
            value={attributeForm.type}
            onChange={handleAttributeChange}
            placeholder="Color, Size, Material"
          />
        </label>
        <label>
          <span>Description</span>
          <textarea
            name="description"
            value={attributeForm.description}
            onChange={handleAttributeChange}
            placeholder="Optional description to help admins"
          />
        </label>
        <div className="order-items">
          <div className="order-items-header">
            <div>
              <p className="eyebrow">Values</p>
              <p className="muted">Add one or more values for this attribute.</p>
            </div>
            <button type="button" className="ghost" onClick={addAttributeValueRow}>
              Add value
            </button>
          </div>
          {attributeForm.values.map((value, index) => (
            <div key={index} className="order-item-row">
              <label>
                <span>Display code</span>
                <input
                  required
                  value={value.displayCode}
                  onChange={(event) => updateAttributeValue(index, 'displayCode', event.target.value)}
                  placeholder="RED"
                />
              </label>
              <label>
                <span>Value</span>
                <input
                  required
                  value={value.value}
                  onChange={(event) => updateAttributeValue(index, 'value', event.target.value)}
                  placeholder="Red"
                />
              </label>
              {attributeForm.values.length > 1 && (
                <div className="form-actions compact">
                  <button
                    className="ghost"
                    type="button"
                    onClick={() => removeAttributeValueRow(index)}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
        <div className="form-actions">
          <button className="primary" type="submit">
            {editingAttributeId ? 'Update attribute' : 'Create attribute'}
          </button>
          <button className="ghost" type="button" onClick={resetAttributeForm}>
            Reset
          </button>
        </div>
      </form>
    </section>
  );
}
