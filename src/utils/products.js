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
  valueLabel: value?.attributeValueName || value?.value || value?.name || value?.valueName || '',
  extraPrice: Number(value?.extraPrice ?? 0),
});

const normalizeProductAttribute = (attribute) => {
  const attributeTypeId = attribute?.attributeTypeId ?? attribute?.id ?? null;
  const values =
    attribute?.productAttributeValues ||
    attribute?.productAttributeValueResponses ||
    attribute?.values ||
    attribute?.attributeValues ||
    attribute?.productAttributeValueRequestList ||
    [];

  return {
    productAttributeId: attribute?.id ?? attribute?.productAttributeId ?? null,
    attributeTypeId,
    attributeName: attribute?.attributeName || attribute?.type || attribute?.name || '',
    attributeInputType: attribute?.attributeInputType || '',
    label: attribute?.productAttributeLabel || attribute?.label || attribute?.attributeName || '',
    values: values
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
  attributes: (
    product?.attributes ??
    product?.productAttributes ??
    product?.productAttributeResponses ??
    product?.productAttributeRequestList ??
    []
  ).map((attribute) => normalizeProductAttribute(attribute)),
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
  const productAttributes = (productForm.attributes || [])
    .filter((attribute) => attribute.attributeTypeId)
    .map((attribute) => ({
      attributeTypeId: Number(attribute.attributeTypeId) || attribute.attributeTypeId,
      productAttributeLabel: attribute.label?.trim() || '',
      productAttributeValues: (attribute.values || [])
        .filter((value) => value.attributeValueId)
        .map((value) => ({
          attributeValueId: Number(value.attributeValueId) || value.attributeValueId,
          extraPrice: Number(value.extraPrice) || 0,
        })),
    }))
    .filter((attribute) => (attribute.productAttributeValues || []).length > 0);

  return { ...buildBaseProductPayload(productForm), productAttributes };
};

export const buildUpdateProductPayload = (productForm, productId) => {
  const productAttributes = (productForm.attributes || [])
    .filter((attribute) => attribute.attributeTypeId || attribute.productAttributeId)
    .map((attribute) => {
      const productAttributeValues = (attribute.values || [])
        .filter((value) => value.attributeValueId)
        .map((value) => ({
          id: value.productAttributeValueId ?? null,
          attributeValueId: Number(value.attributeValueId) || value.attributeValueId,
          extraPrice: Number(value.extraPrice) || 0,
        }));

      return {
        id: attribute.productAttributeId ?? null,
        attributeTypeId: Number(attribute.attributeTypeId) || attribute.attributeTypeId,
        productAttributeLabel: attribute.label?.trim() || '',
        productAttributeValues,
      };
    })
    .filter(
      (attribute) =>
        attribute.id != null ||
        attribute.attributeTypeId != null ||
        (attribute.productAttributeValues || []).length > 0,
    );

  return {
    ...buildBaseProductPayload(productForm),
    id: productId,
    productAttributes,
  };
};
