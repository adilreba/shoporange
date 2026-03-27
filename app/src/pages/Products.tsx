import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  Grid3X3,
  LayoutList,
  X,
  Filter,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { SEO } from '@/components/common/SEO';
import { ProductCard } from '@/components/product/ProductCard';
import { cn } from '@/lib/utils';
import { ProductGridSkeleton } from '@/components/product/ProductCardSkeleton';
import { products as mockProducts, categories, brands, subcategories } from '@/data/mockData';
import { productsApi } from '@/services/api';
import type { Product } from '@/types';


const sortOptions = [
  { value: 'popular', label: 'Popülerlik' },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'newest', label: 'En Yeniler' },
  { value: 'rating', label: 'En Yüksek Puan' },
  { value: 'discount', label: 'İndirimli Ürünler' }
];

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    searchParams.get('category') ? [searchParams.get('category')!] : []
  );
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>(
    searchParams.get('subcategory') ? [searchParams.get('subcategory')!] : []
  );
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [selectedRatings, setSelectedRatings] = useState<number[]>([]);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [isLoading, setIsLoading] = useState(true);
  
  // API state
  const [products, setProducts] = useState<Product[]>([]);
  const [apiError] = useState<string | null>(null);

  // Ürünleri yükle - Başlangıçta mock verileri hemen göster
  useEffect(() => {
    // Başlangıçta mock verileri hemen yükle (facets hesaplanabilmesi için)
    setProducts(mockProducts);
    setIsLoading(false);
    
    // API'den veri çekmeyi dene (arka planda)
    const fetchProducts = async () => {
      try {
        const data = await productsApi.getAll({
          category: selectedCategories[0] || undefined,
          search: searchQuery || undefined,
          limit: 100
        });
        
        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          setProducts(data.products);
        }
      } catch (error) {
        console.error('API error, using mock data:', error);
        // Zaten mock veriler yüklü, hata göstermeye gerek yok
      }
    };

    fetchProducts();
  }, [selectedCategories, searchQuery]);

  // URL parametreleri değiştiğinde state'leri güncelle
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    const subcategoryParam = searchParams.get('subcategory');
    const searchParam = searchParams.get('search') || '';
    
    setSelectedCategories(categoryParam ? [categoryParam] : []);
    setSelectedSubcategories(subcategoryParam ? [subcategoryParam] : []);
    setSearchQuery(searchParam);
  }, [searchParams]);

  // Facets - Dinamik ürün sayıları
  const facets = useMemo(() => {
    // Her facet kendi filtresi HARİÇ tüm filtreler uygulanarak hesaplanır
    
    // Kategori facet'leri - SADECE kategori filtresi hariç
    const baseFiltersForCategories = (p: typeof products[0]) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) ||
              p.tags?.some(tag => tag.toLowerCase().includes(query)))) return false;
      }
      // KATEGORİ filtresi HARİÇ - diğer tüm filtreler dahil
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(p.subcategory || '')) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (selectedRatings.length > 0) {
        const minSelectedRating = Math.min(...selectedRatings);
        if (p.rating < minSelectedRating) return false;
      }
      if (onlyDiscount && (!p.discount || p.discount <= 0)) return false;
      if (onlyInStock && p.stock <= 0) return false;
      return true;
    };
    const baseProductsForCategories = products.filter(baseFiltersForCategories);
    const categoryCounts: Record<string, number> = {};
    categories.forEach(cat => {
      categoryCounts[cat.id] = baseProductsForCategories.filter(p => p.category === cat.id).length;
    });

    // Marka facet'leri - SADECE marka filtresi hariç
    const baseFiltersForBrands = (p: typeof products[0]) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) ||
              p.tags?.some(tag => tag.toLowerCase().includes(query)))) return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(p.subcategory || '')) return false;
      // MARKA filtresi HARİÇ
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (selectedRatings.length > 0) {
        const minSelectedRating = Math.min(...selectedRatings);
        if (p.rating < minSelectedRating) return false;
      }
      if (onlyDiscount && (!p.discount || p.discount <= 0)) return false;
      if (onlyInStock && p.stock <= 0) return false;
      return true;
    };
    const baseProductsForBrands = products.filter(baseFiltersForBrands);
    const brandCounts: Record<string, number> = {};
    brands.forEach(brand => {
      brandCounts[brand] = baseProductsForBrands.filter(p => p.brand === brand).length;
    });

    // Fiyat aralığı facet'leri - SADECE fiyat filtresi hariç
    const baseFiltersForPrice = (p: typeof products[0]) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) ||
              p.tags?.some(tag => tag.toLowerCase().includes(query)))) return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(p.subcategory || '')) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      // FİYAT filtresi HARİÇ
      if (selectedRatings.length > 0) {
        const minSelectedRating = Math.min(...selectedRatings);
        if (p.rating < minSelectedRating) return false;
      }
      if (onlyDiscount && (!p.discount || p.discount <= 0)) return false;
      if (onlyInStock && p.stock <= 0) return false;
      return true;
    };
    const baseProductsForPrice = products.filter(baseFiltersForPrice);
    
    const priceRanges = [
      { label: '0 - 1.000 TL', min: 0, max: 1000 },
      { label: '1.000 - 5.000 TL', min: 1000, max: 5000 },
      { label: '5.000 - 10.000 TL', min: 5000, max: 10000 },
      { label: '10.000 - 25.000 TL', min: 10000, max: 25000 },
      { label: '25.000 TL+', min: 25000, max: Infinity },
    ];
    const priceRangeCounts: Record<string, number> = {};
    priceRanges.forEach(range => {
      priceRangeCounts[range.label] = baseProductsForPrice.filter(
        p => p.price >= range.min && p.price < range.max
      ).length;
    });

    // Puan facet'leri - SADECE puan filtresi hariç
    const baseFiltersForRatings = (p: typeof products[0]) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) ||
              p.tags?.some(tag => tag.toLowerCase().includes(query)))) return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(p.subcategory || '')) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      // PUAN filtresi HARİÇ
      if (onlyDiscount && (!p.discount || p.discount <= 0)) return false;
      if (onlyInStock && p.stock <= 0) return false;
      return true;
    };
    const baseProductsForRatings = products.filter(baseFiltersForRatings);
    
    const ratingCounts: Record<number, number> = {};
    [5, 4, 3, 2, 1].forEach(rating => {
      ratingCounts[rating] = baseProductsForRatings.filter(p => p.rating >= rating).length;
    });

    // İndirim ve stok - tüm filtreler uygulanarak (kendi filtreleri dışında)
    const baseFiltersForOthers = (p: typeof products[0]) => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (!(p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query) ||
              p.category.toLowerCase().includes(query) || p.description.toLowerCase().includes(query) ||
              p.tags?.some(tag => tag.toLowerCase().includes(query)))) return false;
      }
      if (selectedCategories.length > 0 && !selectedCategories.includes(p.category)) return false;
      if (selectedSubcategories.length > 0 && !selectedSubcategories.includes(p.subcategory || '')) return false;
      if (selectedBrands.length > 0 && !selectedBrands.includes(p.brand)) return false;
      if (p.price < priceRange[0] || p.price > priceRange[1]) return false;
      if (selectedRatings.length > 0) {
        const minSelectedRating = Math.min(...selectedRatings);
        if (p.rating < minSelectedRating) return false;
      }
      // İNDİRİM ve STOK filtreleri HARİÇ
      return true;
    };
    const baseProductsForOthers = products.filter(baseFiltersForOthers);
    
    const discountCount = baseProductsForOthers.filter(p => p.discount && p.discount > 0).length;
    const inStockCount = baseProductsForOthers.filter(p => p.stock > 0).length;

    return {
      categoryCounts,
      brandCounts,
      priceRangeCounts,
      ratingCounts,
      discountCount,
      inStockCount,
    };
  }, [searchQuery, selectedCategories, selectedSubcategories, selectedBrands, priceRange, selectedRatings, onlyDiscount, onlyInStock]);

  const filteredProducts = useMemo(() => {
    let result = [...products];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    if (selectedCategories.length > 0) {
      result = result.filter(p => selectedCategories.includes(p.category));
    }

    if (selectedSubcategories.length > 0) {
      result = result.filter(p => selectedSubcategories.includes(p.subcategory || ''));
    }

    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (selectedRatings.length > 0) {
      // En düşük seçilen puandan yüksek olanları göster
      const minSelectedRating = Math.min(...selectedRatings);
      result = result.filter(p => p.rating >= minSelectedRating);
    }

    if (onlyDiscount) {
      result = result.filter(p => p.discount && p.discount > 0);
    }

    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    switch (sortBy) {
      case 'price-asc':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'discount':
        result.sort((a, b) => {
          const discountA = a.discount || 0;
          const discountB = b.discount || 0;
          return discountB - discountA;
        });
        break;
    }

    return result;
  }, [searchQuery, selectedCategories, selectedSubcategories, selectedBrands, priceRange, selectedRatings, onlyDiscount, onlyInStock, sortBy]);

  // Did you mean? - Benzer kelime önerileri
  const suggestions = useMemo(() => {
    if (!searchQuery || filteredProducts.length > 0) return [];
    
    const query = searchQuery.toLowerCase();
    const allTerms = [
      ...categories.map(c => c.name),
      ...brands,
      ...products.flatMap(p => p.tags || []),
      ...products.map(p => p.name.split(' ')[0]),
    ];
    
    const similar = allTerms.filter(term => {
      const termLower = term.toLowerCase();
      return termLower.length >= 3 && (
        termLower.slice(0, 3) === query.slice(0, 3) ||
        query.slice(0, 3) === termLower.slice(0, 3)
      ) && termLower !== query;
    });
    
    return [...new Set(similar)].slice(0, 3);
  }, [searchQuery, filteredProducts.length]);

  const activeFiltersCount = [
    ...selectedCategories,
    ...selectedSubcategories,
    ...selectedBrands,
    priceRange[0] > 0 || priceRange[1] < 100000 ? 'price' : null,
    selectedRatings.length > 0 ? 'rating' : null,
    onlyDiscount ? 'discount' : null,
    onlyInStock ? 'stock' : null
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedSubcategories([]);
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setSelectedRatings([]);
    setOnlyDiscount(false);
    setOnlyInStock(false);
    setSearchQuery('');
    setSearchParams({});
  };

  const toggleBrand = (brand: string) => {
    setSelectedBrands(prev =>
      prev.includes(brand)
        ? prev.filter(b => b !== brand)
        : [...prev, brand]
    );
  };

  // Kategori seçildiğinde çoklu seçim yap
  const toggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      const newCategories = prev.includes(categoryId)
        ? prev.filter(c => c !== categoryId)
        : [...prev, categoryId];
      
      // URL'yi güncelle (ilk seçili kategori)
      const params = new URLSearchParams(searchParams);
      if (newCategories.length > 0) {
        params.set('category', newCategories[0]);
      } else {
        params.delete('category');
      }
      setSearchParams(params);
      
      return newCategories;
    });
  };

  // Alt kategori seçildiğinde çoklu seçim yap
  const toggleSubcategory = (sub: string) => {
    setSelectedSubcategories(prev => {
      const newSubcategories = prev.includes(sub)
        ? prev.filter(s => s !== sub)
        : [...prev, sub];
      
      // URL'yi güncelle (ilk seçili alt kategori)
      const params = new URLSearchParams(searchParams);
      if (newSubcategories.length > 0) {
        params.set('subcategory', newSubcategories[0]);
      } else {
        params.delete('subcategory');
      }
      setSearchParams(params);
      
      return newSubcategories;
    });
  };

  // Highlight search query in text
  const highlightText = (text: string, query: string) => {
    if (!query.trim()) return text;
    
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={i} className="bg-orange-200 text-orange-900 px-0.5 rounded">{part}</mark>
      ) : part
    );
  };

  const FilterContent = (props: { compact?: boolean }) => {
    const compact = props.compact || false;
    return (
    <div className={cn("space-y-5 pb-5", compact && "space-y-4 pb-4")}>
      <div className="border-b border-border pb-3">
        <h4 className="font-semibold mb-2 text-foreground text-sm">Kategoriler</h4>
        <div className="space-y-1.5">
          {categories.map(cat => {
            const count = facets.categoryCounts[cat.id] || 0;
            const isDisabled = count === 0 && !selectedCategories.includes(cat.id);
            return (
              <label 
                key={cat.id} 
                className={cn(
                  "flex items-center gap-1.5 cursor-pointer group",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Checkbox
                  checked={selectedCategories.includes(cat.id)}
                  onCheckedChange={() => !isDisabled && toggleCategory(cat.id)}
                  disabled={isDisabled}
                  className={cn("border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500", compact ? "!w-2 !h-2" : "!w-6 !h-6")}
                />
                <span className={cn(
                  "text-sm group-hover:text-orange-600 transition-colors",
                  isDisabled ? "text-muted-foreground" : "text-foreground"
                )}>{cat.name}</span>
                <span className={cn(
                  "text-xs ml-auto px-2 py-0.5 rounded-full",
                  count > 0 ? "bg-muted text-muted-foreground" : "bg-gray-100 text-gray-400"
                )}>{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Alt Kategoriler - Tüm seçili kategorilerin alt kategorilerini göster */}
      {selectedCategories.length > 0 && (
        <div className="border-b border-border pb-3">
          <h4 className="font-semibold mb-2 text-foreground text-sm">Alt Kategoriler</h4>
          <div className="space-y-1.5 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
            {selectedCategories.flatMap(catId => 
              subcategories[catId as keyof typeof subcategories] || []
            ).filter((sub, index, self) => self.indexOf(sub) === index) // Benzersiz
              .map(sub => (
                <label key={sub} className="flex items-center gap-1.5 cursor-pointer group">
                  <Checkbox
                    checked={selectedSubcategories.includes(sub)}
                    onCheckedChange={() => toggleSubcategory(sub)}
                    className={cn("border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500", compact ? "!w-2 !h-2" : "!w-6 !h-6")}
                  />
                  <span className="text-sm text-foreground group-hover:text-orange-600 transition-colors">{sub}</span>
                </label>
              ))
            }
          </div>
        </div>
      )}

      <div className="border-b border-border pb-3">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-foreground text-sm">Fiyat Aralığı</h4>
          {(priceRange[0] > 0 || priceRange[1] < 100000) && (
            <button 
              onClick={() => setPriceRange([0, 100000])}
              className="text-xs text-orange-500 hover:text-orange-600 hover:underline"
            >
              Temizle
            </button>
          )}
        </div>
        <div className="px-1">
          <Slider
            value={priceRange}
            onValueChange={(value) => setPriceRange(value as [number, number])}
            max={100000}
            step={1000}
            className="mb-4"
          />
        </div>
        {/* Manuel Fiyat Girişi */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₺</span>
            <input
              type="number"
              min={0}
              max={100000}
              defaultValue={priceRange[0]}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value <= priceRange[1]) {
                  setPriceRange([value, priceRange[1]]);
                } else {
                  // Geçersiz değerse eski değeri geri yaz
                  e.target.value = priceRange[0].toString();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full pl-5 pr-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Min"
            />
          </div>
          <span className="text-gray-400">-</span>
          <div className="relative flex-1">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm">₺</span>
            <input
              type="number"
              min={0}
              max={100000}
              defaultValue={priceRange[1]}
              onBlur={(e) => {
                const value = parseInt(e.target.value) || 0;
                if (value >= priceRange[0]) {
                  setPriceRange([priceRange[0], value]);
                } else {
                  // Geçersiz değerse eski değeri geri yaz
                  e.target.value = priceRange[1].toString();
                }
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-full pl-5 pr-2 py-1.5 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Max"
            />
          </div>
        </div>
      </div>

      <div className="border-b border-border pb-3">
        <h4 className="font-semibold mb-2 text-foreground text-sm">Markalar</h4>
        <div className="space-y-1.5 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {brands.map(brand => {
            const count = facets.brandCounts[brand] || 0;
            const isDisabled = count === 0 && !selectedBrands.includes(brand);
            return (
              <label 
                key={brand} 
                className={cn(
                  "flex items-center gap-1.5 cursor-pointer group",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Checkbox
                  checked={selectedBrands.includes(brand)}
                  onCheckedChange={() => !isDisabled && toggleBrand(brand)}
                  disabled={isDisabled}
                  className={cn("border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500", compact ? "!w-2 !h-2" : "!w-6 !h-6")}
                />
                <span className={cn(
                  "text-sm flex-1 group-hover:text-orange-600 transition-colors",
                  isDisabled ? "text-muted-foreground" : "text-foreground"
                )}>{brand}</span>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  count > 0 ? "bg-muted text-muted-foreground" : "bg-gray-100 text-gray-400"
                )}>{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div className="border-b border-border pb-3">
        <h4 className="font-semibold mb-2 text-foreground text-sm">Puan Aralığı</h4>
        <div className="space-y-1.5">
          {[5, 4, 3, 2, 1].map(rating => {
            const count = facets.ratingCounts[rating] || 0;
            const isDisabled = count === 0 && !selectedRatings.includes(rating);
            return (
              <label 
                key={rating} 
                className={cn(
                  "flex items-center gap-1.5 cursor-pointer group",
                  isDisabled && "opacity-50 cursor-not-allowed"
                )}
              >
                <Checkbox
                  checked={selectedRatings.includes(rating)}
                  onCheckedChange={() => {
                    if (isDisabled) return;
                    setSelectedRatings(prev => 
                      prev.includes(rating) 
                        ? prev.filter(r => r !== rating)
                        : [...prev, rating]
                    );
                  }}
                  disabled={isDisabled}
                  className={cn("border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500", compact ? "!w-2 !h-2" : "!w-6 !h-6")}
                />
                <div className="flex items-center gap-0.5 flex-1">
                  {[...Array(5)].map((_, i) => (
                    <span key={i} className={`text-sm ${i < rating ? 'text-amber-400' : 'text-gray-200'}`}>
                      ★
                    </span>
                  ))}
                </div>
                <span className={cn(
                  "text-xs px-2 py-0.5 rounded-full",
                  count > 0 ? "bg-muted text-muted-foreground" : "bg-gray-100 text-gray-400"
                )}>{count}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-2 text-foreground text-sm">Diğer Filtreler</h4>
        <div className="space-y-2">
          <label className={cn(
            "flex items-center gap-1.5 cursor-pointer group",
            facets.discountCount === 0 && !onlyDiscount && "opacity-50 cursor-not-allowed"
          )}>
            <Checkbox
              checked={onlyDiscount}
              onCheckedChange={(checked) => facets.discountCount > 0 && setOnlyDiscount(checked as boolean)}
              disabled={facets.discountCount === 0 && !onlyDiscount}
              className={cn("border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500", compact ? "!w-2 !h-2" : "!w-6 !h-6")}
            />
            <span className="text-sm text-foreground group-hover:text-orange-600 transition-colors flex-1">Sadece İndirimli</span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              facets.discountCount > 0 ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-400"
            )}>{facets.discountCount}</span>
          </label>
          <label className={cn(
            "flex items-center gap-1.5 cursor-pointer group",
            facets.inStockCount === 0 && !onlyInStock && "opacity-50 cursor-not-allowed"
          )}>
            <Checkbox
              checked={onlyInStock}
              onCheckedChange={(checked) => facets.inStockCount > 0 && setOnlyInStock(checked as boolean)}
              disabled={facets.inStockCount === 0 && !onlyInStock}
              className={cn("border-gray-300 data-[state=checked]:bg-orange-500 data-[state=checked]:border-orange-500", compact ? "!w-2 !h-2" : "!w-6 !h-6")}
            />
            <span className="text-sm text-foreground group-hover:text-orange-600 transition-colors flex-1">Sadece Stokta</span>
            <span className={cn(
              "text-xs px-2 py-0.5 rounded-full",
              facets.inStockCount > 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"
            )}>{facets.inStockCount}</span>
          </label>
        </div>
      </div>
    </div>
  );
  };

  const pageTitle = searchQuery 
    ? `"${searchQuery}" Arama Sonuçları`
    : selectedCategories.length > 0 
      ? selectedCategories.map(id => categories.find(c => c.id === id)?.name).join(', ') || 'Ürünler'
      : 'Tüm Ürünler';

  const pageDescription = selectedCategories.length > 0
    ? `${selectedCategories.map(id => categories.find(c => c.id === id)?.name).join(', ')} kategorilerinde ${filteredProducts.length} ürün bulunuyor.`
    : `AtusHome'da ${filteredProducts.length} ürün arasından size uygun olanı bulun. Elektronik, moda, ev yaşam ve daha fazlası.`;

  return (
    <div className="min-h-screen bg-background">
      <SEO 
        title={pageTitle}
        description={pageDescription}
        keywords={`${selectedCategories.join(', ') || 'tüm ürünler'}, e-ticaret, alışveriş, online mağaza`}
      />
      <Header />

      <main className="container-custom pt-[42px] pb-6 sm:pt-[42px] sm:pb-8 px-4 sm:px-6 lg:px-8">
        {/* Title & Did You Mean */}
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">
            {searchQuery ? (
              <span>"{highlightText(searchQuery, searchQuery)}" Arama Sonuçları</span>
            ) : selectedCategories.length > 0 ? (
              selectedCategories.map(id => categories.find(c => c.id === id)?.name).join(', ')
            ) : 'Tüm Ürünler'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {filteredProducts.length} ürün bulundu
          </p>
          
          {/* Did you mean? */}
          {suggestions.length > 0 && (
            <div className="mt-3 flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Bunu mu demiştiniz?</span>
              {suggestions.map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    const params = new URLSearchParams(searchParams);
                    params.set('search', suggestion);
                    setSearchParams(params);
                  }}
                  className="text-orange-600 hover:text-orange-700 underline font-medium"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6 p-3 sm:p-4 bg-muted rounded-xl">
          <div className="flex items-center gap-2 sm:gap-4">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden text-xs sm:text-sm h-9">
                  <Filter className="h-4 w-4 mr-1.5 sm:mr-2" />
                  Filtre
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-1.5 sm:ml-2 bg-orange-100 text-orange-700 text-xs">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] p-0">
                <div className="flex flex-col h-full">
                  <SheetHeader className="px-4 py-3 border-b border-border bg-card sticky top-0 z-10">
                    <div className="flex items-center justify-between">
                      <SheetTitle className="text-base font-semibold text-foreground">Filtreler</SheetTitle>
                      {activeFiltersCount > 0 && (
                        <button 
                          onClick={clearFilters}
                          className="text-xs text-red-500 hover:text-red-600"
                        >
                          Temizle
                        </button>
                      )}
                    </div>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-4 py-3">
                    <FilterContent compact />
                  </div>
                  <div className="px-4 py-3 border-t border-border bg-muted sticky bottom-0 safe-area-pb">
                    <Button
                      className="w-full gradient-orange h-11 text-sm"
                      onClick={() => setIsFilterOpen(false)}
                    >
                      {filteredProducts.length} Ürünü Göster
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              className="hidden lg:flex"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              {isFilterOpen ? 'Filtreleri Gizle' : 'Filtrele'}
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2 bg-orange-100 text-orange-700">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-red-500 hover:text-red-600 text-xs sm:text-sm"
              >
                <X className="h-4 w-4 mr-1" />
                Temizle
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 sm:gap-4 ml-auto">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground hidden sm:inline">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-lg px-2 sm:px-3 py-2 text-xs sm:text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none bg-background"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="hidden sm:flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={viewMode === 'grid' ? 'gradient-orange rounded-none h-9 w-9' : 'rounded-none h-9 w-9'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={viewMode === 'list' ? 'gradient-orange rounded-none h-9 w-9' : 'rounded-none h-9 w-9'}
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-6 lg:gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className={`hidden lg:block flex-shrink-0 transition-all duration-300 ${isFilterOpen ? 'w-64' : 'w-0 overflow-hidden'}`}>
            {isFilterOpen && (
              <div className="sticky top-24 bg-card rounded-xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                  <h3 className="font-semibold text-lg text-foreground">Filtreler</h3>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsFilterOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-500 hover:text-red-600 h-auto py-1 mb-3 -mt-1 text-xs"
                  >
                    Tümünü Temizle
                  </Button>
                )}
                <FilterContent />
              </div>
            )}
          </aside>

          {/* Products Grid */}
          <div className="flex-1 min-w-0">
            {apiError && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="h-5 w-5 flex-shrink-0" />
                  <p className="text-sm flex-1">{apiError}</p>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => window.location.reload()}
                    className="text-amber-800 hover:text-amber-900"
                  >
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Yenile
                  </Button>
                </div>
              </div>
            )}
            
            {filteredProducts.length === 0 ? (
              <div className="text-center py-12 sm:py-16">
                <div className="w-20 h-20 sm:w-24 sm:h-24 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                  Ürün Bulunamadı
                </h3>
                <p className="text-muted-foreground mb-6 text-sm">
                  Seçtiğiniz filtrelere uygun ürün bulunmuyor.
                </p>
                <Button onClick={clearFilters} variant="outline" size="sm">
                  Filtreleri Temizle
                </Button>
              </div>
            ) : isLoading ? (
              <ProductGridSkeleton count={8} />
            ) : (
              <div 
                className={`grid gap-[clamp(0.5rem,1.5vw,1rem)] ${viewMode === 'grid' ? '' : 'grid-cols-1'}`}
                style={viewMode === 'grid' ? {
                  gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 220px), 1fr))'
                } : undefined}
              >
                {filteredProducts.map(product => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant={viewMode === 'list' ? 'horizontal' : 'default'}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
