import { AttributesForm } from './AttributesForm';
import { getAttributeTypeId } from '../../utils/attributes';

export function AttributesPage({
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
