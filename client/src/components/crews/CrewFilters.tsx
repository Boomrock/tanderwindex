import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Search, Filter, X } from 'lucide-react';

interface CrewFiltersProps {
  onFiltersChange: (filters: CrewFilters) => void;
  initialFilters?: CrewFilters;
}

export interface CrewFilters {
  search: string;
  location: string;
  specialization: string;
  minExperience: number;
  maxExperience: number;
  minRate: number;
  maxRate: number;
  minTeamSize: number;
  maxTeamSize: number;
  verified: boolean | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

const specializations = [
  'Строительство домов',
  'Капитальный ремонт',
  'Отделочные работы',
  'Кровельные работы',
  'Фундаментные работы',
  'Монтаж конструкций',
  'Инженерные системы',
  'Ландшафтные работы',
  'Демонтажные работы',
  'Реставрация',
  'Промышленное строительство',
  'Дорожные работы',
  'Электромонтаж',
  'Сантехнические работы',
  'Другое'
];

const sortOptions = [
  { value: 'rating', label: 'По рейтингу' },
  { value: 'hourly_rate', label: 'По стоимости' },
  { value: 'experience_years', label: 'По опыту' },
  { value: 'team_size', label: 'По размеру команды' },
  { value: 'name', label: 'По названию' }
];

export default function CrewFilters({ onFiltersChange, initialFilters }: CrewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchValue, setSearchValue] = useState(initialFilters?.search || '');
  const [filters, setFilters] = useState<CrewFilters>({
    search: initialFilters?.search || '',
    location: initialFilters?.location || '',
    specialization: initialFilters?.specialization || '',
    minExperience: initialFilters?.minExperience || 0,
    maxExperience: initialFilters?.maxExperience || 20,
    minRate: initialFilters?.minRate || 0,
    maxRate: initialFilters?.maxRate || 20000,
    minTeamSize: initialFilters?.minTeamSize || 1,
    maxTeamSize: initialFilters?.maxTeamSize || 50,
    verified: initialFilters?.verified || null,
    sortBy: initialFilters?.sortBy || 'rating',
    sortOrder: initialFilters?.sortOrder || 'desc'
  });

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      const updatedFilters = { ...filters, search: searchValue };
      setFilters(updatedFilters);
      onFiltersChange(updatedFilters);
    }, 500); // 500ms delay

    return () => clearTimeout(timeoutId);
  }, [searchValue]);

  const updateFilters = (newFilters: Partial<CrewFilters>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFiltersChange(updatedFilters);
  };

  const clearFilters = () => {
    const clearedFilters: CrewFilters = {
      search: '',
      location: '',
      specialization: '',
      minExperience: 0,
      maxExperience: 20,
      minRate: 0,
      maxRate: 20000,
      minTeamSize: 1,
      maxTeamSize: 50,
      verified: null,
      sortBy: 'rating',
      sortOrder: 'desc'
    };
    setSearchValue('');
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return searchValue || filters.location || filters.specialization || 
           filters.minExperience > 0 || filters.maxExperience < 20 ||
           filters.minRate > 0 || filters.maxRate < 20000 || 
           filters.minTeamSize > 1 || filters.maxTeamSize < 50 ||
           filters.verified !== null;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchValue) count++;
    if (filters.location) count++;
    if (filters.specialization) count++;
    if (filters.minExperience > 0 || filters.maxExperience < 20) count++;
    if (filters.minRate > 0 || filters.maxRate < 20000) count++;
    if (filters.minTeamSize > 1 || filters.maxTeamSize < 50) count++;
    if (filters.verified !== null) count++;
    return count;
  };

  return (
    <Card className="mb-6">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Поиск и фильтры</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters() && (
              <Badge variant="secondary" className="bg-green-100 text-green-700">
                {getActiveFilterCount()} активных
              </Badge>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Filter className="h-4 w-4 mr-1" />
              {isExpanded ? 'Скрыть' : 'Фильтры'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Поиск по названию, описанию, специализации..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={filters.verified === true ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ verified: filters.verified === true ? null : true })}
            className={filters.verified === true ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Проверенные
          </Button>
          <Button
            variant={filters.specialization === 'Строительство домов' ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ 
              specialization: filters.specialization === 'Строительство домов' ? '' : 'Строительство домов' 
            })}
            className={filters.specialization === 'Строительство домов' ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Строительство домов
          </Button>
          <Button
            variant={filters.specialization === 'Отделочные работы' ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilters({ 
              specialization: filters.specialization === 'Отделочные работы' ? '' : 'Отделочные работы' 
            })}
            className={filters.specialization === 'Отделочные работы' ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Отделочные работы
          </Button>
          {hasActiveFilters() && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-red-600 hover:text-red-700"
            >
              <X className="h-3 w-3 mr-1" />
              Очистить
            </Button>
          )}
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-2 block">Местоположение</label>
              <Input
                placeholder="Город"
                value={filters.location}
                onChange={(e) => updateFilters({ location: e.target.value })}
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="text-sm font-medium mb-2 block">Специализация</label>
              <Select value={filters.specialization} onValueChange={(value) => updateFilters({ specialization: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите специализацию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все специализации</SelectItem>
                  {specializations.map((spec) => (
                    <SelectItem key={spec} value={spec}>
                      {spec}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Sort */}
            <div>
              <label className="text-sm font-medium mb-2 block">Сортировка</label>
              <div className="flex gap-1">
                <Select value={filters.sortBy} onValueChange={(value) => updateFilters({ sortBy: value })}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {sortOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateFilters({ sortOrder: filters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="px-2"
                >
                  {filters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Verified Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Статус</label>
              <Select 
                value={filters.verified === null ? '' : String(filters.verified)} 
                onValueChange={(value) => updateFilters({ verified: value === '' ? null : value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Все</SelectItem>
                  <SelectItem value="true">Проверенные</SelectItem>
                  <SelectItem value="false">Не проверенные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Experience Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Опыт работы: {filters.minExperience}-{filters.maxExperience} лет
              </label>
              <div className="px-3">
                <Slider
                  value={[filters.minExperience, filters.maxExperience]}
                  onValueChange={([min, max]) => updateFilters({ minExperience: min, maxExperience: max })}
                  min={0}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Team Size Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Размер команды: {filters.minTeamSize}-{filters.maxTeamSize} человек
              </label>
              <div className="px-3">
                <Slider
                  value={[filters.minTeamSize, filters.maxTeamSize]}
                  onValueChange={([min, max]) => updateFilters({ minTeamSize: min, maxTeamSize: max })}
                  min={1}
                  max={50}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="md:col-span-4">
              <label className="text-sm font-medium mb-2 block">
                Стоимость: {filters.minRate.toLocaleString()}-{filters.maxRate.toLocaleString()} ₽/час
              </label>
              <div className="px-3">
                <Slider
                  value={[filters.minRate, filters.maxRate]}
                  onValueChange={([min, max]) => updateFilters({ minRate: min, maxRate: max })}
                  min={0}
                  max={20000}
                  step={500}
                  className="w-full"
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}