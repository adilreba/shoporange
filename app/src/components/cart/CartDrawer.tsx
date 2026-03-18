import { useNavigate } from 'react-router-dom';
import { Plus, Minus, ShoppingBag, Trash2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import { useState } from 'react';

interface CartDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CartDrawer({ open, onOpenChange }: CartDrawerProps) {
  const navigate = useNavigate();
  const { 
    items, 
    updateQuantity, 
    removeFromCart, 
    totalItems, 
    totalPrice, 
    finalPrice, 
    shippingCost,
    couponCode,
    discountAmount,
    applyCoupon,
    removeCoupon
  } = useCartStore();
  
  const [couponInput, setCouponInput] = useState('');

  const handleApplyCoupon = () => {
    if (applyCoupon(couponInput)) {
      toast.success('Kupon başarıyla uygulandı!');
      setCouponInput('');
    } else {
      toast.error('Geçersiz kupon kodu');
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg flex flex-col p-0">
        <SheetHeader className="space-y-2.5 p-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2 text-xl">
              <ShoppingBag className="h-6 w-6 text-orange-500" />
              Alışveriş Sepeti
              <span className="text-sm font-normal text-muted-foreground">
                ({totalItems()} ürün)
              </span>
            </SheetTitle>
          </div>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
            <div className="w-24 h-24 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <ShoppingBag className="h-12 w-12 text-orange-500" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Sepetiniz Boş
            </h3>
            <p className="text-muted-foreground mb-6 max-w-xs">
              Sepetinizde ürün bulunmuyor. Hemen alışverişe başlayın!
            </p>
            <Button 
              className="gradient-orange"
              onClick={() => {
                onOpenChange(false);
                navigate('/products');
              }}
            >
              Alışverişe Başla
            </Button>
          </div>
        ) : (
          <>
            {/* Scrollable Items Area */}
            <div className="flex-1 overflow-y-auto p-4">
              <div className="space-y-4">
                {items.map((item) => (
                  <div 
                    key={item.product.id}
                    className="flex gap-3 p-3 rounded-xl bg-muted"
                  >
                    {/* Product Image */}
                    <div 
                      className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer"
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/product/${item.product.id}`);
                      }}
                    >
                      <img
                        src={item.product.images?.[0] || 'https://placehold.co/100x100/orange/white?text=Urun'}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/orange/white?text=Urun';
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h4 
                        className="font-medium text-foreground text-sm line-clamp-1 cursor-pointer hover:text-orange-600 transition-colors"
                        onClick={() => {
                          onOpenChange(false);
                          navigate(`/product/${item.product.id}`);
                        }}
                      >
                        {item.product.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">{item.product.brand}</p>
                      
                      <div className="flex items-center justify-between mt-2">
                        {/* Quantity Controls */}
                        <div className="flex items-center gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.product.id);
                                toast.info('Ürün sepetten çıkarıldı');
                              } else {
                                updateQuantity(item.product.id, item.quantity - 1);
                              }
                            }}
                          >
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-8 text-center font-medium text-sm">
                            {item.quantity}
                          </span>
                          <Button
                            variant="outline"
                            size="icon"
                            className="h-7 w-7 rounded-full"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>

                        {/* Price */}
                        <span className="font-semibold text-orange-600 text-sm">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {/* Remove Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-red-500 flex-shrink-0"
                      onClick={() => {
                        removeFromCart(item.product.id);
                        toast.info('Ürün sepetten çıkarıldı');
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Coupon Code */}
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground mb-2">İndirim Kuponu</p>
                {couponCode ? (
                  <div className="flex items-center gap-2 p-3 bg-green-50 rounded-lg">
                    <span className="flex-1 text-green-700 font-medium text-sm">
                      {couponCode} - %{discountAmount} İndirim
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-red-500 hover:text-red-600"
                      onClick={removeCoupon}
                    >
                      Kaldır
                    </Button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <Input
                      placeholder="Kupon kodu girin"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value)}
                      className="flex-1 text-sm"
                    />
                    <Button 
                      variant="outline"
                      onClick={handleApplyCoupon}
                      disabled={!couponInput.trim()}
                      size="sm"
                    >
                      Uygula
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Fixed Bottom Summary */}
            <div className="border-t p-4 space-y-4 shrink-0 bg-card">
              {/* Summary */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Ara Toplam</span>
                  <span>{formatPrice(totalPrice())}</span>
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>İndirim</span>
                    <span>-{formatPrice(totalPrice() * discountAmount / 100)}</span>
                  </div>
                )}
                <div className="flex justify-between text-muted-foreground">
                  <span>Kargo</span>
                  <span className={shippingCost() === 0 ? 'text-green-600' : ''}>
                    {shippingCost() === 0 ? 'Ücretsiz' : formatPrice(shippingCost())}
                  </span>
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Toplam</span>
                  <span className="text-orange-600">{formatPrice(finalPrice())}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button 
                  className="w-full gradient-orange h-12 text-base"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/checkout');
                  }}
                >
                  Ödemeye Geç
                  <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    onOpenChange(false);
                    navigate('/cart');
                  }}
                >
                  Sepeti Görüntüle
                </Button>
              </div>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
