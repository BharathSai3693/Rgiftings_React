import { useCart } from '../../context/CartContext';

export function CartPage({
  navigate,
  guestEmail,
  guestPhone,
  setGuestEmail,
  setGuestPhone,
  isPlacing,
  placeOrder,
  calculateLineTotals,
}) {
  const cart = useCart();
  const items = cart?.items || [];
  const totals = items.reduce(
    (acc, item) => {
      const line = calculateLineTotals(item);
      acc.subtotal += line.lineSubtotal;
      acc.tax += line.lineTax;
      acc.grand += line.lineTotal;
      return acc;
    },
    { subtotal: 0, tax: 0, grand: 0 },
  );

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
          {items.map((item) => {
            const totals = calculateLineTotals(item);
            return (
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
                    <div className="form-row compact">
                      <label>
                        <span>Quantity</span>
                        <input
                          type="number"
                          min="1"
                          value={item.quantity || 1}
                          onChange={(event) => cart?.updateQuantity?.(item.cartItemId, event.target.value)}
                        />
                      </label>
                    </div>
                    <div className="mini-pills">
                      <span className="pill muted">Base: ${Number(item.basePrice || 0).toFixed(2)}</span>
                      <span className="pill muted">
                        Extras: $
                        {Number(
                          (item.selectedAttributes || []).reduce(
                            (sum, attr) => sum + Number(attr.extraPrice || 0),
                            0,
                          ),
                        ).toFixed(2)}
                      </span>
                      <span className="pill">
                        Line total: ${totals.lineTotal.toFixed(2)}
                      </span>
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
            );
          })}
        </div>
        {items.length > 0 && (
          <div className="cart-summary">
            <div>
              <p className="eyebrow">Cart total</p>
              <div className="stacked">
                <span className="pill muted">Subtotal: ${totals.subtotal.toFixed(2)}</span>
                <span className="pill muted">Tax: ${totals.tax.toFixed(2)}</span>
                <h3>Total: ${totals.grand.toFixed(2)}</h3>
              </div>
            </div>
            <div className="card-actions">
              <button className="ghost" type="button" onClick={cart?.clearCart}>
                Clear cart
              </button>
              <button className="primary" type="button" onClick={placeOrder} disabled={isPlacing}>
                {isPlacing ? 'Placing order…' : 'Checkout'}
              </button>
            </div>
          </div>
        )}
        <div className="panel">
          <div className="panel-header">
            <div>
              <p className="eyebrow">Guest info</p>
              <h3>Required for checkout</h3>
            </div>
          </div>
          <div className="form">
            <label>
              <span>Email</span>
              <input
                type="email"
                value={guestEmail}
                onChange={(event) => setGuestEmail(event.target.value)}
                placeholder="guest@example.com"
              />
            </label>
            <label>
              <span>Phone</span>
              <input
                type="tel"
                value={guestPhone}
                onChange={(event) => setGuestPhone(event.target.value)}
                placeholder="+1 555 000 0000"
              />
            </label>
          </div>
        </div>
      </section>
    </div>
  );
}
