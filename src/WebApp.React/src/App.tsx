import { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { AuthGuard } from './components/AuthGuard';
import { CatalogPage } from './features/catalog/CatalogPage';
import { ItemPage } from './features/item/ItemPage';
import { LoginPage } from './features/user/LoginPage';
import { useAuthStore } from './stores/authStore';

function CartPlaceholder() {
  return <div>Cart</div>;
}

function CheckoutPlaceholder() {
  return <div>Checkout</div>;
}

function OrdersPlaceholder() {
  return <div>My Orders</div>;
}

export function App() {
  const fetchUser = useAuthStore((state) => state.fetchUser);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<CatalogPage />} />
        <Route path="/item/:itemId" element={<ItemPage />} />
        <Route
          path="/cart"
          element={
            <AuthGuard>
              <CartPlaceholder />
            </AuthGuard>
          }
        />
        <Route
          path="/checkout"
          element={
            <AuthGuard>
              <CheckoutPlaceholder />
            </AuthGuard>
          }
        />
        <Route
          path="/user/orders"
          element={
            <AuthGuard>
              <OrdersPlaceholder />
            </AuthGuard>
          }
        />
        <Route path="/user/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
