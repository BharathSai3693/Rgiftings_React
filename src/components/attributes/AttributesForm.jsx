export function AttributesForm({
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
