import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Gift,
  Truck,
  ShieldCheck,
  RotateCcw,

} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export function Cart() {
  const navigate = useNavigate();
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    totalItems, 
    totalPrice, 
    finalPrice, 
    shippingCost,
    couponCode,
    discountAmount,
    applyCoupon,
    removeCoupon,
    clearCart
  } = useCartStore();
  
  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = () => {
    if (applyCoupon(couponInput)) {
      toast.success('Kupon başarıyla uygulandı!');
      setCouponInput('');
    } else {
      toast.error('Geçersiz kupon kodu');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-custom pt-[42px] pb-12 sm:pt-[42px] sm:py-16 px-4">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-12 w-12 sm:h-16 sm:w-16 text-orange-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-3">Sepetiniz Boş</h1>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Sepetinizde ürün bulunmuyor. Hemen alışverişe başlayın!
            </p>
            <Button 
              className="gradient-orange px-6 sm:px-8"
              onClick={() => navigate('/products')}
            >
              Alışverişe Başla
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom pt-[42px] pb-6 sm:pt-[42px] sm:pb-8 px-4">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 sm:mb-6">
          Alışveriş Sepeti 
          <span className="text-muted-foreground font-normal text-base sm:text-lg ml-2">
            ({totalItems()} ürün)
          </span>
        </h1>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-3 sm:space-y-4">
            {items.map((item) => (
              <div 
                key={item.product.id}
                className="flex gap-3 sm:gap-4 p-3 sm:p-4 bg-card rounded-xl border border-border hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <Link 
                  to={`/product/${item.product.id}`}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <Link 
                        to={`/product/${item.product.id}`}
                        className="font-semibold text-foreground hover:text-orange-600 transition-colors text-sm sm:text-base line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-xs sm:text-sm text-muted-foreground">{item.product.brand}</p>
                      
                      {item.product.discount && item.product.discount > 0 && (
                        <Badge className="mt-1 bg-red-100 text-red-600 text-xs">
                          %{item.product.discount} İndirim
                        </Badge>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(item.product.id);
                        toast.info('Ürün sepetten çıkarıldı');
                      }}
                      className="text-muted-foreground hover:text-red-500 transition-colors p-1"
                      aria-label="Ürünü sil"
                    >
                      <Trash2 className="h-4 w-4 sm:h-5 sm:w-5" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-3 sm:mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border rounded-lg bg-background">
                      <button
                        onClick={() => {
                          if (item.quantity <= 1) {
                            removeFromCart(item.product.id);
                            toast.info('Ürün sepetten çıkarıldı');
                          } else {
                            updateQuantity(item.product.id, item.quantity - 1);
                          }
                        }}
                        className="p-2.5 sm:p-3 hover:bg-muted transition-colors"
                        aria-label="Azalt"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 sm:w-10 text-center font-medium text-base">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-2.5 sm:p-3 hover:bg-muted transition-colors"
                        disabled={item.quantity >= item.product.stock}
                        aria-label="Artır"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-base sm:text-lg font-bold text-orange-600">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                      {item.product.originalPrice && (
                        <p className="text-xs sm:text-sm text-muted-foreground line-through">
                          {formatPrice(item.product.originalPrice * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart - Mobile */}
            <Button 
              variant="ghost" 
              className="text-red-500 hover:text-red-600 w-full lg:hidden"
              onClick={() => {
                clearCart();
                toast.info('Sepet temizlendi');
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sepeti Temizle
            </Button>
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-muted rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-4 sm:space-y-6">
              <h2 className="text-lg sm:text-xl font-bold">Sipariş Özeti</h2>

              {/* Coupon Code */}
              <div>
                <p className="text-sm font-medium text-foreground mb-2">İndirim Kuponu</p>
                {couponCode ? (
                  <div className="flex items-center gap-2 p-2.5 sm:p-3 bg-green-50 rounded-lg">
                    <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-green-600" />
                    <span className="flex-1 text-green-700 font-medium text-sm">
                      {couponCode} - %{discountAmount} İndirim
                    </span>
                    <button 
                      onClick={removeCoupon}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      Kaldır
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kupon kodu"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button 
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim()}
                      className="text-sm"
                    >
                      Uygula
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-2 sm:space-y-3 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-{formatPrice(totalPrice() * discountAmount / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Kargo</span>
                  <span className={shippingCost() === 0 ? 'text-green-600' : ''}>
                    {shippingCost() === 0 ? 'Ücretsiz' : formatPrice(shippingCost())}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg sm:text-xl font-bold">
                  <span>Toplam</span>
                  <span className="text-orange-600">{formatPrice(finalPrice())}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                className="w-full gradient-orange h-12 sm:h-14 text-base sm:text-lg"
                onClick={() => navigate('/checkout')}
              >
                Ödemeye Geç
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
              </Button>

              {/* Free Shipping Progress */}
              {totalPrice() < 500 && (
                <div className="p-3 bg-orange-50 rounded-lg">
                  <p className="text-xs sm:text-sm text-orange-700 text-center">
                    <span className="font-bold">{formatPrice(500 - totalPrice())}</span> daha harcayın, 
                    <span className="font-bold"> ücretsiz kargo</span> kazanın!
                  </p>
                </div>
              )}

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                <div className="text-center">
                  <Truck className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Ücretsiz Kargo</p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Güvenli Ödeme</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-4 w-4 sm:h-5 sm:w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-[10px] sm:text-xs text-muted-foreground">Kolay İade</p>
                </div>
              </div>
            </div>

            {/* Clear Cart - Desktop */}
            <Button 
              variant="ghost" 
              className="text-red-500 hover:text-red-600 w-full mt-4 hidden lg:flex"
              onClick={() => {
                clearCart();
                toast.info('Sepet temizlendi');
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Sepeti Temizle
            </Button>
          </div>
        </div>
      </main>

      {/* Mobile Sticky Checkout */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-card border-t p-3 sm:p-4 safe-area-inset z-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">Toplam</span>
          <span className="text-xl font-bold text-orange-600">{formatPrice(finalPrice())}</span>
        </div>
        <Button 
          className="w-full gradient-orange h-11"
          onClick={() => navigate('/checkout')}
        >
          Ödemeye Geç
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Spacer for mobile sticky */}
      <div className="h-24 lg:hidden" />

      <Footer />
    </div>
  );
}
