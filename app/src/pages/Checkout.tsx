import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Truck, 
  ChevronRight, 
  Check,
  Lock,
  ShieldCheck,
  MapPin
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
      toast.error('Lütfen tüm alanları doldurun');
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
        <main className="container-custom py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Sepetiniz Boş</h1>
          <p className="text-gray-500 mb-6">Ödeme yapmak için sepetinize ürün ekleyin.</p>
          <Button onClick={() => navigate('/products')}>
            Alışverişe Başla
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom py-8">
        {/* Progress */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center">
            <div className={`flex items-center gap-2 ${step === 'shipping' ? 'text-orange-600' : 'text-green-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'shipping' ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {step === 'shipping' ? <Truck className="h-5 w-5" /> : <Check className="h-5 w-5" />}
              </div>
              <span className="font-medium hidden sm:inline">Teslimat</span>
            </div>
            <ChevronRight className="h-5 w-5 mx-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-orange-600' : step === 'processing' ? 'text-green-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'payment' ? 'bg-orange-100' : step === 'processing' ? 'bg-green-100' : 'bg-gray-100'
              }`}>
                {step === 'processing' ? <Check className="h-5 w-5" /> : <CreditCard className="h-5 w-5" />}
              </div>
              <span className="font-medium hidden sm:inline">Ödeme</span>
            </div>
            <ChevronRight className="h-5 w-5 mx-4 text-gray-400" />
            <div className={`flex items-center gap-2 ${step === 'processing' ? 'text-orange-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step === 'processing' ? 'bg-orange-100' : 'bg-gray-100'
              }`}>
                <Check className="h-5 w-5" />
              </div>
              <span className="font-medium hidden sm:inline">Onay</span>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {step === 'shipping' && (
              <form onSubmit={handleShippingSubmit} className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-xl font-bold mb-6">Teslimat Bilgileri</h2>
                
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="fullName">Ad Soyad *</Label>
                    <Input
                      id="fullName"
                      value={shippingData.fullName}
                      onChange={(e) => setShippingData({...shippingData, fullName: e.target.value})}
                      required
                      placeholder="Ahmet Yılmaz"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon *</Label>
                    <Input
                      id="phone"
                      value={shippingData.phone}
                      onChange={(e) => setShippingData({...shippingData, phone: e.target.value})}
                      required
                      placeholder="05XX XXX XX XX"
                    />
                  </div>
                </div>

                <div className="mb-4">
                  <Label htmlFor="address">Adres *</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      id="address"
                      value={shippingData.address}
                      onChange={(e) => setShippingData({...shippingData, address: e.target.value})}
                      required
                      className="pl-10"
                      placeholder="Sokak, bina no, daire"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4 mb-6">
                  <div>
                    <Label htmlFor="city">Şehir *</Label>
                    <Input
                      id="city"
                      value={shippingData.city}
                      onChange={(e) => setShippingData({...shippingData, city: e.target.value})}
                      required
                      placeholder="İstanbul"
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">İlçe *</Label>
                    <Input
                      id="district"
                      value={shippingData.district}
                      onChange={(e) => setShippingData({...shippingData, district: e.target.value})}
                      required
                      placeholder="Kadıköy"
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">Posta Kodu</Label>
                    <Input
                      id="zipCode"
                      value={shippingData.zipCode}
                      onChange={(e) => setShippingData({...shippingData, zipCode: e.target.value})}
                      placeholder="34710"
                    />
                  </div>
                </div>

                <Separator className="my-6" />

                <h3 className="font-semibold mb-4">Kargo Seçeneği</h3>
                <RadioGroup 
                  value={selectedShipping} 
                  onValueChange={setSelectedShipping}
                  className="space-y-3"
                >
                  {shippingOptions.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        selectedShipping === option.id 
                          ? 'border-orange-500 bg-orange-50' 
                          : 'border-gray-100 hover:border-gray-200'
                      }`}
                    >
                      <RadioGroupItem value={option.id} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{option.name}</span>
                          <span className="font-bold">
                            {option.price === 0 ? 'Ücretsiz' : formatPrice(option.price)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-500">{option.description}</p>
                        <p className="text-sm text-orange-600">Tahmini: {option.estimatedDays}</p>
                      </div>
                    </label>
                  ))}
                </RadioGroup>

                <Button type="submit" className="w-full gradient-orange h-12 mt-6">
                  Devam Et
                  <ChevronRight className="h-5 w-5 ml-2" />
                </Button>
              </form>
            )}

            {step === 'payment' && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold">Ödeme Bilgileri</h2>
                  <div className="flex items-center gap-2 text-green-600">
                    <Lock className="h-4 w-4" />
                    <span className="text-sm">Güvenli Ödeme</span>
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
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Check className="h-10 w-10 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Siparişiniz Alındı!</h2>
                <p className="text-gray-500 mb-4">
                  Siparişiniz başarıyla oluşturuldu. Teşekkür ederiz!
                </p>
                <div className="bg-gray-50 rounded-lg p-4 mb-6">
                  <p className="text-sm text-gray-500">Sipariş Numaranız</p>
                  <p className="text-xl font-bold text-orange-600">{orderId}</p>
                </div>
                <p className="text-sm text-gray-400">
                  Siparişlerim sayfasına yönlendiriliyorsunuz...
                </p>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:sticky lg:top-24 h-fit">
            <div className="bg-gray-50 rounded-2xl p-6">
              <h3 className="font-bold text-lg mb-4">Sipariş Özeti</h3>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm line-clamp-1">{item.product.name}</p>
                      <p className="text-sm text-gray-500">{item.quantity} adet</p>
                      <p className="font-medium text-orange-600">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Kargo</span>
                  <span className={shippingPrice === 0 ? 'text-green-600' : ''}>
                    {shippingPrice === 0 ? 'Ücretsiz' : formatPrice(shippingPrice)}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam</span>
                  <span className="text-orange-600">{formatPrice(finalTotal)}</span>
                </div>
              </div>

              <div className="flex items-center justify-center gap-2 mt-6 pt-4 border-t text-gray-500 text-sm">
                <ShieldCheck className="h-4 w-4" />
                <span>256-bit SSL ile şifrelenmiş güvenli ödeme</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
