import { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCartStore } from '@/stores/cartStore';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCompareStore } from '@/stores/compareStore';
import { Heart, ShoppingCart, BarChart3, X, Check, Star, Truck, Shield, RotateCcw, Share2, Minus, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import type { Product } from '@/types';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface QuickViewProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickView({ product, isOpen, onClose }: QuickViewProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showFeatures, setShowFeatures] = useState(false);
  
  const { addToCart } = useCartStore();
  const { addToWishlist, isInWishlist, removeFromWishlist } = useWishlistStore();
  const { addToCompare, isInCompare, removeFromCompare } = useCompareStore();

  const handleAddToCart = () => {
    addToCart(product, quantity);
    toast.success(`${product.name} sepete eklendi!`);
    onClose();
  };

  const handleWishlistToggle = () => {
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
      toast.info('Ürün favorilerden çıkarıldı');
    } else {
      addToWishlist(product);
      toast.success('Ürün favorilere eklendi');
    }
  };

  const handleCompareToggle = () => {
    if (isInCompare(product.id)) {
      removeFromCompare(product.id);
      toast.info('Ürün karşılaştırmadan çıkarıldı');
    } else {
      addToCompare(product);
      toast.success('Ürün karşılaştırmaya eklendi');
    }
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.origin + '/product/' + product.id);
    toast.success('Ürün linki kopyalandı!');
  };

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % product.images.length);
  };

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + product.images.length) % product.images.length);
  };

  const discount = product.originalPrice 
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg p-0 overflow-hidden w-[95vw] max-h-[85vh] flex flex-col">
        <VisuallyHidden>
          <DialogTitle>{product.name} - Hızlı Görünüm</DialogTitle>
        </VisuallyHidden>
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-50 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border border-gray-200 hover:bg-gray-100"
        >
          <X className="w-4 h-4 text-gray-600" />
        </button>

        {/* Scrollable Content */}
        <div className="flex flex-col h-full overflow-y-auto">
          {/* IMAGE SECTION */}
          <div className="relative bg-gray-50 p-3 flex-shrink-0">
            {/* Main Image */}
            <div className="relative aspect-[4/3] bg-white rounded-lg overflow-hidden">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain p-4"
              />
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {product.isNew && (
                  <Badge className="bg-green-500 text-white text-[10px] px-1.5 py-0.5">YENİ</Badge>
                )}
                {discount > 0 && (
                  <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0.5">%{discount}</Badge>
                )}
                {product.isBestseller && (
                  <Badge className="bg-orange-500 text-white text-[10px] px-1.5 py-0.5">ÇOK SATAN</Badge>
                )}
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="absolute top-2 right-2 w-7 h-7 bg-white rounded-full shadow flex items-center justify-center border border-gray-200"
              >
                <Share2 className="w-3.5 h-3.5 text-gray-600" />
              </button>

              {/* Navigation Arrows */}
              {product.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full shadow flex items-center justify-center"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-600" />
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 rounded-full shadow flex items-center justify-center"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  </button>
                </>
              )}

              {/* Image Counter */}
              {product.images.length > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full">
                  {selectedImage + 1} / {product.images.length}
                </div>
              )}
            </div>
            
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-1.5 justify-center mt-2">
                {product.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`w-10 h-10 rounded border-2 overflow-hidden ${
                      selectedImage === idx ? 'border-orange-500' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* INFO SECTION */}
          <div className="p-4 flex flex-col">
            {/* Brand & Name */}
            <p className="text-xs text-orange-600 font-semibold uppercase">{product.brand}</p>
            <h2 className="text-base font-bold text-gray-900 mt-0.5 leading-tight">{product.name}</h2>

            {/* Rating */}
            <div className="flex items-center gap-2 mt-2 text-xs">
              <div className="flex items-center bg-yellow-50 px-2 py-0.5 rounded-full">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400 mr-1" />
                <span className="font-semibold">{product.rating}</span>
              </div>
              <span className="text-gray-500">({product.reviewCount} değerlendirme)</span>
              <span className="text-gray-300">|</span>
              <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                {product.stock > 0 ? `Stokta (${product.stock})` : 'Stokta Yok'}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 mt-2">
              <span className="text-xl font-bold text-orange-600">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-sm text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 mt-2 text-sm line-clamp-2">{product.description}</p>

            {/* Features */}
            {product.features && Object.keys(product.features).length > 0 && (
              <div className="mt-3">
                <button
                  onClick={() => setShowFeatures(!showFeatures)}
                  className="flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                  <Check className="w-4 h-4 text-green-500" />
                  Ürün Özellikleri
                  <span className="text-xs text-gray-400">({Object.keys(product.features).length})</span>
                </button>
                
                {showFeatures && (
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {Object.entries(product.features).slice(0, 4).map(([key, value]) => (
                      <div key={key} className="p-2 bg-gray-50 rounded text-xs">
                        <span className="text-gray-500 uppercase block text-[10px]">{key}</span>
                        <span className="font-medium text-gray-800">{value}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Benefits */}
            <div className="flex items-center justify-between gap-2 mt-3 py-2 border-y border-gray-100 text-xs">
              <div className="flex items-center gap-1">
                <Truck className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-gray-600">Ücretsiz Kargo</span>
              </div>
              <div className="flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5 text-green-500" />
                <span className="text-gray-600">14 Gün İade</span>
              </div>
              <div className="flex items-center gap-1">
                <Shield className="w-3.5 h-3.5 text-purple-500" />
                <span className="text-gray-600">Garantili</span>
              </div>
            </div>

            {/* Quantity */}
            {product.stock > 0 && (
              <div className="flex items-center gap-3 mt-3">
                <span className="text-sm font-medium">Adet:</span>
                <div className="flex items-center border border-gray-200 rounded">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="px-2.5 py-1 hover:bg-gray-100"
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="px-3 py-1 font-semibold text-sm border-x border-gray-200 min-w-[2rem] text-center">
                    {quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="px-2.5 py-1 hover:bg-gray-100"
                    disabled={quantity >= product.stock}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
              <Button
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className="flex-1 bg-orange-500 hover:bg-orange-600 h-10 text-sm font-semibold"
              >
                <ShoppingCart className="w-4 h-4 mr-1.5" />
                {product.stock === 0 ? 'Stokta Yok' : 'Sepete Ekle'}
              </Button>
              
              <Button
                variant="outline"
                onClick={handleWishlistToggle}
                className={`h-10 px-2.5 ${isInWishlist(product.id) ? 'bg-red-50 border-red-200 text-red-500' : ''}`}
              >
                <Heart className={`w-4 h-4 ${isInWishlist(product.id) ? 'fill-current' : ''}`} />
              </Button>
              
              <Button
                variant="outline"
                onClick={handleCompareToggle}
                className={`h-10 px-2.5 ${isInCompare(product.id) ? 'bg-blue-50 border-blue-200 text-blue-500' : ''}`}
              >
                <BarChart3 className="w-4 h-4" />
              </Button>
            </div>

            {/* View Full Details */}
            <a
              href={`/product/${product.id}`}
              onClick={onClose}
              className="block text-center text-orange-600 hover:text-orange-700 font-medium mt-2 text-sm"
            >
              Tüm Detayları Gör →
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
