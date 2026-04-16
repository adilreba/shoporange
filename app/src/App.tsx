import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { Permission } from '@/types';
import { ROLE_NAMES, ROLE_PERMISSIONS } from '@/types';
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
import { VerifyEmail } from '@/pages/VerifyEmail';
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
import { AdminProducts } from '@/pages/Admin/Products';
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
function ProtectedRoute({ 
  children, 
  requireAdmin = false,
  requiredPermission 
}: { 
  children: React.ReactNode; 
  requireAdmin?: boolean;
  requiredPermission?: Permission;
}) {
  const { isAuthenticated, user } = useAuthStore();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Admin paneline erişebilen roller: admin, super_admin, editor, support
  const isStaff = user?.role === 'admin' || user?.role === 'super_admin' || 
                  user?.role === 'editor' || user?.role === 'support';
  
  if (requireAdmin && !isStaff) {
    return <Navigate to="/" replace />;
  }
  
  // Özel izin kontrolü
  if (requiredPermission && user) {
    const hasPermission = ROLE_PERMISSIONS[user.role]?.includes(requiredPermission);
    if (!hasPermission) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8 bg-white rounded-lg shadow-lg max-w-md">
            <div className="text-red-500 text-6xl mb-4">🚫</div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Erişim Engellendi</h1>
            <p className="text-gray-600 mb-4">
              Bu sayfaya erişim yetkiniz bulunmuyor.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Mevcut rolünüz: <span className="font-medium">{ROLE_NAMES[user.role]}</span>
            </p>
            <button 
              onClick={() => window.history.back()}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      );
    }
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
        <Route path="/verify-email" element={<VerifyEmail />} />
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
          
          {/* Products - admin, super_admin, editor */}
          <Route path="products" element={<ProtectedRoute requireAdmin requiredPermission="products:view"><AdminProducts /></ProtectedRoute>} />
          <Route path="products/new" element={<ProtectedRoute requireAdmin requiredPermission="products:create"><ProductForm /></ProtectedRoute>} />
          <Route path="products/:id/edit" element={<ProtectedRoute requireAdmin requiredPermission="products:edit"><ProductForm /></ProtectedRoute>} />
          <Route path="stock" element={<ProtectedRoute requireAdmin requiredPermission="products:edit"><StockManagement /></ProtectedRoute>} />
          
          {/* Categories - admin, super_admin, editor */}
          <Route path="categories" element={<ProtectedRoute requireAdmin requiredPermission="content:edit"><CategoryManagement /></ProtectedRoute>} />
          
          {/* Orders - admin, super_admin, support */}
          <Route path="orders" element={<ProtectedRoute requireAdmin requiredPermission="orders:view"><AdminOrders /></ProtectedRoute>} />
          
          {/* Users - sadece admin ve super_admin */}
          <Route path="users" element={<ProtectedRoute requireAdmin requiredPermission="users:view"><AdminUsers /></ProtectedRoute>} />
          
          {/* Coupons - admin, super_admin */}
          <Route path="coupons" element={<ProtectedRoute requireAdmin requiredPermission="settings:edit"><AdminCoupons /></ProtectedRoute>} />
          
          {/* Campaigns - admin, super_admin, editor */}
          <Route path="campaigns" element={<ProtectedRoute requireAdmin requiredPermission="content:edit"><AdminCampaigns /></ProtectedRoute>} />
          
          {/* Settings - admin, super_admin */}
          <Route path="settings" element={<ProtectedRoute requireAdmin requiredPermission="settings:view"><AdminSettings /></ProtectedRoute>} />
          
          {/* Shipping - admin, super_admin */}
          <Route path="shipping" element={<ProtectedRoute requireAdmin requiredPermission="settings:edit"><ShippingSettings /></ProtectedRoute>} />
          
          {/* Invoices - admin, super_admin */}
          <Route path="invoices" element={<ProtectedRoute requireAdmin requiredPermission="payments:view"><InvoiceManagement /></ProtectedRoute>} />
          
          {/* Support - admin, super_admin, support */}
          <Route path="support" element={<ProtectedRoute requireAdmin requiredPermission="chat:view"><AgentDashboard /></ProtectedRoute>} />
          
          {/* Legal Pages - admin, super_admin, editor */}
          <Route path="legal-pages" element={<ProtectedRoute requireAdmin requiredPermission="content:edit"><AdminLegalPages /></ProtectedRoute>} />
          <Route path="legal-pages/new" element={<ProtectedRoute requireAdmin requiredPermission="content:edit"><LegalPagesEditor /></ProtectedRoute>} />
          <Route path="legal-pages/edit/:id" element={<ProtectedRoute requireAdmin requiredPermission="content:edit"><LegalPagesEditor /></ProtectedRoute>} />
          
          {/* Payment Methods - admin, super_admin */}
          <Route path="payment-methods" element={<ProtectedRoute requireAdmin requiredPermission="settings:edit"><AdminPaymentMethods /></ProtectedRoute>} />
          
          {/* Audit Logs - SADECE super_admin */}
          <Route path="audit-logs" element={<ProtectedRoute requireAdmin requiredPermission="audit:view"><AuditLogs /></ProtectedRoute>} />
          
          {/* Paraşüt - admin, super_admin */}
          <Route path="parasut" element={<ProtectedRoute requireAdmin requiredPermission="settings:edit"><ParasutSettings /></ProtectedRoute>} />
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
