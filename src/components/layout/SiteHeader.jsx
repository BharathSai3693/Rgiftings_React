import { useCart } from '../../context/CartContext';

export function SiteHeader({ toast, navigate, route }) {
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
        <button
          type="button"
          className={route.page === 'orders' ? 'primary' : 'ghost'}
          onClick={() => navigate('orders')}
        >
          Orders
        </button>
      </nav>
      {toast.message && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </header>
  );
}
