import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TenderCard from '@/components/tenders/TenderCard';
import { SearchFilters } from '@/components/ui/search-filters';

import { Tender } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/authContext';

export default function Tenders() {
  const [filters, setFilters] = useState<Record<string, any>>({});
  const { isAuthenticated } = useAuth();

  // Build query string from filters
  const queryString = Object.entries(filters)
    .filter(([_, value]) => value !== undefined && value !== '')
    .map(([key, value]) => `${key}=${encodeURIComponent(value as string)}`)
    .join('&');

  // Fetch tenders with filters
  const { data: tenders, isLoading, error } = useQuery<Tender[]>({
    queryKey: [`/api/tenders${queryString ? `?${queryString}` : ''}`],
  });

  const handleFiltersChange = (newFilters: Record<string, any>) => {
    setFilters(newFilters);
  };

  return (
    <>
      <Helmet>
        <title>Тендеры на строительные работы | СтройТендер</title>
        <meta name="description" content="Найдите исполнителей для строительных работ или предложите свои услуги. Сотни актуальных тендеров на ремонт, строительство и отделку." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Тендеры на строительные работы</h1>
          {isAuthenticated && (
            <Link href="/tenders/create">
              <Button className="flex items-center gap-2">
                <Plus size={16} />
                Создать тендер
              </Button>
            </Link>
          )}
        </div>

        {/* Фильтры и поиск */}
        <SearchFilters
          type="tenders"
          onFiltersChange={handleFiltersChange}
          initialFilters={filters}
        />



        <div className="mt-6">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                  <div className="p-5">
                    <div className="flex justify-between mb-4">
                      <Skeleton className="h-6 w-24" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-8 w-full mb-3" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-4" />
                    <div className="flex justify-between items-center mt-4">
                      <div>
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-4 w-20" />
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                  <div className="bg-gray-50 px-5 py-3 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Skeleton className="h-8 w-8 rounded-full mr-2" />
                        <div>
                          <Skeleton className="h-4 w-20 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                      </div>
                      <Skeleton className="h-8 w-24" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-500 p-4 rounded-md text-center">
              Произошла ошибка при загрузке тендеров. Пожалуйста, попробуйте позже.
            </div>
          ) : tenders && tenders.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {tenders.map((tender) => (
                <TenderCard key={tender.id} tender={tender} />
              ))}
            </div>
          ) : (
            <div className="bg-gray-50 p-8 rounded-lg text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Тендеры не найдены</h3>
              <p className="text-gray-600 mb-6">
                {Object.keys(filters).length > 0 
                  ? 'Не найдено тендеров, соответствующих вашим параметрам поиска. Попробуйте изменить фильтры.'
                  : 'В данный момент нет активных тендеров. Будьте первым, кто создаст тендер!'}
              </p>
              {isAuthenticated && (
                <Link href="/tenders/create">
                  <Button>Создать тендер</Button>
                </Link>
              )}
              {!isAuthenticated && (
                <Link href="/login">
                  <Button>Войти и создать тендер</Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
