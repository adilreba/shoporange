import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
  FileText,
  Loader2
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
import { legalPagesPublicApi, type LegalPage } from '@/services/legalPagesApi';

export function Footer() {
  const [email, setEmail] = useState('');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [legalPages, setLegalPages] = useState<Pick<LegalPage, 'slug' | 'title'>[]>([]);
  const [loadingPages, setLoadingPages] = useState(true);

  // Yasal sayfaları yükle
  useEffect(() => {
    loadLegalPages();
  }, []);

  const loadLegalPages = async () => {
    try {
      setLoadingPages(true);
      const pages = await legalPagesPublicApi.getPublished();
      setLegalPages(pages.map(p => ({ slug: p.slug, title: p.title })));
    } catch (error) {
      // Hata durumunda sessizce başarısız ol, footer çalışmaya devam etsin
      console.log('Yasal sayfalar yüklenemedi');
    } finally {
      setLoadingPages(false);
    }
  };

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }
    toast.success('Bültenimize başarıyla abone oldunuz!');
    setEmail('');
  };

  const handleSocialClick = (platform: string) => {
    toast.info(`${platform} sayfamız yakında aktif olacak!`);
  };

  const handlePhoneClick = () => {
    window.location.href = 'tel:08501234567';
  };

  const handleEmailClick = () => {
    window.location.href = 'mailto:info@atushome.com';
  };

  const handleFeatureClick = (feature: string) => {
    setSelectedFeature(feature);
  };

  const featureContent: Record<string, { title: string; description: string; details: string[] }> = {
    shipping: {
      title: 'Ücretsiz Kargo',
      description: '500₺ ve üzeri siparişlerinizde kargo ücreti ödemeyin!',
      details: ['500₺ üzeri tüm siparişlerde kargo bedava', '1-3 iş günü içinde kargoya teslim', 'Türkiye\'nin her yerine teslimat', 'Kargo takibi için sipariş numaranızı kullanın']
    },
    payment: {
      title: 'Güvenli Ödeme',
      description: '256-bit SSL şifreleme ile güvenli alışveriş',
      details: ['256-bit SSL güvenlik sertifikası', 'Kredi kartı bilgileriniz şifrelenerek saklanır', '3D Secure güvenlik protokolü', 'Havale/EFT ile ödeme imkanı']
    },
    returns: {
      title: 'Kolay İade',
      description: '14 gün içinde koşulsuz iade garantisi',
      details: ['14 gün içinde koşulsuz iade', 'İade kargo ücreti bizden', 'Hızlı para iadesi (3-5 iş günü)', 'Değişim imkanı']
    },
    installment: {
      title: 'Taksit Seçenekleri',
      description: '9 aya varan taksit imkanları',
      details: ['Tüm banka kartlarına taksit', '9 aya varan taksit seçenekleri', 'Faizsiz taksit kampanyaları', 'Anlaşmalı bankalara özel avantajlar']
    }
  };

  const quickLinks = [
    { label: 'Hakkımızda', path: '/about' },
    { label: 'Tüm Ürünler', path: '/products' },
    { label: 'Kampanyalar', path: '/campaigns' },
    { label: 'Yeni Gelenler', path: '/new-arrivals' },
    { label: 'Çok Satanlar', path: '/bestsellers' },
  ];

  const serviceLinks = [
    { label: 'Yardım', path: '/help' },
    { label: 'Kargo Takibi', path: '/track-order' },
    { label: 'İade', path: '/returns' },
    { label: 'SSS', path: '/faq' },
    { label: 'İletişim', path: '/contact' },
  ];

  return (
    <footer className="bg-gray-900 text-white">
      {/* Features Bar */}
      <div className="border-b border-gray-800">
        <div className="container-custom py-4 sm:py-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { id: 'shipping', icon: Truck, title: 'Ücretsiz Kargo', desc: '500₺+' },
              { id: 'payment', icon: ShieldCheck, title: 'Güvenli Ödeme', desc: '256-bit' },
              { id: 'returns', icon: RotateCcw, title: 'Kolay İade', desc: '14 Gün' },
              { id: 'installment', icon: CreditCard, title: 'Taksit', desc: '9 Ay' },
            ].map((item) => (
              <button 
                key={item.id}
                onClick={() => handleFeatureClick(item.id)}
                className="flex items-center gap-2 sm:gap-3 text-left hover:bg-gray-800/50 p-2 sm:p-3 rounded-lg transition-colors group"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                  <item.icon className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500" />
                </div>
                <div className="min-w-0">
                  <h4 className="font-semibold text-xs sm:text-sm group-hover:text-orange-400 transition-colors truncate">{item.title}</h4>
                  <p className="text-[10px] sm:text-xs text-gray-400">{item.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Footer */}
      <div className="container-custom py-6 sm:py-10">
        
        {/* Brand Section */}
        <div className="mb-6 pb-6 border-b border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Link to="/" className="inline-block mb-2">
                <h2 className="text-2xl font-bold">
                  <span className="text-orange-500">Atus</span>
                  <span className="text-white">Home</span>
                </h2>
              </Link>
              <p className="text-gray-400 text-sm">
                Türkiye'nin güvenilir online alışveriş platformu.
              </p>
            </div>
            
            {/* Newsletter */}
            <form onSubmit={handleSubscribe} className="flex gap-2 w-full sm:w-[380px] lg:w-[450px]">
              <Input 
                type="email" 
                placeholder="E-posta adresiniz"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 text-sm h-10 flex-1"
              />
              <Button type="submit" className="gradient-orange whitespace-nowrap text-sm h-10 px-4">
                Abone Ol
              </Button>
            </form>
          </div>
          
          {/* Social Links */}
          <div className="flex gap-2 mt-4">
            {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
              <button 
                key={i}
                onClick={() => handleSocialClick(['Facebook', 'Twitter', 'Instagram', 'Youtube'][i])}
                className="w-9 h-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-orange-500 transition-colors"
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>
        </div>

        {/* Links Grid - 4 columns on desktop */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          
          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">Hızlı Bağlantılar</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Service Links */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">Müşteri Hizmetleri</h4>
            <ul className="space-y-2">
              {serviceLinks.map((link) => (
                <li key={link.path}>
                  <Link 
                    to={link.path}
                    className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Pages - Dinamik */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Yasal Bilgiler
            </h4>
            {loadingPages ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader2 className="h-3 w-3 animate-spin" />
                Yükleniyor...
              </div>
            ) : legalPages.length > 0 ? (
              <ul className="space-y-2">
                {legalPages.slice(0, 6).map((page) => (
                  <li key={page.slug}>
                    <Link 
                      to={`/legal/${page.slug}`}
                      className="text-gray-400 hover:text-orange-500 transition-colors text-sm"
                    >
                      {page.title}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="space-y-2">
                <li><Link to="/legal/kvkk-aydinlatma-metni" className="text-gray-400 hover:text-orange-500 text-sm">KVKK Aydınlatma Metni</Link></li>
                <li><Link to="/legal/gizlilik-politikasi" className="text-gray-400 hover:text-orange-500 text-sm">Gizlilik Politikası</Link></li>
                <li><Link to="/legal/mesafeli-satis-sozlesmesi" className="text-gray-400 hover:text-orange-500 text-sm">Mesafeli Satış Sözleşmesi</Link></li>
                <li><Link to="/legal/iade-degisim" className="text-gray-400 hover:text-orange-500 text-sm">İade ve Değişim</Link></li>
              </ul>
            )}
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white">İletişim</h4>
            <ul className="space-y-2">
              <li>
                <button 
                  onClick={handlePhoneClick}
                  className="flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors text-sm"
                >
                  <Phone className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  0850 123 45 67
                </button>
              </li>
              <li>
                <button 
                  onClick={handleEmailClick}
                  className="flex items-center gap-2 text-gray-400 hover:text-orange-500 transition-colors text-sm"
                >
                  <Mail className="h-4 w-4 text-orange-500 flex-shrink-0" />
                  info@atushome.com
                </button>
              </li>
              <li className="flex items-start gap-2 text-gray-400 text-sm">
                <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0 mt-0.5" />
                <span>İstanbul, Türkiye</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800">
        <div className="container-custom py-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-gray-500 text-xs">
              © 2024 AtusHome. Tüm hakları saklıdır.
            </p>
            <div className="flex items-center gap-4">
              {/* Yasal sayfalar linkleri - bottom bar */}
              {!loadingPages && legalPages.slice(0, 4).map((page) => (
                <Link 
                  key={page.slug}
                  to={`/legal/${page.slug}`}
                  className="text-gray-500 hover:text-orange-500 text-xs"
                >
                  {page.title}
                </Link>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {['Visa', 'MC', 'Amex'].map((card) => (
                <div key={card} className="w-10 h-6 bg-gray-800 rounded flex items-center justify-center">
                  <span className="text-gray-400 text-[10px] font-bold">{card}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Feature Detail Dialog */}
      <Dialog open={!!selectedFeature} onOpenChange={() => setSelectedFeature(null)}>
        <DialogContent className="sm:max-w-md mx-4">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedFeature && featureContent[selectedFeature]?.title}
            </DialogTitle>
            <DialogDescription className="text-sm">
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
                  <span className="text-foreground text-sm">{detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </DialogContent>
      </Dialog>
    </footer>
  );
}
