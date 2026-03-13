import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Flame, 
  TrendingUp,
  Star,
  ShoppingCart,
  Filter,
  Trophy,
  Medal,
  Award
} from 'lucide-react';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { products } from '@/data/mockData';

export function Bestsellers() {
  const [timeRange, setTimeRange] = useState('all');

  // Get bestseller products sorted by sales count
  const bestsellers = products
    .filter(p => p.isBestseller || (p.salesCount && p.salesCount > 50))
    .sort((a, b) => (b.salesCount || 0) - (a.salesCount || 0));

  const top3 = bestsellers.slice(0, 3);
  const rest = bestsellers.slice(3);

  const categories = [
    { id: 'all', name: 'Tümü', count: bestsellers.length },
    { id: 'elektronik', name: 'Elektronik', count: bestsellers.filter(p => p.category === 'elektronik').length },
    { id: 'moda', name: 'Moda', count: bestsellers.filter(p => p.category === 'moda').length },
    { id: 'ev-yasam', name: 'Ev & Yaşam', count: bestsellers.filter(p => p.category === 'ev-yasam').length },
    { id: 'kozmetik', name: 'Kozmetik', count: bestsellers.filter(p => p.category === 'kozmetik').length },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredProducts = selectedCategory === 'all' 
    ? rest 
    : rest.filter(p => p.category === selectedCategory);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-500" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-400" />;
      case 3:
        return <Award className="w-8 h-8 text-orange-400" />;
      default:
        return null;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-br from-yellow-100 to-yellow-200 border-yellow-300';
      case 2:
        return 'bg-gradient-to-br from-gray-100 to-gray-200 border-gray-300';
      case 3:
        return 'bg-gradient-to-br from-orange-100 to-orange-200 border-orange-300';
      default:
        return '';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-orange-500 to-red-500 text-white py-16">
        <div className="container-custom">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <Badge className="bg-white/20 text-white mb-4 px-4 py-1">
                <Flame className="w-4 h-4 mr-1 inline" />
                Çok Satanlar
              </Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-4">En Çok Satanlar</h1>
              <p className="text-xl text-white/90 max-w-xl">
                Müşterilerimizin en çok tercih ettiği, en popüler ürünler burada!
              </p>
            </div>
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur rounded-xl p-4">
              <TrendingUp className="w-12 h-12" />
              <div>
                <p className="text-2xl font-bold">{bestsellers.length}</p>
                <p className="text-white/80">Popüler Ürün</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Top 3 Section */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <h2 className="text-2xl font-bold text-center mb-8">🏆 Bu Haftanın En İyileri</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {top3.map((product, index) => (
              <div 
                key={product.id} 
                className={`relative rounded-2xl border-2 p-6 ${getRankStyle(index + 1)}`}
              >
                {/* Rank Badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
                    {getRankIcon(index + 1)}
                  </div>
                </div>

                <div className="pt-6 text-center">
                  <img 
                    src={product.images[0]} 
                    alt={product.name}
                    className="w-32 h-32 object-contain mx-auto mb-4"
                  />
                  <p className="text-sm text-orange-600 font-medium">{product.brand}</p>
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                  <div className="flex items-center justify-center gap-2 mb-3">
                    <div className="flex items-center bg-yellow-50 px-2 py-1 rounded">
                      <Star className="w-4 h-4 text-yellow-400 fill-yellow-400 mr-1" />
                      <span className="font-medium">{product.rating}</span>
                    </div>
                    <span className="text-sm text-gray-500">({product.reviewCount} yorum)</span>
                  </div>
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-2xl font-bold text-orange-600">
                      ₺{product.price.toLocaleString()}
                    </span>
                    {product.originalPrice && (
                      <span className="text-gray-400 line-through">
                        ₺{product.originalPrice.toLocaleString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-center gap-2 text-sm text-gray-600 mb-4">
                    <ShoppingCart className="w-4 h-4" />
                    <span>{product.salesCount || 100}+ satıldı</span>
                  </div>
                  <Button asChild className="w-full gradient-orange">
                    <Link to={`/product/${product.id}`}>
                      Ürüne Git
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8">
        <div className="container-custom">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Sidebar */}
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
                          ? 'bg-orange-50 text-orange-600 font-medium' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span>{cat.name}</span>
                      <span className="text-sm text-gray-400">{cat.count}</span>
                    </button>
                  ))}
                </div>

                <div className="mt-8">
                  <h3 className="font-semibold mb-4">Zaman Aralığı</h3>
                  <div className="space-y-2">
                    {[
                      { value: 'all', label: 'Tüm Zamanlar' },
                      { value: 'week', label: 'Bu Hafta' },
                      { value: 'month', label: 'Bu Ay' },
                      { value: 'year', label: 'Bu Yıl' },
                    ].map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setTimeRange(option.value)}
                        className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                          timeRange === option.value 
                            ? 'bg-orange-50 text-orange-600' 
                            : 'hover:bg-gray-50 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

            {/* Products Grid */}
            <div className="flex-1">
              {/* Toolbar */}
              <div className="bg-white rounded-xl shadow-sm p-4 mb-6 flex items-center justify-between">
                <p className="text-gray-500">
                  <span className="font-semibold text-gray-900">{filteredProducts.length}</span> ürün daha
                </p>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Sıralama:</span>
                  <select className="border rounded-lg px-3 py-2 text-sm">
                    <option>En Çok Satan</option>
                    <option>En Yüksek Puan</option>
                    <option>En Yeni</option>
                  </select>
                </div>
              </div>

              {/* Products */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl">
                  <Flame className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Henüz ürün yok</h3>
                  <p className="text-gray-500">Bu kategoride henüz çok satan ürün bulunmuyor.</p>
                </div>
              ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProducts.map((product, index) => (
                    <div key={product.id} className="relative">
                      <div className="absolute top-2 left-2 z-10">
                        <Badge className="bg-orange-500 text-white">
                          #{index + 4}
                        </Badge>
                      </div>
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-4xl font-bold text-orange-500 mb-2">1M+</p>
              <p className="text-gray-400">Toplam Satış</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-orange-500 mb-2">500K+</p>
              <p className="text-gray-400">Mutlu Müşteri</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-orange-500 mb-2">4.8</p>
              <p className="text-gray-400">Ortalama Puan</p>
            </div>
            <div>
              <p className="text-4xl font-bold text-orange-500 mb-2">99%</p>
              <p className="text-gray-400">Memnuniyet Oranı</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
