import { getAttributeTypeId } from './attributes';

export const createEmptyProduct = () => ({
  name: '',
  description: '',
  basePrice: '',
  stock: '',
  taxRate: '',
  category: '',
  imageUrl: '',
  attributes: [],
});

const normalizeProductAttributeValue = (value) => ({
  productAttributeValueId: value?.id ?? value?.productAttributeValueId ?? null,
  attributeValueId: value?.attributeValueId ?? value?.valueId ?? value?.id ?? null,
  valueLabel: value?.value || value?.name || value?.valueName || '',
  extraPrice: Number(value?.extraPrice ?? 0),
});

const normalizeProductAttribute = (attribute) => {
  const attributeTypeId = getAttributeTypeId(attribute);
  return {
    productAttributeId: attribute?.id ?? attribute?.productAttributeId ?? null,
    attributeTypeId,
    label: attribute?.label || attribute?.type || attribute?.name || '',
    values: (attribute?.values || attribute?.attributeValues || [])
      .map((value) => normalizeProductAttributeValue(value))
      .filter((value) => value.attributeValueId),
  };
};

export const normalizeProduct = (product) => ({
  id: product?.id ?? product?.productId ?? null,
  name: product?.name ?? product?.productName ?? '',
  description: product?.description ?? product?.productDescription ?? '',
  basePrice: Number(product?.basePrice ?? product?.productPrice ?? 0),
  taxRate: Number(product?.taxRate ?? product?.productTaxRate ?? 0),
  stock: Number(product?.stock ?? product?.productStock ?? 0),
  category: product?.category ?? product?.productCategory ?? '',
  imageUrl: product?.imageUrl ?? product?.productImageUrl ?? '',
  attributes: (product?.attributes ?? product?.productAttributes ?? []).map((attribute) =>
    normalizeProductAttribute(attribute),
  ),
  createdAt: product?.createdAt,
  updatedAt: product?.updatedAt,
});

export const buildBaseProductPayload = (productForm) => ({
  name: productForm.name.trim(),
  description: productForm.description?.trim() || '',
  basePrice: Number(productForm.basePrice) || 0,
  taxRate: Number.isFinite(Number(productForm.taxRate))
    ? Number(productForm.taxRate) / 100
    : 0,
  stock: Number(productForm.stock) || 0,
  category: productForm.category?.trim() || '',
  imageUrl: productForm.imageUrl?.trim() || '',
});

export const buildCreateProductPayload = (productForm) => {
  const attributes = (productForm.attributes || [])
    .filter((attribute) => attribute.attributeTypeId)
    .map((attribute) => ({
      attributeTypeId: Number(attribute.attributeTypeId) || attribute.attributeTypeId,
      label: attribute.label?.trim() || '',
      values: (attribute.values || [])
        .filter((value) => value.attributeValueId)
        .map((value) => ({
          attributeValueId: Number(value.attributeValueId) || value.attributeValueId,
          extraPrice: Number(value.extraPrice) || 0,
        })),
    }))
    .filter((attribute) => (attribute.values || []).length > 0);

  return { ...buildBaseProductPayload(productForm), attributes };
};

export const buildUpdateProductPayload = (productForm, productId) => {
  const productAttributeRequestList = (productForm.attributes || [])
    .filter((attribute) => attribute.attributeTypeId || attribute.productAttributeId)
    .map((attribute) => {
      const productAttributeValueRequestList = (attribute.values || [])
        .filter((value) => value.attributeValueId)
        .map((value) => ({
          id: value.productAttributeValueId ?? null,
          AttributeValueId:
            value.productAttributeValueId != null
              ? undefined
              : Number(value.attributeValueId) || value.attributeValueId,
          extraPrice: Number(value.extraPrice) || 0,
        }));

      return {
        id: attribute.productAttributeId ?? null,
        attributeTypeId:
          attribute.productAttributeId != null ? undefined : Number(attribute.attributeTypeId) || attribute.attributeTypeId,
        label: attribute.label?.trim() || '',
        productAttributeValueRequestList,
      };
    })
    .filter(
      (attribute) =>
        attribute.id != null ||
        attribute.attributeTypeId != null ||
        (attribute.productAttributeValueRequestList || []).length > 0,
    );

  return {
    ...buildBaseProductPayload(productForm),
    id: productId,
    updatedAt: new Date().toISOString(),
    productAttributeRequestList,
  };
};
