import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = '/api';

const emptyProduct = {
  productName: '',
  productDescription: '',
  productPrice: '',
  productStock: '',
  productImageUrl: '',
};

const createEmptyOrderItem = () => ({ productId: '', quantity: 1, itemPrice: '' });

export default function App() {
  const [products, setProducts] = useState([]);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [orderForm, setOrderForm] = useState({
    userId: '',
    guestEmail: '',
    guestPhone: '',
    items: [createEmptyOrderItem()],
    totalPrice: '',
  });
  const [toast, setToast] = useState({ type: 'info', message: 'Loading products...' });
  const [loadingProducts, setLoadingProducts] = useState(false);

  const productOptions = useMemo(
    () => products.map((product) => ({ value: product.productId, label: product.productName, price: product.productPrice })),
    [products],
  );

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setToast((prev) => ({ ...prev, message: '' })), 3500);
    return () => clearTimeout(timeout);
  }, [toast.message]);

  const loadProducts = async () => {
    setLoadingProducts(true);
    try {
      const response = await fetch(`${API_BASE}/products`);
      if (!response.ok) {
        throw new Error('Unable to fetch products.');
      }
      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setToast({ type: 'success', message: 'Products loaded.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductChange = (event) => {
    const { name, value } = event.target;
    setProductForm((previous) => ({ ...previous, [name]: value }));
  };

  const resetProductForm = () => {
    setProductForm(emptyProduct);
    setEditingProductId(null);
  };

  const submitProduct = async (event) => {
    event.preventDefault();
    const method = editingProductId ? 'PUT' : 'POST';
    const url = editingProductId ? `${API_BASE}/product/${editingProductId}` : `${API_BASE}/product`;
    const payload = {
      ...productForm,
      productPrice: Number(productForm.productPrice) || 0,
      productStock: Number(productForm.productStock) || 0,
    };

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

  const handleEditProduct = (product) => {
    setEditingProductId(product.productId);
    setProductForm({
      productName: product.productName || '',
      productDescription: product.productDescription || '',
      productPrice: product.productPrice ?? '',
      productStock: product.productStock ?? '',
      productImageUrl: product.productImageUrl || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const deleteProduct = async (productId) => {
    if (!window.confirm('Delete this product?')) return;

    try {
      const response = await fetch(`${API_BASE}/product/${productId}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Unable to delete product.');
      }
      setProducts((previous) => previous.filter((product) => product.productId !== productId));
      setToast({ type: 'success', message: 'Product deleted.' });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const updateOrderItem = (index, key, value) => {
    setOrderForm((previous) => {
      const items = previous.items.map((item, currentIndex) =>
        currentIndex === index ? { ...item, [key]: value } : item,
      );
      return { ...previous, items };
    });
  };

  const addOrderItemRow = () => {
    setOrderForm((previous) => ({ ...previous, items: [...previous.items, createEmptyOrderItem()] }));
  };

  const removeOrderItemRow = (index) => {
    setOrderForm((previous) => ({
      ...previous,
      items: previous.items.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  const calculateOrderTotal = () => {
    return orderForm.items.reduce((sum, item) => {
      const lineTotal = (Number(item.itemPrice) || 0) * (Number(item.quantity) || 0);
      return sum + lineTotal;
    }, 0);
  };

  useEffect(() => {
    const total = calculateOrderTotal();
    setOrderForm((previous) => ({ ...previous, totalPrice: total.toFixed(2) }));
  }, [orderForm.items]);

  const submitOrder = async (event) => {
    event.preventDefault();
    const payload = {
      ...orderForm,
      userId: orderForm.userId ? Number(orderForm.userId) : null,
      items: orderForm.items.map((item) => ({
        ...item,
        productId: Number(item.productId) || 0,
        quantity: Number(item.quantity) || 0,
        itemPrice: Number(item.itemPrice) || 0,
      })),
      totalPrice: Number(orderForm.totalPrice) || 0,
    };

    try {
      const response = await fetch(`${API_BASE}/order/place`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Unable to place order.');
      }
      const data = await response.json();
      setToast({ type: 'success', message: `Order #${data.orderId} placed successfully.` });
      setOrderForm({
        userId: '',
        guestEmail: '',
        guestPhone: '',
        items: [createEmptyOrderItem()],
        totalPrice: '',
      });
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">RGiftings</p>
        <h1>Gift store operations dashboard</h1>
        <p className="lede">
          Manage catalog data and place orders using the storefront APIs. Create gift-able products,
          update inventory, and simulate checkout with the provided endpoints.
        </p>
        <div className="hero-actions">
          <button className="primary" type="button" onClick={loadProducts} disabled={loadingProducts}>
            {loadingProducts ? 'Refreshing…' : 'Refresh products'}
          </button>
          <span className="hint">API base: {API_BASE}</span>
        </div>
        {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
      </header>

      <main className="grid">
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
          <form className="form" onSubmit={submitProduct}>
            <label>
              <span>Name</span>
              <input
                required
                name="productName"
                value={productForm.productName}
                onChange={handleProductChange}
                placeholder="Rose & Candle Gift Set"
              />
            </label>
            <label>
              <span>Description</span>
              <textarea
                required
                name="productDescription"
                value={productForm.productDescription}
                onChange={handleProductChange}
                placeholder="Cozy gifting bundle with rose-scented candle and greeting card."
              />
            </label>
            <div className="form-row">
              <label>
                <span>Price ($)</span>
                <input
                  required
                  name="productPrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.productPrice}
                  onChange={handleProductChange}
                />
              </label>
              <label>
                <span>Stock</span>
                <input
                  required
                  name="productStock"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.productStock}
                  onChange={handleProductChange}
                />
              </label>
            </div>
            <label>
              <span>Image URL</span>
              <input
                name="productImageUrl"
                value={productForm.productImageUrl}
                onChange={handleProductChange}
                placeholder="https://example.com/gift.jpg"
              />
            </label>
            <div className="form-actions">
              <button className="primary" type="submit">
                {editingProductId ? 'Update product' : 'Create product'}
              </button>
              <button className="ghost" type="button" onClick={resetProductForm}>
                Reset
              </button>
            </div>
          </form>

          <div className="product-list">
            {loadingProducts && <p className="muted">Loading products…</p>}
            {!loadingProducts && products.length === 0 && <p className="muted">No products yet.</p>}
            {products.map((product) => (
              <article key={product.productId} className="product-card">
                <div className="product-meta">
                  <p className="eyebrow">ID: {product.productId}</p>
                  <h3>{product.productName}</h3>
                  <p className="muted">{product.productDescription}</p>
                  <div className="product-stats">
                    <span>${Number(product.productPrice || 0).toFixed(2)}</span>
                    <span>{product.productStock} in stock</span>
                  </div>
                  <div className="timestamps">
                    <span>Created: {product.productCreatedAt || '—'}</span>
                    <span>Updated: {product.productUpdatedAt || '—'}</span>
                  </div>
                </div>
                {product.productImageUrl && (
                  <div className="product-image">
                    <img src={product.productImageUrl} alt={product.productName} loading="lazy" />
                  </div>
                )}
                <div className="card-actions">
                  <button type="button" onClick={() => handleEditProduct(product)}>
                    Edit
                  </button>
                  <button className="danger" type="button" onClick={() => deleteProduct(product.productId)}>
                    Delete
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Orders</p>
              <h2>Place an order</h2>
            </div>
            <p className="muted">Supports guest checkout and authenticated users.</p>
          </div>
          <form className="form" onSubmit={submitOrder}>
            <div className="form-row">
              <label>
                <span>User ID (optional)</span>
                <input
                  name="userId"
                  value={orderForm.userId}
                  onChange={(event) => setOrderForm({ ...orderForm, userId: event.target.value })}
                  placeholder="123 (leave blank for guest)"
                />
              </label>
              <label>
                <span>Guest email</span>
                <input
                  name="guestEmail"
                  type="email"
                  required={!orderForm.userId}
                  value={orderForm.guestEmail}
                  onChange={(event) => setOrderForm({ ...orderForm, guestEmail: event.target.value })}
                  placeholder="customer@email.com"
                />
              </label>
              <label>
                <span>Guest phone</span>
                <input
                  name="guestPhone"
                  type="tel"
                  required={!orderForm.userId}
                  value={orderForm.guestPhone}
                  onChange={(event) => setOrderForm({ ...orderForm, guestPhone: event.target.value })}
                  placeholder="(555) 123-4567"
                />
              </label>
            </div>

            <div className="order-items">
              <div className="order-items-header">
                <p className="eyebrow">Order items</p>
                <button type="button" className="ghost" onClick={addOrderItemRow}>
                  + Add item
                </button>
              </div>
              {orderForm.items.map((item, index) => (
                <div key={`item-${index}`} className="order-item-row">
                  <label>
                    <span>Product</span>
                    <select
                      value={item.productId}
                      onChange={(event) => {
                        const value = event.target.value;
                        const selected = productOptions.find((option) => `${option.value}` === value);
                        updateOrderItem(index, 'productId', value);
                        if (selected) {
                          updateOrderItem(index, 'itemPrice', selected.price ?? '');
                        }
                      }}
                    >
                      <option value="">Choose a product</option>
                      {productOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Quantity</span>
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(event) => updateOrderItem(index, 'quantity', event.target.value)}
                    />
                  </label>
                  <label>
                    <span>Item price ($)</span>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.itemPrice}
                      onChange={(event) => updateOrderItem(index, 'itemPrice', event.target.value)}
                    />
                  </label>
                  {orderForm.items.length > 1 && (
                    <button className="ghost" type="button" onClick={() => removeOrderItemRow(index)}>
                      Remove
                    </button>
                  )}
                </div>
              ))}
            </div>

            <div className="form-row total-row">
              <div>
                <p className="eyebrow">Total price</p>
                <p className="total">${Number(orderForm.totalPrice || 0).toFixed(2)}</p>
              </div>
              <button className="primary" type="submit">
                Place order
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}
