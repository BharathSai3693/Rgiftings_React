import { useEffect, useState } from 'react';
import './App.css';
import { SiteHeader } from './components/layout/SiteHeader';
import { AppRoutes } from './components/layout/AppRoutes';
import { CartContext } from './context/CartContext';
import { useHashRouter } from './hooks/useHashRouter';
import { useCartManager } from './hooks/useCartManager';
import { useProductsData } from './hooks/useProductsData';
import { useAttributesData } from './hooks/useAttributesData';
import { useProductAdmin } from './hooks/useProductAdmin';
import { useAttributeAdmin } from './hooks/useAttributeAdmin';
import { useOrderCheckout } from './hooks/useOrderCheckout';
import { useOrdersData } from './hooks/useOrdersData';

export default function App() {
  const [toast, setToast] = useState({ type: 'info', message: 'Loading…' });
  const { route, navigate } = useHashRouter();
  const { cartItems, cartValue } = useCartManager(setToast);
  const { products, setProducts, loadingProducts, loadProducts } = useProductsData(setToast);
  const { attributes, setAttributes, loadingAttributes, loadAttributes } = useAttributesData(setToast);
  const ordersData = useOrdersData(setToast);
  const productAdmin = useProductAdmin({
    attributes,
    setToast,
    loadProducts,
    setProducts,
    navigate,
  });
  const attributeAdmin = useAttributeAdmin({
    setToast,
    loadAttributes,
    setAttributes,
    navigate,
  });
  const orderCheckout = useOrderCheckout({
    cartItems,
    clearCart: cartValue.clearCart,
    setToast,
  });

  useEffect(() => {
    loadProducts();
    loadAttributes();
  }, [loadAttributes, loadProducts]);

  useEffect(() => {
    const timeout = setTimeout(() => setToast((previous) => ({ ...previous, message: '' })), 3000);
    return () => clearTimeout(timeout);
  }, [toast.message]);

  const shopProps = {
    products,
    loadingProducts,
    reloadProducts: loadProducts,
  };

  const attributesProps = {
    ...attributeAdmin,
    attributes,
    loadingAttributes,
    reloadAttributes: loadAttributes,
  };

  const productAdminProps = {
    ...productAdmin,
    products,
    attributes,
    loadingProducts,
    reloadProducts: loadProducts,
  };
  const ordersProps = {
    ...ordersData,
  };

  return (
    <CartContext.Provider value={cartValue}>
      <div className="page">
        <SiteHeader toast={toast} navigate={navigate} route={route} />
        <AppRoutes
          route={route}
          navigate={navigate}
          shopProps={shopProps}
          cartProps={{ ...orderCheckout }}
          attributesProps={attributesProps}
          productAdminProps={productAdminProps}
          ordersProps={ordersProps}
        />
      </div>
    </CartContext.Provider>
  );
}
