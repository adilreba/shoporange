import { Skeleton } from '@/components/ui/skeleton';

interface ProductCardSkeletonProps {
  variant?: 'default' | 'compact' | 'horizontal';
}

export function ProductCardSkeleton({ variant = 'default' }: ProductCardSkeletonProps) {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-4 p-4 bg-card rounded-xl border animate-pulse">
        <Skeleton className="w-32 h-32 rounded-lg flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-4 w-1/4" />
          <div className="flex items-center gap-2 pt-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl overflow-hidden border animate-pulse">
      {/* Image Skeleton */}
      <div className="relative aspect-square">
        <Skeleton className="absolute inset-0" />
      </div>
      
      {/* Content Skeleton */}
      <div className="p-3 sm:p-4 space-y-3">
        {/* Category */}
        <Skeleton className="h-3 w-16" />
        
        {/* Title */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        
        {/* Rating */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-3 w-20" />
        </div>
        
        {/* Price & Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="space-y-1">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-14" />
          </div>
          <Skeleton className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
