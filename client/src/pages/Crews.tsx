import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, Plus, Users, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";
import CrewFilters, { CrewFilters as CrewFiltersType } from "@/components/crews/CrewFilters";

interface Crew {
  id: number;
  name: string;
  description: string;
  location: string;
  experience_years: number;
  team_size: number;
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

export default function Crews() {
  const [filters, setFilters] = useState<CrewFiltersType>({
    search: '',
    location: '',
    specialization: '',
    minExperience: 0,
    maxExperience: 20,
    minRate: 0,
    maxRate: 10000,
    minTeamSize: 2,
    maxTeamSize: 50,
    verified: null,
    sortBy: 'rating',
    sortOrder: 'desc'
  });

  const buildQueryString = (filters: CrewFiltersType) => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.location) params.append('location', filters.location);
    if (filters.specialization) params.append('specialization', filters.specialization);
    if (filters.minExperience > 0) params.append('minExperience', filters.minExperience.toString());
    if (filters.maxExperience < 20) params.append('maxExperience', filters.maxExperience.toString());
    if (filters.minRate > 0) params.append('minRate', filters.minRate.toString());
    if (filters.maxRate < 10000) params.append('maxRate', filters.maxRate.toString());
    if (filters.minTeamSize > 2) params.append('minTeamSize', filters.minTeamSize.toString());
    if (filters.maxTeamSize < 50) params.append('maxTeamSize', filters.maxTeamSize.toString());
    if (filters.verified !== null) params.append('verified', filters.verified.toString());
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    
    return params.toString() ? `?${params.toString()}` : '';
  };

  const { data: crews = [], isLoading } = useQuery<Crew[]>({
    queryKey: ["/api/crews", filters],
    queryFn: async () => {
      const queryString = buildQueryString(filters);
      const response = await fetch(`/api/crews${queryString}`);
      if (!response.ok) throw new Error('Failed to fetch crews');
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">Загрузка бригад...</div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Бригады | Windexs-Строй</title>
        <meta name="description" content="Найдите профессиональные строительные бригады для крупных проектов" />
      </Helmet>

      <div className="container py-12">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold mb-2 sm:mb-4 text-green-600">Бригады</h1>
            <p className="text-gray-600 text-base sm:text-lg">
              Найдите профессиональные строительные бригады для ваших проектов
            </p>
          </div>
          <Link href="/crews/create" className="w-full sm:w-auto">
            <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:inline">Добавить бригаду</span>
              <span className="sm:hidden">Добавить</span>
            </Button>
          </Link>
        </div>

        <CrewFilters 
          onFiltersChange={setFilters}
          initialFilters={filters}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {crews.map((crew) => (
            <Link key={crew.id} href={`/crews/${crew.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={crew.images?.[0] || undefined} />
                    <AvatarFallback>
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{crew.name}</CardTitle>
                    <p className="text-sm text-gray-600">{crew.user.username}</p>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">{crew.user.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({crew.user.completedProjects})
                      </span>
                      {crew.user.isVerified && (
                        <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                          Проверена
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="h-4 w-4 mr-1" />
                  {crew.location}
                </div>
                
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="h-4 w-4 mr-1" />
                  Опыт: {crew.experience_years} лет
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  {crew.team_size} специалистов
                </div>

                <div className="flex flex-wrap gap-1">
                  {(crew.specializations || []).slice(0, 3).map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {(crew.specializations || []).length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{(crew.specializations || []).length - 3}
                    </Badge>
                  )}
                </div>

                <div className="text-lg font-semibold text-green-600">
                  от {crew.hourly_rate.toLocaleString()} ₽/услуги
                </div>

                <div className="flex space-x-2 pt-2">
                  <Link href={`/crews/${crew.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Подробнее
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      // Логика открытия чата
                      console.log(`Открыть чат с ${crew.name}`);
                    }}
                  >
                    <MessageCircle className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>

        {crews.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">Бригады не найдены</p>
          </div>
        )}
      </div>
    </>
  );
}