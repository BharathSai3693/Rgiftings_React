# RGiftings API Design (UI Contract)

Base URL: `http://localhost:8080/api` (same origin as the frontend). JSON in/out, no auth assumed.

## Resources
- Products (with nested product attributes and attribute values)
- Attribute Types (with their Attribute Values)

## Field Aliases the UI Accepts
- Product ids/names/etc: `id` | `productId`; `name` | `productName`; `description` | `productDescription`; `basePrice` | `productPrice`; `stock` | `productStock`; `category` | `productCategory`; `imageUrl` | `productImageUrl`.
- Product attributes: `attributes` | `productAttributes`; `productAttributeId` | `id`; `attributeTypeId` | `attributeId` | `typeId`; values: `productAttributeValueId` | `id`; `attributeValueId` | `valueId`; value names: `valueLabel` | `value` | `name` | `valueName`.
- Attribute types: `id` | `attributeTypeId` | `attributeId` | `typeId`; `type` | `name`; `attributeValues` | `values`; attribute value ids: `id` | `attributeValueId` | `valueId`; value names: `value` | `name` | `valueName`.

## Product APIs

### GET `/products`
Returns an array of products.
```json
[
  {
    "id": 1,
    "name": "Rose & Candle Gift Set",
    "description": "Cozy bundle",
    "basePrice": 49.99,
    "stock": 120,
    "category": "Home decor",
    "imageUrl": "https://…/gift.jpg",
    "attributes": [
      {
        "productAttributeId": 10,
        "attributeTypeId": 3,
        "label": "Color",
        "values": [
          {
            "productAttributeValueId": 100,
            "attributeValueId": 301,
            "valueLabel": "Red",
            "extraPrice": 0
          }
        ]
      }
    ],
    "createdAt": "2024-05-01T12:00:00Z",
    "updatedAt": "2024-05-02T12:00:00Z"
  }
]
```

### POST `/product`
Creates a product. The UI only checks for `response.ok`.
```json
{
  "name": "Gift Box",
  "description": "Hand-picked items",
  "basePrice": 35.0,
  "stock": 50,
  "category": "Gifts",
  "imageUrl": "https://…/box.jpg",
  "attributes": [
    {
      "attributeTypeId": 3,
      "label": "Color",
      "values": [
        { "attributeValueId": 301, "extraPrice": 0 },
        { "attributeValueId": 302, "extraPrice": 2.5 }
      ]
    }
  ]
}
```

### PUT `/product/{id}`
Updates a product and its attributes. The UI sends:
```json
{
  "id": 1,
  "name": "Gift Box",
  "description": "Updated description",
  "basePrice": 36.0,
  "stock": 60,
  "category": "Gifts",
  "imageUrl": "https://…/box.jpg",
  "updatedAt": "2024-05-20T10:15:00Z",
  "productAttributeRequestList": [
    {
      "id": 10,                       // existing productAttributeId; omit for new attribute rows
      "attributeTypeId": 3,           // omit when id is provided
      "label": "Color",
      "productAttributeValueRequestList": [
        { "id": 100, "extraPrice": 0 },                 // update existing value by id
        { "AttributeValueId": 302, "extraPrice": 2.5 }  // note capital A; used when creating new values
      ]
    }
  ]
}
```

### DELETE `/product/{id}`
Deletes a product (UI removes locally on 2xx).

## Attribute Type APIs

### GET `/attribute`
Returns an array of attribute types with values.
```json
[
  {
    "id": 3,
    "type": "Color",
    "description": "Color options",
    "values": [
      { "id": 301, "displayCode": "RED", "value": "Red" },
      { "id": 302, "displayCode": "BLU", "value": "Blue" }
    ]
  }
]
```

### POST `/attribute`
Creates an attribute type.
```json
{
  "type": "Color",
  "description": "Color options",
  "attributeValueRequests": [
    { "displayCode": "RED", "value": "Red" },
    { "displayCode": "BLU", "value": "Blue" }
  ]
}
```

### PUT `/attribute/{id}`
Updates an attribute type.
```json
{
  "id": 3,
  "type": "Color",
  "description": "Updated description",
  "attributeValues": [
    { "id": 301, "displayCode": "RED", "value": "Red" },
    { "id": 302, "displayCode": "BLU", "value": "Blue" }
  ]
}
```

### DELETE `/attribute/{id}`
Deletes an attribute type (UI removes locally on 2xx).

## UI Expectations and Notes
- Success: list endpoints must return valid JSON; write endpoints just need 2xx (`response.ok`); body unused on writes.
- Errors: products fetch shows raw `response.text()` when present; otherwise the UI shows “Unable to …” messages.
- IDs may be strings or numbers; the UI coerces with `Number(...) || value`.
- Attribute values are optional in requests; the UI filters out empty rows.
