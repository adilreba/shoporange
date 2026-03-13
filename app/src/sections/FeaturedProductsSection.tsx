import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard } from '@/components/product/ProductCard';
import { products } from '@/data/mockData';

const tabs = [
  { id: 'featured', label: 'Öne Çıkanlar' },
  { id: 'new', label: 'Yeni Gelenler' },
  { id: 'bestseller', label: 'Çok Satanlar' },
  { id: 'discount', label: 'İndirimdekiler' }
];

export function FeaturedProductsSection() {
  const [activeTab, setActiveTab] = useState('featured');

  const getProducts = () => {
    switch (activeTab) {
      case 'new':
        return products.filter(p => p.isNew).slice(0, 8);
      case 'bestseller':
        return products.filter(p => p.isBestseller).slice(0, 8);
      case 'discount':
        return products.filter(p => p.discount && p.discount > 0).slice(0, 8);
      default:
        return products.filter(p => p.isFeatured).slice(0, 8);
    }
  };

  const displayedProducts = getProducts();

  return (
    <section className="section-padding">
      <div className="container-custom">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <span className="text-orange-600 font-medium mb-2 block">Ürünler</span>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900">
              Keşfetmeye Başla
            </h2>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'gradient-orange text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {displayedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-12 text-center">
          <Link to="/products">
            <Button 
              size="lg" 
              variant="outline"
              className="border-2 border-orange-500 text-orange-600 hover:bg-orange-500 hover:text-white px-8"
            >
              Tüm Ürünleri Gör
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
