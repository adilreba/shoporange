import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Youtube, 
  Mail, 
  Phone, 
  MapPin,
  CreditCard,
  Truck,
  ShieldCheck,
  RotateCcw,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

export function Footer() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    toast.success('Bültenimize başarıyla abone oldunuz!', {
      description: 'Kampanya ve indirimlerden haberdar olacaksınız.',
    });
    setEmail('');
  };

  const handleSocialClick = (platform: string) => {
    toast.info(`${platform} sayfamız yakında aktif olacak!`);
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:08501234567';
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:info@shoporange.com';
  };

  const handleFeatureClick = (feature: string) => {
    setSelectedFeature(feature);
  };

  const handleLinkClick = (path: string) => {
    navigate(path);
  };

  const featureContent: Record<string, { title: string; description: string; details: string[] }> = {
    shipping: {
      title: 'Ücretsiz Kargo',
      description: '500₺ ve üzeri siparişlerinizde kargo ücreti ödemeyin!',
      details: [
        '500₺ üzeri tüm siparişlerde kargo bedava',
        '1-3 iş günü içinde kargoya teslim',
        'Türkiye\'nin her yerine teslimat',
        'Kargo takibi için sipariş numaranızı kullanın'
      ]
    },
    payment: {
      title: 'Güvenli Ödeme',
      description: '256-bit SSL şifreleme ile güvenli alışveriş',
      details: [
        '256-bit SSL güvenlik sertifikası',
        'Kredi kartı bilgileriniz şifrelenerek saklanır',
        '3D Secure güvenlik protokolü',
        'Havale/EFT ile ödeme imkanı'
      ]
    },
    returns: {
      title: 'Kolay İade',
      description: '14 gün içinde koşulsuz iade garantisi',
      details: [
        '14 gün içinde koşulsuz iade',
        'İade kargo ücreti bizden',
        'Hızlı para iadesi (3-5 iş günü)',
        'Değişim imkanı'
      ]
    },
    installment: {
      title: 'Taksit Seçenekleri',
      description: '9 aya varan taksit imkanları',
      details: [
        'Tüm banka kartlarına taksit',
        '9 aya varan taksit seçenekleri',
        'Faizsiz taksit kampanyaları',
        'Anlaşmalı bankalara özel avantajlar'
      ]
    }
  };

  return (
    <footer className="bg-gray-900 text-white">
      {/* Features Bar */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <button 
              onClick={() => handleFeatureClick('shipping')}
              className="flex items-center gap-4 text-left hover:bg-gray-800/50 p-3 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                <Truck className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold group-hover:text-orange-400 transition-colors">Ücretsiz Kargo</h4>
                <p className="text-sm text-gray-400">500₺ üzeri siparişlerde</p>
              </div>
            </button>
            <button 
              onClick={() => handleFeatureClick('payment')}
              className="flex items-center gap-4 text-left hover:bg-gray-800/50 p-3 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                <ShieldCheck className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold group-hover:text-orange-400 transition-colors">Güvenli Ödeme</h4>
                <p className="text-sm text-gray-400">256-bit SSL güvenliği</p>
              </div>
            </button>
            <button 
              onClick={() => handleFeatureClick('returns')}
              className="flex items-center gap-4 text-left hover:bg-gray-800/50 p-3 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                <RotateCcw className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold group-hover:text-orange-400 transition-colors">Kolay İade</h4>
                <p className="text-sm text-gray-400">14 gün içinde iade</p>
              </div>
            </button>
            <button 
              onClick={() => handleFeatureClick('installment')}
              className="flex items-center gap-4 text-left hover:bg-gray-800/50 p-3 rounded-xl transition-colors group"
            >
              <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                <CreditCard className="h-6 w-6 text-orange-500" />
              </div>
              <div>
                <h4 className="font-semibold group-hover:text-orange-400 transition-colors">Taksit Seçenekleri</h4>
                <p className="text-sm text-gray-400">9 aya varan taksit</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-2">
            <Link to="/" className="inline-block mb-4">
              <h2 className="text-3xl font-bold">
                <span className="text-orange-500">Shop</span>
                <span className="text-white">Orange</span>
              </h2>
            </Link>
            <p className="text-gray-400 mb-6 max-w-sm">
              Türkiye'nin en güvenilir online alışveriş platformu. 
              Binlerce ürün, uygun fiyatlar ve hızlı teslimat garantisi.
            </p>
            
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="mb-6">
              <h4 className="font-semibold mb-2">Bültenimize Abone Olun</h4>
              <div className="flex gap-2">
                <Input 
                  type="email" 
                  placeholder="E-posta adresiniz"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
                <Button type="submit" className="gradient-orange whitespace-nowrap">
                  Abone Ol
                </Button>
              </div>
            </form>

            {/* Social Links */}
            <div className="flex gap-3">
              <button 
                onClick={() => handleSocialClick('Facebook')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('Twitter')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
              >
                <Twitter className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('Instagram')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </button>
              <button 
                onClick={() => handleSocialClick('Youtube')}
                className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
              >
                <Youtube className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Hızlı Bağlantılar</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleLinkClick('/about')}
                  className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1 group"
                >
                  Hakkımızda
                  <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100" />
                </button>
              </li>
              <li>
                <Link to="/products" className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1">
                  Tüm Ürünler
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/campaigns')}
                  className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                  Kampanyalar
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/new-arrivals')}
                  className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                  Yeni Gelenler
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/bestsellers')}
                  className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1"
                >
                  Çok Satanlar
                </button>
              </li>
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-semibold text-lg mb-4">Müşteri Hizmetleri</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={() => handleLinkClick('/help')}
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Yardım Merkezi
                </button>
              </li>
              <li>
                <Link to="/track-order" className="text-gray-400 hover:text-orange-500 transition-colors flex items-center gap-1">
                  Kargo Takibi
                  <ChevronRight className="w-3 h-3" />
                </Link>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/returns')}
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  İade Politikası
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/faq')}
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Sıkça Sorulan Sorular
                </button>
              </li>
              <li>
                <button 
                  onClick={() => handleLinkClick('/contact')}
                  className="text-gray-400 hover:text-orange-500 transition-colors"
                >
                  Bize Ulaşın
                </button>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-semibold text-lg mb-4">İletişim</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-orange-500 flex-shrink-0 mt-0.5" />
                <span className="text-gray-400">
                  Atatürk Cad. No:123<br />
                  Kadıköy/İstanbul
                </span>
              </li>
              <li>
                <button 
                  onClick={handlePhoneClick}
                  className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Phone className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  0850 123 45 67
                </button>
              </li>
              <li>
                <button 
                  onClick={handleEmailClick}
                  className="flex items-center gap-3 text-gray-400 hover:text-orange-500 transition-colors"
                >
                  <Mail className="h-5 w-5 text-orange-500 flex-shrink-0" />
                  info@shoporange.com
                </button>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Payment Methods & Copyright */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              © 2024 ShopOrange. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-4">
              <span className="text-gray-500 text-sm">Ödeme Yöntemleri:</span>
              <div className="flex gap-2">
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-gray-800 text-xs font-bold">Visa</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-gray-800 text-xs font-bold">MC</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-gray-800 text-xs font-bold">Amex</span>
                </div>
                <div className="w-12 h-8 bg-white rounded flex items-center justify-center cursor-pointer hover:scale-110 transition-transform">
                  <span className="text-gray-800 text-xs font-bold">PayPal</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Detail Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">
              {selectedFeature && featureContent[selectedFeature]?.title}
            </DialogTitle>
            <DialogDescription>
              {selectedFeature && featureContent[selectedFeature]?.description}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ul className="space-y-3">
              {selectedFeature && featureContent[selectedFeature]?.details.map((detail, index) => (
                <li key={index} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <ChevronRight className="w-3 h-3 text-orange-600" />
                  </div>
                  <span className="text-gray-700">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
