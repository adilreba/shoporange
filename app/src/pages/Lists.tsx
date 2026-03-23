import { useState } from 'react';
import { 
  Heart, 
  ShoppingCart, 
  Share2, 
  Trash2,
  Plus,
  Lock,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { toast } from 'sonner';

interface ListItem {
  id: string;
  productName: string;
  productImage: string;
  price: number;
  addedAt: string;
}

interface Wishlist {
  id: string;
  name: string;
  description: string;
  items: ListItem[];
  isPublic: boolean;
  createdAt: string;
  coverImage?: string;
}

const mockLists: Wishlist[] = [
  {
    id: 'LIST-001',
    name: 'Ev Dekorasyonu',
    description: 'Yeni evim için almayı planladığım ürünler',
    isPublic: true,
    createdAt: '2024-03-01',
    items: [
      { id: '1', productName: 'Modern Koltuk Takımı', productImage: 'https://via.placeholder.com/150', price: 15000, addedAt: '2024-03-15' },
      { id: '2', productName: 'Yemek Masası', productImage: 'https://via.placeholder.com/150', price: 8500, addedAt: '2024-03-14' },
      { id: '3', productName: 'Avize', productImage: 'https://via.placeholder.com/150', price: 2800, addedAt: '2024-03-13' },
    ]
  },
  {
    id: 'LIST-002',
    name: 'Ofis Alışverişi',
    description: 'Ev ofisi için gerekli ürünler',
    isPublic: false,
    createdAt: '2024-03-10',
    items: [
      { id: '4', productName: 'Çalışma Sandalyesi', productImage: 'https://via.placeholder.com/150', price: 3500, addedAt: '2024-03-12' },
      { id: '5', productName: 'Kitaplık', productImage: 'https://via.placeholder.com/150', price: 4500, addedAt: '2024-03-11' },
    ]
  },
  {
    id: 'LIST-003',
    name: 'Hediye Listem',
    description: 'Doğum günü hediyeleri',
    isPublic: true,
    createdAt: '2024-03-05',
    items: [
      { id: '6', productName: 'Dekoratif Vazo', productImage: 'https://via.placeholder.com/150', price: 450, addedAt: '2024-03-08' },
    ]
  }
];

export function Lists() {
  const [lists, setLists] = useState<Wishlist[]>(mockLists);
  const [selectedList, setSelectedList] = useState<Wishlist | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newList, setNewList] = useState({ name: '', description: '', isPublic: false });

  const handleDeleteList = (id: string) => {
    if (confirm('Bu listeyi silmek istediğinize emin misiniz?')) {
      setLists(lists.filter(l => l.id !== id));
      if (selectedList?.id === id) setSelectedList(null);
      toast.success('Liste silindi');
    }
  };

  const handleDeleteItem = (listId: string, itemId: string) => {
    setLists(lists.map(list => 
      list.id === listId 
        ? { ...list, items: list.items.filter(item => item.id !== itemId) }
        : list
    ));
    if (selectedList?.id === listId) {
      setSelectedList({
        ...selectedList,
        items: selectedList.items.filter(item => item.id !== itemId)
      });
    }
    toast.success('Ürün listeden kaldırıldı');
  };

  const handleCreateList = () => {
    if (!newList.name) {
      toast.error('Liste adı gerekli');
      return;
    }
    
    const list: Wishlist = {
      id: `LIST-${String(lists.length + 1).padStart(3, '0')}`,
      name: newList.name,
      description: newList.description,
      isPublic: newList.isPublic,
      createdAt: new Date().toISOString().split('T')[0],
      items: []
    };
    
    setLists([...lists, list]);
    setIsCreateOpen(false);
    setNewList({ name: '', description: '', isPublic: false });
    toast.success('Liste oluşturuldu');
  };

  const handleAddToCart = (item: ListItem) => {
    toast.success(`${item.productName} sepete eklendi`);
  };

  const totalValue = (list: Wishlist) => list.items.reduce((sum, item) => sum + item.price, 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Tüm Listem</h1>
            <p className="text-gray-600 dark:text-gray-400">Kaydettiğiniz ürün listelerinizi yönetin</p>
          </div>
          <Button onClick={() => setIsCreateOpen(true)} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Yeni Liste
          </Button>
        </div>

        {selectedList ? (
          /* Selected List Detail View */
          <div>
            <Button variant="ghost" onClick={() => setSelectedList(null)} className="mb-4">
              ← Listelere Dön
            </Button>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-2xl flex items-center gap-2">
                    {selectedList.name}
                    {selectedList.isPublic ? (
                      <Users className="w-5 h-5 text-green-500" />
                    ) : (
                      <Lock className="w-5 h-5 text-gray-400" />
                    )}
                  </CardTitle>
                  <p className="text-gray-500 mt-1">{selectedList.description}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    {selectedList.items.length} ürün • Toplam: ₺{totalValue(selectedList).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Share2 className="w-4 h-4 mr-2" />
                    Paylaş
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedList.items.length === 0 ? (
                  <div className="text-center py-12">
                    <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">Bu liste boş</p>
                    <Button onClick={() => window.location.href = '/products'} variant="outline" className="mt-4">
                      Ürün Ekle
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {selectedList.items.map((item) => (
                      <Card key={item.id} className="overflow-hidden">
                        <div className="aspect-video bg-gray-100">
                          <img
                            src={item.productImage}
                            alt={item.productName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-1">{item.productName}</h3>
                          <p className="text-lg font-bold text-orange-600">₺{item.price.toLocaleString()}</p>
                          <p className="text-xs text-gray-500 mb-3">Eklenme: {item.addedAt}</p>
                          <div className="flex gap-2">
                            <Button 
                              size="sm" 
                              className="flex-1 bg-orange-500 hover:bg-orange-600"
                              onClick={() => handleAddToCart(item)}
                            >
                              <ShoppingCart className="w-4 h-4 mr-1" />
                              Sepete Ekle
                            </Button>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleDeleteItem(selectedList.id, item.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Lists Grid View */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {lists.map((list) => (
              <Card 
                key={list.id} 
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setSelectedList(list)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {list.name}
                        {list.isPublic ? (
                          <Users className="w-4 h-4 text-green-500" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-400" />
                        )}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{list.description}</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteList(list.id);
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span>{list.items.length} ürün</span>
                    <span>•</span>
                    <span>₺{totalValue(list).toLocaleString()}</span>
                  </div>
                  {list.items.length > 0 && (
                    <div className="flex -space-x-2 mt-4">
                      {list.items.slice(0, 3).map((item) => (
                        <img
                          key={item.id}
                          src={item.productImage}
                          alt=""
                          className="w-10 h-10 rounded-full border-2 border-white object-cover"
                        />
                      ))}
                      {list.items.length > 3 && (
                        <div className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 flex items-center justify-center text-xs font-medium">
                          +{list.items.length - 3}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Create List Modal */}
        {isCreateOpen && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle>Yeni Liste Oluştur</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Liste Adı</label>
                  <Input
                    value={newList.name}
                    onChange={(e) => setNewList({...newList, name: e.target.value})}
                    placeholder="Örn: Ev Dekorasyonu"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Açıklama</label>
                  <textarea
                    value={newList.description}
                    onChange={(e) => setNewList({...newList, description: e.target.value})}
                    placeholder="Liste açıklaması..."
                    className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isPublic"
                    checked={newList.isPublic}
                    onChange={(e) => setNewList({...newList, isPublic: e.target.checked})}
                    className="w-4 h-4"
                  />
                  <label htmlFor="isPublic" className="text-sm">Herkese açık liste</label>
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setIsCreateOpen(false)}>
                    İptal
                  </Button>
                  <Button onClick={handleCreateList} className="bg-orange-500 hover:bg-orange-600">
                    Oluştur
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </div>
      <Footer />
    </div>
  );
}
