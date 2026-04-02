import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Users, 
  Settings,
  Bell,
  Search,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  Percent,
  Tag,
  Warehouse,
  Headphones,
  Truck,
  FileText,
  CreditCard
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { chatApi } from '@/services/api';

const menuItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/products', icon: Package, label: 'Ürünler' },
  { path: '/admin/stock', icon: Warehouse, label: 'Stok Yönetimi' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Siparişler' },
  { path: '/admin/invoices', icon: FileText, label: 'Faturalar' },
  { path: '/admin/coupons', icon: Percent, label: 'Kuponlar' },
  { path: '/admin/campaigns', icon: Tag, label: 'Kampanyalar' },
  { path: '/admin/users', icon: Users, label: 'Kullanıcılar' },
  { path: '/admin/shipping', icon: Truck, label: 'Kargo' },
  { path: '/admin/support', icon: Headphones, label: 'Canlı Destek' },
  { path: '/admin/legal-pages', icon: FileText, label: 'Yasal Sayfalar' },
  { path: '/admin/payment-methods', icon: CreditCard, label: 'Ödeme Yöntemleri' },
  { path: '/admin/categories', icon: Tag, label: 'Kategoriler' },
  { path: '/admin/settings', icon: Settings, label: 'Ayarlar' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [waitingCount, setWaitingCount] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();
  const { user, logout } = useAuthStore();
  const { agentRequests, activeSessions } = useChatStore();

  // Canlı destek sayılarını güncelle
  useEffect(() => {
    const fetchCounts = async () => {
      try {
        // AWS'den bekleme sayısını çek
        const response = await chatApi.getWaitingSessions();
        
        // Local pending sayısı
        const localPendingCount = agentRequests.filter(req => req.status === 'pending').length;
        
        // Toplam bekleme (AWS + Local, tekrarları çıkararak)
        const localPendingIds = new Set(agentRequests.filter(req => req.status === 'pending').map(req => req.id));
        const uniqueAwsCount = response.data?.filter((s: any) => !localPendingIds.has(s.sessionId)).length || 0;
        
        setWaitingCount(uniqueAwsCount + localPendingCount);
        setActiveCount(activeSessions.length);
      } catch (error) {
        // Hata durumunda sadece local verileri göster
        const localPendingCount = agentRequests.filter(req => req.status === 'pending').length;
        setWaitingCount(localPendingCount);
        setActiveCount(activeSessions.length);
      }
    };

    fetchCounts();
    const interval = setInterval(fetchCounts, 5000); // Her 5 saniyede güncelle
    return () => clearInterval(interval);
  }, [agentRequests, activeSessions]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string, exact?: boolean) => {
    if (exact) return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="h-screen bg-gray-50 dark:bg-gray-900 flex max-w-[100vw] overflow-x-hidden overflow-y-hidden">
      {/* Sidebar - Desktop */}
      <aside 
        className={`hidden lg:flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 ${
          sidebarOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
          <Link to="/admin" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">A</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-xl text-gray-900 dark:text-white">
                Atus<span className="text-orange-500">Admin</span>
              </span>
            )}
          </Link>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden lg:flex"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            // Canlı Destek için badge hesapla
            const isSupport = item.path === '/admin/support';
            const totalCount = isSupport ? waitingCount + activeCount : 0;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                  isActive(item.path, item.exact)
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="font-medium truncate">{item.label}</span>
                    {isSupport && totalCount > 0 && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full min-w-[20px] text-center">
                        {totalCount}
                      </span>
                    )}
                  </div>
                )}
                {!sidebarOpen && isSupport && totalCount > 0 && (
                  <span className="absolute right-2 w-4 h-4 text-[10px] font-semibold bg-orange-500 text-white rounded-full flex items-center justify-center">
                    {totalCount}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <div className={`flex items-center gap-3 ${sidebarOpen ? '' : 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-medium">
              {user?.name?.charAt(0).toUpperCase() || 'A'}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user?.name || 'Admin'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'admin@atushome.com'}
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div 
            className="absolute inset-0 bg-black/50" 
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="absolute left-0 top-0 bottom-0 w-64 bg-white dark:bg-gray-800 shadow-xl">
            <div className="h-16 flex items-center justify-between px-4 border-b">
              <span className="font-bold text-xl">Atus<span className="text-orange-500">Admin</span></span>
              <Button variant="ghost" size="icon" onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <nav className="p-4 space-y-1">
              {menuItems.map((item) => {
                const isSupport = item.path === '/admin/support';
                const totalCount = isSupport ? waitingCount + activeCount : 0;
                
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${
                      isActive(item.path, item.exact)
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span className="font-medium">{item.label}</span>
                    {isSupport && totalCount > 0 && (
                      <span className="ml-auto px-1.5 py-0.5 text-xs font-semibold bg-orange-500 text-white rounded-full min-w-[20px] text-center">
                        {totalCount}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
          </aside>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* Header - Sabit */}
        <header className="flex-none h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Breadcrumb */}
            <nav className="hidden md:flex items-center text-sm text-gray-500">
              <Link to="/admin" className="hover:text-orange-500">Admin</Link>
              {location.pathname !== '/admin' && (
                <>
                  <span className="mx-2">/</span>
                  <span className="text-gray-900 dark:text-white capitalize">
                    {location.pathname.split('/').pop()?.replace('-', ' ')}
                  </span>
                </>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-1.5">
              <Search className="w-4 h-4 text-gray-400" />
              <input 
                type="text" 
                placeholder="Ara..."
                className="bg-transparent border-none outline-none ml-2 text-sm w-48"
              />
            </div>

            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Notifications */}
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
            </Button>

            {/* Logout */}
            <Button variant="ghost" size="icon" onClick={handleLogout}>
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
