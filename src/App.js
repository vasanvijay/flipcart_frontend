import './App.css';
import 'swiper/css';
import { BrowserRouter as Router, Navigate, Routes, Route, useLocation } from 'react-router-dom'
import Home from './component/Home/Main';
import Header from './component/Header/Main';
import Footer from './component/Footer/Main';
import Address from './component/Address/Main';
import Checkout from './component/Checkout/Main';
import ProductDetails from './component/ProdutctDetails/Main';
import Categories from './component/Categories/Main';
import Cart from './component/Cart/Main';
import Payment from './component/Payment/Main';
import PaymentSuccess from './component/PaymentSuccess/Main';
import PaymentFailure from './component/PaymentFailure/Main';
import CartDrawer from './component/Cart/Drawer';
import BottomNav from './component/BottomNav/Main';
import { useEffect, useState } from 'react';
import { getCartCount } from './utils/cart';
import AdminLogin from './component/Admin/Login';
import Login from './component/Login/Login';
import AdminDashboard from './component/Admin/Dashboard';
import MetaPixel from './component/MetaPixel/Main';
import { PAYU_ENABLED } from './utils/config';

const AppContent = ({ cartCount, setIsCartOpen, isCartOpen, setSelected, selected }) => {
  const location = useLocation();
  const isCategoryPage = location.pathname === '/category';
  const adminPath = process.env.REACT_APP_ADMIN_PATH || '/admin';
  const isAdminPage = location.pathname.startsWith(adminPath);

  return (
    <>
      <MetaPixel />
      {!isCategoryPage && !isAdminPage && (
        <Header setSelected={setSelected} onOpenCart={() => setIsCartOpen(true)} cartCount={cartCount} />
      )}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/product-details" element={<ProductDetails />} />
        <Route path="/address" element={<Address />} />
        <Route path="/category" element={<Categories selected={selected} />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/payment" element={<Payment />} />
        <Route
          path="/payment-success"
          element={PAYU_ENABLED ? <PaymentSuccess /> : <Navigate to="/checkout" replace />}
        />
        <Route
          path="/payment-failure"
          element={PAYU_ENABLED ? <PaymentFailure /> : <Navigate to="/checkout" replace />}
        />

        {/* Admin Routes */}
        <Route path="/login" element={<Login />} />
        <Route path={adminPath} element={<AdminLogin />} />
        <Route path={`${adminPath}/dashboard`} element={<AdminDashboard />} />
      </Routes>

      {!isAdminPage && (
        <CartDrawer open={isCartOpen} onClose={() => setIsCartOpen(false)} />
      )}

      {/* Hide Bottom Nav on Admin pages, Product Details, Checkout, and Payment pages */}
      {!isAdminPage && !location.pathname.startsWith('/product/') && !location.pathname.startsWith('/product-details') &&
        !location.pathname.startsWith('/checkout') && !location.pathname.startsWith('/payment') && (
          <BottomNav cartCount={cartCount} onOpenCart={() => setIsCartOpen(true)} />
        )}

      {!isAdminPage && <Footer />}

      {!isAdminPage && <div className="h-14 md:hidden" />}
    </>
  )
}

function App() {
  const [selected, setSelected] = useState("Dry Fruits")
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [cartCount, setCartCount] = useState(getCartCount())

  useEffect(() => {
    const handler = () => setCartCount(getCartCount())
    window.addEventListener('cart:updated', handler)
    return () => window.removeEventListener('cart:updated', handler)
  }, [])

  return (
    <Router>
      <AppContent
        cartCount={cartCount}
        setIsCartOpen={setIsCartOpen}
        isCartOpen={isCartOpen}
        setSelected={setSelected}
        selected={selected}
      />
    </Router>
  );
}

export default App;
