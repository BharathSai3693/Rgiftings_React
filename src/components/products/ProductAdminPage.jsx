import { ProductForm } from './ProductForm';

export function ProductAdminPage({
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
            selectedProduct={selectedProduct}
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
                <span className="pill muted">
                  Tax: {(Number(selectedProduct.taxRate || 0) * 100).toFixed(2)}%
                </span>
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
