import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, X, SlidersHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SearchFiltersProps {
  type: 'tenders' | 'marketplace';
  onFiltersChange: (filters: any) => void;
  initialFilters?: any;
}

const tenderCategories = [
  'Строительство зданий',
  'Дорожные работы',
  'Электромонтажные работы',
  'Сантехнические работы',
  'Отделочные работы',
  'Кровельные работы',
  'Ландшафтный дизайн',
  'Снос и демонтаж'
];

const marketplaceCategories = [
  'Строительные материалы',
  'Инструменты',
  'Техника и оборудование',
  'Услуги',
  'Аренда техники',
  'Спецтехника'
];

const listingTypes = [
  { value: 'sell', label: 'Продажа' },
  { value: 'rent', label: 'Аренда' },
  { value: 'service', label: 'Услуга' }
];

export function SearchFilters({ type, onFiltersChange, initialFilters = {} }: SearchFiltersProps) {
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    category: initialFilters.category || '',
    location: initialFilters.location || '',
    minPrice: initialFilters.minPrice || '',
    maxPrice: initialFilters.maxPrice || '',
    minBudget: initialFilters.minBudget || '',
    maxBudget: initialFilters.maxBudget || '',
    listingType: initialFilters.listingType || '',
    sortBy: initialFilters.sortBy || '',
    sortOrder: initialFilters.sortOrder || 'desc',
    ...initialFilters
  });

  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleFilterChange = (key: string, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: '',
      location: '',
      minPrice: '',
      maxPrice: '',
      minBudget: '',
      maxBudget: '',
      listingType: '',
      sortBy: '',
      sortOrder: 'desc'
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFiltersCount = () => {
    const activeFilters = Object.entries(filters).filter(([key, value]) => 
      value && value !== '' && key !== 'sortOrder'
    );
    return activeFilters.length;
  };

  const categories = type === 'tenders' ? tenderCategories : marketplaceCategories;

  return (
    <Card className="mb-6">
      <CardContent className="p-4">
        {/* Основная строка поиска */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder={type === 'tenders' ? 'Поиск тендеров...' : 'Поиск товаров и услуг...'}
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setIsAdvancedOpen(!isAdvancedOpen)}
            className="flex items-center gap-2"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Фильтры
            {getActiveFiltersCount() > 0 && (
              <Badge variant="secondary" className="ml-1">
                {getActiveFiltersCount()}
              </Badge>
            )}
          </Button>
          {getActiveFiltersCount() > 0 && (
            <Button variant="outline" onClick={clearFilters} className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Очистить
            </Button>
          )}
        </div>

        {/* Расширенные фильтры */}
        <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Категория */}
              <div>
                <label className="text-sm font-medium mb-2 block">Категория</label>
                <Select value={filters.category} onValueChange={(value) => handleFilterChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Все категории" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">Все категории</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Местоположение */}
              <div>
                <label className="text-sm font-medium mb-2 block">Местоположение</label>
                <Input
                  placeholder="Город, регион..."
                  value={filters.location}
                  onChange={(e) => handleFilterChange('location', e.target.value)}
                />
              </div>

              {/* Тип объявления (только для маркетплейса) */}
              {type === 'marketplace' && (
                <div>
                  <label className="text-sm font-medium mb-2 block">Тип объявления</label>
                  <Select value={filters.listingType} onValueChange={(value) => handleFilterChange('listingType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Все типы" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Все типы</SelectItem>
                      {listingTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* Сортировка */}
              <div>
                <label className="text-sm font-medium mb-2 block">Сортировка</label>
                <Select value={filters.sortBy} onValueChange={(value) => handleFilterChange('sortBy', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="По дате создания" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">По дате создания</SelectItem>
                    {type === 'tenders' ? (
                      <>
                        <SelectItem value="budget">По бюджету</SelectItem>
                        <SelectItem value="deadline">По дедлайну</SelectItem>
                      </>
                    ) : (
                      <>
                        <SelectItem value="price">По цене</SelectItem>
                        <SelectItem value="title">По названию</SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Ценовой диапазон */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {type === 'tenders' ? (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Минимальный бюджет</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minBudget}
                      onChange={(e) => handleFilterChange('minBudget', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Максимальный бюджет</label>
                    <Input
                      type="number"
                      placeholder="Без ограничений"
                      value={filters.maxBudget}
                      onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Минимальная цена</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Максимальная цена</label>
                    <Input
                      type="number"
                      placeholder="Без ограничений"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Порядок сортировки */}
            {filters.sortBy && (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">Порядок:</span>
                <div className="flex gap-2">
                  <Button
                    variant={filters.sortOrder === 'asc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortOrder', 'asc')}
                  >
                    По возрастанию
                  </Button>
                  <Button
                    variant={filters.sortOrder === 'desc' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleFilterChange('sortOrder', 'desc')}
                  >
                    По убыванию
                  </Button>
                </div>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Активные фильтры */}
        {getActiveFiltersCount() > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {Object.entries(filters).map(([key, value]) => {
              if (!value || value === '' || key === 'sortOrder') return null;
              
              let label = '';
              switch (key) {
                case 'search':
                  label = `Поиск: "${value}"`;
                  break;
                case 'category':
                  label = `Категория: ${value}`;
                  break;
                case 'location':
                  label = `Местоположение: ${value}`;
                  break;
                case 'listingType':
                  label = `Тип: ${listingTypes.find(t => t.value === value)?.label || value}`;
                  break;
                case 'minBudget':
                  label = `Бюджет от: ${value} ₽`;
                  break;
                case 'maxBudget':
                  label = `Бюджет до: ${value} ₽`;
                  break;
                case 'minPrice':
                  label = `Цена от: ${value} ₽`;
                  break;
                case 'maxPrice':
                  label = `Цена до: ${value} ₽`;
                  break;
                case 'sortBy':
                  label = `Сортировка: ${
                    value === 'budget' ? 'По бюджету' :
                    value === 'price' ? 'По цене' :
                    value === 'deadline' ? 'По дедлайну' :
                    value === 'title' ? 'По названию' : 'По дате'
                  } ${filters.sortOrder === 'asc' ? '↑' : '↓'}`;
                  break;
                default:
                  label = `${key}: ${value}`;
              }

              return (
                <Badge key={key} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X 
                    className="h-3 w-3 cursor-pointer" 
                    onClick={() => handleFilterChange(key, '')}
                  />
                </Badge>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}