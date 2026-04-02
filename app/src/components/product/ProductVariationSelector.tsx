import { useState, useEffect } from 'react';
import { Check, AlertCircle, Package } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  getProductAttributeOptions, 
  findVariationByAttributes,
  type ProductVariation,
  checkStock,
  formatPrice,
  calculateDiscount
} from '@/services/productVariationsApi';
import { toast } from 'sonner';

// Renk eşleştirme
const COLOR_MAP: Record<string, string> = {
  'Siyah': '#000000',
  'Beyaz': '#FFFFFF',
  'Kırmızı': '#FF0000',
  'Mavi': '#0000FF',
  'Yeşil': '#008000',
  'Sarı': '#FFFF00',
  'Pembe': '#FFC0CB',
  'Mor': '#800080',
  'Gri': '#808080',
  'Kahverengi': '#8B4513',
  'Bej': '#F5F5DC',
  'Gümüş': '#C0C0C0',
  'Altın': '#FFD700',
  'Turuncu': '#FFA500',
  'Lacivert': '#000080',
  'Şeffaf': 'transparent',
};

interface ProductVariationSelectorProps {
  productId: string;
  basePrice: number;
  onVariationChange?: (variation: ProductVariation | null, quantity: number) => void;
}

export function ProductVariationSelector({ 
  productId, 
  basePrice,
  onVariationChange 
}: ProductVariationSelectorProps) {
  const [loading, setLoading] = useState(true);
  const [attributeOptions, setAttributeOptions] = useState<Record<string, string[]>>({});
  const [selectedAttributes, setSelectedAttributes] = useState<Record<string, string>>({});
  const [currentVariation, setCurrentVariation] = useState<ProductVariation | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [stockStatus, setStockStatus] = useState({
    available: false,
    maxQuantity: 0,
    message: 'Lütfen özellik seçin',
  });

  // Load attribute options on mount
  useEffect(() => {
    loadAttributeOptions();
  }, [productId]);

  // Check variation when attributes change
  useEffect(() => {
    checkCurrentVariation();
  }, [selectedAttributes]);

  const loadAttributeOptions = async () => {
    try {
      setLoading(true);
      const data = await getProductAttributeOptions(productId);
      setAttributeOptions(data.attributeOptions);
    } catch (error) {
      console.error('Özellikler yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkCurrentVariation = async () => {
    // Check if all required attributes are selected
    const attributeKeys = Object.keys(attributeOptions);
    if (attributeKeys.length === 0) return;

    const selectedKeys = Object.keys(selectedAttributes).filter(
      key => selectedAttributes[key]
    );

    if (selectedKeys.length === 0) {
      setStockStatus({
        available: false,
        maxQuantity: 0,
        message: 'Lütfen özellik seçin',
      });
      setCurrentVariation(null);
      onVariationChange?.(null, quantity);
      return;
    }

    // Find matching variation
    try {
      const variation = await findVariationByAttributes(productId, selectedAttributes);
      setCurrentVariation(variation);
      
      if (variation) {
        const status = checkStock(variation, quantity);
        setStockStatus(status);
        onVariationChange?.(variation, quantity);
      } else {
        setStockStatus({
          available: false,
          maxQuantity: 0,
          message: 'Seçilen özelliklerde ürün bulunamadı',
        });
        onVariationChange?.(null, quantity);
      }
    } catch (error) {
      console.error('Varyasyon kontrolü hatası:', error);
    }
  };

  const handleAttributeSelect = (attributeName: string, value: string) => {
    setSelectedAttributes(prev => ({
      ...prev,
      [attributeName]: prev[attributeName] === value ? '' : value,
    }));
  };

  const handleQuantityChange = (delta: number) => {
    const newQuantity = quantity + delta;
    if (newQuantity < 1) return;
    if (stockStatus.maxQuantity > 0 && newQuantity > stockStatus.maxQuantity) {
      toast.error(`En fazla ${stockStatus.maxQuantity} adet seçebilirsiniz`);
      return;
    }
    setQuantity(newQuantity);
    onVariationChange?.(currentVariation, newQuantity);
  };

  // Render color option
  const renderColorOption = (attributeName: string, option: string) => {
    const isSelected = selectedAttributes[attributeName] === option;
    const colorCode = COLOR_MAP[option] || '#ccc';
    
    return (
      <button
        key={option}
        type="button"
        onClick={() => handleAttributeSelect(attributeName, option)}
        className={`group relative flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
          isSelected 
            ? 'border-orange-500 bg-orange-50' 
            : 'border-gray-200 hover:border-orange-300 bg-white'
        }`}
      >
        <span 
          className="w-10 h-10 rounded-full border-2 border-gray-200 shadow-sm"
          style={{ 
            backgroundColor: colorCode,
            backgroundImage: colorCode === 'transparent' 
              ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)' 
              : undefined,
            backgroundSize: colorCode === 'transparent' ? '8px 8px' : undefined,
          }}
        />
        <span className="text-xs font-medium">{option}</span>
        {isSelected && (
          <span className="absolute top-1 right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </span>
        )}
      </button>
    );
  };

  // Render select option
  const renderSelectOption = (attributeName: string, option: string) => {
    const isSelected = selectedAttributes[attributeName] === option;
    
    return (
      <button
        key={option}
        type="button"
        onClick={() => handleAttributeSelect(attributeName, option)}
        className={`px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
          isSelected 
            ? 'border-orange-500 bg-orange-50 text-orange-700' 
            : 'border-gray-200 hover:border-orange-300 bg-white text-gray-700'
        }`}
      >
        {option}
      </button>
    );
  };

  // Determine attribute type (color or select)
  const isColorAttribute = (attributeName: string) => {
    return attributeName.toLowerCase().includes('renk');
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="flex gap-2">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-12 w-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // If no attribute options, show simple stock info
  if (Object.keys(attributeOptions).length === 0) {
    return null;
  }

  const displayPrice = currentVariation?.price || basePrice;
  const discount = currentVariation?.compareAtPrice 
    ? calculateDiscount(displayPrice, currentVariation.compareAtPrice)
    : 0;

  return (
    <div className="space-y-6">
      {/* Price Display */}
      {currentVariation && (
        <div className="flex items-baseline gap-3 p-4 bg-orange-50 rounded-xl">
          <span className="text-3xl font-bold text-orange-600">
            {formatPrice(displayPrice)}
          </span>
          {discount > 0 && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(currentVariation.compareAtPrice!)}
              </span>
              <Badge className="bg-red-500 text-white">%{discount} İndirim</Badge>
            </>
          )}
        </div>
      )}

      {/* Attribute Selectors */}
      {Object.entries(attributeOptions).map(([attributeName, options]) => (
        <div key={attributeName} className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-gray-900">
              {attributeName}
              {selectedAttributes[attributeName] && (
                <span className="ml-2 text-sm font-normal text-orange-600">
                  : {selectedAttributes[attributeName]}
                </span>
              )}
            </label>
            {selectedAttributes[attributeName] && (
              <button
                type="button"
                onClick={() => handleAttributeSelect(attributeName, '')}
                className="text-xs text-gray-500 hover:text-orange-600"
              >
                Temizle
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {isColorAttribute(attributeName)
              ? options.map(option => renderColorOption(attributeName, option))
              : options.map(option => renderSelectOption(attributeName, option))
            }
          </div>
        </div>
      ))}

      {/* Stock Status */}
      <div className={`flex items-center gap-3 p-4 rounded-xl ${
        stockStatus.available 
          ? 'bg-green-50 border border-green-200' 
          : 'bg-amber-50 border border-amber-200'
      }`}>
        {stockStatus.available ? (
          <>
            <Package className="w-5 h-5 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{stockStatus.message}</p>
              {stockStatus.maxQuantity > 0 && (
                <p className="text-sm text-green-600">
                  En fazla {stockStatus.maxQuantity} adet seçebilirsiniz
                </p>
              )}
            </div>
          </>
        ) : (
          <>
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <p className="font-medium text-amber-800">{stockStatus.message}</p>
          </>
        )}
      </div>

      {/* Quantity Selector */}
      {stockStatus.available && (
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-700">Adet:</span>
          <div className="flex items-center border-2 border-gray-200 rounded-xl">
            <button
              type="button"
              onClick={() => handleQuantityChange(-1)}
              className="px-4 py-2 hover:bg-gray-100 transition-colors"
              disabled={quantity <= 1}
            >
              -
            </button>
            <span className="w-12 text-center font-semibold">{quantity}</span>
            <button
              type="button"
              onClick={() => handleQuantityChange(1)}
              className="px-4 py-2 hover:bg-gray-100 transition-colors"
              disabled={quantity >= stockStatus.maxQuantity}
            >
              +
            </button>
          </div>
        </div>
      )}

      {/* SKU Display */}
      {currentVariation?.sku && (
        <p className="text-sm text-gray-500">
          Ürün Kodu: <span className="font-mono">{currentVariation.sku}</span>
        </p>
      )}
    </div>
  );
}
