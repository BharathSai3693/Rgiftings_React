export function OrdersPage({ navigate, orders, loadingOrders, loadOrders, userId, setUserId }) {
  return (
    <div className="stacked-columns">
      <section className="panel wide">
        <div className="panel-header">
          <div>
            <p className="eyebrow">Orders</p>
            <h2>Order history</h2>
          </div>
          <div className="card-actions">
            <button className="ghost" type="button" onClick={() => navigate('shop')}>
              Back to shop
            </button>
          </div>
        </div>
        <div className="form-row">
          <label>
            <span>User ID</span>
            <input
              type="text"
              value={userId}
              onChange={(event) => setUserId(event.target.value)}
              placeholder="Enter user ID to load orders"
            />
          </label>
          <div className="form-actions compact">
            <button type="button" onClick={() => loadOrders()}>
              {loadingOrders ? 'Loading…' : 'Load orders'}
            </button>
          </div>
        </div>
        {loadingOrders && <p className="muted">Loading orders…</p>}
        {!loadingOrders && orders.length === 0 && <p className="muted">No orders yet.</p>}
        <div className="stacked-list">
          {orders.map((order) => (
            <article key={order.orderId} className="list-card">
              <div className="list-card__body">
                <div className="form-row">
                  <div>
                    <p className="eyebrow">Order ID</p>
                    <strong>{order.orderId}</strong>
                  </div>
                  <div>
                    <p className="eyebrow">Status</p>
                    <span className="pill">{order.status || '—'}</span>
                  </div>
                  <div>
                    <p className="eyebrow">Totals</p>
                    <div className="mini-pills">
                      <span className="pill muted">Price: ${Number(order.totalPrice || 0).toFixed(2)}</span>
                      <span className="pill muted">Tax: ${Number(order.totalTax || 0).toFixed(2)}</span>
                      <span className="pill">Grand: ${Number(order.grandTotal || 0).toFixed(2)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="eyebrow">Timestamps</p>
                    <div className="mini-pills">
                      <span className="pill muted">Created: {order.orderCreatedAt || '—'}</span>
                      <span className="pill muted">Updated: {order.orderUpdatedAt || '—'}</span>
                    </div>
                  </div>
                </div>
                <div className="muted small">
                  Guest: {order.guestEmail || '—'} · {order.guestPhone || '—'} · User ID: {order.userId ?? '—'}
                </div>
                <div className="stacked-list compact">
                  {(order.orderItems || []).map((item, idx) => (
                    <div key={`${order.orderId}-${idx}`} className="list-card nested">
                      <div className="list-card__body">
                        <div className="form-row">
                          <div>
                            <p className="eyebrow">Product</p>
                            <strong>{item.productName || 'Item'}</strong>
                            <p className="muted">ID: {item.productId ?? '—'}</p>
                          </div>
                          <div>
                            <p className="eyebrow">Qty</p>
                            <strong>{item.quantity}</strong>
                          </div>
                          <div>
                            <p className="eyebrow">Pricing</p>
                            <div className="mini-pills">
                              <span className="pill muted">
                                Base: ${Number(item.basePrice || 0).toFixed(2)}
                              </span>
                              <span className="pill muted">
                                Extras: ${Number(item.lineExtraPrice || 0).toFixed(2)}
                              </span>
                              <span className="pill muted">
                                Tax: ${Number(item.lineTax || 0).toFixed(2)}
                              </span>
                              <span className="pill">
                                Line total: ${Number(item.lineTotalPrice || 0).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {(item.orderItemAttributeResponseList || []).length > 0 && (
                          <div className="attribute-values detailed">
                            {item.orderItemAttributeResponseList.map((attr, attrIdx) => (
                              <div key={`${order.orderId}-${idx}-attr-${attrIdx}`} className="attribute-block">
                                <div className="attribute-block__header">
                                  <div>
                                    <p className="eyebrow">Product Attribute ID: {attr.productAttributeId ?? '—'}</p>
                                    <strong>{attr.productAttributeLabel || 'Attribute'}</strong>
                                  </div>
                                </div>
                                <div className="pill-row">
                                  {(attr.orderItemAttributeValueResponseList || []).map((value, valueIdx) => (
                                    <span
                                      key={`${order.orderId}-${idx}-attr-${attrIdx}-val-${valueIdx}`}
                                      className="pill"
                                    >
                                      {value.ProductAttributeValue_value || 'Value'} · Extra: $
                                      {Number(value.extraPrice || 0).toFixed(2)}
                                      {value.customText ? ` · Note: ${value.customText}` : ''}
                                      {value.fileUrl ? ` · File: ${value.fileUrl}` : ''}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
