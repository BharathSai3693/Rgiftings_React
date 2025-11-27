import { ShopPage } from '../shop/ShopPage';
import { CartPage } from '../cart/CartPage';
import { ProductAdminPage } from '../products/ProductAdminPage';
import { AttributesPage } from '../attributes/AttributesPage';
import { OrdersPage } from '../orders/OrdersPage';

export function AppRoutes({
  route,
  navigate,
  shopProps,
  cartProps,
  attributesProps,
  productAdminProps,
  ordersProps,
}) {
  if (route.page === 'shop') {
    return <ShopPage {...shopProps} route={route} navigate={navigate} />;
  }

  if (route.page === 'cart') {
    return <CartPage {...cartProps} navigate={navigate} />;
  }

  if (route.page === 'attributes') {
    return <AttributesPage {...attributesProps} route={route} navigate={navigate} />;
  }

  if (route.page === 'orders') {
    return <OrdersPage {...ordersProps} route={route} navigate={navigate} />;
  }

  return <ProductAdminPage {...productAdminProps} route={route} navigate={navigate} />;
}
