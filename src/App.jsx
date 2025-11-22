import { useEffect, useMemo, useState } from 'react';
import './App.css';

const API_BASE = 'http://localhost:8080/api';

const emptyProduct = {
  productName: '',
  productDescription: '',
  productPrice: '',
  productStock: '',
  productImageUrl: '',
};

const createEmptyOrderItem = () => ({ productId: '', quantity: 1, itemPrice: '' });

const featureHighlights = [
  {
    title: 'Curated gift boxes',
    copy: 'Thoughtfully paired products that make gifting effortless and memorable.',
  },
  {
    title: 'Fast fulfillment',
    copy: 'Real-time inventory lets you place and track orders with confidence.',
  },
  {
    title: 'Admin friendly',
    copy: 'Manage catalog, pricing, and imagery without leaving the dashboard.',
  },
];

const parseHashRoute = () => {
  const cleaned = window.location.hash.replace('#', '').replace(/^\//, '');
  const [page, productId] = cleaned.split('/').filter(Boolean);
  return {
    page: page || 'home',
    productId: productId || null,
  };
};

export default function App() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
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
  const [route, setRoute] = useState(parseHashRoute);

  const productOptions = useMemo(
    () => products.map((product) => ({ value: product.productId, label: product.productName, price: product.productPrice })),
    [products],
  );

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setToast((previous) => ({ ...previous, message: '' })), 3500);
    return () => clearTimeout(timeout);
  }, [toast.message]);

  useEffect(() => {
    const handlePopState = () => setRoute(parseHashRoute());
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (page, productId = null) => {
    const newHash = `#/${page}${productId ? `/${productId}` : ''}`;
    window.history.pushState({ page, productId }, '', newHash);
    setRoute({ page, productId });
  };

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
      const orderRecord = {
        orderId: data.orderId ?? Date.now(),
        customer: payload.userId ? `User #${payload.userId}` : payload.guestEmail || 'Guest checkout',
        totalPrice: payload.totalPrice,
        itemCount: payload.items.reduce((sum, item) => sum + item.quantity, 0),
        createdAt: new Date().toLocaleString(),
      };
      setOrders((previous) => [orderRecord, ...previous]);
      setToast({ type: 'success', message: `Order #${orderRecord.orderId} placed successfully.` });
      setOrderForm({
        userId: '',
        guestEmail: '',
        guestPhone: '',
        items: [createEmptyOrderItem()],
        totalPrice: '',
      });
      navigate('orders');
    } catch (error) {
      setToast({ type: 'error', message: error.message });
    }
  };

  const prefillOrderWithProduct = (product) => {
    if (!product) return;
    setOrderForm({
      userId: '',
      guestEmail: '',
      guestPhone: '',
      items: [
        {
          productId: product.productId?.toString() || '',
          quantity: 1,
          itemPrice: product.productPrice ?? '',
        },
      ],
      totalPrice: Number(product.productPrice || 0).toFixed(2),
    });
    navigate('order');
  };

  const renderPage = () => {
    switch (route.page) {
      case 'products':
        return <ProductsPage products={products} loadingProducts={loadingProducts} onNavigate={navigate} />;
      case 'product':
        return (
          <ProductDetails
            products={products}
            productId={route.productId}
            onShop={prefillOrderWithProduct}
            onNavigate={navigate}
          />
        );
      case 'order':
        return (
          <OrderPage
            orderForm={orderForm}
            setOrderForm={setOrderForm}
            productOptions={productOptions}
            updateOrderItem={updateOrderItem}
            addOrderItemRow={addOrderItemRow}
            removeOrderItemRow={removeOrderItemRow}
            submitOrder={submitOrder}
          />
        );
      case 'orders':
        return <OrderHistoryPage orders={orders} />;
      case 'admin':
        return (
          <AdminPage
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
          />
        );
      default:
        return (
          <HomePage
            products={products}
            onShop={(product) => prefillOrderWithProduct(product)}
            loadingProducts={loadingProducts}
            onNavigate={navigate}
          />
        );
    }
  };

  return (
    <div className="page">
      <SiteHeader toast={toast} navigate={navigate} />
      {renderPage()}
    </div>
  );
}

function SiteHeader({ toast, navigate }) {
  const handleBrandKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      navigate('home');
    }
  };

  return (
    <header className="site-header">
      <div
        className="brand"
        onClick={() => navigate('home')}
        onKeyDown={handleBrandKeyDown}
        role="button"
        tabIndex={0}
      >
        <span className="dot" />
        <div>
          <p className="eyebrow">RGiftings</p>
          <strong>Marketplace</strong>
        </div>
      </div>
      <nav>
        <button type="button" className="ghost" onClick={() => navigate('home')}>
          Home
        </button>
        <button type="button" className="ghost" onClick={() => navigate('products')}>
          Products
        </button>
        <button type="button" className="ghost" onClick={() => navigate('order')}>
          Place order
        </button>
        <button type="button" className="ghost" onClick={() => navigate('orders')}>
          Order history
        </button>
        <button type="button" className="ghost" onClick={() => navigate('admin')}>
          Admin
        </button>
      </nav>
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </header>
  );
}

function HomePage({ products, onShop, loadingProducts, onNavigate }) {
  const featured = products.slice(0, 3);
  return (
    <div className="home">
      <section className="hero">
        <div>
          <p className="eyebrow">Gifts for every story</p>
          <h1>Delightful finds for shoppers and admins alike.</h1>
          <p className="lede">
            Browse curated products, preview details, and test checkout flows. With the built-in admin
            workspace you can create, update, and remove inventory in seconds.
          </p>
          <div className="hero-actions">
            <button className="primary" type="button" onClick={() => onNavigate('products')}>
              Shop the collection
            </button>
            <button className="ghost" type="button" onClick={() => onNavigate('admin')}>
              Manage catalog
            </button>
          </div>
          <p className="hint">API base: {API_BASE}</p>
        </div>
        <div className="hero-card">
          <p className="eyebrow">Fast checkout</p>
          <h3>Place an order in moments</h3>
          <p>
            The order form supports authenticated and guest flows with real-time pricing and quantity
            calculations.
          </p>
          <button className="primary block" type="button" onClick={() => onNavigate('order')}>
            Start checkout
          </button>
        </div>
      </section>

      <section className="feature-grid">
        {featureHighlights.map((feature) => (
          <article key={feature.title} className="feature">
            <h3>{feature.title}</h3>
            <p>{feature.copy}</p>
          </article>
        ))}
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Trending now</p>
            <h2>Best picks from the catalog</h2>
          </div>
          <button className="ghost" type="button" onClick={() => onNavigate('products')}>
            View all products
          </button>
        </div>
        {loadingProducts && <p className="muted">Loading products…</p>}
        {!loadingProducts && featured.length === 0 && <p className="muted">No products yet.</p>}
        <ProductGrid products={featured} onShop={onShop} onNavigate={onNavigate} />
      </section>
    </div>
  );
}

function ProductsPage({ products, loadingProducts, onNavigate }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Explore all products</h2>
        </div>
        <button className="ghost" type="button" onClick={() => onNavigate('admin')}>
          Admin tools
        </button>
      </div>
      {loadingProducts && <p className="muted">Loading products…</p>}
      {!loadingProducts && products.length === 0 && <p className="muted">No products available.</p>}
      <ProductGrid products={products} allowLinks onNavigate={onNavigate} />
    </section>
  );
}

function ProductDetails({ products, productId, onShop, onNavigate }) {
  const product = products.find((item) => `${item.productId}` === productId);

  if (!product) {
    return (
      <section className="panel">
        <p className="eyebrow">Product</p>
        <h2>We couldn't find that product.</h2>
        <p className="muted">Return to the catalog to continue shopping.</p>
        <button type="button" className="primary" onClick={() => onNavigate('products')}>
          Back to products
        </button>
      </section>
    );
  }

  return (
    <section className="panel product-detail">
      <div className="detail-media">
        {product.productImageUrl ? (
          <img src={product.productImageUrl} alt={product.productName} />
        ) : (
          <div className="placeholder">Image coming soon</div>
        )}
      </div>
      <div className="detail-content">
        <p className="eyebrow">Product</p>
        <h2>{product.productName}</h2>
        <p className="muted">{product.productDescription}</p>
        <div className="product-stats">
          <span>${Number(product.productPrice || 0).toFixed(2)}</span>
          <span>{product.productStock} in stock</span>
        </div>
        <div className="detail-actions">
          <button className="primary" type="button" onClick={() => onShop(product)}>
            Add to order
          </button>
          <button className="ghost" type="button" onClick={() => onNavigate('products')}>
            Continue shopping
          </button>
        </div>
      </div>
    </section>
  );
}

function ProductGrid({ products, allowLinks = false, onShop, onNavigate }) {
  return (
    <div className="product-grid">
      {products.map((product) => (
        <article key={product.productId} className="product-card">
          {product.productImageUrl ? (
            <img src={product.productImageUrl} alt={product.productName} />
          ) : (
            <div className="placeholder">No image</div>
          )}
          <div className="product-info">
            <p className="eyebrow">ID: {product.productId}</p>
            <h3>{product.productName}</h3>
            <p className="muted">{product.productDescription}</p>
            <div className="product-stats">
              <span>${Number(product.productPrice || 0).toFixed(2)}</span>
              <span>{product.productStock} in stock</span>
            </div>
          </div>
          <div className="card-actions">
            {allowLinks ? (
              <button className="primary" type="button" onClick={() => onNavigate('product', product.productId)}>
                View details
              </button>
            ) : (
              <button className="primary" type="button" onClick={() => onShop?.(product)}>
                Add to order
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function OrderPage({
  orderForm,
  setOrderForm,
  productOptions,
  updateOrderItem,
  addOrderItemRow,
  removeOrderItemRow,
  submitOrder,
}) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Checkout</p>
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
  );
}

function OrderHistoryPage({ orders }) {
  return (
    <section className="panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">Orders</p>
          <h2>Recent order history</h2>
        </div>
        <p className="muted">New orders appear after you submit the checkout form.</p>
      </div>
      {orders.length === 0 ? (
        <p className="muted">No orders placed yet.</p>
      ) : (
        <div className="order-table">
          <div className="order-row order-head">
            <span>Order ID</span>
            <span>Customer</span>
            <span>Items</span>
            <span>Total</span>
            <span>Placed</span>
          </div>
          {orders.map((order) => (
            <div key={order.orderId} className="order-row">
              <span>#{order.orderId}</span>
              <span>{order.customer}</span>
              <span>{order.itemCount} items</span>
              <span>${Number(order.totalPrice || 0).toFixed(2)}</span>
              <span>{order.createdAt}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function AdminPage({
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
}) {
  return (
    <div className="admin-grid">
      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Admin</p>
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
      </section>

      <section className="panel">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Catalog</p>
            <h2>Manage products</h2>
          </div>
          <button className="ghost" type="button" onClick={reloadProducts} disabled={loadingProducts}>
            {loadingProducts ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
        <div className="product-grid admin-list">
          {loadingProducts && <p className="muted">Loading products…</p>}
          {!loadingProducts && products.length === 0 && <p className="muted">No products yet.</p>}
          {products.map((product) => (
            <article key={product.productId} className="product-card">
              {product.productImageUrl ? (
                <img src={product.productImageUrl} alt={product.productName} />
              ) : (
                <div className="placeholder">No image</div>
              )}
              <div className="product-info">
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
    </div>
  );
}
