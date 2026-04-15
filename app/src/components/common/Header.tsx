import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  ShoppingCart, 
  Heart, 
  User, 
  Menu, 
  ChevronDown,
  LogOut,
  Settings,
  Package,
  BarChart3,
  Scale,
  Sun,
  Moon,
  X,
  LayoutGrid,
  MessageCircle,
  Star,
  Bookmark,
  Ticket
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useAuthStore } from '@/stores/authStore';
import { MOCK_USERS } from '@/data/mockUsers';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCompareStore } from '@/stores/compareStore';
import { useThemeStore } from '@/stores/themeStore';
// import { usePermissions } from '@/hooks/usePermissions';
import { categories } from '@/data/mockData';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { LiveSearch } from '@/components/search/LiveSearch';

// Emoji kontrol fonksiyonu
const isEmoji = (str: string): boolean => {
  const emojiRegex = /\p{Emoji}/u;
  return emojiRegex.test(str);
};

export function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  
  // DOĞRUDAN ROL KONTROLÜ - Hook'u bypass et
  const userRole = user?.role;
  const isStaffUser = userRole === 'admin' || userRole === 'super_admin' || userRole === 'editor' || userRole === 'support';
  
  // Debug: Kullanıcı rolünü kontrol et
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('[Header] USER id:', user.id, 'email:', user.email, 'ROLE:', userRole);
      console.log('[Header] MOCK_USERS count:', MOCK_USERS.length);
      
      // ID ile dene
      const mockUserById = MOCK_USERS.find(u => u.id === user.id);
      console.log('[Header] Found by ID:', mockUserById ? {id: mockUserById.id, role: mockUserById.role} : 'NOT FOUND');
      
      // Email ile dene
      const mockUserByEmail = MOCK_USERS.find(u => u.email === user.email);
      console.log('[Header] Found by EMAIL:', mockUserByEmail ? {id: mockUserByEmail.id, role: mockUserByEmail.role} : 'NOT FOUND');
      
      // Her durumda MOCK_USERS'tan güncel rolü al
      const mockUser = mockUserById || mockUserByEmail;
      
      if (mockUser) {
        if (mockUser.role !== user.role) {
          console.log('[Header] UPDATING role:', user.role, '->', mockUser.role);
          useAuthStore.setState({ user: { ...user, role: mockUser.role as any } });
        } else {
          console.log('[Header] Role already correct:', user.role);
        }
      } else {
        console.log('[Header] ERROR: User not found in MOCK_USERS!');
        console.log('[Header] Available IDs:', MOCK_USERS.map(u => u.id));
      }
    }
  }, [isAuthenticated, user, userRole, isStaffUser]);
  const { totalItems } = useCartStore();
  const { getWishlistCount } = useWishlistStore();
  const { getCompareCount } = useCompareStore();
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLiveSearchOpen, setIsLiveSearchOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const cartItemCount = totalItems();
  const wishlistCount = getWishlistCount();
  const compareCount = getCompareCount();

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled 
            ? 'bg-card/95 backdrop-blur-xl shadow-soft' 
            : 'bg-card'
        }`}
      >
        {/* Top Bar */}
        <div className="bg-gradient-orange text-white py-[clamp(0.375rem,1vw,0.5rem)] px-[clamp(0.75rem,2vw,1rem)]">
          <div className="container-custom flex items-center justify-between text-[clamp(0.625rem,1vw,0.75rem)] sm:text-[clamp(0.75rem,1vw,0.875rem)]">
            <p className="hidden sm:block">
              🎉 500₺ üzeri alışverişlerde <span className="font-bold">ÜCRETSİZ KARGO!</span>
            </p>
            <div className="flex items-center gap-[clamp(0.5rem,1.5vw,0.75rem)] sm:gap-[clamp(0.75rem,2vw,1rem)] ml-auto">
              <Link to="/help" className="hover:underline">Yardım</Link>
              <Link to="/contact" className="hover:underline hidden sm:inline">İletişim</Link>
              <Link to="/track-order" className="hover:underline">Sipariş Takip</Link>
              {isAuthenticated ? (
                <span className="font-medium hidden sm:inline">Hoş geldin, {user?.name?.split(' ')[0]}</span>
              ) : (
                <Link to="/login" className="font-medium hover:underline">Giriş Yap</Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container-custom py-[clamp(0.75rem,1.5vw,0.75rem)] sm:py-[clamp(0.75rem,2vw,1rem)]">
          <div className="flex items-center justify-between w-full gap-4">
            {/* Left: Mobile Menu Button + Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild className="lg:hidden">
                  <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9">
                    <Menu className="h-4 w-4 sm:h-5 sm:w-5" />
                  </Button>
                </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0 [&>button]:hidden">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between p-4 border-b">
                    <Link to="/" className="text-xl font-bold text-gradient">
                      Atus Home
                    </Link>
                    <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-orange-50" onClick={() => setIsMobileMenuOpen(false)}>
                      <X className="h-5 w-5" />
                    </Button>
                  </div>
                  
                  <nav className="flex-1 overflow-y-auto flex flex-col gap-2 p-4">
                    <Link 
                      to="/" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg">🏠</span> Ana Sayfa
                    </Link>
                    <Link 
                      to="/products" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium text-gray-700 dark:text-gray-200"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg">📦</span> Tüm Ürünler
                    </Link>
                    {isAuthenticated && isStaffUser && (
                      <Link 
                        to="/admin" 
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium text-orange-600"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span className="text-lg">📊</span> Admin Paneli
                      </Link>
                    )}
                    <Link 
                      to="/compare" 
                      className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-sm font-medium text-orange-600"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <span className="text-lg">⚖️</span> Karşılaştırma {compareCount > 0 && `(${compareCount})`}
                    </Link>
                    {categories.map((cat) => (
                      <Link 
                        key={cat.id}
                        to={`/products?category=${cat.id}`}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors text-sm text-gray-700 dark:text-gray-200"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {cat.icon && isEmoji(cat.icon) && <span className="text-lg w-6">{cat.icon}</span>} {cat.name}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto p-4 border-t">
                    {!isAuthenticated && (
                      <div className="flex flex-col gap-2">
                        <Button 
                          className="w-full gradient-orange h-11"
                          onClick={() => {
                            navigate('/login');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Giriş Yap
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full h-11"
                          onClick={() => {
                            navigate('/register');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Kayıt Ol
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </SheetContent>
              </Sheet>
              {/* Logo */}
              <Link to="/" className="flex items-center">
              <h1 className="text-lg md:text-xl lg:text-3xl font-bold whitespace-nowrap leading-none text-center">
                <span className="text-gradient">Atus</span>
                <span className="text-orange-600">Home</span>
              </h1>
              </Link>
            </div>

            {/* Center: Search Bar - Desktop */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8">
              <div 
                className="relative w-full cursor-pointer"
                onClick={() => setIsLiveSearchOpen(true)}
              >
                <Search 
                  className="absolute left-[clamp(0.75rem,2vw,1rem)] top-1/2 -translate-y-1/2 text-orange-500 h-[clamp(1rem,2vw,1.25rem)] w-[clamp(1rem,2vw,1.25rem)] pointer-events-none"
                />
                <Input
                  type="text"
                  placeholder="Ürün, kategori veya marka ara..."
                  readOnly
                  className="w-full pl-[clamp(2rem,4vw,2.5rem)] pr-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.375rem,1vw,0.625rem)] rounded-full border-2 border-orange-100 focus:border-orange-500 transition-colors cursor-pointer text-[clamp(0.75rem,1vw,0.875rem)]"
                />
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              
              {/* Desktop: All icons visible with equal spacing */}
              <div className="hidden lg:flex items-center gap-2">
                {/* Theme Toggle */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  onClick={toggleTheme}
                  className="h-9 w-9"
                >
                  {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </Button>

                {/* Compare */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => navigate('/compare')}
                >
                  <Scale className="h-5 w-5" />
                  {compareCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-orange-500 text-[10px]">
                      {compareCount}
                    </Badge>
                  )}
                </Button>

                {/* Wishlist */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => navigate('/wishlist')}
                >
                  <Heart className="h-5 w-5" />
                  {wishlistCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-red-500 text-[10px]">
                      {wishlistCount}
                    </Badge>
                  )}
                </Button>

                {/* Cart */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-orange-500 text-[10px]">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>
              </div>

              {/* Tablet: Show more icons */}
              <div className="flex lg:hidden items-center gap-1">
                {/* Cart icon */}
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="relative h-9 w-9"
                  onClick={() => setIsCartOpen(true)}
                >
                  <ShoppingCart className="h-5 w-5" />
                  {cartItemCount > 0 && (
                    <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center p-0 bg-orange-500 text-[10px]">
                      {cartItemCount}
                    </Badge>
                  )}
                </Button>

                {/* More options menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                      <div className="flex items-center">
                        {(compareCount > 0 || wishlistCount > 0) && (
                          <span className="absolute -top-0.5 -right-0.5 h-2 w-2 bg-orange-500 rounded-full" />
                        )}
                        <LayoutGrid className="h-5 w-5" />
                      </div>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate('/compare')} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Scale className="h-4 w-4" />
                        Karşılaştırma
                      </span>
                      {compareCount > 0 && (
                        <Badge className="bg-orange-500 text-white text-xs px-2">{compareCount}</Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wishlist')} className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Favorilerim
                      </span>
                      {wishlistCount > 0 && (
                        <Badge className="bg-red-500 text-white text-xs px-2">{wishlistCount}</Badge>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="h-4 w-4 mr-2" />
                      Siparişlerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/support')}>
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Soru ve Taleplerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/reviews')}>
                      <Star className="h-4 w-4 mr-2" />
                      Değerlendirmelerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/lists')}>
                      <Bookmark className="h-4 w-4 mr-2" />
                      Tüm Listem
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/coupons')}>
                      <Ticket className="h-4 w-4 mr-2" />
                      Kuponlarım
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="h-4 w-4 mr-2" />
                      Profilim
                    </DropdownMenuItem>
                    {isAuthenticated && isStaffUser && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Admin Paneli
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={toggleTheme}>
                      {isDark ? <Sun className="h-4 w-4 mr-2" /> : <Moon className="h-4 w-4 mr-2" />}
                      {isDark ? 'Aydınlık Tema' : 'Karanlık Tema'}
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* User Menu - Desktop */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="hidden lg:flex items-center gap-1 h-9 px-2 ml-1">
                      <div className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center text-white font-medium text-sm">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-sm">{user?.name}</p>
                      <p className="text-xs text-muted-foreground">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      Profilim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/orders')}>
                      <Package className="mr-2 h-4 w-4" />
                      Siparişlerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/wishlist')}>
                      <Heart className="mr-2 h-4 w-4" />
                      Favorilerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/compare')}>
                      <Scale className="mr-2 h-4 w-4" />
                      Karşılaştırma
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate('/support')}>
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Soru ve Taleplerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/reviews')}>
                      <Star className="mr-2 h-4 w-4" />
                      Değerlendirmelerim
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/lists')}>
                      <Bookmark className="mr-2 h-4 w-4" />
                      Tüm Listem
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/coupons')}>
                      <Ticket className="mr-2 h-4 w-4" />
                      Kuponlarım
                    </DropdownMenuItem>
                    {isStaffUser && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center cursor-pointer">
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Admin Paneli
                      </Link>
                    </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => navigate('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      Ayarlar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Çıkış Yap
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Button 
                  variant="ghost" 
                  size="icon"
                  className="h-8 w-8 sm:h-9 sm:w-9"
                  onClick={() => navigate('/login')}
                >
                  <User className="h-4 w-4 sm:h-5 sm:w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search - Compact design */}
          <form onSubmit={handleSearch} className="md:hidden mt-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-orange-400 h-4 w-4 pointer-events-none" />
              <Input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-full text-sm h-9 bg-gray-50 border-0 focus-visible:ring-orange-200"
              />
            </div>
          </form>
        </div>

        {/* Navigation Categories - Desktop */}
        <nav className="hidden lg:block border-t">
          <div className="container-custom">
            <ul className="flex items-center gap-1 py-2">
              <li>
                <Link 
                  to="/products" 
                  className="px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.375rem,1vw,0.5rem)] rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors font-medium text-[clamp(0.75rem,1vw,0.875rem)] text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400"
                >
                  Tüm Ürünler
                </Link>
              </li>
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link 
                    to={`/products?category=${cat.id}`}
                    className="px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.375rem,1vw,0.5rem)] rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors font-medium text-[clamp(0.75rem,1vw,0.875rem)] text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-[clamp(0.75rem,2vw,1rem)] py-[clamp(0.375rem,1vw,0.5rem)] rounded-full hover:bg-orange-50 dark:hover:bg-orange-900/30 transition-colors font-medium text-[clamp(0.75rem,1vw,0.875rem)] text-gray-700 dark:text-gray-200 hover:text-orange-600 dark:hover:text-orange-400 flex items-center gap-[clamp(0.25rem,0.5vw,0.375rem)]">
                      Diğer
                      <ChevronDown className="h-[clamp(0.75rem,1vw,1rem)] w-[clamp(0.75rem,1vw,1rem)]" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    {categories.slice(6).map((cat) => (
                      <DropdownMenuItem key={cat.id} asChild>
                        <Link to={`/products?category=${cat.id}`}>
                          {cat.name}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </li>
            </ul>
          </div>
        </nav>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-[120px] sm:h-[140px] lg:h-[180px]" />

      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />

      {/* Live Search */}
      <LiveSearch isOpen={isLiveSearchOpen} onClose={() => setIsLiveSearchOpen(false)} />
    </>
  );
}
