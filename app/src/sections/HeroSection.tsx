import { useEffect, useState } from 'react';
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

  useEffect(() => {
    if (!isAutoPlaying) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
    setIsAutoPlaying(false);
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  return (
    <section className="relative h-[500px] md:h-[600px] lg:h-[700px] overflow-hidden">
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
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="relative h-full container-custom flex items-center">
            <div className="max-w-xl text-white animate-fade-in-up">
              <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium bg-gradient-to-r ${slide.color} mb-4`}>
                {slide.subtitle}
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {slide.title}
              </h1>
              <p className="text-lg md:text-xl text-gray-200 mb-8">
                {slide.description}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={slide.link}>
                  <Button 
                    size="lg" 
                    className={`gradient-orange text-white px-8 h-14 text-lg rounded-full hover:shadow-orange-lg transition-all`}
                  >
                    <ShoppingBag className="h-5 w-5 mr-2" />
                    {slide.cta}
                    <ArrowRight className="h-5 w-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/products">
                  <Button 
                    size="lg" 
                    variant="outline"
                    className="border-white text-white hover:bg-white hover:text-gray-900 px-8 h-14 text-lg rounded-full"
                  >
                    Tüm Ürünler
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation Arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
      >
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors z-10"
      >
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === currentSlide 
                ? 'w-8 h-2 bg-orange-500' 
                : 'w-2 h-2 bg-white/50 hover:bg-white'
            }`}
          />
        ))}
      </div>
    </section>
  );
}
