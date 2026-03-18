import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categories } from '@/data/mockData';

// Emoji kontrol fonksiyonu
const isEmoji = (str: string): boolean => {
  const emojiRegex = /\p{Emoji}/u;
  return emojiRegex.test(str);
};

export function CategoriesSection() {
  return (
    <section className="py-[clamp(2rem,5vw,4rem)] bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container-custom px-[clamp(0.75rem,2vw,1.5rem)]">
        {/* Section Header - Fluid */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-[clamp(0.5rem,1.5vw,1rem)] mb-[clamp(1rem,3vw,2rem)]">
          <div>
            <span className="text-orange-600 font-medium mb-[clamp(0.25rem,1vw,0.5rem)] block text-[clamp(0.75rem,1.2vw,1rem)]">Kategoriler</span>
            <h2 className="text-[clamp(1.25rem,3vw,2.5rem)] font-bold text-foreground">
              Popüler Kategoriler
            </h2>
          </div>
          <Link 
            to="/products" 
            className="hidden sm:flex items-center gap-2 text-orange-600 font-medium hover:gap-3 transition-all text-[clamp(0.75rem,1.2vw,1rem)]"
          >
            Tümünü Gör
            <ArrowRight className="w-[clamp(1rem,2vw,1.25rem)] h-[clamp(1rem,2vw,1.25rem)]" />
          </Link>
        </div>

        {/* Categories Grid - Mobile: 2 cols */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group relative overflow-hidden rounded-[clamp(0.75rem,2vw,1.25rem)] bg-card shadow-soft hover:shadow-soft-lg transition-all duration-300"
            >
              {/* Background Image */}
              <div className="overflow-hidden aspect-[4/3]">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-3">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {category.icon && isEmoji(category.icon) && <span className="text-lg sm:text-xl">{category.icon}</span>}
                  <div className="min-w-0">
                    <h3 className="text-white font-bold text-xs sm:text-sm group-hover:text-orange-300 transition-colors line-clamp-1">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-[10px] sm:text-xs">
                      {category.productCount.toLocaleString()} ürün
                    </p>
                  </div>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors duration-300" />
            </Link>
          ))}
        </div>

        {/* Mobile View All Link */}
        <div className="mt-[clamp(1rem,3vw,1.5rem)] text-center sm:hidden">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-orange-600 font-medium text-[clamp(0.75rem,1.2vw,0.875rem)]"
          >
            Tümünü Gör
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
