import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  Heart, 
  Scale, 
  ShoppingCart, 
  Star, 
  Check, 
  Truck, 
  ShieldCheck, 
  RotateCcw,
  Minus,
  Plus,
  Share2,
  AlertCircle,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO, generateProductSEO, generateBreadcrumbs } from '@/components/common/SEO';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductReviews } from '@/components/product/ProductReviews';
import { getProductById, products } from '@/data/mockData';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCompareStore } from '@/stores/compareStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { useStockStore } from '@/stores/stockStore';
import { toast } from 'sonner';
import { RecentlyViewed } from '@/components/product/RecentlyViewed';
import { StockAlertButton } from '@/components/product/StockAlert';

export function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const product = id ? getProductById(id) : undefined;
  
  const { addToCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { toggleCompare, isInCompare } = useCompareStore();
  const { addItem: addToRecentlyViewed } = useRecentlyViewedStore();
  const { checkProductStock, getCachedStock } = useStockStore();
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);
  
  // Real-time stock state
  const [stockInfo, setStockInfo] = useState<{
    loading: boolean;
    available: number;
    inStock: boolean;
    canAddToCart: boolean;
    error: string | null;
  }>({
    loading: true,
    available: product?.stock || 0,
    inStock: (product?.stock || 0) > 0,
    canAddToCart: (product?.stock || 0) > 0,
    error: null,
  });

  // Check stock on mount and when product changes
  useEffect(() => {
    if (!product || !id) return;

    const checkStock = async () => {
      setStockInfo(prev => ({ ...prev, loading: true, error: null }));
      
      try {
        // First check cache
        const cached = getCachedStock(id);
        if (cached) {
          setStockInfo({
            loading: false,
            available: cached.actualAvailable,
            inStock: cached.actualAvailable > 0,
            canAddToCart: cached.actualAvailable > 0,
            error: null,
          });
        }

        // Then fetch fresh data
        const result = await checkProductStock(id, quantity);
        setStockInfo({
          loading: false,
          available: result.available,
          inStock: result.inStock,
          canAddToCart: result.canAddToCart,
          error: null,
        });
      } catch (error) {
        console.error('Error checking stock:', error);
        // Fallback to product data
        setStockInfo({
          loading: false,
          available: product.stock || 0,
          inStock: (product.stock || 0) > 0,
          canAddToCart: (product.stock || 0) > 0,
          error: 'Stok bilgisi alınamadı, lütfen tekrar deneyin',
        });
      }
    };

    checkStock();
    setSelectedImage(0);
    setQuantity(1);
    addToRecentlyViewed(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [product, id, quantity, checkProductStock, getCachedStock, addToRecentlyViewed]);

  // Refresh stock every 60 seconds
  useEffect(() => {
    if (!id) return;

    const interval = setInterval(async () => {
      try {
        const result = await checkProductStock(id, quantity);
        setStockInfo({
          loading: false,
          available: result.available,
          inStock: result.inStock,
          canAddToCart: result.canAddToCart,
          error: null,
        });
      } catch (error) {
        console.error('Error refreshing stock:', error);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [id, quantity, checkProductStock]);

  

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-custom py-12 sm:py-16 text-center px-4">
          <div className="max-w-md mx-auto">
            <AlertCircle className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-bold mb-3">Ürün Bulunamadı</h1>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">Aradığınız ürün mevcut değil.</p>
            <Button onClick={() => navigate('/products')} className="gradient-orange">
              Ürünlere Dön
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  // Get related products
  const relatedProducts = products
    .filter(p => p.category === product.category && p.id !== product.id)
    .slice(0, 4);

  const handleAddToCart = async () => {
    // Check stock again before adding
    if (!stockInfo.canAddToCart || stockInfo.available < quantity) {
      toast.error('Yetersiz stok!', {
        description: `Mevcut stok: ${stockInfo.available} adet`
      });
      return;
    }

    addToCart(product, quantity);
    toast.success(`${product.name} sepete eklendi!`, {
      description: `${quantity} adet ürün sepetinize eklendi.`
    });
  };

  const handleToggleWishlist = () => {
    toggleWishlist(product);
    if (inWishlist) {
      toast.info('Favorilerden çıkarıldı');
    } else {
      toast.success('Favorilere eklendi!');
    }
  };

  const handleToggleCompare = () => {
    const result = toggleCompare(product);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.warning(result.message);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch {
        // User cancelled
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Get stock status display
  const getStockStatus = () => {
    if (stockInfo.loading) {
      return (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Stok kontrol ediliyor...</span>
        </div>
      );
    }

    if (stockInfo.error) {
      return (
        <div className="flex items-center gap-2 text-amber-600">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm">{stockInfo.error}</span>
        </div>
      );
    }

    if (stockInfo.available === 0) {
      return (
        <>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500" />
          <span className="text-red-600 font-medium text-sm sm:text-base">Stokta Yok</span>
        </>
      );
    }

    if (stockInfo.available < 5) {
      return (
        <>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500 animate-pulse" />
          <span className="text-red-600 font-medium text-sm sm:text-base">
            Son {stockInfo.available} adet!
          </span>
        </>
      );
    }

    if (stockInfo.available < 10) {
      return (
        <>
          <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-yellow-500" />
          <span className="text-yellow-600 font-medium text-sm sm:text-base">
            Stokta ({stockInfo.available} adet)
          </span>
        </>
      );
    }

    return (
      <>
        <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-green-500" />
        <span className="text-green-600 font-medium text-sm sm:text-base">
          Stokta ({stockInfo.available} adet)
        </span>
      </>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {product && (
        <SEO 
          {...generateProductSEO(product)}
          url={`/product/${product.id}`}
          breadcrumbs={generateBreadcrumbs([
            { name: product.category, url: `/products?category=${product.category}` },
            { name: product.name, url: `/product/${product.id}` },
          ])}
        />
      )}
      <Header />
      
      <main className="container-custom pt-[42px] pb-6 sm:pt-[42px] sm:pb-8">
        <div className="grid lg:grid-cols-2 gap-6 lg:gap-8 lg:gap-12">
          {/* Images Section */}
          <div className="space-y-3 sm:space-y-4">
            {/* Main Image */}
            <div 
              className="relative aspect-square bg-muted rounded-xl sm:rounded-2xl overflow-hidden cursor-zoom-in"
              onClick={() => setIsZoomed(!isZoomed)}
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className={`w-full h-full object-cover transition-transform duration-300 ${
                  isZoomed ? 'scale-150' : 'scale-100'
                }`}
              />
              
              {/* Badges */}
              <div className="absolute top-3 left-3 flex flex-col gap-1.5 sm:gap-2">
                {product.isNew && (
                  <Badge className="bg-green-500 text-xs">YENİ</Badge>
                )}
                {product.discount && product.discount > 0 && (
                  <Badge className="bg-red-500 text-xs">%{product.discount} İNDİRİM</Badge>
                )}
                {product.isBestseller && (
                  <Badge className="bg-amber-500 text-xs">ÇOK SATAN</Badge>
                )}
                {!stockInfo.inStock && !stockInfo.loading && (
                  <Badge className="bg-gray-500 text-xs">TÜKENDİ</Badge>
                )}
                {stockInfo.available > 0 && stockInfo.available < 5 && (
                  <Badge className="bg-red-500 text-xs animate-pulse">AZ STOK</Badge>
                )}
              </div>

              {/* Share Button */}
              <button
                onClick={(e) => { e.stopPropagation(); handleShare(); }}
                className="absolute top-3 right-3 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-card/90 flex items-center justify-center shadow-md hover:bg-card transition-colors"
              >
                <Share2 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      selectedImage === index 
                        ? 'border-orange-500' 
                        : 'border-transparent hover:border-gray-300'
                    }`}
                  >
                    <img
                      src={img}
                      alt={`${product.name} - ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-4 sm:space-y-6">
            {/* Brand & Name */}
            <div>
              <Link 
                to={`/products?brand=${product.brand}`}
                className="text-orange-600 font-medium text-sm sm:text-base hover:underline"
              >
                {product.brand}
              </Link>
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-1 leading-tight">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-4 w-4 sm:h-5 sm:w-5 ${
                      i < Math.floor(product.rating) 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="font-medium ml-1 sm:ml-2 text-sm sm:text-base">{product.rating}</span>
              </div>
              <span className="text-muted-foreground text-xs sm:text-sm">({product.reviewCount} değerlendirme)</span>
            </div>

            {/* Price */}
            <div className="flex flex-wrap items-baseline gap-2 sm:gap-3">
              <span className="text-2xl sm:text-3xl lg:text-4xl font-bold text-orange-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-lg sm:text-xl text-muted-foreground line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge className="bg-red-500 text-xs sm:text-sm">
                    %{product.discount} Tasarruf
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
              {product.description}
            </p>

            {/* Features */}
            {product.features && (
              <div className="bg-muted rounded-xl p-3 sm:p-4">
                <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Özellikler</h4>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {Object.entries(product.features).slice(0, 4).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-xs sm:text-sm truncate">
                        <span className="font-medium">{key}:</span> {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status - Real-time */}
            <div className="flex items-center gap-2">
              {getStockStatus()}
            </div>

            {/* Desktop Quantity & Add to Cart */}
            <div className="hidden sm:flex flex-wrap items-center gap-3">
              {/* Quantity Selector */}
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-2.5 sm:p-3 hover:bg-muted transition-colors disabled:opacity-50"
                  disabled={quantity <= 1 || stockInfo.loading}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-10 sm:w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(stockInfo.available, quantity + 1))}
                  className="p-2.5 sm:p-3 hover:bg-muted transition-colors"
                  disabled={quantity >= stockInfo.available || stockInfo.loading}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <Button 
                size="lg"
                className="flex-1 gradient-orange h-12 sm:h-14 text-base sm:text-lg"
                onClick={handleAddToCart}
                disabled={!stockInfo.canAddToCart || stockInfo.loading}
              >
                {stockInfo.loading ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <ShoppingCart className="h-5 w-5 mr-2" />
                )}
                {stockInfo.loading 
                  ? 'Kontrol ediliyor...' 
                  : stockInfo.canAddToCart 
                    ? 'Sepete Ekle' 
                    : 'Stokta Yok'
                }
              </Button>

              {/* Wishlist */}
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 sm:h-14 sm:w-14 ${inWishlist ? 'text-red-500 border-red-500' : ''}`}
                onClick={handleToggleWishlist}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>

              {/* Compare */}
              <Button
                variant="outline"
                size="icon"
                className={`h-12 w-12 sm:h-14 sm:w-14 ${inCompare ? 'text-orange-500 border-orange-500' : ''}`}
                onClick={handleToggleCompare}
              >
                <Scale className="h-5 w-5" />
              </Button>
            </div>

            {/* Stock Alert - Show when out of stock */}
            {!stockInfo.inStock && !stockInfo.loading && (
              <div className="hidden sm:block">
                <StockAlertButton 
                  productId={product.id} 
                  productName={product.name}
                />
              </div>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 pt-4 sm:pt-6 border-t">
              <div className="text-center">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-orange-500" />
                <p className="text-xs text-muted-foreground">Ücretsiz Kargo</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">500₺ üzeri</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-orange-500" />
                <p className="text-xs text-muted-foreground">Güvenli Ödeme</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">256-bit SSL</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-5 w-5 sm:h-6 sm:w-6 mx-auto mb-1.5 sm:mb-2 text-orange-500" />
                <p className="text-xs text-muted-foreground">Kolay İade</p>
                <p className="text-[10px] sm:text-xs text-muted-foreground">14 gün</p>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Sticky Actions - Always Visible */}
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-3 lg:hidden z-50 safe-area-pb shadow-[0_-4px_12px_-2px_rgba(0,0,0,0.15)]">
          <div className="flex items-center gap-3 max-w-screen-xl mx-auto">
            {/* Quantity Selector */}
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-800 flex-shrink-0 h-12">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 h-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-l-xl disabled:opacity-50"
                disabled={quantity <= 1 || stockInfo.loading}
              >
                <Minus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
              <span className="w-10 text-center font-semibold text-base text-gray-900 dark:text-white">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(stockInfo.available, quantity + 1))}
                className="px-3 h-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors rounded-r-xl disabled:opacity-50"
                disabled={quantity >= stockInfo.available || stockInfo.loading}
              >
                <Plus className="h-4 w-4 text-gray-600 dark:text-gray-300" />
              </button>
            </div>

            {/* Add to Cart Button */}
            <Button 
              className="flex-1 h-12 rounded-xl text-base font-semibold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white border-0 shadow-lg shadow-orange-500/25 disabled:opacity-50 disabled:shadow-none"
              onClick={handleAddToCart}
              disabled={!stockInfo.canAddToCart || stockInfo.loading}
            >
              {stockInfo.loading ? (
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              ) : (
                <ShoppingCart className="h-5 w-5 mr-2" />
              )}
              <span>
                {stockInfo.loading 
                  ? 'Kontrol...' 
                  : stockInfo.canAddToCart 
                    ? 'Sepete Ekle' 
                    : 'Stokta Yok'
                }
              </span>
            </Button>

            {/* Wishlist Button */}
            <Button
              variant="outline"
              size="icon"
              className={`h-12 w-12 rounded-xl border-2 ${inWishlist ? 'text-red-500 border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'}`}
              onClick={handleToggleWishlist}
            >
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-8 sm:mt-12">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start overflow-x-auto no-scrollbar h-auto p-1 gap-1">
              <TabsTrigger value="description" className="text-xs sm:text-sm px-3 sm:px-4 py-2">Ürün Açıklaması</TabsTrigger>
              <TabsTrigger value="specs" className="text-xs sm:text-sm px-3 sm:px-4 py-2">Teknik Özellikler</TabsTrigger>
              <TabsTrigger value="reviews" className="text-xs sm:text-sm px-3 sm:px-4 py-2">
                Değerlendirmeler ({product.reviewCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-4 sm:mt-6">
              <div className="prose max-w-none">
                <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
                  {product.description}
                </p>
                {product.tags && (
                  <div className="mt-4 sm:mt-6">
                    <h4 className="font-semibold mb-2 sm:mb-3 text-sm sm:text-base">Etiketler:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map(tag => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="specs" className="mt-4 sm:mt-6">
              {product.features ? (
                <div className="bg-muted rounded-xl overflow-hidden">
                  <div className="divide-y">
                    {Object.entries(product.features).map(([key, value], index) => (
                      <div 
                        key={key} 
                        className={`flex flex-col sm:flex-row sm:items-center px-4 sm:px-6 py-3 sm:py-4 ${index % 2 === 0 ? 'bg-card' : 'bg-muted'}`}
                      >
                        <span className="font-medium text-foreground sm:w-1/3 text-sm sm:text-base mb-1 sm:mb-0">{key}</span>
                        <span className="text-muted-foreground text-sm sm:text-base">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-muted-foreground text-sm sm:text-base">Teknik özellikler bulunmuyor.</p>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-4 sm:mt-6">
              <ProductReviews 
                reviews={product.reviews || []}
                averageRating={product.rating}
                totalReviews={product.reviewCount}
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-10 sm:mt-16">
            <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Benzer Ürünler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 md:gap-6">
              {relatedProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Recently Viewed */}
      <RecentlyViewed />

      <Footer />

      {/* Spacer for mobile sticky actions - increased height */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}
