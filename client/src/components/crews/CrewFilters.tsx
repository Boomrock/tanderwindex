import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Search, Filter, X } from "lucide-react";

export interface CrewFilters {
  search: string;
  location: string;
  specialization: string;
  minSize: number;
  maxSize: number;
  minRate: number;
  maxRate: number;
  verified: boolean | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface CrewFiltersProps {
  onFiltersChange: (filters: CrewFilters) => void;
  initialFilters?: Partial<CrewFilters>;
}

const specializations = [
  'Строительство',
  'Ремонт',
  'Сантехника',
  'Электричество',
  'Отделка',
  'Кровля',
  'Фундамент',
  'Дизайн интерьера'
];

const sortOptions = [
  { value: 'rating', label: 'По рейтингу' },
  { value: 'hourly_rate', label: 'По стоимости' },
  { value: 'team_size', label: 'По размеру команды' },
  { value: 'name', label: 'По названию' }
];

export default function CrewFilters({ onFiltersChange, initialFilters }: CrewFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Applied filters - what's currently active
  const [appliedFilters, setAppliedFilters] = useState<CrewFilters>({
    search: initialFilters?.search || '',
    location: initialFilters?.location || '',
    specialization: initialFilters?.specialization || '',
    minSize: initialFilters?.minSize || 2,
    maxSize: initialFilters?.maxSize || 20,
    minRate: initialFilters?.minRate || 0,
    maxRate: initialFilters?.maxRate || 100000,
    verified: initialFilters?.verified || null,
    sortBy: initialFilters?.sortBy || 'rating',
    sortOrder: initialFilters?.sortOrder || 'desc'
  });
  
  // Temporary filters - what user is setting up
  const [tempFilters, setTempFilters] = useState<CrewFilters>(appliedFilters);

  const updateTempFilters = (newFilters: Partial<CrewFilters>) => {
    setTempFilters(prev => ({ ...prev, ...newFilters }));
  };

  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    onFiltersChange(tempFilters);
  };

  const clearFilters = () => {
    const clearedFilters: CrewFilters = {
      search: '',
      location: '',
      specialization: '',
      minSize: 2,
      maxSize: 20,
      minRate: 0,
      maxRate: 100000,
      verified: null,
      sortBy: 'rating',
      sortOrder: 'desc'
    };
    setTempFilters(clearedFilters);
    setAppliedFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const hasActiveFilters = () => {
    return appliedFilters.search || appliedFilters.location || appliedFilters.specialization || 
           appliedFilters.minSize > 2 || appliedFilters.maxSize < 20 ||
           appliedFilters.minRate > 0 || appliedFilters.maxRate < 100000 || 
           appliedFilters.verified !== null;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (appliedFilters.search) count++;
    if (appliedFilters.location) count++;
    if (appliedFilters.specialization) count++;
    if (appliedFilters.minSize > 2 || appliedFilters.maxSize < 20) count++;
    if (appliedFilters.minRate > 0 || appliedFilters.maxRate < 100000) count++;
    if (appliedFilters.verified !== null) count++;
    return count;
  };

  const hasChanges = () => {
    return JSON.stringify(tempFilters) !== JSON.stringify(appliedFilters);
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
            value={tempFilters.search}
            onChange={(e) => updateTempFilters({ search: e.target.value })}
            className="pl-10"
          />
        </div>

        {/* Quick Filters */}
        <div className="flex flex-wrap gap-2">
          <Button
            variant={tempFilters.verified === true ? "default" : "outline"}
            size="sm"
            onClick={() => updateTempFilters({ verified: tempFilters.verified === true ? null : true })}
            className={tempFilters.verified === true ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Проверенные
          </Button>
          <Button
            variant={tempFilters.specialization === 'Строительство' ? "default" : "outline"}
            size="sm"
            onClick={() => updateTempFilters({ 
              specialization: tempFilters.specialization === 'Строительство' ? '' : 'Строительство' 
            })}
            className={tempFilters.specialization === 'Строительство' ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Строительство
          </Button>
          <Button
            variant={tempFilters.specialization === 'Ремонт' ? "default" : "outline"}
            size="sm"
            onClick={() => updateTempFilters({ 
              specialization: tempFilters.specialization === 'Ремонт' ? '' : 'Ремонт' 
            })}
            className={tempFilters.specialization === 'Ремонт' ? "bg-green-600 hover:bg-green-700" : ""}
          >
            Ремонт
          </Button>
          <div className="flex gap-2 ml-auto">
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
            <Button
              onClick={applyFilters}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
              disabled={!hasChanges()}
            >
              Применить фильтры
            </Button>
          </div>
        </div>

        {/* Advanced Filters */}
        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
            {/* Location */}
            <div>
              <label className="text-sm font-medium mb-2 block">Местоположение</label>
              <Input
                placeholder="Город"
                value={tempFilters.location}
                onChange={(e) => updateTempFilters({ location: e.target.value })}
              />
            </div>

            {/* Specialization */}
            <div>
              <label className="text-sm font-medium mb-2 block">Специализация</label>
              <Select value={tempFilters.specialization || "all"} onValueChange={(value) => updateTempFilters({ specialization: value === "all" ? "" : value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Выберите специализацию" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все специализации</SelectItem>
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
                <Select value={tempFilters.sortBy} onValueChange={(value) => updateTempFilters({ sortBy: value })}>
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
                  onClick={() => updateTempFilters({ sortOrder: tempFilters.sortOrder === 'asc' ? 'desc' : 'asc' })}
                  className="px-2"
                >
                  {tempFilters.sortOrder === 'asc' ? '↑' : '↓'}
                </Button>
              </div>
            </div>

            {/* Verified Filter */}
            <div>
              <label className="text-sm font-medium mb-2 block">Статус</label>
              <Select 
                value={tempFilters.verified === null ? 'all' : String(tempFilters.verified)} 
                onValueChange={(value) => updateTempFilters({ verified: value === 'all' ? null : value === 'true' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Все" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="true">Проверенные</SelectItem>
                  <SelectItem value="false">Не проверенные</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Team Size Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Размер команды: {tempFilters.minSize}-{tempFilters.maxSize} человек
              </label>
              <div className="px-3">
                <Slider
                  value={[tempFilters.minSize, tempFilters.maxSize]}
                  onValueChange={([min, max]) => updateTempFilters({ minSize: min, maxSize: max })}
                  min={2}
                  max={20}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* Price Range */}
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-2 block">
                Стоимость: {tempFilters.minRate.toLocaleString()}-{tempFilters.maxRate.toLocaleString()} ₽/услугу
              </label>
              <div className="px-3">
                <Slider
                  value={[tempFilters.minRate, tempFilters.maxRate]}
                  onValueChange={([min, max]) => updateTempFilters({ minRate: min, maxRate: max })}
                  min={0}
                  max={100000}
                  step={100}
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