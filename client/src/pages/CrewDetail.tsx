import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { 
  MapPin, 
  Clock, 
  Star, 
  MessageCircle, 
  Phone, 
  Mail, 
  Award,
  Users,
  ArrowLeft,
  Calendar,
  DollarSign
} from "lucide-react";

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

export default function CrewDetail() {
  const params = useParams();
  const crewId = params.id;

  const { data: crew, isLoading } = useQuery<Crew>({
    queryKey: ["/api/crews", crewId],
    queryFn: async () => {
      const response = await fetch(`/api/crews/${crewId}`);
      if (!response.ok) {
        throw new Error('Бригада не найдена');
      }
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Бригада не найдена</h1>
          <Link href="/crews">
            <Button>Вернуться к списку бригад</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{crew.name} | Windexs-Строй</title>
        <meta name="description" content={crew.description} />
      </Helmet>

      <div className="container py-8">
        <div className="mb-6">
          <Link href="/crews">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к бригадам
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start space-x-4">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={crew.images?.[0]} />
                    <AvatarFallback>
                      <Users className="h-10 w-10" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{crew.name}</CardTitle>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        {crew.location}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        {crew.experience_years} лет опыта
                      </div>
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {crew.team_size} специалистов
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                        <span className="font-semibold">{crew.user.rating}</span>
                      </div>
                      <span className="text-sm text-gray-600">
                        {crew.user.completedProjects} проектов
                      </span>
                      {crew.user.isVerified && (
                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                          <Award className="h-3 w-3 mr-1" />
                          Проверена
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Описание</h3>
                    <p className="text-gray-700 leading-relaxed">{crew.description}</p>
                  </div>

                  <Separator />

                  <div>
                    <h3 className="font-semibold mb-3">Специализации</h3>
                    <div className="flex flex-wrap gap-2">
                      {(crew.specializations || []).map((spec) => (
                        <Badge key={spec} variant="secondary">
                          {spec}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {crew.images && crew.images.length > 1 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3">Портфолио работ</h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          {crew.images.slice(1).map((image, index) => (
                            <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                              <img 
                                src={`/api/files/${image}`} 
                                alt={`Работа ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Стоимость услуг</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    от {crew.hourly_rate.toLocaleString()} ₽/час
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    Стоимость за работу всей бригады
                  </p>
                  <div className="space-y-2">
                    <Button className="w-full bg-green-600 hover:bg-green-700">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Написать сообщение
                    </Button>
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Показать телефон
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Информация о бригаде</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Руководитель</span>
                  <span className="font-medium">{crew.user.username}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Размер бригады</span>
                  <span className="font-medium">{crew.team_size} человек</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Рейтинг</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                    <span className="font-medium">{crew.user.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Выполнено проектов</span>
                  <span className="font-medium">{crew.user.completedProjects}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Опыт работы</span>
                  <span className="font-medium">{crew.experience_years} лет</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Статус</span>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                    Активна
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}