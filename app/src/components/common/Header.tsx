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
  Moon
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
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCompareStore } from '@/stores/compareStore';
import { useThemeStore } from '@/stores/themeStore';
import { categories } from '@/data/mockData';
import { CartDrawer } from '@/components/cart/CartDrawer';
import { LiveSearch } from '@/components/search/LiveSearch';

export function Header() {
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
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
            ? 'bg-white/95 backdrop-blur-xl shadow-soft' 
            : 'bg-white'
        }`}
      >
        {/* Top Bar */}
        <div className="bg-gradient-orange text-white py-2 px-4">
          <div className="container-custom flex items-center justify-between text-sm">
            <p className="hidden sm:block">
              🎉 500₺ üzeri alışverişlerde <span className="font-bold">ÜCRETSİZ KARGO!</span>
            </p>
            <div className="flex items-center gap-4 ml-auto">
              <Link to="/help" className="hover:underline">Yardım</Link>
              <Link to="/contact" className="hover:underline">İletişim</Link>
              <Link to="/track-order" className="hover:underline">Sipariş Takip</Link>
              {isAuthenticated ? (
                <span className="font-medium">Hoş geldin, {user?.name?.split(' ')[0]}</span>
              ) : (
                <Link to="/login" className="font-medium hover:underline">Giriş Yap</Link>
              )}
            </div>
          </div>
        </div>

        {/* Main Header */}
        <div className="container-custom py-4">
          <div className="flex items-center gap-4 lg:gap-8">
            {/* Mobile Menu Button */}
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80">
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-6">
                    <Link to="/" className="text-2xl font-bold text-gradient">
                      ShopOrange
                    </Link>
                  </div>
                  
                  <nav className="flex flex-col gap-2">
                    <Link 
                      to="/" 
                      className="p-3 rounded-lg hover:bg-orange-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Ana Sayfa
                    </Link>
                    <Link 
                      to="/products" 
                      className="p-3 rounded-lg hover:bg-orange-50 transition-colors"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Tüm Ürünler
                    </Link>
                    {categories.map((cat) => (
                      <Link 
                        key={cat.id}
                        to={`/products?category=${cat.id}`}
                        className="p-3 rounded-lg hover:bg-orange-50 transition-colors flex items-center gap-3"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        <span>{cat.name}</span>
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-auto pt-6 border-t">
                    {!isAuthenticated && (
                      <div className="flex gap-2">
                        <Button 
                          className="flex-1 gradient-orange"
                          onClick={() => {
                            navigate('/login');
                            setIsMobileMenuOpen(false);
                          }}
                        >
                          Giriş Yap
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
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
            <Link to="/" className="flex-shrink-0">
              <h1 className="text-2xl lg:text-3xl font-bold">
                <span className="text-gradient">Shop</span>
                <span className="text-orange-600">Orange</span>
              </h1>
            </Link>

            {/* Search Bar */}
            <div className="hidden md:flex flex-1 max-w-xl">
              <div 
                className="relative w-full cursor-pointer"
                onClick={() => setIsLiveSearchOpen(true)}
              >
                <Input
                  type="text"
                  placeholder="Ürün, kategori veya marka ara..."
                  readOnly
                  className="w-full pl-4 pr-12 py-3 rounded-full border-2 border-orange-100 focus:border-orange-500 transition-colors cursor-pointer"
                />
                <Button 
                  size="icon"
                  onClick={() => setIsLiveSearchOpen(true)}
                  className="absolute right-1 top-1/2 -translate-y-1/2 gradient-orange rounded-full"
                >
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 lg:gap-2 ml-auto">
              {/* Theme Toggle */}
              <Button 
                variant="ghost" 
                size="icon"
                onClick={toggleTheme}
                className="hidden sm:flex"
              >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              {/* Compare */}
              <Button 
                variant="ghost" 
                size="icon"
                className="relative hidden sm:flex"
                onClick={() => navigate('/compare')}
              >
                <Scale className="h-5 w-5" />
                {compareCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500">
                    {compareCount}
                  </Badge>
                )}
              </Button>

              {/* Wishlist */}
              <Button 
                variant="ghost" 
                size="icon"
                className="relative"
                onClick={() => navigate('/wishlist')}
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-red-500">
                    {wishlistCount}
                  </Badge>
                )}
              </Button>

              {/* Cart */}
              <Button 
                variant="ghost" 
                size="icon"
                className="relative"
                onClick={() => setIsCartOpen(true)}
              >
                <ShoppingCart className="h-5 w-5" />
                {cartItemCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-orange-500">
                    {cartItemCount}
                  </Badge>
                )}
              </Button>

              {/* User Menu */}
              {isAuthenticated ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full gradient-orange flex items-center justify-center text-white font-medium">
                        {user?.name?.charAt(0).toUpperCase()}
                      </div>
                      <ChevronDown className="h-4 w-4 hidden lg:block" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium">{user?.name}</p>
                      <p className="text-sm text-muted-foreground">{user?.email}</p>
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
                    {user?.role === 'admin' && (
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Admin Paneli
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
                  onClick={() => navigate('/login')}
                >
                  <User className="h-5 w-5" />
                </Button>
              )}
            </div>
          </div>

          {/* Mobile Search */}
          <form onSubmit={handleSearch} className="md:hidden mt-4">
            <div className="relative">
              <Input
                type="text"
                placeholder="Ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-12 py-2 rounded-full"
              />
              <Button 
                type="submit" 
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 gradient-orange rounded-full h-8 w-8"
              >
                <Search className="h-4 w-4" />
              </Button>
            </div>
          </form>
        </div>

        {/* Navigation Categories - Desktop */}
        <nav className="hidden lg:block border-t">
          <div className="container-custom">
            <ul className="flex items-center gap-1 py-3">
              <li>
                <Link 
                  to="/products" 
                  className="px-4 py-2 rounded-full hover:bg-orange-50 transition-colors font-medium"
                >
                  Tüm Ürünler
                </Link>
              </li>
              {categories.slice(0, 6).map((cat) => (
                <li key={cat.id}>
                  <Link 
                    to={`/products?category=${cat.id}`}
                    className="px-4 py-2 rounded-full hover:bg-orange-50 transition-colors font-medium text-sm"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="px-4 py-2 rounded-full hover:bg-orange-50 transition-colors font-medium text-sm flex items-center gap-1">
                      Diğer
                      <ChevronDown className="h-4 w-4" />
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
      <div className="h-[140px] lg:h-[180px]" />

      {/* Cart Drawer */}
      <CartDrawer open={isCartOpen} onOpenChange={setIsCartOpen} />

      {/* Live Search */}
      <LiveSearch isOpen={isLiveSearchOpen} onClose={() => setIsLiveSearchOpen(false)} />
    </>
  );
}
