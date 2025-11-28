export function ProductForm({
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
  const resolvedTaxRate =
    productForm.taxRate !== '' && productForm.taxRate != null
      ? Number(productForm.taxRate)
      : selectedProduct?.taxRate != null
        ? Number(selectedProduct.taxRate) * 100
        : 0;

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
            <span>Tax: {resolvedTaxRate.toFixed(2)}%</span>
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
            <span>Tax rate (%)</span>
            <input
              name="taxRate"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={productForm.taxRate}
              onChange={handleProductChange}
              placeholder="e.g. 18 for 18%"
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
                            {attribute.name} (ID: {attribute.id})
                          </option>
                        ))}
                      </select>
                    </label>
                    <label>
                      <span>Label (optional)</span>
                      <input
                        value={attributeEntry.label}
                        onChange={(event) => updateProductAttributeLabel(index, event.target.value)}
                        placeholder={attributeDef?.name || 'Color, Size, etc.'}
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
                    {(attributeDef?.attributeValues || []).map((value) => {
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
                                <span className="value-name">{value.value || 'Value'}</span>
                              </div>
                              <p className="value-ids">
                                AttrValID: {value.id ?? '—'}
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
                    {(attributeDef?.attributeValues || []).length === 0 && (
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
