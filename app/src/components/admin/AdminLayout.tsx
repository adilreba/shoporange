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
  CreditCard,
  Shield,
  Check,
  AlertCircle,
  MessageSquare,
  UserPlus,
  ShoppingBag
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeStore } from '@/stores/themeStore';
import { useAuthStore } from '@/stores/authStore';
import { useLiveChatStore } from '@/stores/liveChatStore';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { usePermissions } from '@/hooks/usePermissions';
import type { Permission } from '@/types';

interface MenuItem {
  path: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  requiredPermission?: Permission;
}

const allMenuItems: MenuItem[] = [
  { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', exact: true },
  { path: '/admin/products', icon: Package, label: 'Ürünler', requiredPermission: 'products:view' },
  { path: '/admin/stock', icon: Warehouse, label: 'Stok Yönetimi', requiredPermission: 'products:edit' },
  { path: '/admin/orders', icon: ShoppingCart, label: 'Siparişler', requiredPermission: 'orders:view' },
  { path: '/admin/invoices', icon: FileText, label: 'Faturalar', requiredPermission: 'payments:view' },
  { path: '/admin/coupons', icon: Percent, label: 'Kuponlar', requiredPermission: 'settings:edit' },
  { path: '/admin/campaigns', icon: Tag, label: 'Kampanyalar', requiredPermission: 'content:edit' },
  { path: '/admin/users', icon: Users, label: 'Kullanıcılar', requiredPermission: 'users:view' },
  { path: '/admin/shipping', icon: Truck, label: 'Kargo', requiredPermission: 'settings:edit' },
  { path: '/admin/support', icon: Headphones, label: 'Canlı Destek', requiredPermission: 'chat:view' },
  { path: '/admin/legal-pages', icon: FileText, label: 'Yasal Sayfalar', requiredPermission: 'content:edit' },
  { path: '/admin/payment-methods', icon: CreditCard, label: 'Ödeme Yöntemleri', requiredPermission: 'settings:edit' },
  { path: '/admin/categories', icon: Tag, label: 'Kategoriler', requiredPermission: 'content:edit' },
  { path: '/admin/settings', icon: Settings, label: 'Ayarlar', requiredPermission: 'settings:view' },
  { path: '/admin/audit-logs', icon: Shield, label: 'Denetim Kayıtları', requiredPermission: 'audit:view' },
  { path: '/admin/parasut', icon: FileText, label: 'e-Fatura (Paraşüt)', requiredPermission: 'settings:edit' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Bildirim tipi
  interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'success' | 'error';
    timestamp: Date;
    read: boolean;
    link?: string;
    icon?: React.ReactNode;
  }
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark, toggleTheme } = useThemeStore();
  const { user } = useAuthStore();
  const { can, isSuperAdmin } = usePermissions();
  const { agentRequests, connect, isConnected, connectionStatus, fetchWaitingSessions } = useLiveChatStore();

  // Filter menu items based on user permissions
  const menuItems = allMenuItems.filter(item => {
    if (isSuperAdmin) return true;
    if (!item.requiredPermission) return true;
    return can(item.requiredPermission);
  });
  const isSupportPage = location.pathname === '/admin/support';

  // Admin panel açıldığında WebSocket bağlantısı kur ve bekleyen session'ları çek
  useEffect(() => {
    const userId = user?.id || user?.email;
    if (userId && !isConnected && connectionStatus === 'idle') {
      console.log('[AdminLayout] Connecting as agent:', userId);
      connect(userId, 'agent');
    }
    
    // Bekleyen session'ları çek
    fetchWaitingSessions();
  }, [user?.id, user?.email, isConnected, connectionStatus, connect, fetchWaitingSessions]);

  // Rol bazlı bildirimleri oluştur
  const generateNotifications = (): Notification[] => {
    if (!user) return [];
    
    const notifs: Notification[] = [];
    const userRole = user.role;
    
    // SUPER_ADMIN için bildirimler
    if (userRole === 'super_admin') {
      notifs.push({
        id: '1',
        title: 'Sistem Uyarısı',
        message: 'Son 24 saatte 3 yeni kullanıcı kaydı oluşturuldu',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 dk önce
        read: false,
        link: '/admin/users',
        icon: <UserPlus className="w-4 h-4" />
      });
      notifs.push({
        id: '2',
        title: 'Güvenlik Uyarısı',
        message: 'Şüpheli giriş denemesi tespit edildi',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 saat önce
        read: false,
        link: '/admin/audit-logs',
        icon: <AlertCircle className="w-4 h-4" />
      });
    }
    
    // ADMIN için bildirimler
    if (userRole === 'admin' || userRole === 'super_admin') {
      notifs.push({
        id: '3',
        title: 'Yeni Sipariş',
        message: 'Bekleyen 5 yeni sipariş var',
        type: 'success',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 dk önce
        read: false,
        link: '/admin/orders',
        icon: <ShoppingBag className="w-4 h-4" />
      });
      notifs.push({
        id: '4',
        title: 'Stok Uyarısı',
        message: '3 ürünün stok seviyesi kritik düzeyde',
        type: 'warning',
        timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 dk önce
        read: true,
        link: '/admin/stock',
        icon: <Package className="w-4 h-4" />
      });
    }
    
    // SUPPORT için canlı destek bildirimleri
    if (userRole === 'support' || userRole === 'admin' || userRole === 'super_admin') {
      const pendingChats = agentRequests.filter(req => req.status === 'pending').length;
      if (pendingChats > 0 && !isSupportPage) {
        notifs.push({
          id: '5',
          title: 'Canlı Destek',
          message: `${pendingChats} bekleyen destek talebi var`,
          type: 'info',
          timestamp: new Date(),
          read: false,
          link: '/admin/support',
          icon: <MessageSquare className="w-4 h-4" />
        });
      }
    }
    
    // EDITOR için içerik bildirimleri
    if (userRole === 'editor' || userRole === 'admin' || userRole === 'super_admin') {
      notifs.push({
        id: '6',
        title: 'İçerik Onayı',
        message: '2 yeni ürün incelemenizi bekliyor',
        type: 'info',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 saat önce
        read: false,
        link: '/admin/products',
        icon: <FileText className="w-4 h-4" />
      });
    }
    
    return notifs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  // Bildirimleri güncelle
  useEffect(() => {
    const notifs = generateNotifications();
    setNotifications(notifs);
    const unreadCount = notifs.filter(n => !n.read).length;
    setNotificationCount(unreadCount);
  }, [user?.role, agentRequests, isSupportPage]);

  // Bildirimi okundu olarak işaretle
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setNotificationCount(prev => Math.max(0, prev - 1));
  };

  // Tüm bildirimleri okundu olarak işaretle
  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setNotificationCount(0);
  };

  // Zaman formatı
  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Şimdi';
    if (minutes < 60) return `${minutes} dk önce`;
    if (hours < 24) return `${hours} saat önce`;
    return `${days} gün önce`;
  };

  // Admin panelinden çıkış - sadece front-end'e (anasayfa) yönlendir, oturum kapanmasın
  const handleExitAdmin = () => {
    navigate('/');
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
            // Canlı Destek için bildirim badge'i
            const isSupport = item.path === '/admin/support';
            const showBadge = isSupport && notificationCount > 0 && !isSupportPage;
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all relative ${
                  isActive(item.path, item.exact)
                    ? 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {sidebarOpen && (
                  <div className="flex items-center justify-between flex-1 min-w-0">
                    <span className="font-medium truncate">{item.label}</span>
                    {showBadge && (
                      <span className="ml-2 px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full min-w-[20px] text-center animate-pulse">
                        {notificationCount}
                      </span>
                    )}
                  </div>
                )}
                {!sidebarOpen && showBadge && (
                  <span className="absolute right-2 w-4 h-4 text-[10px] font-semibold bg-red-500 text-white rounded-full flex items-center justify-center animate-pulse">
                    {notificationCount}
                  </span>
                )}
              </Link>
            );
          })},
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
                const showBadge = isSupport && notificationCount > 0 && !isSupportPage;
                
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
                    {showBadge && (
                      <span className="ml-auto px-1.5 py-0.5 text-xs font-semibold bg-red-500 text-white rounded-full min-w-[20px] text-center animate-pulse">
                        {notificationCount}
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
        {/* Header - Modern Responsive */}
        <header className="flex-none h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-8">
          
          {/* Sol: Breadcrumb */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden -ml-2"
              onClick={() => setMobileMenuOpen(true)}
            >
              <Menu className="w-5 h-5" />
            </Button>
            
            {/* Breadcrumb */}
            <nav className="hidden md:flex items-center text-sm text-gray-500">
              <Link to="/admin" className="hover:text-orange-500 transition-colors">Admin</Link>
              {location.pathname !== '/admin' && (
                <>
                  <span className="mx-2 text-gray-300">/</span>
                  <span className="text-gray-900 dark:text-white font-medium capitalize">
                    {location.pathname.split('/').pop()?.replace('-', ' ')}
                  </span>
                </>
              )}
            </nav>
          </div>

          {/* Orta: Search */}
          <div className="hidden sm:flex flex-1 max-w-md mx-4 lg:mx-8">
            <div className="w-full flex items-center bg-gray-100 dark:bg-gray-700 rounded-xl px-4 py-2 focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:bg-white dark:focus-within:bg-gray-600 transition-all">
              <Search className="w-4 h-4 text-gray-400 flex-shrink-0" />
              <input 
                type="text" 
                placeholder="Ara..."
                className="bg-transparent border-none outline-none ml-3 text-sm w-full text-gray-700 dark:text-gray-200 placeholder:text-gray-400"
              />
            </div>
          </div>

          {/* Sağ: Actions */}
          <div className="flex items-center gap-1 sm:gap-2">
            
            {/* Theme Toggle */}
            <Button variant="ghost" size="icon" className="w-9 h-9 sm:w-10 sm:h-10" onClick={toggleTheme}>
              {isDark ? <Sun className="w-[18px] h-[18px] sm:w-5 sm:h-5" /> : <Moon className="w-[18px] h-[18px] sm:w-5 sm:h-5" />}
            </Button>

            {/* Notifications Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative w-9 h-9 sm:w-10 sm:h-10 hidden sm:flex">
                  <Bell className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
                  {notificationCount > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 sm:w-5 sm:h-5 bg-red-500 text-white text-[10px] sm:text-xs font-bold rounded-full flex items-center justify-center animate-pulse">
                      {notificationCount > 9 ? '9+' : notificationCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 sm:w-80 max-h-96 overflow-y-auto">
                <div className="flex items-center justify-between px-3 py-2 border-b">
                  <span className="font-semibold text-sm">Bildirimler</span>
                  {notificationCount > 0 && (
                    <button 
                      onClick={markAllAsRead}
                      className="text-xs text-orange-500 hover:text-orange-600 flex items-center gap-1"
                    >
                      <Check className="w-3 h-3" />
                      Tümünü okundu işaretle
                    </button>
                  )}
                </div>
                
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Bildirim yok</p>
                  </div>
                ) : (
                  notifications.map((notif) => (
                    <DropdownMenuItem 
                      key={notif.id}
                      className={cn(
                        "flex items-start gap-3 p-3 cursor-pointer",
                        !notif.read && "bg-orange-50 dark:bg-orange-900/20"
                      )}
                      onClick={() => {
                        markAsRead(notif.id);
                        if (notif.link) navigate(notif.link);
                      }}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
                        notif.type === 'error' && "bg-red-100 text-red-600",
                        notif.type === 'warning' && "bg-yellow-100 text-yellow-600",
                        notif.type === 'success' && "bg-green-100 text-green-600",
                        notif.type === 'info' && "bg-blue-100 text-blue-600"
                      )}>
                        {notif.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-sm font-medium",
                          !notif.read && "text-gray-900 dark:text-white"
                        )}>
                          {notif.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
                          {notif.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notif.timestamp)}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-orange-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin'den Çıkış - Front-end'e git */}
            <Button 
              variant="ghost" 
              size="icon"
              className="w-9 h-9 sm:w-10 sm:h-10"
              onClick={handleExitAdmin}
              title="Admin Panelinden Çık"
            >
              <LogOut className="w-[18px] h-[18px] sm:w-5 sm:h-5" />
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto px-4 lg:px-6 pb-4 lg:pb-6 pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
