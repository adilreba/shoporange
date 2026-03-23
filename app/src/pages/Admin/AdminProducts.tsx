import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search,
  MoreHorizontal,
  Image as ImageIcon,
  Package,
  ArrowUpDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/services/api';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  stock: number;
  images: string[];
  rating?: number;
  reviews?: number;
  createdAt: string;
}

const categories = [
  { id: 'all', name: 'Tümü' },
  { id: 'living-room', name: 'Oturma Odası' },
  { id: 'bedroom', name: 'Yatak Odası' },
  { id: 'dining-room', name: 'Yemek Odası' },
  { id: 'kitchen', name: 'Mutfak' },
  { id: 'office', name: 'Ofis' },
  { id: 'outdoor', name: 'Bahçe' },
  { id: 'lighting', name: 'Aydınlatma' },
  { id: 'decor', name: 'Dekorasyon' },
  { id: 'electronics', name: 'Elektronik' },
];

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'stock' | 'date'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      // MOCK DATA - API CORS çözülünce değiştirilecek
      setProducts([
        { id: 'PROD-001', name: 'Modern Koltuk Takımı', description: 'Lüks koltuk', price: 15000, category: 'living-room', stock: 10, images: ['https://via.placeholder.com/150'], createdAt: new Date().toISOString() },
        { id: 'PROD-002', name: 'Yemek Masası', description: 'Ahşap masa', price: 8500, category: 'dining-room', stock: 5, images: ['https://via.placeholder.com/150'], createdAt: new Date().toISOString() },
        { id: 'PROD-003', name: 'Çalışma Sandalyesi', description: 'Ergonomik', price: 3500, category: 'office', stock: 15, images: [], createdAt: new Date().toISOString() },
        { id: 'PROD-004', name: 'Avize', description: 'Modern LED avize', price: 2800, category: 'lighting', stock: 8, images: ['https://via.placeholder.com/150'], createdAt: new Date().toISOString() },
        { id: 'PROD-005', name: 'Kitaplık', description: '5 raflı kitaplık', price: 4500, category: 'office', stock: 0, images: [], createdAt: new Date().toISOString() },
      ]);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error('Ürünler yüklenirken hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Bu ürünü silmek istediğinize emin misiniz?')) return;
    
    try {
      await api.delete(`/admin/products/${productId}`);
      toast.success('Ürün silindi');
      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Ürün silinirken hata oluştu');
    }
  };

  // Filter and sort products
  const filteredProducts = products
    .filter(product => {
      const matchesSearch = product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = (a.name || '').localeCompare(b.name || '');
          break;
        case 'price':
          comparison = (a.price || 0) - (b.price || 0);
          break;
        case 'stock':
          comparison = (a.stock || 0) - (b.stock || 0);
          break;
        case 'date':
          comparison = new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
          break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const getStockBadge = (stock: number) => {
    if (stock === 0) return <Badge className="bg-red-500">Tükendi</Badge>;
    if (stock < 10) return <Badge className="bg-yellow-500">Az Stok</Badge>;
    return <Badge className="bg-green-500">Stokta</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ürün Yönetimi</h1>
          <p className="text-sm text-gray-500">{filteredProducts.length} ürün</p>
        </div>
        <Link to="/admin/products/new">
          <Button className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Ürün Ekle
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Ürün ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Kategori" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-full md:w-40">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sırala" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Tarih</SelectItem>
                <SelectItem value="name">İsim</SelectItem>
                <SelectItem value="price">Fiyat</SelectItem>
                <SelectItem value="stock">Stok</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑ Artan' : '↓ Azalan'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ürün</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>Fiyat</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Durum</TableHead>
                <TableHead className="text-right">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto"></div>
                  </TableCell>
                </TableRow>
              ) : filteredProducts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                    <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>Ürün bulunamadı</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.images?.[0] ? (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center">
                            <ImageIcon className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-sm text-gray-500 line-clamp-1 max-w-xs">
                            {product.description}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {categories.find(c => c.id === product.category)?.name || product.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ₺{product.price?.toLocaleString()}
                    </TableCell>
                    <TableCell>{product.stock}</TableCell>
                    <TableCell>{getStockBadge(product.stock)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link to={`/admin/products/${product.id}/edit`}>
                              <Pencil className="w-4 h-4 mr-2" />
                              Düzenle
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDelete(product.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Sil
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
