import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { 
  Clock, 
  MapPin, 
  Eye, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ChevronRight, 
  MessageCircle
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import StarRating from '@/components/shared/StarRating';
import { MarketplaceListing } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { formatDate, getUserInitials, getStatusColor, getPlaceholderImage } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface MarketplaceItemDetailProps {
  listingId: number;
}

export default function MarketplaceItemDetail({ listingId }: MarketplaceItemDetailProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch listing details
  const { 
    data: listing, 
    isLoading: isListingLoading, 
    error: listingError 
  } = useQuery<MarketplaceListing>({
    queryKey: [`/api/marketplace/${listingId}`],
  });

  // Delete listing mutation
  const deleteListingMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/marketplace/${listingId}`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Объявление удалено',
        description: 'Ваше объявление было успешно удалено',
      });
      navigate('/marketplace');
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить объявление',
        variant: 'destructive',
      });
    },
  });

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    toast({
      title: isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
      description: isFavorite 
        ? 'Объявление удалено из избранного' 
        : 'Объявление добавлено в избранное',
    });
  };

  const handleShare = () => {
    // In a real app, this would use the Web Share API or copy to clipboard
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Ссылка скопирована',
      description: 'Ссылка на объявление скопирована в буфер обмена',
    });
  };

  const handlePrevImage = () => {
    if (!listing || !listing.images || listing.images.length === 0) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === 0 ? listing.images.length - 1 : prevIndex - 1
    );
  };

  const handleNextImage = () => {
    if (!listing || !listing.images || listing.images.length === 0) return;
    setCurrentImageIndex((prevIndex) => 
      prevIndex === listing.images.length - 1 ? 0 : prevIndex + 1
    );
  };
  
  const handleDeleteListing = async () => {
    await deleteListingMutation.mutateAsync();
  };



  const getListingTypeLabel = (type: string) => {
    switch (type) {
      case 'sell': return 'Продажа';
      case 'rent': return 'Аренда';
      case 'buy': return 'Покупка';
      default: return type;
    }
  };

  const formatPrice = (price: number, listingType: string) => {
    const formattedPrice = price.toLocaleString() + ' ₽';
    return listingType === 'rent' ? formattedPrice + '/день' : formattedPrice;
  };

  // If listing is loading, show skeleton
  if (isListingLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <Skeleton className="h-[400px] w-full rounded-md mb-6" />
            
            <Card className="p-6">
              <Skeleton className="h-6 w-40 mb-4" />
              <Skeleton className="h-20 w-full" />
              
              <div className="pt-4 space-y-2 border-t mt-4">
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-40" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-32" />
                </div>
                <div className="flex items-center">
                  <Skeleton className="h-5 w-5 mr-2" />
                  <Skeleton className="h-5 w-36" />
                </div>
              </div>
            </Card>
          </div>

          <div>
            <Card className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              
              <div className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
              
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If listing error occurred
  if (listingError || !listing) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки данных</h2>
          <p className="text-gray-500 mb-4">
            Не удалось загрузить информацию об объявлении. Пожалуйста, попробуйте позже.
          </p>
          <Button onClick={() => navigate('/marketplace')}>Вернуться к списку объявлений</Button>
        </div>
      </Card>
    );
  }

  // Check if user is the listing owner
  const isOwner = isAuthenticated && user?.id === listing.userId;
  
  // Get current image URL
  const currentImage = listing.images && listing.images.length > 0 
    ? listing.images[currentImageIndex] 
    : getPlaceholderImage(listing.category);
  
  // Has multiple images
  const hasMultipleImages = listing.images && listing.images.length > 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{listing.title}</h1>
          <Badge 
            variant="secondary"
            className={getStatusColor(listing.listingType)}
          >
            {getListingTypeLabel(listing.listingType)}
          </Badge>
        </div>
        
        {isOwner && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(`/marketplace/edit/${listing.id}`)}>
              Редактировать
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Удалить
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          {/* Image gallery */}
          <div className="relative rounded-md overflow-hidden mb-6">
            <img 
              src={currentImage} 
              alt={listing.title} 
              className="w-full h-[400px] object-cover"
            />
            
            {hasMultipleImages && (
              <>
                <button 
                  className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-70 hover:opacity-100"
                  onClick={handlePrevImage}
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-white rounded-full p-2 shadow-md opacity-70 hover:opacity-100"
                  onClick={handleNextImage}
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
                
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {listing.images.map((_, index) => (
                    <button 
                      key={index}
                      className={`h-2 w-2 rounded-full ${
                        index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                      }`}
                      onClick={() => setCurrentImageIndex(index)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          
          {/* Listing details */}
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Описание</h2>
            <p className="whitespace-pre-line text-gray-700">{listing.description}</p>
            
            <div className="pt-4 mt-4 border-t border-gray-200 space-y-3">
              {listing.condition && (
                <div className="flex items-center text-sm text-gray-600">
                  <span className="font-medium mr-2">Состояние:</span>
                  <span>{listing.condition}</span>
                </div>
              )}
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="mr-2 h-4 w-4" />
                <span>Местоположение: <strong>{listing.location}</strong></span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="mr-2 h-4 w-4" />
                <span>Дата публикации: <strong>{formatDate(listing.createdAt)}</strong></span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Eye className="mr-2 h-4 w-4" />
                <span>Просмотров: <strong>{listing.viewCount}</strong></span>
              </div>
            </div>
          </Card>
        </div>

        <div>
          {/* Price and seller info */}
          <Card className="p-6">
            <div className="text-2xl font-bold text-secondary mb-4">
              {formatPrice(listing.price, listing.listingType)}
            </div>
            
            <div className="flex items-center space-x-4 mb-4">
              <Avatar className="h-12 w-12">
                <AvatarImage 
                  src={listing.user?.avatar} 
                  alt={listing.user?.fullName || 'Продавец'} 
                />
                <AvatarFallback>
                  {getUserInitials(listing.user?.fullName || 'Продавец')}
                </AvatarFallback>
              </Avatar>
              <div>
                <Link 
                  href={`/profile/${listing.userId}`}
                  className="font-medium text-gray-900 hover:text-primary"
                >
                  {listing.user?.fullName || 'Продавец'}
                </Link>
                <div className="flex items-center">
                  <StarRating rating={listing.user?.rating || 0} size="xs" showText />
                </div>
              </div>
            </div>
            
            {!isOwner && (
              <Button 
                className="w-full mb-3" 
                variant="default"
                onClick={() => {
                  if (!isAuthenticated) {
                    toast({
                      title: 'Требуется авторизация',
                      description: 'Войдите в систему, чтобы связаться с продавцом',
                      variant: 'destructive',
                    });
                    navigate('/login');
                    return;
                  }
                  if (listing?.userId) {
                    navigate(`/messages?userId=${listing.userId}`);
                  }
                }}
              >
                <MessageCircle className="mr-2 h-4 w-4" />
                Написать продавцу
              </Button>
            )}
            
            <div className="flex gap-2">
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={handleToggleFavorite}
              >
                <Heart className={`mr-2 h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
                {isFavorite ? 'В избранном' : 'В избранное'}
              </Button>
              
              <Button 
                className="flex-1" 
                variant="outline"
                onClick={handleShare}
              >
                <Share2 className="mr-2 h-4 w-4" />
                Поделиться
              </Button>
            </div>
          </Card>
          
          {/* Safety tips */}
          <Card className="p-6 mt-4">
            <h3 className="font-semibold mb-2">Советы по безопасности</h3>
            <ul className="text-sm text-gray-600 space-y-2">
              <li>• Не платите до получения товара или проверки его качества</li>
              <li>• Встречайтесь в общественных местах</li>
              <li>• Проверяйте товар перед покупкой</li>
              <li>• Сохраняйте чеки и документы</li>
            </ul>
          </Card>
          
          {/* Similar listings */}
          <Card className="p-6 mt-4">
            <h3 className="font-semibold mb-2">Похожие объявления</h3>
            <p className="text-center text-gray-500 py-3">
              Функция "Похожие объявления" будет доступна в ближайшее время.
            </p>
          </Card>
        </div>
      </div>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие не может быть отменено. Объявление будет удалено безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteListing}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
