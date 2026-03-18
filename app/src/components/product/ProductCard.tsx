import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Check, Star, Scale, Eye, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCompareStore } from '@/stores/compareStore';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const { addToCart } = useCartStore();
  const { isInWishlist, addToWishlist, removeFromWishlist } = useWishlistStore();
  const { isInCompare, addToCompare, removeFromCompare } = useCompareStore();
  const [isAdded, setIsAdded] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  
  const isWishlisted = isInWishlist(product.id);
  const isCompared = isInCompare(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    setIsAdded(true);
    setTimeout(() => setIsAdded(false), 1500);
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isWishlisted) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist(product);
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isCompared) {
      removeFromCompare(product.id);
      toast.info('Karşılaştırmadan çıkarıldı');
    } else {
      addToCompare(product);
      toast.success('Karşılaştırmaya eklendi', {
        description: 'Üst menüden karşılaştırma sayfasına gidebilirsiniz',
        action: {
          label: 'Git',
          onClick: () => window.location.href = '/compare'
        }
      });
    }
  };

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Compact variant for tighter spaces
  if (variant === 'compact') {
    return (
      <Link
        to={`/product/${product.id}`}
        className="group flex flex-col bg-card rounded-[clamp(0.75rem,2vw,1.25rem)] border border-border overflow-hidden hover:shadow-xl transition-all duration-300 h-full"
      >
        {/* Image Container - Fluid aspect ratio */}
        <div className="relative overflow-hidden bg-muted" style={{ aspectRatio: '1 / 1' }}>
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          
          {/* Badges */}
          <div className="absolute top-[clamp(0.25rem,1vw,0.5rem)] left-[clamp(0.25rem,1vw,0.5rem)] flex flex-col gap-1">
            {discount > 0 && (
              <Badge className="bg-red-500 text-white text-[clamp(0.625rem,1vw,0.75rem)] px-[clamp(0.25rem,1vw,0.5rem)] py-0.5">
                -{discount}%
              </Badge>
            )}
            {product.isNew && (
              <Badge className="bg-green-500 text-white text-[clamp(0.625rem,1vw,0.75rem)] px-[clamp(0.25rem,1vw,0.5rem)] py-0.5">
                YENİ
              </Badge>
            )}
          </div>

          {/* Action Buttons - Top Right */}
          <div className="absolute top-[clamp(0.25rem,1vw,0.5rem)] right-[clamp(0.25rem,1vw,0.5rem)] flex flex-col gap-1">
            {/* Wishlist Button */}
            <button
              onClick={handleToggleWishlist}
              className={`w-[clamp(1.5rem,3.5vw,1.75rem)] h-[clamp(1.5rem,3.5vw,1.75rem)] rounded-full flex items-center justify-center transition-all duration-200 hover:bg-orange-50 ${
                isWishlisted 
                  ? 'bg-red-500 text-white hover:bg-red-600' 
                  : 'bg-white/90 text-gray-600 hover:text-orange-500 opacity-0 group-hover:opacity-100'
              }`}
            >
              <Heart className={`w-[clamp(0.625rem,1.5vw,0.875rem)] h-[clamp(0.625rem,1.5vw,0.875rem)] transition-colors ${isWishlisted ? 'fill-current' : 'group-hover:text-orange-500'}`} />
            </button>
            
            {/* Compare Button */}
            <button
              onClick={handleToggleCompare}
              className={`w-[clamp(1.5rem,3.5vw,1.75rem)] h-[clamp(1.5rem,3.5vw,1.75rem)] rounded-full flex items-center justify-center transition-all duration-200 hover:bg-orange-50 ${
                isCompared 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-white/90 text-gray-600 hover:text-orange-500 opacity-0 group-hover:opacity-100'
              }`}
            >
              <Scale className={`w-[clamp(0.625rem,1.5vw,0.875rem)] h-[clamp(0.625rem,1.5vw,0.875rem)] transition-colors ${isCompared ? 'text-white' : 'group-hover:text-orange-500'}`} />
            </button>
            
            {/* Quick View Button */}
            <Link
              to={`/product/${product.id}`}
              className="w-[clamp(1.5rem,3.5vw,1.75rem)] h-[clamp(1.5rem,3.5vw,1.75rem)] rounded-full flex items-center justify-center bg-white/90 text-gray-600 hover:text-orange-500 hover:bg-orange-50 opacity-0 group-hover:opacity-100 transition-all duration-200"
            >
              <Eye className="w-[clamp(0.625rem,1.5vw,0.875rem)] h-[clamp(0.625rem,1.5vw,0.875rem)] transition-colors group-hover:text-orange-500" />
            </Link>
          </div>
        </div>

        {/* Content - Fluid padding */}
        <div className="p-[clamp(0.5rem,1.5vw,1rem)] flex flex-col flex-1">
          <p className="text-[clamp(0.625rem,1vw,0.75rem)] text-orange-600 font-medium mb-0.5">{product.brand}</p>
          <h3 className="text-[clamp(0.75rem,1.2vw,0.875rem)] font-semibold text-foreground line-clamp-2 mb-[clamp(0.25rem,1vw,0.5rem)]" style={{ minHeight: '2.5em' }}>
            {product.name}
          </h3>
          
          {/* Price & Add to Cart - Always at bottom */}
          <div className="mt-auto flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[clamp(0.875rem,1.5vw,1.125rem)] font-bold text-orange-600">
                {product.price.toLocaleString('tr-TR')}₺
              </span>
              {product.originalPrice && (
                <span className="text-[clamp(0.625rem,1vw,0.75rem)] text-muted-foreground line-through">
                  {product.originalPrice.toLocaleString('tr-TR')}₺
                </span>
              )}
            </div>
            <Button
              size="icon"
              className={`h-[clamp(1.75rem,4vw,2rem)] w-[clamp(1.75rem,4vw,2rem)] rounded-full transition-all duration-200 ${
                isAdded 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'gradient-orange'
              }`}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <Check className="w-[clamp(0.75rem,2vw,1rem)] h-[clamp(0.75rem,2vw,1rem)]" />
              ) : (
                <ShoppingCart className="w-[clamp(0.75rem,2vw,1rem)] h-[clamp(0.75rem,2vw,1rem)]" />
              )}
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  // Horizontal variant for list views
  if (variant === 'horizontal') {
    return (
      <Link
        to={`/product/${product.id}`}
        className="group flex bg-card rounded-[clamp(0.75rem,2vw,1.25rem)] border border-border overflow-hidden hover:shadow-xl transition-all duration-300"
      >
        {/* Image */}
        <div className="relative w-[clamp(5rem,15vw,8rem)] flex-shrink-0 overflow-hidden bg-muted">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={product.images[0]}
            alt={product.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
          {discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500 text-white text-[clamp(0.625rem,1vw,0.75rem)]">
              -{discount}%
            </Badge>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-[clamp(0.5rem,1.5vw,1rem)] flex flex-col">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-[clamp(0.625rem,1vw,0.875rem)] text-orange-600 font-medium mb-0.5">{product.brand}</p>
              <h3 className="text-[clamp(0.75rem,1.2vw,1rem)] font-semibold text-foreground line-clamp-2">
                {product.name}
              </h3>
            </div>
            <div className="flex flex-col gap-1">
              <button
                onClick={handleToggleWishlist}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 hover:bg-orange-50 ${
                  isWishlisted 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-gray-100 text-gray-600 hover:text-orange-500'
                }`}
              >
                <Heart className={`w-4 h-4 transition-colors ${isWishlisted ? 'fill-current' : 'hover:text-orange-500'}`} />
              </button>
              <button
                onClick={handleToggleCompare}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0 hover:bg-orange-50 ${
                  isCompared 
                    ? 'bg-orange-500 text-white hover:bg-orange-600' 
                    : 'bg-gray-100 text-gray-600 hover:text-orange-500'
                }`}
              >
                <Scale className={`w-4 h-4 transition-colors ${isCompared ? 'text-white' : 'hover:text-orange-500'}`} />
              </button>
              <Link
                to={`/product/${product.id}`}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-gray-600 hover:text-orange-500 hover:bg-orange-50 transition-all flex-shrink-0"
              >
                <Eye className="w-4 h-4 transition-colors hover:text-orange-500" />
              </Link>
            </div>
          </div>

          <div className="mt-auto pt-2 flex items-center justify-between">
            <div>
              <span className="text-[clamp(0.875rem,1.5vw,1.25rem)] font-bold text-orange-600">
                {product.price.toLocaleString('tr-TR')}₺
              </span>
              {product.originalPrice && (
                <span className="text-[clamp(0.625rem,1vw,0.875rem)] text-muted-foreground line-through ml-2">
                  {product.originalPrice.toLocaleString('tr-TR')}₺
                </span>
              )}
            </div>
            <Button
              size="sm"
              className={`rounded-full transition-all ${
                isAdded 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'gradient-orange'
              }`}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  <span className="text-[clamp(0.625rem,1vw,0.75rem)]">Eklendi</span>
                </>
              ) : (
                <>
                  <ShoppingCart className="w-4 h-4 mr-1" />
                  <span className="text-[clamp(0.625rem,1vw,0.75rem)]">Ekle</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  // Default card variant - FLUID (no fixed breakpoints)
  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative bg-card rounded-[clamp(0.75rem,2vw,1.5rem)] border border-border overflow-hidden hover:shadow-2xl transition-all duration-300 flex flex-col h-full"
    >
      {/* Badges - Top Left - Compact for mobile */}
      <div className="absolute top-2 left-2 z-10 flex flex-wrap gap-1 max-w-[70%]">
        {discount > 0 && (
          <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 font-bold rounded">
            -{discount}%
          </Badge>
        )}
        {product.isNew && (
          <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 font-bold rounded">
            YENİ
          </Badge>
        )}
        {product.rating >= 4.5 && (
          <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5 font-bold rounded">
            🔥 ÇOK SATAN
          </Badge>
        )}
      </div>

      {/* Action Buttons - Top Right - Compact */}
      <div className="absolute top-2 right-2 z-10 flex flex-col gap-1">
        {/* Wishlist Button */}
        <button
          onClick={handleToggleWishlist}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-orange-50 ${
            isWishlisted 
              ? 'bg-red-500 text-white shadow' 
              : 'bg-white/90 text-gray-600 hover:text-orange-500 opacity-0 group-hover:opacity-100 shadow-sm'
          }`}
        >
          <Heart className={`w-3.5 h-3.5 ${isWishlisted ? 'fill-current' : ''}`} />
        </button>
        
        {/* Compare Button */}
        <button
          onClick={handleToggleCompare}
          className={`w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-orange-50 ${
            isCompared 
              ? 'bg-orange-500 text-white shadow' 
              : 'bg-white/90 text-gray-600 hover:text-orange-500 opacity-0 group-hover:opacity-100 shadow-sm'
          }`}
        >
          <Scale className={`w-3.5 h-3.5 ${isCompared ? 'text-white' : ''}`} />
        </button>
        
        {/* Quick View Button */}
        <Link
          to={`/product/${product.id}`}
          className="w-7 h-7 rounded-full flex items-center justify-center bg-white/90 text-gray-600 hover:text-orange-500 hover:bg-orange-50 opacity-0 group-hover:opacity-100 shadow-sm transition-all duration-200"
        >
          <Eye className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Image Container - Square for mobile, 4:3 for desktop */}
      <div className="relative overflow-hidden bg-gray-100 aspect-square sm:aspect-[4/3]">
        {!imageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <Package className="w-8 h-8 text-gray-300" />
          </div>
        )}
        <img
          src={product.images[0]}
          alt={product.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"%3E%3Crect width="100" height="100" fill="%23f3f4f6"/%3E%3Ctext x="50" y="50" font-family="Arial" font-size="12" fill="%239ca3af" text-anchor="middle" dy=".3em"%3EÜrün%3C/text%3E%3C/svg%3E';
          }}
        />
      </div>

      {/* Content */}
      <div className="p-2 sm:p-3 flex flex-col flex-1">
        {/* Brand & Rating */}
        <div className="flex items-center justify-between gap-2 mb-0.5">
          <p className="text-xs text-orange-600 font-semibold truncate">{product.brand}</p>
          {product.rating > 0 && (
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{product.rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 leading-tight">
          {product.name}
        </h3>

        {/* Price & Add to Cart - Mobile optimized */}
        <div className="mt-auto pt-2 border-t border-border/50">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <span className="text-sm sm:text-base font-bold text-orange-600 block">
                {product.price.toLocaleString('tr-TR')}₺
              </span>
              {product.originalPrice && (
                <p className="text-xs text-muted-foreground line-through">
                  {product.originalPrice.toLocaleString('tr-TR')}₺
                </p>
              )}
            </div>
            <Button
              size="icon"
              className={`rounded-full h-8 w-8 flex-shrink-0 ${
                isAdded 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : 'gradient-orange'
              }`}
              onClick={handleAddToCart}
            >
              {isAdded ? (
                <Check className="h-4 w-4" />
              ) : (
                <ShoppingCart className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
}
