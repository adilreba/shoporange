import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingCart, Scale, Eye, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Product } from '@/types';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCompareStore } from '@/stores/compareStore';
import { toast } from 'sonner';
import { QuickView } from './QuickView';

interface ProductCardProps {
  product: Product;
  variant?: 'default' | 'compact' | 'horizontal';
}

export function ProductCard({ product, variant = 'default' }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);
  const { addToCart, isInCart } = useCartStore();
  const { toggleWishlist, isInWishlist } = useWishlistStore();
  const { toggleCompare, isInCompare } = useCompareStore();

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setQuickViewOpen(true);
  };

  const inCart = isInCart(product.id);
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
    toast.success(`${product.name} sepete eklendi!`, {
      description: 'Sepetinizi görüntülemek için tıklayın.',
      action: {
        label: 'Sepete Git',
        onClick: () => window.location.href = '/cart'
      }
    });
  };

  const handleToggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(product);
    if (inWishlist) {
      toast.info(`${product.name} favorilerden çıkarıldı`);
    } else {
      toast.success(`${product.name} favorilere eklendi!`);
    }
  };

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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

  if (variant === 'horizontal') {
    return (
      <Link 
        to={`/product/${product.id}`}
        className="flex gap-4 bg-white rounded-xl border border-gray-100 p-4 hover:shadow-lg transition-shadow"
      >
        <div className="relative w-32 h-32 flex-shrink-0">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover rounded-lg"
          />
          {product.discount && product.discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              %{product.discount} İNDİRİM
            </Badge>
          )}
        </div>
        <div className="flex-1 flex flex-col">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-orange-600 font-medium">{product.brand}</p>
              <h3 className="font-semibold text-gray-900 line-clamp-2">{product.name}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={`${inWishlist ? 'text-red-500' : 'text-gray-400'}`}
              onClick={handleToggleWishlist}
            >
              <Heart className={`h-5 w-5 ${inWishlist ? 'fill-current' : ''}`} />
            </Button>
          </div>
          
          <div className="flex items-center gap-1 mt-1">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            <span className="text-sm font-medium">{product.rating}</span>
            <span className="text-sm text-gray-400">({product.reviewCount})</span>
          </div>

          <div className="mt-auto flex items-center justify-between">
            <div>
              <span className="text-xl font-bold text-orange-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through ml-2">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>
            <Button 
              size="sm"
              className="gradient-orange"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Sepete Ekle
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === 'compact') {
    return (
      <Link 
        to={`/product/${product.id}`}
        className="group block bg-white rounded-xl border border-gray-100 overflow-hidden hover:shadow-lg transition-all"
      >
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.discount && product.discount > 0 && (
            <Badge className="absolute top-2 left-2 bg-red-500">
              %{product.discount}
            </Badge>
          )}
        </div>
        <div className="p-3">
          <p className="text-xs text-orange-600 font-medium">{product.brand}</p>
          <h3 className="font-medium text-sm text-gray-900 line-clamp-1 mt-0.5">{product.name}</h3>
          <div className="flex items-center justify-between mt-2">
            <span className="font-bold text-orange-600">
              {formatPrice(product.price)}
            </span>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={handleAddToCart}
            >
              <ShoppingCart className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <div 
      className="group relative bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-2xl hover:border-orange-200 transition-all duration-300"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-1">
        {product.isNew && (
          <Badge className="bg-green-500 hover:bg-green-600">YENİ</Badge>
        )}
        {product.discount && product.discount > 0 && (
          <Badge className="bg-red-500 hover:bg-red-600">%{product.discount} İNDİRİM</Badge>
        )}
        {product.isBestseller && (
          <Badge className="bg-amber-500 hover:bg-amber-600">ÇOK SATAN</Badge>
        )}
      </div>

      {/* Action Buttons */}
      <div className={`absolute top-3 right-3 z-10 flex flex-col gap-2 transition-all duration-300 ${
        isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'
      }`}>
        <Button
          variant="secondary"
          size="icon"
          className={`w-9 h-9 rounded-full shadow-md transition-colors ${
            inWishlist ? 'bg-red-50 text-red-500' : 'bg-white text-gray-600 hover:text-red-500'
          }`}
          onClick={handleToggleWishlist}
        >
          <Heart className={`h-4 w-4 ${inWishlist ? 'fill-current' : ''}`} />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className={`w-9 h-9 rounded-full shadow-md transition-colors ${
            inCompare ? 'bg-orange-50 text-orange-500' : 'bg-white text-gray-600 hover:text-orange-500'
          }`}
          onClick={handleToggleCompare}
        >
          <Scale className="h-4 w-4" />
        </Button>
        <Button
          variant="secondary"
          size="icon"
          className="w-9 h-9 rounded-full shadow-md bg-white text-gray-600 hover:text-orange-500"
          onClick={handleQuickView}
        >
          <Eye className="h-4 w-4" />
        </Button>
      </div>

      {/* Image */}
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          {product.images[1] && (
            <img
              src={product.images[1]}
              alt={product.name}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-500 ${
                isHovered ? 'opacity-100' : 'opacity-0'
              }`}
            />
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="p-4">
        <Link to={`/product/${product.id}`}>
          <p className="text-sm text-orange-600 font-medium">{product.brand}</p>
          <h3 className="font-semibold text-gray-900 line-clamp-2 mt-1 group-hover:text-orange-600 transition-colors">
            {product.name}
          </h3>
        </Link>

        {/* Rating */}
        <div className="flex items-center gap-1 mt-2">
          <div className="flex">
            {[...Array(5)].map((_, i) => (
              <Star 
                key={i} 
                className={`h-4 w-4 ${
                  i < Math.floor(product.rating) 
                    ? 'fill-amber-400 text-amber-400' 
                    : 'text-gray-300'
                }`} 
              />
            ))}
          </div>
          <span className="text-sm text-gray-500">({product.reviewCount})</span>
        </div>

        {/* Price & Add to Cart */}
        <div className="flex items-end justify-between mt-3">
          <div>
            <span className="text-xl font-bold text-orange-600">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-sm text-gray-400 line-through ml-2">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <Button 
            size="sm"
            className={`rounded-full transition-all ${
              inCart 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'gradient-orange hover:shadow-orange'
            }`}
            onClick={handleAddToCart}
          >
            <ShoppingCart className="h-4 w-4 mr-1" />
            {inCart ? 'Eklendi' : 'Sepete Ekle'}
          </Button>
        </div>

        {/* Stock Status */}
        {product.stock < 10 && product.stock > 0 && (
          <p className="text-xs text-red-500 mt-2">
            Sadece {product.stock} adet kaldı!
          </p>
        )}
        {product.stock === 0 && (
          <p className="text-xs text-gray-500 mt-2">
            Stokta yok
          </p>
        )}
      </div>

      {/* Quick View Modal */}
      <QuickView 
        product={product} 
        isOpen={quickViewOpen} 
        onClose={() => setQuickViewOpen(false)} 
      />
    </div>
  );
}
