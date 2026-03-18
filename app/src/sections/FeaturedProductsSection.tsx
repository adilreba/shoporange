import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { products } from '@/data/mockData';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'all', label: 'Tümü' },
  { id: 'new', label: 'Yeni Gelenler' },
  { id: 'popular', label: 'Popüler' },
  { id: 'sale', label: 'İndirimli' },
];

export function FeaturedProductsSection() {
  const [activeTab, setActiveTab] = useState('all');

  const filteredProducts = products.filter((product) => {
    switch (activeTab) {
      case 'new':
        return product.isNew;
      case 'popular':
        return product.rating >= 4.5;
      case 'sale':
        return product.originalPrice && product.originalPrice > product.price;
      default:
        return true;
    }
  });

  return (
    <section className="py-[clamp(2rem,5vw,4rem)] bg-background">
      <div className="container-custom px-[clamp(0.75rem,2vw,1.5rem)]">
        {/* Section Header - Fluid */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-[clamp(0.5rem,1.5vw,1rem)] mb-[clamp(1rem,3vw,2rem)]">
          <div>
            <span className="text-orange-600 font-medium mb-[clamp(0.25rem,1vw,0.5rem)] block text-[clamp(0.75rem,1.2vw,1rem)]">
              Öne Çıkan Ürünler
            </span>
            <h2 className="text-[clamp(1.25rem,3vw,2.5rem)] font-bold text-foreground">
              Keşfetmeye Başla
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

        {/* Category Tabs - Fluid */}
        <div className="flex flex-wrap gap-[clamp(0.25rem,1vw,0.5rem)] mb-[clamp(1rem,3vw,2rem)]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-[clamp(0.75rem,1.5vw,1.25rem)] py-[clamp(0.375rem,1vw,0.625rem)] rounded-full text-[clamp(0.625rem,1vw,0.875rem)] font-medium transition-all duration-300',
                activeTab === tab.id
                  ? 'gradient-orange text-white shadow-lg shadow-orange-500/25'
                  : 'bg-card text-foreground hover:bg-orange-50 border border-border'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Products Grid - Mobile: 2 cols, Desktop: auto */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
          {filteredProducts.slice(0, 8).map((product) => (
            <div key={product.id} className="h-full">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Mobile View All Button */}
        <div className="mt-[clamp(1.5rem,4vw,2.5rem)] text-center sm:hidden">
          <Link to="/products">
            <Button 
              variant="outline" 
              className="rounded-full px-[clamp(1.5rem,4vw,2rem)] border-2 border-orange-200 hover:border-orange-500 hover:bg-orange-50"
            >
              Tümünü Gör
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
