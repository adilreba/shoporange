import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import type { Permission } from '@/types';
import { ROLE_NAMES, ROLE_PERMISSIONS } from '@/types';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from '@/components/ui/sonner';
import { useAuthStore, initializeAuth } from '@/stores/authStore';
import { LiveChatWidget } from '@/components/chat/LiveChatWidget';
import { ScrollToTop } from '@/components/common/ScrollToTop';
import { CookieBanner } from '@/components/common/CookieBanner';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import { useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import { NetworkStatus } from '@/components/mobile/NetworkStatus';

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

// Analytics Route Tracker — Her route değişikliğinde page_view event'i gönder
function AnalyticsTracker() {
  const location = useLocation();

  useEffect(() => {
    // Admin sayfalarını track etme (gürültü)
    if (location.pathname.startsWith('/admin')) return;
    
    analytics.pageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}

// Pages - Public (eager loaded for fastest initial render)
import { Home } from '@/pages/Home';
import { Products } from '@/pages/Products';
import { ProductDetail } from '@/pages/ProductDetail';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { About } from '@/pages/About';
import { Campaigns } from '@/pages/Campaigns';
import { NewArrivals } from '@/pages/NewArrivals';
import { Bestsellers } from '@/pages/Bestsellers';
import { Help } from '@/pages/Help';
import { FAQ } from '@/pages/FAQ';
import { Contact } from '@/pages/Contact';
import { NotFound } from '@/pages/NotFound';

// Legal Pages (eager loaded - small)
import { KVKKPage, PrivacyPolicyPage, TermsOfServicePage, ReturnPolicyPage, PreInformationPage, DistanceSalesContractPage } from '@/pages/legal';

// Lazy loaded pages - improves initial bundle size
const Cart = lazy(() => import('@/pages/Cart').then(m => ({ default: m.Cart })));
const Checkout = lazy(() => import('@/pages/Checkout').then(m => ({ default: m.Checkout })));
const VerifyEmail = lazy(() => import('@/pages/VerifyEmail').then(m => ({ default: m.VerifyEmail })));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('@/pages/ResetPassword').then(m => ({ default: m.ResetPassword })));
const Wishlist = lazy(() => import('@/pages/Wishlist').then(m => ({ default: m.Wishlist })));
const Compare = lazy(() => import('@/pages/Compare').then(m => ({ default: m.Compare })));
const Profile = lazy(() => import('@/pages/Profile').then(m => ({ default: m.Profile })));
const Orders = lazy(() => import('@/pages/Orders').then(m => ({ default: m.Orders })));
const Settings = lazy(() => import('@/pages/Settings').then(m => ({ default: m.Settings })));
const OrderTracking = lazy(() => import('@/pages/OrderTracking').then(m => ({ default: m.default })));
const Returns = lazy(() => import('@/pages/Returns').then(m => ({ default: m.Returns })));
const Support = lazy(() => import('@/pages/Support').then(m => ({ default: m.Support })));
const Reviews = lazy(() => import('@/pages/Reviews').then(m => ({ default: m.Reviews })));
const Lists = lazy(() => import('@/pages/Lists').then(m => ({ default: m.Lists })));
const Coupons = lazy(() => import('@/pages/Coupons').then(m => ({ default: m.Coupons })));
const LegalPageView = lazy(() => import('@/pages/LegalPage').then(m => ({ default: m.LegalPageView })));

// Admin Layout & Pages - Lazy loaded (only needed for admin users)
const AdminLayout = lazy(() => import('@/components/admin/AdminLayout').then(m => ({ default: m.default })));
const AdminDashboard = lazy(() => import('@/pages/Admin/Dashboard').then(m => ({ default: m.default })));
const AdminProducts = lazy(() => import('@/pages/Admin/Products').then(m => ({ default: m.AdminProducts })));
const AdminOrders = lazy(() => import('@/pages/Admin/AdminOrders').then(m => ({ default: m.default })));
const AdminUsers = lazy(() => import('@/pages/Admin/AdminUsers').then(m => ({ default: m.default })));
const AdminSettings = lazy(() => import('@/pages/Admin/Settings').then(m => ({ default: m.default })));
const CategoryManagement = lazy(() => import('@/pages/Admin/CategoryManagement').then(m => ({ default: m.default })));
const ProductForm = lazy(() => import('@/pages/Admin/ProductForm').then(m => ({ default: m.default })));
const AdminCoupons = lazy(() => import('@/pages/Admin/Coupons').then(m => ({ default: m.default })));
const AdminCampaigns = lazy(() => import('@/pages/Admin/Campaigns').then(m => ({ default: m.default })));
const AdminLegalPages = lazy(() => import('@/pages/Admin/LegalPages').then(m => ({ default: m.AdminLegalPages })));
const LegalPagesEditor = lazy(() => import('@/pages/Admin/LegalPagesEditor').then(m => ({ default: m.LegalPagesEditor })));
const AdminPaymentMethods = lazy(() => import('@/pages/Admin/PaymentMethods').then(m => ({ default: m.AdminPaymentMethods })));
const StockManagement = lazy(() => import('@/pages/Admin/StockManagement').then(m => ({ default: m.default })));
const AgentDashboard = lazy(() => import('@/pages/Admin/AgentDashboard').then(m => ({ default: m.default })));
const ShippingSettings = lazy(() => import('@/pages/Admin/ShippingSettings').then(m => ({ default: m.default })));
const InvoiceManagement = lazy(() => import('@/pages/Admin/InvoiceManagement').then(m => ({ default: m.default })));
const AuditLogs = lazy(() => import('@/pages/Admin/AuditLogs').then(m => ({ default: m.default })));
const ParasutSettings = lazy(() => import('@/pages/Admin/ParasutSettings').then(m => ({ default: m.default })));
const ABTests = lazy(() => import('@/pages/Admin/ABTests').then(m => ({ default: m.default })));
const Automation = lazy(() => import('@/pages/Admin/Automation').then(m => ({ default: m.default })));

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
    <ErrorBoundary>
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
      <Suspense fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500" />
        </div>
      }>
      <AnalyticsTracker />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/products" element={<Products />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
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
        <Route path="/distance-sales-contract" element={<DistanceSalesContractPage />} />
        
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
          
          {/* A/B Tests - admin, super_admin */}
          <Route path="ab-tests" element={<ProtectedRoute requireAdmin requiredPermission="settings:view"><ABTests /></ProtectedRoute>} />
          <Route path="automation" element={<ProtectedRoute requireAdmin requiredPermission="settings:view"><Automation /></ProtectedRoute>} />
        </Route>
        
        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
      </Suspense>
      
      {/* Network Status Banner */}
      <NetworkStatus />
      
      {/* Chat Widget - Admin panelinde gizli */}
      <ChatWidgetWrapper />
      <CookieBannerWrapper />
    </Router>
    </ErrorBoundary>
    </HelmetProvider>
  );
}

export default App;
