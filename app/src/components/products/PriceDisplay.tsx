import { Badge } from '@/components/ui/badge';

interface PriceDisplayProps {
  price: number;
  originalPrice?: number;
  discount?: number;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  className?: string;
}

export function PriceDisplay({ 
  price, 
  originalPrice, 
  discount, 
  size = 'md', 
  showBadge = true,
  className = ''
}: PriceDisplayProps) {
  const hasDiscount = !!originalPrice && originalPrice > price;
  const discountPercent = hasDiscount 
    ? (discount ?? Math.round((1 - price / originalPrice) * 100))
    : 0;

  const sizeClasses = {
    sm: { price: 'text-sm', original: 'text-xs' },
    md: { price: 'text-lg', original: 'text-sm' },
    lg: { price: 'text-2xl', original: 'text-lg' },
  };

  const formattedPrice = new Intl.NumberFormat('tr-TR', { 
    style: 'currency', 
    currency: 'TRY', 
    minimumFractionDigits: 0 
  }).format(price);

  const formattedOriginal = hasDiscount 
    ? new Intl.NumberFormat('tr-TR', { 
        style: 'currency', 
        currency: 'TRY', 
        minimumFractionDigits: 0 
      }).format(originalPrice)
    : null;

  return (
    <div className={`flex flex-col ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`font-bold text-orange-600 ${sizeClasses[size].price}`}>
          {formattedPrice}
        </span>
        {hasDiscount && (
          <span className={`text-gray-400 line-through ${sizeClasses[size].original}`}>
            {formattedOriginal}
          </span>
        )}
      </div>
      {hasDiscount && showBadge && (
        <Badge className="w-fit mt-1 bg-red-100 text-red-700 hover:bg-red-100 border-0 text-xs">
          %{discountPercent} İndirim
        </Badge>
      )}
    </div>
  );
}
