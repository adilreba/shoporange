import { useState } from 'react';
import { 
  Star, 
  ThumbsUp, 
  Edit2,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/common/Header';
import { Footer } from '@/components/common/Footer';
import { toast } from 'sonner';

interface Review {
  id: string;
  productName: string;
  productImage: string;
  rating: number;
  comment: string;
  date: string;
  likes: number;
  reply?: string;
  images?: string[];
  status: 'pending' | 'approved' | 'rejected';
}

const mockReviews: Review[] = [
  {
    id: 'REV-001',
    productName: 'Modern Koltuk Takımı',
    productImage: 'https://via.placeholder.com/100',
    rating: 5,
    comment: 'Harika bir ürün! Kalitesi çok iyi, tam beklediğim gibi. Teslimat da hızlıydı.',
    date: '2024-03-15',
    likes: 12,
    reply: 'Değerlendirmeniz için teşekkür ederiz!',
    images: ['https://via.placeholder.com/200'],
    status: 'approved'
  },
  {
    id: 'REV-002',
    productName: 'Yemek Masası',
    productImage: 'https://via.placeholder.com/100',
    rating: 4,
    comment: 'Güzel ürün ama montajı biraz zor oldu. Genel olarak memnunum.',
    date: '2024-03-10',
    likes: 5,
    status: 'approved'
  },
  {
    id: 'REV-003',
    productName: 'Çalışma Sandalyesi',
    productImage: 'https://via.placeholder.com/100',
    rating: 5,
    comment: 'Ergonomik ve çok rahat. Ev ofis için ideal.',
    date: '2024-03-05',
    likes: 8,
    status: 'pending'
  },
  {
    id: 'REV-004',
    productName: 'Avize',
    productImage: 'https://via.placeholder.com/100',
    rating: 3,
    comment: 'Fena değil ama renk tonu resimdekinden farklı.',
    date: '2024-02-28',
    likes: 2,
    status: 'approved'
  }
];

const renderStars = (rating: number) => {
  return Array.from({ length: 5 }, (_, i) => (
    <Star
      key={i}
      className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
    />
  ));
};

export function Reviews() {
  const [reviews, setReviews] = useState<Review[]>(mockReviews);
  const [activeTab, setActiveTab] = useState('all');
  const [editingReview, setEditingReview] = useState<Review | null>(null);

  const filteredReviews = reviews.filter(review => {
    if (activeTab === 'all') return true;
    if (activeTab === 'pending') return review.status === 'pending';
    if (activeTab === 'approved') return review.status === 'approved';
    return true;
  });

  const handleDelete = (id: string) => {
    if (confirm('Bu değerlendirmeyi silmek istediğinize emin misiniz?')) {
      setReviews(reviews.filter(r => r.id !== id));
      toast.success('Değerlendirme silindi');
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
  };

  const stats = {
    total: reviews.length,
    average: (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1),
    pending: reviews.filter(r => r.status === 'pending').length,
    approved: reviews.filter(r => r.status === 'approved').length
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Header />
      <div className="py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Değerlendirmelerim</h1>
          <p className="text-gray-600 dark:text-gray-400">Ürün değerlendirmelerinizi ve yorumlarınızı yönetin</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <p className="text-3xl font-bold">{stats.total}</p>
              <p className="text-sm text-gray-500">Toplam Değerlendirme</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <p className="text-3xl font-bold">{stats.average}</p>
                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              </div>
              <p className="text-sm text-gray-500">Ortalama Puan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-3xl font-bold">{stats.approved}</p>
              <p className="text-sm text-gray-500">Onaylanan</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <p className="text-3xl font-bold">{stats.pending}</p>
              <p className="text-sm text-gray-500">Bekleyen</p>
            </CardContent>
          </Card>
        </div>

        {/* Reviews List */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="all">Tümü ({stats.total})</TabsTrigger>
            <TabsTrigger value="approved">Onaylanan ({stats.approved})</TabsTrigger>
            <TabsTrigger value="pending">Bekleyen ({stats.pending})</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            {filteredReviews.length === 0 ? (
              <Card>
                <CardContent className="text-center py-12">
                  <Star className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">Henüz değerlendirmeniz bulunmuyor</p>
                  <Button onClick={() => window.location.href = '/products'} variant="outline" className="mt-4">
                    Ürünleri Keşfet
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredReviews.map((review) => (
                  <Card key={review.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {/* Product Image */}
                        <img
                          src={review.productImage}
                          alt={review.productName}
                          className="w-20 h-20 rounded-lg object-cover"
                        />
                        
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">{review.productName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <div className="flex">{renderStars(review.rating)}</div>
                                <span className="text-sm text-gray-500">{review.date}</span>
                                {review.status === 'pending' && (
                                  <Badge variant="secondary" className="bg-yellow-100 text-yellow-700">Onay Bekliyor</Badge>
                                )}
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <Button variant="ghost" size="sm" onClick={() => handleEdit(review)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm" onClick={() => handleDelete(review.id)}>
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </div>
                          </div>

                          {/* Comment */}
                          <p className="mt-3 text-gray-700 dark:text-gray-300">{review.comment}</p>

                          {/* Images */}
                          {review.images && review.images.length > 0 && (
                            <div className="flex gap-2 mt-3">
                              {review.images.map((img, idx) => (
                                <img
                                  key={idx}
                                  src={img}
                                  alt={`Review ${idx + 1}`}
                                  className="w-16 h-16 rounded object-cover cursor-pointer hover:opacity-80"
                                  onClick={() => toast.info('Resim büyütüldü')}
                                />
                              ))}
                            </div>
                          )}

                          {/* Reply */}
                          {review.reply && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">Satıcı Yanıtı:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{review.reply}</p>
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex items-center gap-4 mt-4">
                            <Button variant="ghost" size="sm" className="text-gray-500">
                              <ThumbsUp className="w-4 h-4 mr-1" />
                              {review.likes} faydalı
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Edit Modal */}
        {editingReview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-lg">
              <CardHeader>
                <CardTitle>Değerlendirmeyi Düzenle</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Puan</label>
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }, (_, i) => (
                      <button
                        key={i}
                        onClick={() => setEditingReview({...editingReview, rating: i + 1})}
                      >
                        <Star
                          className={`w-6 h-6 ${i < editingReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                        />
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Yorumunuz</label>
                  <textarea
                    value={editingReview.comment}
                    onChange={(e) => setEditingReview({...editingReview, comment: e.target.value})}
                    className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                  />
                </div>
                <div className="flex gap-3 justify-end">
                  <Button variant="outline" onClick={() => setEditingReview(null)}>
                    İptal
                  </Button>
                  <Button 
                    onClick={() => {
                      setReviews(reviews.map(r => r.id === editingReview.id ? editingReview : r));
                      setEditingReview(null);
                      toast.success('Değerlendirme güncellendi');
                    }}
                    className="bg-orange-500 hover:bg-orange-600"
                  >
                    Kaydet
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
