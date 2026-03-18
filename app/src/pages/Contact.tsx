import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ChevronRight, 
  MessageCircle, 
  Phone,
  Mail,
  MapPin,
  Clock,
  Send,
  Facebook,
  Twitter,
  Instagram,
  Youtube
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast.error('Lütfen tüm alanları doldurun');
      return;
    }
    toast.success('Mesajınız gönderildi! En kısa sürede size dönüş yapacağız.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const contactInfo = [
    {
      icon: Phone,
      title: 'Telefon',
      value: '0850 123 45 67',
      subtext: '7/24 Destek Hattı',
      action: 'tel:08501234567'
    },
    {
      icon: Mail,
      title: 'E-posta',
      value: 'destek@atushome.com',
      subtext: '24 saat içinde yanıt',
      action: 'mailto:destek@atushome.com'
    },
    {
      icon: MapPin,
      title: 'Adres',
      value: 'Atatürk Cad. No:123',
      subtext: 'Kadıköy/İstanbul',
      action: null
    },
    {
      icon: Clock,
      title: 'Çalışma Saatleri',
      value: '08:00 - 20:00',
      subtext: 'Hafta içi - Cumartesi',
      action: null
    }
  ];

  return (
    <div className="min-h-screen bg-muted">
      <Header />
      
      <main className="pt-[42px]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-16">
        <div className="container-custom text-center">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-80" />
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Bize Ulaşın</h1>
          <p className="text-xl text-orange-100 max-w-2xl mx-auto">
            Sorularınız mı var? Size yardımcı olmaktan mutluluk duyarız.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="bg-card border-b">
        <div className="container-custom py-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link to="/" className="hover:text-orange-600">Anasayfa</Link>
            <ChevronRight className="w-4 h-4" />
            <span className="text-foreground">İletişim</span>
          </div>
        </div>
      </div>

      {/* Contact Info Cards */}
      <section className="py-12">
        <div className="container-custom">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {contactInfo.map((item, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <item.icon className="w-7 h-7 text-orange-600" />
                  </div>
                  <h3 className="font-semibold text-muted-foreground mb-1">{item.title}</h3>
                  {item.action ? (
                    <a 
                      href={item.action}
                      className="text-lg font-bold text-foreground hover:text-orange-600 transition-colors"
                    >
                      {item.value}
                    </a>
                  ) : (
                    <p className="text-lg font-bold text-foreground">{item.value}</p>
                  )}
                  <p className="text-sm text-muted-foreground mt-1">{item.subtext}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Contact Form & Map */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Form */}
            <Card>
              <CardContent className="p-8">
                <h2 className="text-2xl font-bold mb-2">Bize Mesaj Gönderin</h2>
                <p className="text-muted-foreground mb-6">
                  Formu doldurun, en kısa sürede size dönüş yapacağız.
                </p>
                
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <Label>Ad Soyad</Label>
                      <Input 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        placeholder="Adınız Soyadınız"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>E-posta</Label>
                      <Input 
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        placeholder="ornek@email.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Konu</Label>
                    <Input 
                      value={formData.subject}
                      onChange={(e) => setFormData({...formData, subject: e.target.value})}
                      placeholder="Mesajınızın konusu"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Mesajınız</Label>
                    <textarea 
                      value={formData.message}
                      onChange={(e) => setFormData({...formData, message: e.target.value})}
                      placeholder="Mesajınızı buraya yazın..."
                      rows={5}
                      className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
                    />
                  </div>
                  
                  <Button type="submit" className="w-full gradient-orange h-12">
                    <Send className="w-5 h-5 mr-2" />
                    Mesaj Gönder
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Map & Social */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-0">
                  <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 text-orange-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">Harita entegrasyonu yakında!</p>
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="font-bold mb-2">Mağazamız</h3>
                    <p className="text-muted-foreground">
                      Atatürk Cad. No:123, Kadıköy/İstanbul
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Hafta içi: 09:00 - 21:00 | Cumartesi: 10:00 - 20:00
                    </p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <h3 className="font-bold mb-4">Sosyal Medya</h3>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => toast.info('Facebook sayfamız yakında!')}
                      className="w-12 h-12 bg-blue-500 text-white rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors"
                    >
                      <Facebook className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toast.info('Twitter sayfamız yakında!')}
                      className="w-12 h-12 bg-sky-500 text-white rounded-full flex items-center justify-center hover:bg-sky-600 transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toast.info('Instagram sayfamız yakında!')}
                      className="w-12 h-12 bg-pink-500 text-white rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => toast.info('Youtube kanalımız yakında!')}
                      className="w-12 h-12 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                    >
                      <Youtube className="w-5 h-5" />
                    </button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="py-12 bg-card border-t">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">Hızlı Bağlantılar</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link to="/help" className="flex items-center gap-3 p-4 bg-muted rounded-xl hover:bg-orange-50 transition-colors">
              <MessageCircle className="w-6 h-6 text-orange-500" />
              <span className="font-medium">Yardım Merkezi</span>
            </Link>
            <Link to="/faq" className="flex items-center gap-3 p-4 bg-muted rounded-xl hover:bg-orange-50 transition-colors">
              <MessageCircle className="w-6 h-6 text-orange-500" />
              <span className="font-medium">SSS</span>
            </Link>
            <Link to="/track-order" className="flex items-center gap-3 p-4 bg-muted rounded-xl hover:bg-orange-50 transition-colors">
              <MapPin className="w-6 h-6 text-orange-500" />
              <span className="font-medium">Sipariş Takip</span>
            </Link>
            <Link to="/returns" className="flex items-center gap-3 p-4 bg-muted rounded-xl hover:bg-orange-50 transition-colors">
              <MessageCircle className="w-6 h-6 text-orange-500" />
              <span className="font-medium">İade Politikası</span>
            </Link>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
