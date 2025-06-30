import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, Plus, Users, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";

interface Crew {
  id: number;
  name: string;
  avatar?: string;
  specialty: string;
  experience: number;
  rating: number;
  reviewCount: number;
  location: string;
  dailyRate: number;
  memberCount: number;
  services: string[];
  isAvailable: boolean;
  description: string;
}

export default function Crews() {
  const [filter, setFilter] = useState<string>("all");

  // В реальном приложении здесь будет запрос к API
  const { data: crews = [], isLoading } = useQuery<Crew[]>({
    queryKey: ["/api/crews", filter],
    queryFn: async () => {
      // Временные данные для демонстрации
      return [
        {
          id: 1,
          name: "Бригада \"Строймастер\"",
          avatar: "",
          specialty: "Отделочные работы",
          experience: 15,
          rating: 4.9,
          reviewCount: 84,
          location: "Москва",
          dailyRate: 25000,
          memberCount: 6,
          services: ["Штукатурка", "Покраска", "Обои", "Плитка"],
          isAvailable: true,
          description: "Профессиональная бригада отделочников с большим опытом..."
        },
        {
          id: 2,
          name: "Строительная бригада \"Мастер+\"",
          avatar: "",
          specialty: "Общестроительные работы",
          experience: 20,
          rating: 4.8,
          reviewCount: 156,
          location: "Санкт-Петербург",
          dailyRate: 35000,
          memberCount: 8,
          services: ["Кирпичная кладка", "Бетонные работы", "Кровля"],
          isAvailable: false,
          description: "Опытная строительная бригада, выполняем работы любой сложности..."
        }
      ];
    }
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-4 text-green-600">Бригады</h1>
            <p className="text-gray-600 text-lg">
              Найдите профессиональные строительные бригады для ваших проектов
            </p>
          </div>
          <Link href="/crews/create">
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="h-4 w-4 mr-2" />
              Добавить бригаду
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {crews.map((crew) => (
            <Card key={crew.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={crew.avatar} />
                    <AvatarFallback>
                      <Users className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{crew.name}</CardTitle>
                    <p className="text-sm text-gray-600">{crew.specialty}</p>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">{crew.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({crew.reviewCount})
                      </span>
                      {crew.isAvailable && (
                        <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                          Доступна
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
                  Опыт: {crew.experience} лет
                </div>

                <div className="flex items-center text-sm text-gray-600">
                  <Users className="h-4 w-4 mr-1" />
                  {crew.memberCount} специалистов
                </div>

                <div className="flex flex-wrap gap-1">
                  {crew.services.slice(0, 3).map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                  {crew.services.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{crew.services.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="text-lg font-semibold text-green-600">
                  от {crew.dailyRate.toLocaleString()} ₽/день
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