import { useNavigate, Link } from 'react-router-dom';
import { Heart, ShoppingCart, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { useWishlistStore } from '@/stores/wishlistStore';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';

export function Wishlist() {
  const navigate = useNavigate();
  const { items, removeFromWishlist, clearWishlist } = useWishlistStore();
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
        <main className="container-custom pt-[42px] pb-12 sm:pt-[42px] sm:py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-32 h-32 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
              <Heart className="h-16 w-16 text-red-500" />
            </div>
            <h1 className="text-2xl font-bold mb-4">Favori Listesi Boş</h1>
            <p className="text-muted-foreground mb-8">
              Henüz favori ürününüz yok. Beğendiğiniz ürünleri buraya ekleyin!
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

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom pt-[42px] pb-6 sm:pt-[42px] sm:pb-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            Favorilerim <span className="text-sm sm:text-base font-normal text-muted-foreground">({items.length})</span>
          </h1>
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 hover:text-red-600 h-8 text-xs sm:text-sm"
            onClick={() => {
              clearWishlist();
              toast.info('Favori listesi temizlendi');
            }}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Listeyi Temizle</span>
            <span className="sm:hidden">Temizle</span>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((product) => (
            <div key={product.id} className="group relative bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all h-full flex flex-col">
              {/* Image */}
              <Link to={`/product/${product.id}`} className="block flex-shrink-0">
                <div className="aspect-square overflow-hidden bg-muted">
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                </div>
              </Link>

              {/* Remove Button */}
              <button
                onClick={() => {
                  removeFromWishlist(product.id);
                  toast.info('Favorilerden çıkarıldı');
                }}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-card shadow-md flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="p-4 flex-1 flex flex-col">
                <Link to={`/product/${product.id}`} className="flex-1">
                  <p className="text-sm text-orange-600 font-medium">{product.brand}</p>
                  <h3 className="font-semibold text-foreground line-clamp-2 mt-1 group-hover:text-orange-600 transition-colors min-h-[3rem]">
                    {product.name}
                  </h3>
                </Link>

                <div className="mt-auto pt-3">
                  <span className="text-lg font-bold text-orange-600 block mb-3">
                    {formatPrice(product.price)}
                  </span>

                  <Button 
                    className="w-full gradient-orange"
                    size="sm"
                    onClick={() => handleAddToCart(product)}
                  >
                    <ShoppingCart className="h-4 w-4 mr-2" />
                    Sepete Ekle
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  );
}
