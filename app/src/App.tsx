import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore } from '@/stores/authStore';
import { ChatWidget } from '@/components/chat/ChatWidget';
import { ScrollToTop } from '@/components/common/ScrollToTop';

// Pages
import { Home } from '@/pages/Home';
import { Products } from '@/pages/Products';
import { ProductDetail } from '@/pages/ProductDetail';
import { Cart } from '@/pages/Cart';
import { Checkout } from '@/pages/Checkout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { Wishlist } from '@/pages/Wishlist';
import { Compare } from '@/pages/Compare';
import { Profile } from '@/pages/Profile';
import { Orders } from '@/pages/Orders';
import { Settings } from '@/pages/Settings';
import { OrderTracking } from '@/pages/OrderTracking';
import { About } from '@/pages/About';
import { Campaigns } from '@/pages/Campaigns';
import { NewArrivals } from '@/pages/NewArrivals';
import { Bestsellers } from '@/pages/Bestsellers';
import { Help } from '@/pages/Help';
import { Returns } from '@/pages/Returns';
import { FAQ } from '@/pages/FAQ';
import { Contact } from '@/pages/Contact';
import { NotFound } from '@/pages/NotFound';

// Admin Pages
import { AdminDashboard } from '@/pages/Admin/Dashboard';
import { AdminProducts } from '@/pages/Admin/Products';
import { ProductForm } from '@/pages/Admin/ProductForm';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  return (
    <HelmetProvider>
    <Router>
      <Toaster 
        position="top-right" 
        richColors 
        closeButton
        toastOptions={{
          style: {
            fontFamily: 'Inter, system-ui, sans-serif',
          },
        }}
      />
      <ScrollToTop />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/track-order" element={<OrderTracking />} />
        <Route path="/about" element={<About />} />
        <Route path="/campaigns" element={<Campaigns />} />
        <Route path="/new-arrivals" element={<NewArrivals />} />
        <Route path="/bestsellers" element={<Bestsellers />} />
        <Route path="/help" element={<Help />} />
        <Route path="/returns" element={<Returns />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Protected Routes */}
        <Route 
          path="/checkout" 
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/wishlist" 
          element={
            <ProtectedRoute>
              <Wishlist />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/compare" 
          element={
            <ProtectedRoute>
              <Compare />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <Orders />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          } 
        />
        
        {/* Admin Routes */}
        <Route 
          path="/admin" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminDashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products" 
          element={
            <ProtectedRoute requireAdmin>
              <AdminProducts />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products/new" 
          element={
            <ProtectedRoute requireAdmin>
              <ProductForm />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/admin/products/edit/:id" 
          element={
            <ProtectedRoute requireAdmin>
              <ProductForm />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Chat Widget */}
      <ChatWidget />
    </Router>
    </HelmetProvider>
  );
}

export default App;
