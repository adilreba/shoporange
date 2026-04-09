import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore, initializeAuth } from '@/stores/authStore';
import { LiveChatWidget } from '@/components/chat/LiveChatWidget';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CookieBanner } from '@/components/common/CookieBanner';
import { useEffect } from 'react';

// Chat Widget Wrapper - Admin panelinde gizler
function ChatWidgetWrapper() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (isAdminPage) return null;
  return <LiveChatWidget />;
}

// Cookie Banner Wrapper - Admin panelinde gizler
function CookieBannerWrapper() {
  const location = useLocation();
  const isAdminPage = location.pathname.startsWith('/admin');
  
  if (isAdminPage) return null;
  return <CookieBanner />;
}

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
import OrderTracking from '@/pages/OrderTracking';
import { About } from '@/pages/About';
import { Campaigns } from '@/pages/Campaigns';
import { NewArrivals } from '@/pages/NewArrivals';
import { Bestsellers } from '@/pages/Bestsellers';
import { Help } from '@/pages/Help';
import { Returns } from '@/pages/Returns';
import { FAQ } from '@/pages/FAQ';
import { Contact } from '@/pages/Contact';
import { NotFound } from '@/pages/NotFound';
import { Support } from '@/pages/Support';
import { Reviews } from '@/pages/Reviews';
import { Lists } from '@/pages/Lists';
import { Coupons } from '@/pages/Coupons';

// Legal Pages
import { KVKKPage, PrivacyPolicyPage, TermsOfServicePage, ReturnPolicyPage, PreInformationPage } from '@/pages/legal';

// Admin Layout & Pages
import AdminLayout from '@/components/admin/AdminLayout';
import AdminDashboard from '@/pages/Admin/Dashboard';
import AdminProducts from '@/pages/Admin/AdminProducts';
import AdminOrders from '@/pages/Admin/AdminOrders';
import AdminUsers from '@/pages/Admin/AdminUsers';
import AdminSettings from '@/pages/Admin/Settings';
import CategoryManagement from '@/pages/Admin/CategoryManagement';
import ProductForm from '@/pages/Admin/ProductForm';
import AdminCoupons from '@/pages/Admin/Coupons';
import AdminCampaigns from '@/pages/Admin/Campaigns';
import { AdminLegalPages } from '@/pages/Admin/LegalPages';
import { LegalPagesEditor } from '@/pages/Admin/LegalPagesEditor';
import { LegalPageView } from '@/pages/LegalPage';
import { AdminPaymentMethods } from '@/pages/Admin/PaymentMethods';
import StockManagement from '@/pages/Admin/StockManagement';
import AgentDashboard from '@/pages/Admin/AgentDashboard';
import ShippingSettings from '@/pages/Admin/ShippingSettings';
import InvoiceManagement from '@/pages/Admin/InvoiceManagement';
import AuditLogs from '@/pages/Admin/AuditLogs';
import ParasutSettings from '@/pages/Admin/ParasutSettings';

// Protected Route Component
function ProtectedRoute({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  if (requireAdmin && user?.role !== 'admin' && user?.role !== 'super_admin') {
    return <Navigate to="/" replace />;
  }
  
  return <>{children}</>;
}

function App() {
  useEffect(() => {
    // Uygulama başladığında auth'u initialize et
    // persist middleware'den sonra çalışması için küçük bir gecikme
    const timer = setTimeout(() => {
      console.log('[App] Initializing auth...');
      initializeAuth();
    }, 100);
    
    return () => clearTimeout(timer);
  }, []);

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
        
        {/* Legal Pages */}
        <Route path="/kvkk" element={<KVKKPage />} />
        <Route path="/privacy" element={<PrivacyPolicyPage />} />
        <Route path="/terms" element={<TermsOfServicePage />} />
        <Route path="/return-policy" element={<ReturnPolicyPage />} />
        <Route path="/pre-information" element={<PreInformationPage />} />
        
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
        <Route 
          path="/support" 
          element={
            <ProtectedRoute>
              <Support />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/reviews" 
          element={
            <ProtectedRoute>
              <Reviews />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/lists" 
          element={
            <ProtectedRoute>
              <Lists />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/coupons" 
          element={
            <ProtectedRoute>
              <Coupons />
            </ProtectedRoute>
          } 
        />
        <Route path="/legal/:slug" element={<LegalPageView />} />
        
        {/* Admin Routes with Layout */}
        <Route path="/admin" element={<ProtectedRoute requireAdmin><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="products" element={<AdminProducts />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id/edit" element={<ProductForm />} />
          <Route path="stock" element={<StockManagement />} />
          <Route path="orders" element={<AdminOrders />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="coupons" element={<AdminCoupons />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="categories" element={<CategoryManagement />} />
          <Route path="shipping" element={<ShippingSettings />} />
          <Route path="invoices" element={<InvoiceManagement />} />
          <Route path="support" element={<AgentDashboard />} />
          <Route path="legal-pages" element={<AdminLegalPages />} />
          <Route path="legal-pages/new" element={<LegalPagesEditor />} />
          <Route path="legal-pages/edit/:id" element={<LegalPagesEditor />} />
          <Route path="payment-methods" element={<AdminPaymentMethods />} />
          <Route path="audit-logs" element={<AuditLogs />} />
          <Route path="parasut" element={<ParasutSettings />} />
        </Route>
        
        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      
      {/* Chat Widget - Admin panelinde gizli */}
      <ChatWidgetWrapper />
      <CookieBannerWrapper />
    </Router>
    </HelmetProvider>
  );
}

export default App;
