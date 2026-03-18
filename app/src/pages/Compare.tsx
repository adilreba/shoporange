import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Scale, X, ShoppingCart, Star, Check, ArrowRight, ChevronDown, ChevronUp } from 'lucide-react';
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
  const [expandedFeatures, setExpandedFeatures] = useState<string[]>([]);

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

  const toggleFeature = (feature: string) => {
    setExpandedFeatures(prev => 
      prev.includes(feature) 
        ? prev.filter(f => f !== feature)
        : [...prev, feature]
    );
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container-custom pt-[42px] pb-12 sm:pt-[42px] sm:py-16">
          <div className="max-w-md mx-auto text-center px-4">
            <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
              <Scale className="h-12 w-12 sm:h-16 sm:w-16 text-orange-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold mb-3">Karşılaştırma Listesi Boş</h1>
            <p className="text-muted-foreground mb-6 text-sm sm:text-base px-4">
              Henüz karşılaştırma listenizde ürün yok. Ürünleri karşılaştırmak için ekleyin!
            </p>
            <Button 
              className="gradient-orange px-6 sm:px-8"
              onClick={() => navigate('/products')}
            >
              Alışverişe Başla
              <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5 ml-2" />
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

  const featuresList = Array.from(allFeatures);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom pt-[42px] pb-6 sm:pt-[42px] sm:pb-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold">
              Ürün Karşılaştırma
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {items.length}/4 ürün
            </p>
          </div>
          <Button 
            variant="outline" 
            className="text-red-500 hover:text-red-600 w-full sm:w-auto"
            onClick={() => {
              clearCompare();
              toast.info('Karşılaştırma listesi temizlendi');
            }}
          >
            <X className="h-4 w-4 mr-2" />
            Listeyi Temizle
          </Button>
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[800px] table-fixed">
            <thead>
              <tr>
                <th className="text-left p-4 bg-muted rounded-tl-xl text-sm font-medium sticky left-0 z-10 w-[180px]">Özellik</th>
                {items.map((product) => (
                  <th key={product.id} className="p-4 bg-muted w-[calc((100%-180px)/4)]">
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
                          className="w-20 h-20 sm:w-24 sm:h-24 object-cover rounded-lg mx-auto mb-3"
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
                <td className="p-4 font-medium text-muted-foreground text-sm sticky left-0 bg-background">Ürün Adı</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    <Link 
                      to={`/product/${product.id}`}
                      className="font-semibold hover:text-orange-600 transition-colors text-sm"
                    >
                      {product.name}
                    </Link>
                  </td>
                ))}
              </tr>

              {/* Brand */}
              <tr className="border-b bg-muted/50">
                <td className="p-4 font-medium text-muted-foreground text-sm sticky left-0 bg-muted/50">Marka</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4 text-sm">{product.brand}</td>
                ))}
              </tr>

              {/* Price */}
              <tr className="border-b">
                <td className="p-4 font-medium text-muted-foreground text-sm sticky left-0 bg-background">Fiyat</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    <span className="text-lg font-bold text-orange-600">
                      {formatPrice(product.price)}
                    </span>
                    {product.originalPrice && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        {formatPrice(product.originalPrice)}
                      </span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr className="border-b bg-muted/50">
                <td className="p-4 font-medium text-muted-foreground text-sm sticky left-0 bg-muted/50">Değerlendirme</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                      <span className="font-medium text-sm">{product.rating}</span>
                      <span className="text-muted-foreground text-xs">({product.reviewCount})</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Stock */}
              <tr className="border-b">
                <td className="p-4 font-medium text-muted-foreground text-sm sticky left-0 bg-background">Stok Durumu</td>
                {items.map((product) => (
                  <td key={product.id} className="p-4">
                    {product.stock > 0 ? (
                      <span className="flex items-center gap-1 text-green-600 text-sm">
                        <Check className="h-4 w-4" />
                        Stokta ({product.stock})
                      </span>
                    ) : (
                      <span className="text-red-500 text-sm">Stokta Yok</span>
                    )}
                  </td>
                ))}
              </tr>

              {/* Features */}
              {featuresList.map((feature, index) => (
                <tr key={feature} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                  <td className={`p-4 font-medium text-muted-foreground text-sm sticky left-0 ${index % 2 === 0 ? 'bg-muted/50' : 'bg-background'}`}>
                    {feature}
                  </td>
                  {items.map((product) => (
                    <td key={product.id} className="p-4 text-sm">
                      {product.features?.[feature] || '-'}
                    </td>
                  ))}
                </tr>
              ))}

              {/* Actions */}
              <tr>
                <td className="p-4 sticky left-0 bg-background"></td>
                {items.map((product) => (
                  <td key={product.id} className="p-4 min-w-[140px]">
                    <Button 
                      className="w-full gradient-orange text-sm whitespace-nowrap"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock === 0}
                    >
                      <ShoppingCart className="h-4 w-4 mr-2 flex-shrink-0" />
                      Sepete Ekle
                    </Button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile & Tablet Card View */}
        <div className="lg:hidden space-y-4">
          {/* Products Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {items.map((product) => (
              <div key={product.id} className="bg-card rounded-xl border border-border p-4">
                {/* Product Header */}
                <div className="flex gap-3 mb-4">
                  <Link to={`/product/${product.id}`} className="flex-shrink-0">
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-20 h-20 object-cover rounded-lg"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link 
                      to={`/product/${product.id}`}
                      className="font-semibold text-sm hover:text-orange-600 transition-colors line-clamp-2"
                    >
                      {product.name}
                    </Link>
                    <p className="text-xs text-muted-foreground mt-1">{product.brand}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-medium">{product.rating}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      removeFromCompare(product.id);
                      toast.info('Karşılaştırmadan çıkarıldı');
                    }}
                    className="flex-shrink-0 w-8 h-8 rounded-full bg-red-100 text-red-500 flex items-center justify-center hover:bg-red-200 transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Price */}
                <div className="mb-4">
                  <span className="text-xl font-bold text-orange-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-sm text-muted-foreground line-through ml-2">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>

                {/* Features Accordion */}
                <div className="space-y-2">
                  <button
                    onClick={() => toggleFeature(product.id)}
                    className="w-full flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                  >
                    <span className="font-medium">Özellikler</span>
                    {expandedFeatures.includes(product.id) ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expandedFeatures.includes(product.id) && (
                    <div className="p-3 bg-muted/50 rounded-lg space-y-2">
                      {product.features ? (
                        Object.entries(product.features).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{value as string}</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Özellik bulunmuyor</p>
                      )}
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Stok:</span>
                          <span className={product.stock > 0 ? 'text-green-600' : 'text-red-500'}>
                            {product.stock > 0 ? `${product.stock} adet` : 'Stokta Yok'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Add to Cart */}
                <Button 
                  className="w-full gradient-orange mt-4"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Sepete Ekle
                </Button>
              </div>
            ))}
          </div>

          {/* Feature Comparison Matrix - Mobile */}
          {items.length > 1 && featuresList.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4 mt-6">
              <h3 className="font-semibold mb-4">Özellik Karşılaştırması</h3>
              <div className="space-y-4">
                {featuresList.map((feature) => (
                  <div key={feature} className="border-b border-border pb-3 last:border-0">
                    <p className="text-sm font-medium text-muted-foreground mb-2">{feature}</p>
                    <div className={`grid gap-2 ${items.length === 2 ? 'grid-cols-2' : items.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
                      {items.map((product) => (
                        <div key={product.id} className="text-sm">
                          <p className="text-xs text-muted-foreground truncate mb-1">{product.brand}</p>
                          <p className="font-medium">{product.features?.[feature] || '-'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
