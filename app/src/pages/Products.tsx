import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  SlidersHorizontal, 
  Grid3X3, 
  LayoutList, 
  X,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { ProductCard } from '@/components/product/ProductCard';
import { products, categories, brands, subcategories } from '@/data/mockData';
import type { Category } from '@/types';

const sortOptions = [
  { value: 'popular', label: 'Popülerlik' },
  { value: 'price-asc', label: 'Fiyat: Düşükten Yükseğe' },
  { value: 'price-desc', label: 'Fiyat: Yüksekten Düşüğe' },
  { value: 'newest', label: 'En Yeniler' },
  { value: 'rating', label: 'En Yüksek Puan' }
];

export function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filters
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    searchParams.get('category') as Category || null
  );
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 100000]);
  const [minRating, setMinRating] = useState<number>(0);
  const [onlyDiscount, setOnlyDiscount] = useState(false);
  const [onlyInStock, setOnlyInStock] = useState(false);
  const [sortBy, setSortBy] = useState('popular');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');

  // Filter products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory) {
      result = result.filter(p => p.category === selectedCategory);
    }

    // Subcategory filter
    if (selectedSubcategory) {
      result = result.filter(p => p.subcategory === selectedSubcategory);
    }

    // Brand filter
    if (selectedBrands.length > 0) {
      result = result.filter(p => selectedBrands.includes(p.brand));
    }

    // Price filter
    result = result.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    // Rating filter
    if (minRating > 0) {
      result = result.filter(p => p.rating >= minRating);
    }

    // Discount filter
    if (onlyDiscount) {
      result = result.filter(p => p.discount && p.discount > 0);
    }

    // Stock filter
    if (onlyInStock) {
      result = result.filter(p => p.stock > 0);
    }

    // Sort
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
      default:
        // Popular - keep original order
        break;
    }

    return result;
  }, [searchQuery, selectedCategory, selectedSubcategory, selectedBrands, priceRange, minRating, onlyDiscount, onlyInStock, sortBy]);

  const activeFiltersCount = [
    selectedCategory,
    selectedSubcategory,
    ...selectedBrands,
    priceRange[0] > 0 || priceRange[1] < 100000 ? 'price' : null,
    minRating > 0 ? 'rating' : null,
    onlyDiscount ? 'discount' : null,
    onlyInStock ? 'stock' : null
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory(null);
    setSelectedSubcategory(null);
    setSelectedBrands([]);
    setPriceRange([0, 100000]);
    setMinRating(0);
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

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Filter Sidebar Content
  const FilterContent = () => (
    <div className="space-y-6">
      {/* Categories */}
      <div>
        <h4 className="font-semibold mb-3">Kategoriler</h4>
        <div className="space-y-2">
          {categories.map(cat => (
            <label key={cat.id} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedCategory === cat.id}
                onCheckedChange={() => {
                  setSelectedCategory(selectedCategory === cat.id ? null : cat.id);
                  setSelectedSubcategory(null);
                }}
              />
              <span className="text-sm">{cat.name}</span>
              <span className="text-xs text-gray-400 ml-auto">{cat.productCount}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Subcategories */}
      {selectedCategory && subcategories[selectedCategory] && (
        <div>
          <h4 className="font-semibold mb-3">Alt Kategoriler</h4>
          <div className="space-y-2">
            {subcategories[selectedCategory].map(sub => (
              <label key={sub} className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={selectedSubcategory === sub}
                  onCheckedChange={() => {
                    setSelectedSubcategory(selectedSubcategory === sub ? null : sub);
                  }}
                />
                <span className="text-sm">{sub}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price Range */}
      <div>
        <h4 className="font-semibold mb-3">Fiyat Aralığı</h4>
        <Slider
          value={priceRange}
          onValueChange={(value) => setPriceRange(value as [number, number])}
          max={100000}
          step={1000}
          className="mb-4"
        />
        <div className="flex items-center justify-between text-sm">
          <span>{formatPrice(priceRange[0])}</span>
          <span>{formatPrice(priceRange[1])}</span>
        </div>
      </div>

      {/* Brands */}
      <div>
        <h4 className="font-semibold mb-3">Markalar</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={selectedBrands.includes(brand)}
                onCheckedChange={() => toggleBrand(brand)}
              />
              <span className="text-sm">{brand}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Rating */}
      <div>
        <h4 className="font-semibold mb-3">Minimum Puan</h4>
        <div className="space-y-2">
          {[4, 3, 2, 1].map(rating => (
            <label key={rating} className="flex items-center gap-2 cursor-pointer">
              <Checkbox
                checked={minRating === rating}
                onCheckedChange={() => setMinRating(minRating === rating ? 0 : rating)}
              />
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} className={`text-sm ${i < rating ? 'text-amber-400' : 'text-gray-300'}`}>
                    ★
                  </span>
                ))}
                <span className="text-sm text-gray-500 ml-1">ve üzeri</span>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Other Filters */}
      <div>
        <h4 className="font-semibold mb-3">Diğer Filtreler</h4>
        <div className="space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={onlyDiscount}
              onCheckedChange={(checked) => setOnlyDiscount(checked as boolean)}
            />
            <span className="text-sm">Sadece İndirimli Ürünler</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={onlyInStock}
              onCheckedChange={(checked) => setOnlyInStock(checked as boolean)}
            />
            <span className="text-sm">Sadece Stoktakiler</span>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container-custom py-8">
        {/* Breadcrumb & Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span>Ana Sayfa</span>
            <span>/</span>
            <span className="text-gray-900">Ürünler</span>
            {selectedCategory && (
              <>
                <span>/</span>
                <span className="text-orange-600">
                  {categories.find(c => c.id === selectedCategory)?.name}
                </span>
              </>
            )}
          </div>
          <h1 className="text-3xl font-bold">
            {searchQuery ? `"${searchQuery}" Arama Sonuçları` : 
             selectedCategory ? categories.find(c => c.id === selectedCategory)?.name : 
             'Tüm Ürünler'}
          </h1>
          <p className="text-gray-500 mt-1">
            {filteredProducts.length} ürün bulundu
          </p>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-gray-50 rounded-xl">
          <div className="flex items-center gap-4">
            {/* Mobile Filter Button */}
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtrele
                  {activeFiltersCount > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 overflow-y-auto">
                <SheetHeader>
                  <SheetTitle>Filtreler</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>

            {/* Desktop Filter Button */}
            <Button 
              variant="outline" 
              className="hidden lg:flex"
              onClick={() => setIsFilterOpen(true)}
            >
              <SlidersHorizontal className="h-4 w-4 mr-2" />
              Filtrele
              {activeFiltersCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {activeFiltersCount}
                </Badge>
              )}
            </Button>

            {/* Clear Filters */}
            {activeFiltersCount > 0 && (
              <Button 
                variant="ghost" 
                size="sm"
                onClick={clearFilters}
                className="text-red-500 hover:text-red-600"
              >
                <X className="h-4 w-4 mr-1" />
                Filtreleri Temizle
              </Button>
            )}
          </div>

          <div className="flex items-center gap-4">
            {/* Sort */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 hidden sm:inline">Sırala:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
              >
                {sortOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* View Mode */}
            <div className="flex items-center border rounded-lg overflow-hidden">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="icon"
                className={viewMode === 'grid' ? 'gradient-orange rounded-none' : 'rounded-none'}
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="icon"
                className={viewMode === 'list' ? 'gradient-orange rounded-none' : 'rounded-none'}
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Sidebar Filters - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Filtreler</h3>
                {activeFiltersCount > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={clearFilters}
                    className="text-red-500 hover:text-red-600 h-auto py-1"
                  >
                    Temizle
                  </Button>
                )}
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Products Grid */}
          <div className="flex-1">
            {filteredProducts.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Filter className="h-10 w-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Ürün Bulunamadı
                </h3>
                <p className="text-gray-500 mb-6">
                  Seçtiğiniz filtrelere uygun ürün bulunmuyor.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Filtreleri Temizle
                </Button>
              </div>
            ) : (
              <div className={`grid gap-4 md:gap-6 ${
                viewMode === 'grid' 
                  ? 'grid-cols-2 md:grid-cols-3' 
                  : 'grid-cols-1'
              }`}>
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
