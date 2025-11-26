# RGiftings Database Design (React + Spring Boot)

This schema supports the APIs defined in `API_DESIGN.md` and the React dashboard in `src/App.jsx`. It assumes a relational database (PostgreSQL dialect shown) behind a Spring Boot service using JPA.

## Core Entities
- **product**: Sellable item with base price and stock.
- **attribute_type**: Reusable attribute definitions (e.g., Color, Size).
- **attribute_value**: Allowed values for an attribute type (e.g., Red, Large).
- **product_attribute**: Junction between product and attribute type, with an optional custom label for that product (e.g., "Ribbon Color").
- **product_attribute_value**: Allowed attribute values on a specific product, with optional extra price.
- **order**: A placed order (covers future `/api/order/place`).
- **order_item**: Products inside an order.
- **order_item_attribute**: Attribute selections attached to each order item.

## Table Definitions (PostgreSQL)
```sql
CREATE TABLE attribute_type (
  id              BIGSERIAL PRIMARY KEY,
  type            VARCHAR(120) NOT NULL UNIQUE,
  description     VARCHAR(500),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE attribute_value (
  id              BIGSERIAL PRIMARY KEY,
  attribute_type_id BIGINT NOT NULL REFERENCES attribute_type(id) ON DELETE CASCADE,
  display_code    VARCHAR(40) NOT NULL,
  value           VARCHAR(120) NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(attribute_type_id, display_code),
  UNIQUE(attribute_type_id, value)
);

CREATE TABLE product (
  id              BIGSERIAL PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  description     TEXT,
  base_price      NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock           INTEGER NOT NULL DEFAULT 0,
  category        VARCHAR(120),
  image_url       TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE product_attribute (
  id              BIGSERIAL PRIMARY KEY,
  product_id      BIGINT NOT NULL REFERENCES product(id) ON DELETE CASCADE,
  attribute_type_id BIGINT NOT NULL REFERENCES attribute_type(id),
  label           VARCHAR(120), -- optional UI label override
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, attribute_type_id) -- each product uses a type at most once
);

CREATE TABLE product_attribute_value (
  id              BIGSERIAL PRIMARY KEY,
  product_attribute_id BIGINT NOT NULL REFERENCES product_attribute(id) ON DELETE CASCADE,
  attribute_value_id BIGINT NOT NULL REFERENCES attribute_value(id),
  extra_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_attribute_id, attribute_value_id)
);

CREATE TABLE "order" (
  id              BIGSERIAL PRIMARY KEY,
  total_price     NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          VARCHAR(40) NOT NULL DEFAULT 'PENDING',
  customer_email  VARCHAR(200),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_item (
  id              BIGSERIAL PRIMARY KEY,
  order_id        BIGINT NOT NULL REFERENCES "order"(id) ON DELETE CASCADE,
  product_id      BIGINT NOT NULL REFERENCES product(id),
  quantity        INTEGER NOT NULL DEFAULT 1,
  base_price      NUMERIC(12,2) NOT NULL,
  final_price     NUMERIC(12,2) NOT NULL, -- base + selected extra prices
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE order_item_attribute (
  id              BIGSERIAL PRIMARY KEY,
  order_item_id   BIGINT NOT NULL REFERENCES order_item(id) ON DELETE CASCADE,
  attribute_type_id BIGINT NOT NULL REFERENCES attribute_type(id),
  attribute_value_id BIGINT NOT NULL REFERENCES attribute_value(id),
  value_label     VARCHAR(200),
  extra_price     NUMERIC(12,2) NOT NULL DEFAULT 0
);
```

## Indexes and Constraints
- `attribute_type.type` unique to avoid duplicate attribute names.
- `attribute_value` has unique pairs per attribute type to prevent duplicate codes/values.
- `product_attribute` unique pair ensures one attribute type per product.
- `product_attribute_value` unique pair ensures a value is not duplicated on the same product.
- Indexes to add:
  - `CREATE INDEX idx_product_category ON product(category);`
  - `CREATE INDEX idx_product_attribute_product ON product_attribute(product_id);`
  - `CREATE INDEX idx_product_attribute_value_attr ON product_attribute_value(attribute_value_id);`
  - `CREATE INDEX idx_order_item_order ON order_item(order_id);`

## API to DB Mapping (per `API_DESIGN.md`)
- `GET /api/products`: query `product` with left joins to `product_attribute` and `product_attribute_value` (and `attribute_value`) to build nested JSON.
- `POST /api/product`: insert into `product`; for each attribute: insert into `product_attribute`, then insert rows into `product_attribute_value` using provided `attributeValueId` and `extraPrice`.
- `PUT /api/product/{id}`: update `product`; upsert `product_attribute` rows by provided `id` when present; upsert/delete `product_attribute_value` rows based on `productAttributeValueId`.
- `DELETE /api/product/{id}`: cascade removes related product_attribute and product_attribute_value rows.
- `GET /api/attribute`: select `attribute_type` joined to `attribute_value`.
- `POST /api/attribute`: insert into `attribute_type` then bulk insert `attribute_value` using provided `displayCode` and `value`.
- `PUT /api/attribute/{id}`: update `attribute_type`; upsert `attribute_value` rows; prune removed values if required by business rules.
- `DELETE /api/attribute/{id}`: cascade removes its values and any product_attribute/product_attribute_value rows referencing it.
- `POST /api/order/place` (future): create `order`, create `order_item` rows for cart items, and `order_item_attribute` rows for selections; decrement product stock accordingly.

## Notes and Gotchas
- UI accepts multiple aliases for IDs and names; normalize request payloads before persistence (see the normalization helpers in `src/App.jsx`).
- `product_attribute_value.extra_price` defaults to 0 so “included” options work without explicit price.
- Use transactions for product and attribute writes to keep nested rows consistent.
- Consider optimistic locking on `product.updated_at` if concurrent admin edits are expected.
- If you need soft deletes, add `deleted_at` columns to `product`, `attribute_type`, and cascade logic in queries.
