# Rgiftings React storefront dashboard

This project is a Vite + React dashboard for interacting with the RGiftings gift store APIs. Use it to manage products and place orders against the provided endpoints.

## Available scripts
- `npm install` – install dependencies.
- `npm run dev` – start the development server at http://localhost:5173.
- `npm run build` – build the production bundle.
- `npm run preview` – preview the production build locally.
- `npm run lint` – run ESLint over the source files.

## API expectations
The UI talks to the following endpoints relative to the same origin:
- `GET /api/products`
- `POST /api/product`
- `PUT /api/product/{id}`
- `DELETE /api/product/{id}`
- `POST /api/order/place`

Set up your backend to serve these routes or proxy them from the Vite dev server.
