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
  ChevronRight,
  Minus,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductReviews } from '@/components/product/ProductReviews';
import { getProductById, products } from '@/data/mockData';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCompareStore } from '@/stores/compareStore';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
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
  
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    if (product) {
      setSelectedImage(0);
      setQuantity(1);
      // Add to recently viewed
      addToRecentlyViewed(product);
    }
  }, [product, addToRecentlyViewed]);

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-custom py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Ürün Bulunamadı</h1>
          <p className="text-gray-500 mb-6">Aradığınız ürün mevcut değil.</p>
          <Button onClick={() => navigate('/products')}>
            Ürünlere Dön
          </Button>
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

  const handleAddToCart = () => {
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-orange-600">Ana Sayfa</Link>
          <ChevronRight className="h-4 w-4" />
          <Link to="/products" className="hover:text-orange-600">Ürünler</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900">{product.name}</span>
        </nav>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div 
              className="relative aspect-square bg-gray-50 rounded-2xl overflow-hidden cursor-zoom-in"
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
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {product.isNew && (
                  <Badge className="bg-green-500">YENİ</Badge>
                )}
                {product.discount && product.discount > 0 && (
                  <Badge className="bg-red-500">%{product.discount} İNDİRİM</Badge>
                )}
                {product.isBestseller && (
                  <Badge className="bg-amber-500">ÇOK SATAN</Badge>
                )}
              </div>
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
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
          <div className="space-y-6">
            {/* Brand & Name */}
            <div>
              <Link 
                to={`/products?brand=${product.brand}`}
                className="text-orange-600 font-medium hover:underline"
              >
                {product.brand}
              </Link>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mt-1">
                {product.name}
              </h1>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating) 
                        ? 'fill-amber-400 text-amber-400' 
                        : 'text-gray-300'
                    }`}
                  />
                ))}
                <span className="font-medium ml-2">{product.rating}</span>
              </div>
              <span className="text-gray-500">({product.reviewCount} değerlendirme)</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl md:text-4xl font-bold text-orange-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <>
                  <span className="text-xl text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                  <Badge className="bg-red-500">
                    %{product.discount} Tasarruf
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">
              {product.description}
            </p>

            {/* Features */}
            {product.features && (
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold mb-3">Özellikler</h4>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.features).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm">
                        <span className="font-medium">{key}:</span> {value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.stock > 0 ? (
                <>
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-green-600 font-medium">
                    Stokta ({product.stock} adet)
                  </span>
                </>
              ) : (
                <>
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <span className="text-red-600 font-medium">Stokta Yok</span>
                </>
              )}
            </div>

            {/* Quantity & Add to Cart */}
            <div className="flex flex-wrap items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center border rounded-lg">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="p-3 hover:bg-gray-100 transition-colors"
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-12 text-center font-medium">{quantity}</span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  className="p-3 hover:bg-gray-100 transition-colors"
                  disabled={quantity >= product.stock}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>

              {/* Add to Cart */}
              <Button 
                size="lg"
                className="flex-1 gradient-orange h-14 text-lg"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Sepete Ekle
              </Button>

              {/* Wishlist */}
              <Button
                variant="outline"
                size="icon"
                className={`h-14 w-14 ${inWishlist ? 'text-red-500 border-red-500' : ''}`}
                onClick={handleToggleWishlist}
              >
                <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
              </Button>

              {/* Compare */}
              <Button
                variant="outline"
                size="icon"
                className={`h-14 w-14 ${inCompare ? 'text-orange-500 border-orange-500' : ''}`}
                onClick={handleToggleCompare}
              >
                <Scale className="h-5 h-5" />
              </Button>
            </div>

            {/* Stock Alert - Show when out of stock */}
            {product.stock === 0 && (
              <div className="mt-4">
                <StockAlertButton 
                  productId={product.id} 
                  productName={product.name}
                />
              </div>
            )}

            {/* Benefits */}
            <div className="grid grid-cols-3 gap-4 pt-6 border-t">
              <div className="text-center">
                <Truck className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-xs text-gray-600">Ücretsiz Kargo</p>
                <p className="text-xs text-gray-400">500₺ üzeri</p>
              </div>
              <div className="text-center">
                <ShieldCheck className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-xs text-gray-600">Güvenli Ödeme</p>
                <p className="text-xs text-gray-400">256-bit SSL</p>
              </div>
              <div className="text-center">
                <RotateCcw className="h-6 w-6 mx-auto mb-2 text-orange-500" />
                <p className="text-xs text-gray-600">Kolay İade</p>
                <p className="text-xs text-gray-400">14 gün içinde</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-12">
          <Tabs defaultValue="description">
            <TabsList className="w-full justify-start">
              <TabsTrigger value="description">Ürün Açıklaması</TabsTrigger>
              <TabsTrigger value="specs">Teknik Özellikler</TabsTrigger>
              <TabsTrigger value="reviews">
                Değerlendirmeler ({product.reviewCount})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="description" className="mt-6">
              <div className="prose max-w-none">
                <p className="text-gray-600 leading-relaxed">
                  {product.description}
                </p>
                {product.tags && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Etiketler:</h4>
                    <div className="flex flex-wrap gap-2">
                      {product.tags.map(tag => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="specs" className="mt-6">
              {product.features ? (
                <div className="bg-gray-50 rounded-xl overflow-hidden">
                  <table className="w-full">
                    <tbody>
                      {Object.entries(product.features).map(([key, value], index) => (
                        <tr 
                          key={key} 
                          className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                        >
                          <td className="px-6 py-4 font-medium text-gray-700 w-1/3">
                            {key}
                          </td>
                          <td className="px-6 py-4 text-gray-600">
                            {value}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-500">Teknik özellikler bulunmuyor.</p>
              )}
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
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
          <div className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Benzer Ürünler</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
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
    </div>
  );
}
