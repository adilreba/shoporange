import { Link } from 'react-router-dom';
import { 
  Target, 
  Eye, 
  Heart, 
  Users, 
  Award,
  Truck,
  Shield,
  Headphones,
  Package,
  Star,
  TrendingUp
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function About() {
  const stats = [
    { value: '500K+', label: 'Mutlu Müşteri', icon: Users },
    { value: '50K+', label: 'Ürün Çeşidi', icon: Package },
    { value: '15+', label: 'Yıllık Deneyim', icon: Award },
    { value: '99%', label: 'Müşteri Memnuniyeti', icon: Star },
  ];

  const values = [
    {
      icon: Target,
      title: 'Misyonumuz',
      description: 'Türkiye\'nin her köşesine kaliteli ürünleri en uygun fiyatlarla ulaştırmak ve müşterilerimize kusursuz bir alışveriş deneyimi sunmak.'
    },
    {
      icon: Eye,
      title: 'Vizyonumuz',
      description: 'Türkiye\'nin en güvenilir ve tercih edilen e-ticaret platformu olmak, teknoloji ve hizmet kalitesiyle sektörde öncü konuma gelmek.'
    },
    {
      icon: Heart,
      title: 'Değerlerimiz',
      description: 'Müşteri odaklılık, dürüstlük, şeffaflık ve sürekli gelişim. Her zaman müşterilerimizin yanındayız.'
    }
  ];

  const features = [
    { icon: Truck, title: 'Hızlı Teslimat', description: '1-3 iş günü içinde kargoya teslim' },
    { icon: Shield, title: 'Güvenli Alışveriş', description: '256-bit SSL şifreleme ile güvenli ödeme' },
    { icon: Headphones, title: '7/24 Destek', description: 'Müşteri hizmetlerimiz her zaman yanınızda' },
    { icon: Package, title: 'Kolay İade', description: '14 gün içinde koşulsuz iade garantisi' },
  ];

  return (
    <div className="min-h-screen bg-card">
      <Header />
      
      <main className="pt-[42px]">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-orange-600 text-white py-20">
        <div className="container-custom text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Hakkımızda</h1>
          <p className="text-xl text-orange-100 max-w-2xl mx-auto">
            2009'dan beri milyonlarca müşteriye hizmet veren Türkiye'nin güvenilir e-ticaret platformu
          </p>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-muted">
        <div className="container-custom">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <stat.icon className="w-10 h-10 text-orange-500 mx-auto mb-4" />
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className="text-muted-foreground">{stat.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-16">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6">Hikayemiz</h2>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                AtusHome, 2009 yılında küçük bir girişim olarak başladı. Amacımız, insanların kaliteli ürünlere 
                kolayca ve güvenle ulaşmasını sağlamaktı. Bugün, Türkiye'nin dört bir yanındaki müşterilerimize 
                hizmet veren büyük bir aile olduk.
              </p>
              <p className="text-muted-foreground mb-4 leading-relaxed">
                Teknoloji, moda, ev yaşam, kozmetik ve daha birçok kategoride 50.000'den fazla ürün çeşidiyle, 
                her ihtiyaca uygun çözümler sunuyoruz. Müşteri memnuniyeti bizim için her zaman ön planda.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Sürekli gelişen teknolojimiz ve profesyonel ekibimizle, alışveriş deneyimini her geçen gün 
                daha da iyileştiriyoruz.
              </p>
            </div>
            <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl p-8 h-full flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-24 h-24 text-orange-500 mx-auto mb-4" />
                <p className="text-2xl font-bold text-orange-800">Sürekli Büyüyoruz</p>
                <p className="text-orange-600">Her gün daha fazla müşteriye ulaşıyoruz</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 bg-muted">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Değerlerimiz</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {values.map((value, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <value.icon className="w-12 h-12 text-orange-500 mb-4" />
                  <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container-custom">
          <h2 className="text-3xl font-bold text-center mb-12">Neden AtusHome?</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <feature.icon className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="font-bold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
        <div className="container-custom text-center">
          <h2 className="text-3xl font-bold mb-4">Bize Katılın</h2>
          <p className="text-xl text-orange-100 mb-8 max-w-2xl mx-auto">
            Milyonlarca müşterimiz arasına katılın, kaliteli ürünleri uygun fiyatlarla keşfedin.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild className="bg-card text-orange-600 hover:bg-muted px-8 py-6 text-lg">
              <Link to="/products">Alışverişe Başla</Link>
            </Button>
            <Button asChild variant="outline" className="border-white text-white hover:bg-card/10 px-8 py-6 text-lg">
              <Link to="/contact">Bize Ulaşın</Link>
            </Button>
          </div>
        </div>
      </section>

      </main>
      <Footer />
    </div>
  );
}
