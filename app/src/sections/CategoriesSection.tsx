import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { categories } from '@/data/mockData';

const iconMap: Record<string, string> = {
  'elektronik': '💻',
  'moda': '👕',
  'ev-yasam': '🏠',
  'kozmetik': '💄',
  'spor': '⚽',
  'kitap': '📚',
  'oyuncak': '🎮',
  'supermarket': '🛒'
};

export function CategoriesSection() {
  return (
    <section className="section-padding bg-gradient-to-b from-orange-50/50 to-white">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex items-end justify-between mb-10">
          <div>
            <span className="text-orange-600 font-medium mb-2 block">Kategoriler</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Popüler Kategoriler
            </h2>
          </div>
          <Link 
            to="/products" 
            className="hidden md:flex items-center gap-2 text-orange-600 font-medium hover:gap-3 transition-all"
          >
            Tümünü Gör
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {categories.map((category, index) => (
            <Link
              key={category.id}
              to={`/products?category=${category.id}`}
              className="group relative overflow-hidden rounded-2xl bg-white shadow-soft hover:shadow-soft-lg transition-all duration-300"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Background Image */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              </div>

              {/* Content */}
              <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-3xl">{iconMap[category.id]}</span>
                  <div>
                    <h3 className="text-white font-bold text-lg md:text-xl group-hover:text-orange-300 transition-colors">
                      {category.name}
                    </h3>
                    <p className="text-white/70 text-sm">
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
        <div className="mt-8 text-center md:hidden">
          <Link 
            to="/products" 
            className="inline-flex items-center gap-2 text-orange-600 font-medium"
          >
            Tümünü Gör
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
