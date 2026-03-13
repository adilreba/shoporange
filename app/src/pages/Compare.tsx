import { Link, useNavigate } from 'react-router-dom';
import { Scale, X, ShoppingCart, Star, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useCompareStore } from '@/stores/compareStore';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

export function Compare() {
  const navigate = useNavigate();
  const { items, removeFromCompare, clearCompare } = useCompareStore();
  const { addToCart } = useCartStore();

  const handleAddToCart = (product: any) => {
    addToCart(product, 1);
    toast.success(`${product.name} sepete eklendi!`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-custom py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-32 h-32 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
              <Scale className="h-16 w-16 text-orange-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Karşılaştırma Listesi Boş</h1>
            <p className="text-gray-500 mb-8">
              Henüz karşılaştırma listenizde ürün yok. Ürünleri karşılaştırmak için ekleyin!
            </p>
            <Button 
              className="gradient-orange px-8"
              onClick={() => navigate('/products')}
            >
              Alışverişe Başla
              <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Get all unique features from all products
  const allFeatures = new Set<string>();
  items.forEach(item => {
    if (item.features) {
      Object.keys(item.features).forEach(key => allFeatures.add(key));
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
          <Link to="/" className="hover:text-orange-600">Ana Sayfa</Link>
          <span>/</span>
          <span className="text-gray-900">Karşılaştırma</span>
        </nav>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">
            Ürün Karşılaştırma ({items.length}/4)
          </h1>
          <Button 
            variant="outline" 
            className="text-red-500 hover:text-red-600"
            onClick={() => {
              clearCompare();
              toast.info('Karşılaştırma listesi temizlendi');
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Listeyi Temizle
          </Button>
        </div>

        {/* Comparison Table */}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead>
              <tr>
                <th className="text-left p-4 bg-gray-50 rounded-tl-xl">Özellik</th>
                {items.map((product) => (
                  <th key={product.id} className="p-4 bg-gray-50 min-w-[200px]">
                    <div className="relative">
                      <button
                        onClick={() => {
                          removeFromCompare(product.id);
                          toast.info('Karşılaştırmadan çıkarıldı');
                        }}
                        className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                      <Link to={`/product/${product.id}`}>
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-24 h-24 object-cover rounded-lg mx-auto mb-3"
                        />
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Product Name */}
              <tr className="border-b">
                <td className="p-4 font-medium text-gray-500">Ürün Adı</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    <Link 
                      to={`/product/${product.id}`}
                      className="font-semibold hover:text-orange-600 transition-colors"
                    >
                      {product.name}
                    </Link>
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr className="border-b bg-gray-50/50">
                <td className="p-4 font-medium text-gray-500">Marka</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">{product.brand}</td>
                ))}
              </tr>

              {/* Price */}
              <tr className="border-b">
                <td className="p-4 font-medium text-gray-500">Fiyat</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    <span className="text-xl font-bold text-orange-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-gray-400 line-through ml-2">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr className="border-b bg-gray-50/50">
                <td className="p-4 font-medium text-gray-500">Değerlendirme</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium">{product.rating}</span>
                      <span className="text-gray-400">({product.reviewCount})</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Stock */}
              <tr className="border-b">
                <td className="p-4 font-medium text-gray-500">Stok Durumu</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.stock > 0 ? (
                      <span className="flex items-center gap-1 text-green-600">
                        <Check className="h-4 w-4" />
                        Stokta ({product.stock})
                      </span>
                    ) : (
                      <span className="text-red-500">Stokta Yok</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Features */}
              {Array.from(allFeatures).map((feature, index) => (
                <tr key={feature} className={index % 2 === 0 ? 'bg-gray-50/50' : ''}>
                  <td className="p-4 font-medium text-gray-500">{feature}</td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4">
                      {product.features?.[feature] || '-'}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Actions */}
              <tr>
                <td className="p-4"></td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    <Button 
                      className="w-full gradient-orange"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2" />
                      Sepete Ekle
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>

      <Footer />
    </div>
  );
}
