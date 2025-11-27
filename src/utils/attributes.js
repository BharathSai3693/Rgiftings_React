export const createEmptyAttribute = () => ({
  type: '',
  description: '',
  values: [{ id: null, value: '', displayCode: '' }],
});

export const getAttributeTypeId = (attribute) =>
  attribute?.attributeTypeId ?? attribute?.attributeId ?? attribute?.typeId ?? attribute?.id ?? null;

export const normalizeAttributeType = (attribute) => ({
  id: getAttributeTypeId(attribute),
  type: attribute?.type || attribute?.name || '',
  description: attribute?.description || '',
  values: (attribute?.attributeValues || attribute?.values || []).map((value) => ({
    id: value?.id ?? value?.attributeValueId ?? value?.valueId ?? null,
    displayCode: value?.displayCode || '',
    value: value?.value || value?.name || value?.valueName || '',
  })),
});
