import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Truck, 
  ChevronRight, 
  Check,
  Lock,
  ShieldCheck,
  MapPin,
  ChevronLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { StripePayment } from '@/components/payment/StripePayment';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { shippingOptions } from '@/data/mockData';
import { toast } from 'sonner';

export function Checkout() {
  const navigate = useNavigate();
  const { items, totalPrice, finalPrice, shippingCost, clearCart } = useCartStore();
  const { user } = useAuthStore();
  
  const [step, setStep] = useState<'shipping' | 'payment' | 'processing'>('shipping');
  const [selectedShipping, setSelectedShipping] = useState('standard');
  const [orderId, setOrderId] = useState<string | null>(null);
  
  const [shippingData, setShippingData] = useState({
    fullName: user?.address?.[0]?.fullName || '',
    phone: user?.phone || '',
    address: user?.address?.[0]?.addressLine || '',
    city: user?.address?.[0]?.city || '',
    district: user?.address?.[0]?.district || '',
    zipCode: user?.address?.[0]?.zipCode || ''
  });

  const selectedShippingOption = shippingOptions.find(o => o.id === selectedShipping);
  const shippingPrice = selectedShippingOption?.price || 0;
  const finalTotal = finalPrice() - shippingCost() + shippingPrice;

  const handleShippingSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shippingData.fullName || !shippingData.phone || !shippingData.address) {
      toast.error('Lütfen tüm zorunlu alanları doldurun');
      return;
    }
    setStep('payment');
    window.scrollTo(0, 0);
  };

  const handlePaymentSuccess = async (_paymentIntentId: string) => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    const newOrderId = 'ORD-' + Date.now();
    setOrderId(newOrderId);
    setStep('processing');
    
    toast.success('Siparişiniz başarıyla oluşturuldu!', {
      description: `Sipariş numaranız: ${newOrderId}`
    });
    
    setTimeout(() => {
      clearCart();
      navigate('/orders');
    }, 3000);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (items.length === 0 && step !== 'processing') {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-custom pt-[42px] pb-12 sm:pt-[42px] sm:py-16 text-center px-4">
          <div className="max-w-md mx-auto">
            <h1 className="text-xl sm:text-2xl font-bold mb-3">Sepetiniz Boş</h1>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base">
              Ödeme yapmak için sepetinize ürün ekleyin.
            </p>
            <Button onClick={() => navigate('/products')} className="gradient-orange">
              Alışverişe Başla
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
        {/* Back Button & Title - Mobile */}
        <div className="flex items-center gap-2 mb-4 lg:hidden">
          <button 
            onClick={() => step === 'payment' ? setStep('shipping') : navigate(-1)}
            className="flex items-center text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="text-sm">Geri</span>
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center justify-center mb-6 sm:mb-8">
          <div className="flex items-center">
            <div className={`flex items-center gap-1.5 sm:gap-2 ${step === 'shipping' ? 'text-orange-600' : 'text-green-600'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                step === 'shipping' ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {step === 'shipping' ? <Truck className="h-4 w-4 sm:h-5 sm:w-5" /> : <Check className="h-4 w-4 sm:h-5 sm:w-5" />}
              </div>
              <span className="font-medium text-xs sm:text-sm hidden sm:inline">Teslimat</span>
            </div>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 mx-2 sm:mx-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 sm:gap-2 ${step === 'payment' ? 'text-orange-600' : step === 'processing' ? 'text-green-600' : 'text-muted-foreground'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-orange-100' : step === 'processing' ? 'bg-green-100' : 'bg-muted'
              }`}>
                {step === 'processing' ? <Check className="h-4 w-4 sm:h-5 sm:w-5" /> : <CreditCard className="h-4 w-4 sm:h-5 sm:w-5" />}
              </div>
              <span className="font-medium text-xs sm:text-sm hidden sm:inline">Ödeme</span>
            </div>
            <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 mx-2 sm:mx-4 text-muted-foreground" />
            <div className={`flex items-center gap-1.5 sm:gap-2 ${step === 'processing' ? 'text-orange-600' : 'text-muted-foreground'}`}>
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
                step === 'processing' ? 'bg-orange-100' : 'bg-muted'
              }`}>
                <Check className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <span className="font-medium text-xs sm:text-sm hidden sm:inline">Onay</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6">
                <h2 className="text-lg sm:text-xl font-bold mb-4 sm:mb-6">Teslimat Bilgileri</h2>
                
                <div className="grid sm:grid-cols-2 gap-3 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <Label htmlFor="fullName" className="text-sm">Ad Soyad *</Label>
                    <Input
                      id="fullName"
                      value={shippingData.fullName}
                      onChange={(e) => setShippingData({...shippingData, fullName: e.target.value})}
                      required
                      placeholder="Ahmet Yılmaz"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone" className="text-sm">Telefon *</Label>
                    <Input
                      id="phone"
                      value={shippingData.phone}
                      onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                      required
                      placeholder="05XX XXX XX XX"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="address" className="text-sm">Adres *</Label>
                  <div className="relative mt-1.5">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="address"
                      value={shippingData.address}
                      onChange={(e) => setShippingData({...shippingData, address: e.target.value})}
                      required
                      className="pl-10 bg-background"
                      placeholder="Sokak, bina no, daire"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div>
                    <Label htmlFor="city" className="text-sm">Şehir *</Label>
                    <Input
                      id="city"
                      value={shippingData.city}
                      onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                      required
                      placeholder="İstanbul"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district" className="text-sm">İlçe *</Label>
                    <Input
                      id="district"
                      value={shippingData.district}
                      onChange={(e) => setShippingData({...shippingData, district: e.target.value})}
                      required
                      placeholder="Kadıköy"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode" className="text-sm">Posta Kodu</Label>
                    <Input
                      id="zipCode"
                      value={shippingData.zipCode}
                      onChange={(e) => setShippingData({...shippingData, zipCode: e.target.value})}
                      placeholder="34710"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <Separator className="my-4 sm:my-6" />

                <h3 className="font-semibold mb-3 sm:mb-4 text-sm sm:text-base">Kargo Seçeneği</h3>
                <RadioGroup 
                  value={selectedShipping} 
                  onValueChange={setSelectedShipping}
                  className="space-y-2 sm:space-y-3"
                >
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-start sm:items-center gap-3 p-3 sm:p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedShipping === option.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-border hover:border-muted'
                      }`}
                    >
                      <RadioGroupItem value={option.id} className="mt-0.5 sm:mt-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                          <span className="font-medium text-sm">{option.name}</span>
                          <span className="font-bold text-sm">
                            {option.price === 0 ? 'Ücretsiz' : formatPrice(option.price)}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm text-muted-foreground">{option.description}</p>
                        <p className="text-xs text-orange-600 mt-0.5">Tahmini: {option.estimatedDays}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                <Button type="submit" className="w-full gradient-orange h-12 mt-4 sm:mt-6">
                  Devam Et
                  <ChevronRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                </Button>
              </form>
            )}

            {step === 'payment' && (
              <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-4 sm:p-6">
                <div className="flex items-center justify-between mb-4 sm:mb-6">
                  <h2 className="text-lg sm:text-xl font-bold">Ödeme Bilgileri</h2>
                  <div className="flex items-center gap-1.5 sm:gap-2 text-green-600 text-xs sm:text-sm">
                    <Lock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Güvenli Ödeme</span>
                    <span className="sm:hidden">SSL</span>
                  </div>
                </div>

                <StripePayment
                  amount={finalTotal}
                  onSuccess={handlePaymentSuccess}
                  onCancel={() => setStep('shipping')}
                />
              </div>
            )}

            {step === 'processing' && (
              <div className="bg-card rounded-xl sm:rounded-2xl border border-border p-6 sm:p-8 text-center">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                  <Check className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2">Siparişiniz Alındı!</h2>
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">
                  Siparişiniz başarıyla oluşturuldu. Teşekkür ederiz!
                </p>
                <div className="bg-muted rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
                  <p className="text-xs sm:text-sm text-muted-foreground">Sipariş Numaranız</p>
                  <p className="text-lg sm:text-xl font-bold text-orange-600">{orderId}</p>
                </div>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Siparişlerim sayfasına yönlendiriliyorsunuz...
                </p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-muted rounded-xl sm:rounded-2xl p-4 sm:p-6">
              <h3 className="font-bold text-base sm:text-lg mb-3 sm:mb-4">Sipariş Özeti</h3>
              
              {/* Products List */}
              <div className="space-y-2 sm:space-y-3 mb-3 sm:mb-4 max-h-48 sm:max-h-64 overflow-y-auto custom-scrollbar">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-2 sm:gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg object-cover flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs sm:text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-muted-foreground">{item.quantity} adet</p>
                      <p className="font-medium text-orange-600 text-xs sm:text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-3 sm:my-4" />

              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Kargo</span>
                  <span className={shippingPrice === 0 ? 'text-green-600' : ''}>
                    {shippingPrice === 0 ? 'Ücretsiz' : formatPrice(shippingPrice)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between text-base sm:text-lg font-bold">
                  <span>Toplam</span>
                  <span className="text-orange-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mt-4 sm:mt-6 pt-3 sm:pt-[10px] border-t text-muted-foreground text-xs">
                <ShieldCheck className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span>SSL ile şifrelenmiş güvenli ödeme</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
