import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import MarketplaceItemCard from '@/components/marketplace/MarketplaceItemCard';
import { SearchFilters } from '@/components/ui/search-filters';

import { MarketplaceListing } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/authContext';

export default function Marketplace() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { isAuthenticated } = useAuth();

  // Build query string from filters
  const queryString = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&');

  // Fetch marketplace listings with filters
  const { data: listings, isLoading, error } = useQuery<MarketplaceListing[]>({
    queryKey: [`/api/marketplace${queryString ? `?${queryString}` : ''}`],
  });

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  return (
    <>
      <Helmet>
        <title>Маркетплейс строительных материалов и оборудования | СтройТендер</title>
        <meta
          name="description"
          content="Маркетплейс строительной техники, оборудования и материалов. Продажа и аренда спецтехники, инструментов и стройматериалов."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Маркетплейс строительных материалов и оборудования</h1>
          {isAuthenticated && (
            <Link href="/marketplace/create">
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Разместить объявление
              </Button>
            </Link>
          )}
        </div>

        {/* Фильтры и поиск */}
        <SearchFilters
          type="marketplace"
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />



        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="relative">
                    <Skeleton className="w-full h-44" />
                  </div>
                  <div className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-3" />
                    <div className="flex justify-between items-center mt-4">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-4 rounded-md text-center">
              Произошла ошибка при загрузке объявлений. Пожалуйста, попробуйте позже.
            </div>
          ) : listings && listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
              {listings.map((listing) => (
                <MarketplaceItemCard key={listing.id} listing={listing} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Объявления не найдены</h3>
              <p className="text-gray-600 mb-6">
                {Object.keys(filters).length > 0 
                  ? 'Не найдено объявлений, соответствующих вашим параметрам поиска. Попробуйте изменить фильтры.'
                  : 'В данный момент нет активных объявлений. Будьте первым, кто разместит объявление!'}
              </p>
              {isAuthenticated && (
                <Link href="/marketplace/create">
                  <Button>Разместить объявление</Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/login">
                  <Button>Войти и разместить объявление</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
