import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Clock,
  Filter,
  Grid3X3,
  List,
  ArrowRight
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/mockData';

export function NewArrivals() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState('newest');

  // Get new products sorted by date
  const newProducts = products
    .filter(p => p.isNew)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const sortedProducts = [...newProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price-low':
        return a.price - b.price;
      case 'price-high':
        return b.price - a.price;
      case 'name':
        return a.name.localeCompare(b.name);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const categories = [
    { id: 'all', name: 'Tümü', count: newProducts.length },
    { id: 'elektronik', name: 'Elektronik', count: newProducts.filter(p => p.category === 'elektronik').length },
    { id: 'moda', name: 'Moda', count: newProducts.filter(p => p.category === 'moda').length },
    { id: 'ev-yasam', name: 'Ev & Yaşam', count: newProducts.filter(p => p.category === 'ev-yasam').length },
    { id: 'kozmetik', name: 'Kozmetik', count: newProducts.filter(p => p.category === 'kozmetik').length },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = selectedCategory === 'all' 
    ? sortedProducts 
    : sortedProducts.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-green-500 to-emerald-600 text-white py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Badge className="bg-white/20 text-white mb-4 px-4 py-1">
                <Sparkles className="w-4 h-4 mr-1 inline" />
                Yeni Gelenler
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">En Yeni Ürünler</h1>
              <p className="text-xl text-white/90 max-w-xl">
                En son teknolojiler, en yeni moda trendleri ve daha fazlası burada!
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4">
              <Clock className="w-12 h-12" />
              <div>
                <p className="text-2xl font-bold">{newProducts.length}</p>
                <p className="text-white/80">Yeni Ürün</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar Filters */}
            <aside className="lg:w-64">
              <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Filter className="w-5 h-5" />
                  Kategoriler
                </h3>
                <div className="space-y-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                        selectedCategory === cat.id 
                          ? 'bg-green-50 text-green-600 font-medium' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-sm text-gray-400">{cat.count}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl text-white">
                  <p className="font-semibold mb-2">Yeni Ürün Bildirimi</p>
                  <p className="text-sm text-white/80 mb-4">
                    Yeni ürünlerden haberdar olmak için bültenimize abone olun.
                  </p>
                  <input 
                    type="email" 
                    placeholder="E-posta adresiniz"
                    className="w-full px-3 py-2 rounded-lg text-gray-900 text-sm mb-2"
                  />
                  <Button className="w-full bg-white text-green-600 hover:bg-gray-100 text-sm">
                    Abone Ol
                  </Button>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-gray-500">
                  <span className="font-semibold text-gray-900">{filteredProducts.length}</span> ürün bulundu
                </p>
                <div className="flex items-center gap-4">
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="border rounded-lg px-3 py-2 text-sm"
                  >
                    <option value="newest">En Yeni</option>
                    <option value="price-low">Fiyat: Düşükten Yükseğe</option>
                    <option value="price-high">Fiyat: Yüksekten Düşüğe</option>
                    <option value="name">İsim (A-Z)</option>
                  </select>
                  <div className="flex items-center border rounded-lg overflow-hidden">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100' : ''}`}
                    >
                      <Grid3X3 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`p-2 ${viewMode === 'list' ? 'bg-gray-100' : ''}`}
                    >
                      <List className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Products */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <Sparkles className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz yeni ürün yok</h3>
                  <p className="text-gray-500">Yakında yeni ürünler eklenecek!</p>
                </div>
              ) : (
                <div className={`grid gap-4 ${
                  viewMode === 'grid' 
                    ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' 
                    : 'grid-cols-1'
                }`}>
                  {filteredProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-white border-t">
        <div className="container-custom text-center">
          <h2 className="text-2xl font-bold mb-4">Tüm Ürünleri Keşfedin</h2>
          <p className="text-gray-500 mb-6">Binlerce ürün arasından size en uygun olanı bulun.</p>
          <Button asChild className="gradient-orange">
            <Link to="/products">
              Tüm Ürünler
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>
      </section>

      <Footer />
    </div>
  );
}
