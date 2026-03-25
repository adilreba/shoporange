import { useState } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';

const testimonials = [
  {
    id: 1,
    name: 'Ayşe Yılmaz',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
    rating: 5,
    comment: 'AtusHome\'dan alışveriş yapmak çok keyifli! Ürünler kaliteli, kargo hızlı ve müşteri hizmetleri çok ilgili. Kesinlikle tavsiye ederim.',
    role: 'Müşteri'
  },
  {
    id: 2,
    name: 'Mehmet Kaya',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200',
    rating: 5,
    comment: 'Elektronik ürünlerdeki fiyatlar gerçekten çok uygun. iPhone 15 Pro\'yu piyasadan çok daha ucuz aldım. Teşekkürler AtusHome!',
    role: 'Müşteri'
  },
  {
    id: 3,
    name: 'Zeynep Demir',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
    rating: 5,
    comment: 'İade süreci çok kolaydı. Ürünü beğenmeyince 14 gün içinde sorunsuz iade ettim. Para iadesi de hemen yapıldı. Güvenilir bir site.',
    role: 'Müşteri'
  },
  {
    id: 4,
    name: 'Can Özdemir',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200',
    rating: 5,
    comment: 'Süpermarket alışverişlerimi artık sadece AtusHome\'dan yapıyorum. Ücretsiz kargo limiti düşük, ürünler taze ve paketleme çok iyi.',
    role: 'Müşteri'
  }
];

export function TestimonialsSection() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <section className="section-padding bg-gradient-to-b from-white to-orange-50/50">
      <div className="container-custom">
        {/* Section Header */}
        <div className="text-center mb-12">
          <span className="text-orange-600 font-medium mb-2 block">Müşteri Yorumları</span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Müşterilerimiz Ne Diyor?
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Binlerce mutlu müşterimizin deneyimlerini okuyun ve siz de AtusHome ailesine katılın.
          </p>
        </div>

        {/* Testimonials Carousel */}
        <div className="relative max-w-4xl mx-auto">
          <div className="overflow-hidden">
            <div 
              className="flex transition-transform duration-500 ease-out"
              style={{ transform: `translateX(-${currentIndex * 100}%)` }}
            >
              {testimonials.map((testimonial) => (
                <div 
                  key={testimonial.id}
                  className="w-full flex-shrink-0 px-4"
                >
                  <div className="bg-card rounded-3xl shadow-soft p-8 md:p-12 text-center">
                    <Quote className="h-12 w-12 text-orange-200 mx-auto mb-6" />
                    
                    {/* Rating */}
                    <div className="flex justify-center gap-1 mb-6">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i}
                          className={`h-5 w-5 ${
                            i < testimonial.rating 
                              ? 'fill-amber-400 text-amber-400' 
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Comment */}
                    <p className="text-lg md:text-xl text-foreground mb-8 leading-relaxed">
                      "{testimonial.comment}"
                    </p>

                    {/* Author */}
                    <div className="flex items-center justify-center gap-4">
                      <img
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        className="w-14 h-14 rounded-full object-cover"
                      />
                      <div className="text-left">
                        <h4 className="font-semibold text-foreground">{testimonial.name}</h4>
                        <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-center gap-4 mt-8">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={prevTestimonial}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1.5">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`carousel-dot transition-all duration-300 rounded-full ${
                    index === currentIndex 
                      ? 'w-5 h-1.5 bg-orange-500' 
                      : 'w-1.5 h-1.5 bg-gray-300 hover:bg-gray-400'
                  }`}
                />
              ))}
            </div>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full"
              onClick={nextTestimonial}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
          {[
            { value: '50K+', label: 'Mutlu Müşteri' },
            { value: '100K+', label: 'Ürün' },
            { value: '4.9', label: 'Ortalama Puan' },
            { value: '24h', label: 'Hızlı Teslimat' }
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-600 mb-1">
                {stat.value}
              </div>
              <div className="text-muted-foreground">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
