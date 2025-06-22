import { useState } from 'react';
import { Link } from 'wouter';
import { Heart, MessageCircle, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MarketplaceListing } from '@/lib/types';
import { getStatusColor } from '@/lib/utils';
import { getImageUrl } from '@/lib/gradient-generator';
import { useToast } from '@/hooks/use-toast';

interface MarketplaceItemCardProps {
  listing: MarketplaceListing;
}

export default function MarketplaceItemCard({ listing }: MarketplaceItemCardProps) {
  const [isFavorite, setIsFavorite] = useState(false);
  const { toast } = useToast();

  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsFavorite(!isFavorite);
    
    toast({
      title: isFavorite ? 'Удалено из избранного' : 'Добавлено в избранное',
      description: isFavorite 
        ? 'Объявление удалено из избранного' 
        : 'Объявление добавлено в избранное',
    });
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

  const imageUrl = getImageUrl(listing.images, `${listing.category}-${listing.id}`);

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        <Link href={`/marketplace/${listing.id}`}>
          <img 
            src={imageUrl} 
            alt={listing.title} 
            className="w-full h-44 object-cover"
          />
        </Link>
        <div className="absolute top-0 left-0 m-2">
          <Badge className={getStatusColor(listing.listingType)}>
            {getListingTypeLabel(listing.listingType)}
          </Badge>
        </div>
        <button 
          className="absolute top-0 right-0 m-2 p-1 rounded-full bg-white text-gray-500 hover:text-primary focus:outline-none"
          onClick={handleFavoriteToggle}
        >
          <Heart className={`h-4 w-4 ${isFavorite ? 'fill-primary text-primary' : ''}`} />
        </button>
      </div>
      <div className="p-4">
        <Link href={`/marketplace/${listing.id}`}>
          <h3 className="text-lg font-medium text-gray-900 line-clamp-1">{listing.title}</h3>
        </Link>
        <div className="flex items-center mt-1 text-sm text-gray-500">
          <MapPin className="h-4 w-4 mr-1" />
          {listing.location}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <div className="text-xl font-bold text-black">
            {formatPrice(listing.price, listing.listingType)}
          </div>
          <Link href={`/messages?userId=${listing.userId}`}>
            <Button size="sm" variant="outline" className="flex items-center">
              <MessageCircle className="h-4 w-4 mr-1" />
              Написать
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
