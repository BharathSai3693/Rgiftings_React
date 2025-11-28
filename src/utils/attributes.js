export const createEmptyAttribute = () => ({
  id: null,
  name: '',
  inputType: 'TEXT',
  attributeValues: [{ id: null, value: '' }],
});

export const getAttributeTypeId = (attribute) =>
  attribute?.id ?? attribute?.typeId ?? attribute?.attributeTypeId ?? null;

export const normalizeAttributeType = (attribute) => {
  const typeId = getAttributeTypeId(attribute);
  return {
    id: typeId,
    name: attribute?.name || attribute?.type || '',
    inputType: attribute?.inputType || 'TEXT',
    attributeValues: (attribute?.attributeValues || attribute?.values || []).map((value) => {
      const valueId = value?.id ?? value?.valueId ?? value?.attributeValueId ?? null;
      return {
        id: valueId,
        value: value?.value || value?.name || value?.valueName || '',
      };
    }),
  };
};
