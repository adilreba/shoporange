import { Link } from 'react-router-dom';
import { Clock, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRecentlyViewedStore } from '@/stores/recentlyViewedStore';
import { toast } from 'sonner';

export function RecentlyViewed() {
  const { items, removeItem, clearAll } = useRecentlyViewedStore();
  const recentItems = items.slice(0, 6);

  const handleClearAll = () => {
    clearAll();
    toast.info('Geçmiş temizlendi');
  };

  const handleRemove = (id: string, name: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    removeItem(id);
    toast.info(`${name} geçmişten kaldırıldı`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (recentItems.length === 0) return null;

  return (
    <section className="py-12 bg-muted dark:bg-gray-900">
      <div className="container-custom">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground dark:text-white">
                Son Görüntüledikleriniz
              </h2>
              <p className="text-sm text-muted-foreground dark:text-muted-foreground">
                Son baktığınız {recentItems.length} ürün
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearAll}
              className="text-muted-foreground hover:text-red-500"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Temizle
            </Button>
            <Link 
              to="/products"
              className="text-orange-600 hover:text-orange-700 font-medium text-sm"
            >
              Tümünü Gör →
            </Link>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {recentItems.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="group relative bg-card dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300"
            >
              {/* Remove Button */}
              <button
                onClick={(e) => handleRemove(product.id, product.name, e)}
                className="absolute top-2 right-2 z-10 p-1.5 bg-card/90 dark:bg-gray-800/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-50 hover:text-red-500"
              >
                <X className="w-3 h-3" />
              </button>

              {/* Image */}
              <div className="aspect-square overflow-hidden bg-muted dark:bg-gray-700">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>

              {/* Content */}
              <div className="p-3">
                <p className="text-xs text-orange-600 font-medium truncate">
                  {product.brand}
                </p>
                <h3 className="font-medium text-sm text-foreground dark:text-white line-clamp-2 mt-0.5 min-h-[2.5rem]">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="font-bold text-orange-600">
                    {formatPrice(product.price)}
                  </span>
                  {product.originalPrice && (
                    <span className="text-xs text-muted-foreground line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
