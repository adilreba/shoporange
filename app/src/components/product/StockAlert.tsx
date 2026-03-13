import { useState } from 'react';
import { Bell, Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useStockAlertStore } from '@/stores/stockAlertStore';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';

interface StockAlertProps {
  productId: string;
  productName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function StockAlertDialog({ productId, productName, isOpen, onClose }: StockAlertProps) {
  const { user } = useAuthStore();
  const { addAlert, hasAlert } = useStockAlertStore();
  
  const [email, setEmail] = useState(user?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim() || !email.includes('@')) {
      toast.error('Geçerli bir e-posta adresi girin');
      return;
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const success = addAlert(productId, productName, email);
    
    if (success) {
      toast.success('Stok bildirimine kaydoldunuz!', {
        description: `${productName} stokta olduğunda size haber vereceğiz.`,
      });
      onClose();
    } else {
      toast.info('Zaten bu ürün için bildirim kaydınız var');
    }

    setIsSubmitting(false);
  };

  const alreadySubscribed = email ? hasAlert(productId, email) : false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
            <Bell className="w-8 h-8 text-orange-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Stokta Olmunca Haber Ver
          </DialogTitle>
          <DialogDescription className="text-center">
            <span className="font-medium text-gray-900">{productName}</span> stokta olduğunda
            size e-posta ile haber verelim.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              type="email"
              placeholder="E-posta adresiniz"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="pl-10 py-6"
              disabled={isSubmitting || alreadySubscribed}
            />
          </div>

          {alreadySubscribed ? (
            <div className="flex items-center gap-2 p-4 bg-green-50 rounded-lg">
              <Check className="w-5 h-5 text-green-500" />
              <span className="text-green-700">
                Bu ürün için bildirim kaydınız bulunuyor
              </span>
            </div>
          ) : (
            <Button
              type="submit"
              className="w-full gradient-orange py-6"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Kaydediliyor...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Beni Haberdar Et
                </span>
              )}
            </Button>
          )}

          <p className="text-xs text-gray-500 text-center">
            Stok bildirimini istediğiniz zaman iptal edebilirsiniz.
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Inline button for product cards
interface StockAlertButtonProps {
  productId: string;
  productName: string;
  variant?: 'default' | 'small';
}

export function StockAlertButton({ productId, productName, variant = 'default' }: StockAlertButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { user } = useAuthStore();
  const { hasAlert } = useStockAlertStore();

  const isSubscribed = user?.email ? hasAlert(productId, user.email) : false;

  if (variant === 'small') {
    return (
      <>
        <button
          onClick={() => setIsDialogOpen(true)}
          className="p-2 bg-orange-50 hover:bg-orange-100 text-orange-600 rounded-lg transition-colors"
          title="Stokta olunca haber ver"
        >
          <Bell className={`w-4 h-4 ${isSubscribed ? 'fill-current' : ''}`} />
        </button>
        <StockAlertDialog
          productId={productId}
          productName={productName}
          isOpen={isDialogOpen}
          onClose={() => setIsDialogOpen(false)}
        />
      </>
    );
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
        onClick={() => setIsDialogOpen(true)}
      >
        <Bell className={`w-4 h-4 mr-2 ${isSubscribed ? 'fill-current' : ''}`} />
        {isSubscribed ? 'Bildirim Kaydı Mevcut' : 'Stokta Olunca Haber Ver'}
      </Button>
      <StockAlertDialog
        productId={productId}
        productName={productName}
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
      />
    </>
  );
}
