import { Link } from 'react-router-dom';
import { ArrowRight, Timer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEffect, useState } from 'react';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        }
        return { hours: 23, minutes: 59, seconds: 59 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => num.toString().padStart(2, '0');

  return (
    <div className="flex items-center gap-2">
      <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg flex items-center justify-center">
        <span className="text-xl md:text-2xl font-bold text-orange-600">
          {formatNumber(timeLeft.hours)}
        </span>
      </div>
      <span className="text-2xl font-bold">:</span>
      <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg flex items-center justify-center">
        <span className="text-xl md:text-2xl font-bold text-orange-600">
          {formatNumber(timeLeft.minutes)}
        </span>
      </div>
      <span className="text-2xl font-bold">:</span>
      <div className="w-12 h-12 md:w-14 md:h-14 bg-white rounded-lg flex items-center justify-center">
        <span className="text-xl md:text-2xl font-bold text-orange-600">
          {formatNumber(timeLeft.seconds)}
        </span>
      </div>
    </div>
  );
}

export function PromoSection() {
  return (
    <section className="section-padding">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Flash Sale Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-orange-500 via-orange-600 to-red-600 p-8 md:p-12">
            <div className="relative z-10">
              <div className="flex items-center gap-2 text-white/80 mb-4">
                <Timer className="h-5 w-5" />
                <span className="font-medium">Sınırlı Süreli Fırsat</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Flash Sale
              </h3>
              <p className="text-white/80 mb-6 max-w-sm">
                Seçili ürünlerde %70\'e varan indirimler. Acele edin, stoklar tükeniyor!
              </p>
              
              <CountdownTimer />
              
              <Link to="/products?discount=true" className="inline-block mt-8">
                <Button 
                  size="lg"
                  className="bg-white text-orange-600 hover:bg-gray-100 px-8"
                >
                  Fırsatları Kaçırma
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
            
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          </div>

          {/* New Arrivals Banner */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-purple-700 to-indigo-800 p-8 md:p-12">
            <div className="absolute inset-0">
              <img
                src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800"
                alt="New Arrivals"
                className="w-full h-full object-cover opacity-30"
              />
            </div>
            
            <div className="relative z-10">
              <span className="inline-block px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium mb-4">
                Yeni Sezon
              </span>
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Yeni Gelenler
              </h3>
              <p className="text-white/80 mb-8 max-w-sm">
                En yeni ürünler ve trendler burada! İlk sen keşfet, ilk sen sahip ol.
              </p>
              
              <Link to="/products?sort=newest">
                <Button 
                  size="lg"
                  className="bg-white text-purple-700 hover:bg-gray-100 px-8"
                >
                  Yeni Ürünleri Gör
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
