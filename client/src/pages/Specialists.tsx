import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MessageCircle, Plus, User, MapPin, Clock } from "lucide-react";
import { Link } from "wouter";

interface Specialist {
  id: number;
  name: string;
  avatar?: string;
  specialty: string;
  experience: number;
  rating: number;
  reviewCount: number;
  location: string;
  hourlyRate: number;
  services: string[];
  isOnline: boolean;
  description: string;
}

export default function Specialists() {
  const [filter, setFilter] = useState<string>("all");

  // В реальном приложении здесь будет запрос к API
  const { data: specialists = [], isLoading } = useQuery<Specialist[]>({
    queryKey: ["/api/specialists", filter],
    queryFn: async () => {
      // Временные данные для демонстрации
      return [
        {
          id: 1,
          name: "Иван Петров",
          avatar: "",
          specialty: "Электрик",
          experience: 8,
          rating: 4.9,
          reviewCount: 127,
          location: "Москва",
          hourlyRate: 2500,
          services: ["Проводка", "Освещение", "Розетки"],
          isOnline: true,
          description: "Профессиональный электрик с 8-летним опытом работы..."
        },
        {
          id: 2,
          name: "Сергей Иванов",
          avatar: "",
          specialty: "Сантехник",
          experience: 12,
          rating: 4.8,
          reviewCount: 89,
          location: "Санкт-Петербург",
          hourlyRate: 3000,
          services: ["Водопровод", "Отопление", "Канализация"],
          isOnline: false,
          description: "Опытный сантехник, специализируюсь на сложных системах..."
        }
      ];
    }
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
            <h1 className="text-4xl font-bold mb-4">Специалисты</h1>
            <p className="text-gray-600 text-lg">
              Найдите квалифицированных строительных специалистов
            </p>
          </div>
          <Link href="/specialists/create">
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Добавить объявление
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {specialists.map((specialist) => (
            <Card key={specialist.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center space-x-3">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={specialist.avatar} />
                    <AvatarFallback>
                      <User className="h-6 w-6" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-lg">{specialist.name}</CardTitle>
                    <p className="text-sm text-gray-600">{specialist.specialty}</p>
                    <div className="flex items-center mt-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm ml-1">{specialist.rating}</span>
                      <span className="text-sm text-gray-500 ml-1">
                        ({specialist.reviewCount})
                      </span>
                      {specialist.isOnline && (
                        <div className="ml-2 h-2 w-2 bg-emerald-500 rounded-full"></div>
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
                  Опыт: {specialist.experience} лет
                </div>

                <div className="flex flex-wrap gap-1">
                  {specialist.services.slice(0, 3).map((service) => (
                    <Badge key={service} variant="secondary" className="text-xs">
                      {service}
                    </Badge>
                  ))}
                </div>

                <div className="text-lg font-semibold text-primary">
                  от {specialist.hourlyRate.toLocaleString()} ₽/час
                </div>

                <div className="flex space-x-2 pt-2">
                  <Link href={`/specialists/${specialist.id}`} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Подробнее
                    </Button>
                  </Link>
                  <Button 
                    size="sm" 
                    className="bg-primary hover:bg-primary/90"
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