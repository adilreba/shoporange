import { useState } from 'react';
import { X, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCompareStore } from '@/stores/compareStore';
import { useCartStore } from '@/stores/cartStore';
import { toast } from 'sonner';
import type { Product } from '@/types';

interface CompareTableProps {
  products: Product[];
}

export function CompareTable({ products }: CompareTableProps) {
  const { removeFromCompare, clearCompare } = useCompareStore();
  const { addToCart } = useCartStore();
  const [expandedSpecs, setExpandedSpecs] = useState(true);

  if (products.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Karşılaştırma listeniz boş.</p>
      </div>
    );
  }

  const handleAddToCart = (product: Product) => {
    addToCart(product, 1);
    toast.success(`${product.name} sepete eklendi!`);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Get all unique specification keys
  const allSpecs = new Set<string>();
  products.forEach((p) => {
    if (p.features) {
      Object.keys(p.features).forEach((key) => allSpecs.add(key));
    }
  });
  const specKeys = Array.from(allSpecs);

  // Comparison rows
  const comparisonRows = [
    { label: 'Fiyat', key: 'price', render: (p: Product) => formatPrice(p.price) },
    { label: 'Marka', key: 'brand', render: (p: Product) => p.brand },
    { label: 'Kategori', key: 'category', render: (p: Product) => p.category },
    { label: 'Stok', key: 'stock', render: (p: Product) => `${p.stock} adet` },
    { label: 'Puan', key: 'rating', render: (p: Product) => `${p.rating} / 5` },
    { label: 'Değerlendirme', key: 'reviewCount', render: (p: Product) => `${p.reviewCount} yorum` },
    ...specKeys.map((key) => ({
      label: key,
      key: `spec_${key}`,
      render: (p: Product) => p.features?.[key] || '-',
    })),
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">
          Ürün Karşılaştırma ({products.length})
        </h2>
        <Button variant="outline" size="sm" onClick={clearCompare}>
          <X className="w-4 h-4 mr-1" />
          Tümünü Temizle
        </Button>
      </div>

      {/* Products Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}>
        <div className="font-medium text-muted-foreground">Özellik</div>
        {products.map((product) => (
          <div key={product.id} className="relative">
            <button
              onClick={() => removeFromCompare(product.id)}
              className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 z-10"
            >
              <X className="w-3 h-3" />
            </button>
            <Card>
              <CardContent className="p-4">
                <img
                  src={product.images[0]}
                  alt={product.name}
                  className="w-full h-32 object-cover rounded-lg mb-3"
                />
                <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                <p className="text-orange-600 font-bold mt-1">{formatPrice(product.price)}</p>
                <Button
                  size="sm"
                  className="w-full mt-3 gradient-orange"
                  onClick={() => handleAddToCart(product)}
                  disabled={product.stock === 0}
                >
                  Sepete Ekle
                </Button>
              </CardContent>
            </Card>
          </div>
        ))}
      </div>

      {/* Specifications Toggle */}
      <button
        onClick={() => setExpandedSpecs(!expandedSpecs)}
        className="flex items-center gap-2 text-orange-600 font-medium"
      >
        Teknik Özellikler
        {expandedSpecs ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {/* Specifications Table */}
      {expandedSpecs && (
        <div className="border rounded-lg overflow-hidden">
          {comparisonRows.map((row, index) => (
            <div
              key={row.key}
              className={`grid ${index % 2 === 0 ? 'bg-muted' : 'bg-card'}`}
              style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}
            >
              <div className="p-4 font-medium text-muted-foreground border-r">{row.label}</div>
              {products.map((product) => (
                <div key={product.id} className="p-4 border-r last:border-r-0">
                  {row.key === 'price' ? (
                    <span className="font-bold text-orange-600">{row.render(product)}</span>
                  ) : (
                    <span className="text-foreground">{row.render(product)}</span>
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {/* Badges Comparison */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `150px repeat(${products.length}, 1fr)` }}>
        <div className="font-medium text-muted-foreground">Özellikler</div>
        {products.map((product) => (
          <div key={product.id} className="flex flex-wrap gap-1">
            {product.isNew && <Badge className="bg-green-500">Yeni</Badge>}
            {product.isBestseller && <Badge className="bg-orange-500">Çok Satan</Badge>}
            {product.isFeatured && <Badge className="bg-blue-500">Öne Çıkan</Badge>}
            {product.discount && product.discount > 0 && (
              <Badge className="bg-red-500">%{product.discount} İndirim</Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
