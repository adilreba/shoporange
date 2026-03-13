import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ShoppingBag, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  Gift,
  Truck,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

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
        <main className="container-custom py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="h-16 w-16 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
            <p className="text-gray-500 mb-8">
              Sepetinizde ürün bulunmuyor. Hemen alışverişe başlayın!
            </p>
            <Button 
              className="gradient-orange px-8"
              onClick={() => navigate('/products')}
            >
              Alışverişe Başla
              <ArrowRight className="h-5 w-5 ml-2" />
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
      
      <main className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-orange-600">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-900">Sepetim</span>
        </nav>

        <h1 className="text-3xl font-bold mb-8">
          Alışveriş Sepeti ({totalItems()} ürün)
        </h1>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item) => (
              <div 
                key={item.product.id}
                className="flex gap-4 p-4 bg-white rounded-xl border border-gray-100 hover:shadow-md transition-shadow"
              >
                {/* Product Image */}
                <Link 
                  to={`/product/${item.product.id}`}
                  className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0"
                >
                  <img
                    src={item.product.images[0]}
                    alt={item.product.name}
                    className="w-full h-full object-cover"
                  />
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Link 
                        to={`/product/${item.product.id}`}
                        className="font-semibold text-gray-900 hover:text-orange-600 transition-colors line-clamp-1"
                      >
                        {item.product.name}
                      </Link>
                      <p className="text-sm text-gray-500">{item.product.brand}</p>
                      
                      {item.product.discount && item.product.discount > 0 && (
                        <span className="inline-block mt-1 px-2 py-0.5 bg-red-100 text-red-600 text-xs rounded-full">
                          %{item.product.discount} İndirim
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        removeFromCart(item.product.id);
                        toast.info('Ürün sepetten çıkarıldı');
                      }}
                      className="text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-4">
                    {/* Quantity Controls */}
                    <div className="flex items-center border rounded-lg">
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={item.quantity <= 1}
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-10 text-center font-medium">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                        className="p-2 hover:bg-gray-100 transition-colors"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price */}
                    <div className="text-right">
                      <span className="text-lg font-bold text-orange-600">
                        {formatPrice(item.product.price * item.quantity)}
                      </span>
                      {item.product.originalPrice && (
                        <p className="text-sm text-gray-400 line-through">
                          {formatPrice(item.product.originalPrice * item.quantity)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Clear Cart */}
            <Button 
              variant="ghost" 
              className="text-red-500 hover:text-red-600"
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
            <div className="bg-gray-50 rounded-2xl p-6 space-y-6">
              <h2 className="text-xl font-bold">Sipariş Özeti</h2>

              {/* Coupon Code */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">İndirim Kuponu</p>
                {couponCode ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <Gift className="h-5 w-5 text-green-600" />
                    <span className="flex-1 text-green-700 font-medium">
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
                      placeholder="Kupon kodu girin"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim()}
                    >
                      Uygula
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              {/* Price Breakdown */}
              <div className="space-y-3">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-{formatPrice(totalPrice() * discountAmount / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Kargo</span>
                  <span className={shippingCost() === 0 ? 'text-green-600' : ''}>
                    {shippingCost() === 0 ? 'Ücretsiz' : formatPrice(shippingCost())}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-xl font-bold">
                  <span>Toplam</span>
                  <span className="text-orange-600">{formatPrice(finalPrice())}</span>
                </div>
              </div>

              {/* Checkout Button */}
              <Button 
                className="w-full gradient-orange h-14 text-lg"
                onClick={() => navigate('/checkout')}
              >
                Ödemeye Geç
                <ArrowRight className="h-5 w-5 ml-2" />
              </Button>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-2 pt-4 border-t">
                <div className="text-center">
                  <Truck className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-xs text-gray-500">Ücretsiz Kargo</p>
                </div>
                <div className="text-center">
                  <ShieldCheck className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-xs text-gray-500">Güvenli Ödeme</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="h-5 w-5 mx-auto mb-1 text-orange-500" />
                  <p className="text-xs text-gray-500">Kolay İade</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
