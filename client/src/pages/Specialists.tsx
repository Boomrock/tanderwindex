import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, Plus, User, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import SpecialistFilters, { SpecialistFilters as SpecialistFiltersType } from "@/components/specialists/SpecialistFilters";

interface Specialist {
  id: number;
  name: string;
  description: string;
  location: string;
  experience_years: number;
  hourly_rate: number;
  specializations: string[];
  images: string[];
  status: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    rating: number;
    isVerified: boolean;
    completedProjects: number;
  };
}

export default function Specialists() {
  const [filters, setFilters] = useState<SpecialistFiltersType>({
    search: '',
    location: '',
    specialization: '',
    minExperience: 0,
    maxExperience: 20,
    minRate: 0,
    maxRate: 10000,
    verified: null,
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const buildQueryString = (filters: SpecialistFiltersType) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.minExperience > 0) params.append('minExperience', filters.minExperience.toString());
    if (filters.maxExperience < 20) params.append('maxExperience', filters.maxExperience.toString());
    if (filters.minRate > 0) params.append('minRate', filters.minRate.toString());
    if (filters.maxRate < 10000) params.append('maxRate', filters.maxRate.toString());
    if (filters.verified !== null) params.append('verified', filters.verified.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    return params.toString() ? `?${params.toString()}` : '';
  };

  const { data: specialists = [], isLoading } = useQuery<Specialist[]>({
    queryKey: ["/api/specialists", filters],
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      const response = await fetch(`/api/specialists${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch specialists');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">Загрузка специалистов...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Специалисты | Windexs-Строй</title>
        <meta name="description" content="Найдите проверенных строительных специалистов для ваших проектов" />
      </Helmet>

      <div className="container py-12">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4 text-green-600">Специалисты</h1>
            <p className="text-gray-600 text-lg">
              Найдите квалифицированных строительных специалистов
            </p>
          </div>
          <Link href="/specialists/create">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Добавить объявление
            </Button>
          </Link>
        </div>

        <SpecialistFilters 
          onFiltersChange={setFilters}
          initialFilters={filters}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists.map((specialist) => (
            <Card key={specialist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={specialist.images?.[0] || undefined} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{specialist.name}</CardTitle>
                    <p className="text-sm text-gray-600">{specialist.user.username}</p>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">{specialist.user.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({specialist.user.completedProjects})
                      </span>
                      {specialist.user.isVerified && (
                        <div className="ml-2 h-2 w-2 bg-green-500 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {specialist.location}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Опыт: {specialist.experience_years} лет
                </div>

                <div className="flex flex-wrap gap-1">
                  {specialist.specializations.slice(0, 3).map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>

                <div className="text-lg font-semibold text-green-600">
                  от {specialist.hourly_rate.toLocaleString()} ₽/час
                </div>

                <div className="flex space-x-2 pt-2">
                  <Link href={`/specialists/${specialist.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Подробнее
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Логика открытия чата
                      console.log(`Открыть чат с ${specialist.name}`);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {specialists.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Специалисты не найдены</p>
          </div>
        )}
      </div>
    </>
  );
}