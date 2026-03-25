import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, ChevronLeft, ChevronRight, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';

const slides = [
  {
    id: 1,
    title: 'Yeni Sezon İndirimleri',
    subtitle: 'Elektronik Ürünlerde',
    description: 'iPhone, Samsung, MacBook ve daha fazlasında %50\'ye varan indirimler!',
    image: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=1600',
    cta: 'Hemen Keşfet',
    link: '/products?category=elektronik',
    color: 'from-orange-500 to-red-600'
  },
  {
    id: 2,
    title: 'Moda Tutkunlarına',
    subtitle: 'Yeni Koleksiyon',
    description: 'Nike, Adidas, Zara ve daha birçok markada yeni sezon ürünleri!',
    image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1600',
    cta: 'Koleksiyonu Gör',
    link: '/products?category=moda',
    color: 'from-purple-500 to-pink-600'
  },
  {
    id: 3,
    title: 'Ev & Yaşam',
    subtitle: 'Konforlu Yaşam',
    description: 'Evinizi güzelleştirecek mobilya ve dekorasyon ürünlerinde özel fiyatlar!',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600',
    cta: 'Keşfet',
    link: '/products?category=ev-yasam',
    color: 'from-green-500 to-teal-600'
  }
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  // Auto play
  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying, nextSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStart - touchEnd > 50) {
      nextSlide();
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 10000);
    }
    if (touchStart - touchEnd < -50) {
      prevSlide();
      setIsAutoPlaying(false);
      setTimeout(() => setIsAutoPlaying(true), 10000);
    }
  };

  return (
    <section 
      className="relative h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-700 ease-out ${
            index === currentSlide 
              ? 'opacity-100 scale-100' 
              : 'opacity-0 scale-105'
          }`}
        >
          {/* Background Image */}
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent sm:from-black/70 sm:via-black/40" />
          </div>

          {/* Content */}
          <div className="relative h-full container-custom flex items-center">
            <div className="max-w-md sm:max-w-lg lg:max-w-xl text-white animate-fade-in-up px-4 sm:px-0">
              <span className={`inline-block px-3 sm:px-4 py-1 sm:py-1.5 rounded-full text-xs sm:text-sm font-medium bg-gradient-to-r ${slide.color} mb-3 sm:mb-4`}>
                {slide.subtitle}
              </span>
              <h1 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-3 sm:mb-4 leading-tight">
                {slide.title}
              </h1>
              <p className="text-base sm:text-lg md:text-xl text-gray-200 mb-6 sm:mb-8 line-clamp-2 sm:line-clamp-none">
                {slide.description}
              </p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Link to={slide.link} className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    className={`gradient-orange text-white px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg rounded-full hover:shadow-orange-lg transition-all w-full sm:w-auto`}
                  >
                    <ShoppingBag className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    {slide.cta}
                    <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/products" className="w-full sm:w-auto">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white text-white hover:bg-card hover:text-foreground px-6 sm:px-8 h-12 sm:h-14 text-base sm:text-lg rounded-full w-full sm:w-auto"
                  >
                    Tüm Ürünler
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows - Hidden on mobile, visible on sm+ */}
      <button
        onClick={() => { prevSlide(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 10000); }}
        className="hidden sm:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-card/20 backdrop-blur-sm items-center justify-center text-white hover:bg-card/30 transition-colors z-10"
        aria-label="Önceki slayt"
      >
        <ChevronLeft className="h-5 w-5 lg:h-6 lg:w-6" />
      </button>
      <button
        onClick={() => { nextSlide(); setIsAutoPlaying(false); setTimeout(() => setIsAutoPlaying(true), 10000); }}
        className="hidden sm:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-card/20 backdrop-blur-sm items-center justify-center text-white hover:bg-card/30 transition-colors z-10"
        aria-label="Sonraki slayt"
      >
        <ChevronRight className="h-5 w-5 lg:h-6 lg:w-6" />
      </button>

      {/* Dots - Minimal */}
      <div className="absolute bottom-6 sm:bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`carousel-dot transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-5 sm:w-6 h-1.5 bg-white' 
                : 'w-1.5 h-1.5 bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Slayt ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
