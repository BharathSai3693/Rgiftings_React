import { useEffect, useMemo, useState } from 'react';
import { useCart } from '../../context/CartContext';

export function ShopPage({ products, route, navigate, loadingProducts, reloadProducts }) {
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

export function ProductDetailPage({ product, navigate }) {
  const cart = useCart();
  const [quantity, setQuantity] = useState(1);

  const getAttributeKey = (attribute, index) =>
    `${attribute.productAttributeId ?? attribute.attributeTypeId ?? attribute.id ?? index}`;

  const defaultSelections = useMemo(() => {
    const defaults = {};
    (product.attributes || []).forEach((attribute, index) => {
      const key = getAttributeKey(attribute, index);
      const firstValue = (attribute.values || [])[0];
      if (!firstValue) return;
      defaults[key] = {
        attributeTypeId: attribute.attributeTypeId ?? attribute.productAttributeId ?? attribute.id ?? key,
        productAttributeId: attribute.productAttributeId ?? null,
        attributeValueId: firstValue.attributeValueId ?? firstValue.id ?? null,
        productAttributeValueId: firstValue.productAttributeValueId ?? firstValue.id ?? null,
        valueLabel: firstValue.valueLabel || firstValue.value || '',
        extraPrice: Number(firstValue.extraPrice || 0),
      };
    });
    return defaults;
  }, [product]);

  const [selectedValues, setSelectedValues] = useState(defaultSelections);

  useEffect(() => {
    setSelectedValues(defaultSelections);
  }, [defaultSelections]);

  const handleSelectValue = (attribute, value, index) => {
    const attributeKey = getAttributeKey(attribute, index);
    setSelectedValues((previous) => ({
      ...previous,
      [attributeKey]: {
        attributeTypeId: attribute.attributeTypeId ?? attribute.productAttributeId ?? attribute.id ?? attributeKey,
        productAttributeId: attribute.productAttributeId ?? null,
        attributeValueId: value.attributeValueId ?? value.id ?? null,
        productAttributeValueId: value.productAttributeValueId ?? value.id ?? null,
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
            productAttributeId: selected.productAttributeId ?? attribute.productAttributeId ?? null,
            attributeValueId: selected.attributeValueId,
            productAttributeValueId: selected.productAttributeValueId ?? null,
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
      taxRate: Number(product.taxRate || 0),
      imageUrl: product.imageUrl,
      description: product.description,
      quantity,
    });
    setQuantity(1);
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
              <span className="pill muted">
                Tax: {(Number(product.taxRate || 0) * 100).toFixed(2)}%
              </span>
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
              <div className="form-row compact">
                <label>
                  <span>Quantity</span>
                  <input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value) || 1))}
                  />
                </label>
              </div>
              <div className="price-row">
                <div>
                  <p className="eyebrow">Final price</p>
                  <h3>
                    ${finalPrice.toFixed(2)}
                    {quantity > 1 ? ` · Qty ${quantity} = $${(finalPrice * quantity).toFixed(2)}` : ''}
                  </h3>
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
