import { useState } from 'react';
import { Star, ThumbsUp, Check, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuthStore } from '@/stores/authStore';
import { toast } from 'sonner';
import type { Review } from '@/types';

interface ProductReviewsProps {
  reviews: Review[];
  averageRating: number;
  totalReviews: number;
}

export function ProductReviews({ reviews, averageRating, totalReviews }: ProductReviewsProps) {
  const { user, isAuthenticated } = useAuthStore();
  const [isWriteDialogOpen, setIsWriteDialogOpen] = useState(false);
  const [newReview, setNewReview] = useState({
    rating: 5,
    comment: ''
  });
  const [localReviews, setLocalReviews] = useState<Review[]>(reviews);

  const handleSubmitReview = () => {
    if (!newReview.comment.trim()) {
      toast.error('Lütfen bir yorum yazın');
      return;
    }

    const review: Review = {
      id: `rev_${Date.now()}`,
      userId: user?.id || '',
      userName: user?.name || 'Misafir Kullanıcı',
      userAvatar: user?.avatar,
      rating: newReview.rating,
      comment: newReview.comment,
      createdAt: new Date().toISOString().split('T')[0],
      verified: true
    };

    setLocalReviews([review, ...localReviews]);
    setNewReview({ rating: 5, comment: '' });
    setIsWriteDialogOpen(false);
    toast.success('Yorumunuz başarıyla eklendi!');
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    localReviews.forEach(review => {
      distribution[review.rating as keyof typeof distribution]++;
    });
    return distribution;
  };

  const ratingDistribution = getRatingDistribution();

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="bg-muted rounded-2xl p-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Average Rating */}
          <div className="text-center md:text-left">
            <p className="text-5xl font-bold text-orange-600">{averageRating.toFixed(1)}</p>
            <div className="flex items-center justify-center md:justify-start gap-1 my-2">
              {[...Array(5)].map((_, i) => (
                <Star 
                  key={i} 
                  className={`h-5 w-5 ${
                    i < Math.round(averageRating) 
                      ? 'fill-amber-400 text-amber-400' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
            <p className="text-muted-foreground">{totalReviews} değerlendirme</p>
          </div>

          {/* Rating Distribution */}
          <div className="space-y-2">
            {[5, 4, 3, 2, 1].map((star) => {
              const count = ratingDistribution[star as keyof typeof ratingDistribution];
              const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;
              
              return (
                <div key={star} className="flex items-center gap-3">
                  <span className="text-sm w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-400 rounded-full transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  <span className="text-sm text-muted-foreground w-8">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Write Review Button */}
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold">Müşteri Yorumları ({localReviews.length})</h3>
        <Dialog open={isWriteDialogOpen} onOpenChange={setIsWriteDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gradient-orange">
              Yorum Yaz
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Ürünü Değerlendirin</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              {!isAuthenticated && (
                <p className="text-sm text-orange-600 bg-orange-50 p-3 rounded-lg">
                  Yorum yapmak için giriş yapmanız gerekiyor.
                </p>
              )}
              
              <div>
                <Label>Puanınız</Label>
                <div className="flex gap-2 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setNewReview({ ...newReview, rating: star })}
                      className="focus:outline-none"
                    >
                      <Star 
                        className={`h-8 w-8 transition-colors ${
                          star <= newReview.rating 
                            ? 'fill-amber-400 text-amber-400' 
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <Label>Yorumunuz</Label>
                <Textarea
                  placeholder="Ürün hakkında düşüncelerinizi paylaşın..."
                  value={newReview.comment}
                  onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
                  rows={4}
                />
              </div>
              
              <Button 
                className="w-full gradient-orange"
                onClick={handleSubmitReview}
                disabled={!isAuthenticated}
              >
                Yorumu Gönder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {localReviews.length > 0 ? (
          localReviews.map((review) => (
            <div key={review.id} className="border rounded-xl p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {review.userAvatar ? (
                    <img 
                      src={review.userAvatar} 
                      alt={review.userName}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                      <User className="h-5 w-5 text-orange-600" />
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{review.userName}</p>
                    <p className="text-sm text-muted-foreground">{review.createdAt}</p>
                  </div>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={`h-4 w-4 ${
                        i < review.rating 
                          ? 'fill-amber-400 text-amber-400' 
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
              
              <p className="text-foreground mb-3">{review.comment}</p>
              
              <div className="flex items-center gap-4">
                {review.verified && (
                  <span className="flex items-center gap-1 text-green-600 text-sm">
                    <Check className="h-4 w-4" />
                    Doğrulanmış Satın Alma
                  </span>
                )}
                <button className="flex items-center gap-1 text-muted-foreground text-sm hover:text-orange-600">
                  <ThumbsUp className="h-4 w-4" />
                  Faydalı (0)
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-12">
            <Star className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-muted-foreground">Henüz yorum yapılmamış. İlk yorumu siz yapın!</p>
          </div>
        )}
      </div>
    </div>
  );
}
