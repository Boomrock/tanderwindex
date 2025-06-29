import { Helmet } from 'react-helmet';
import { Link, useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, MessageCircle, Phone, Mail, MapPin, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface Crew {
  id: number;
  name: string;
  specialty: string;
  experience: number;
  daily_rate: number;
  member_count: number;
  rating: number;
  reviewCount: number;
  location: string;
  description: string;
  specializations: string[];
  phone?: string;
  email?: string;
  avatar?: string;
  isAvailable: boolean;
  completedProjects: number;
  portfolio: string[];
}

export default function CrewDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: crew, isLoading } = useQuery<Crew>({
    queryKey: [`/api/crews/${id}`],
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Загрузка...</div>;
  }

  if (!crew) {
    return <div className="container mx-auto px-4 py-8">Бригада не найдена</div>;
  }

  const handleChatClick = () => {
    setLocation(`/messages/new?userId=${crew.id}`);
  };

  return (
    <>
      <Helmet>
        <title>{crew.name} - Бригада | Windexs-Строй</title>
        <meta name="description" content={`Строительная бригада ${crew.name} - ${crew.specialty}. Опыт работы ${crew.experience} лет.`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/crews">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Назад к бригадам
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center">
                    {crew.avatar ? (
                      <img src={crew.avatar} alt={crew.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <Users className="h-10 w-10 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {crew.name}
                      {crew.isAvailable && (
                        <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                          Доступна
                        </Badge>
                      )}
                    </CardTitle>
                    <p className="text-lg text-gray-600 mt-1">{crew.specialty}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{crew.rating}</span>
                        <span className="text-gray-500">({crew.reviewCount} отзывов)</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Users className="h-4 w-4" />
                        <span>{crew.member_count} человек</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Описание</h3>
                    <p className="text-gray-700">{crew.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Специализации</h3>
                    <div className="flex flex-wrap gap-2">
                      {crew.specializations.map((spec, index) => (
                        <Badge key={index} variant="secondary">{spec}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{crew.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="h-4 w-4" />
                      <span>{crew.completedProjects} завершенных проектов</span>
                    </div>
                  </div>

                  {crew.portfolio && crew.portfolio.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Портфолио работ</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {crew.portfolio.map((image, index) => (
                          <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                            <img src={image} alt={`Проект ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Стоимость услуг</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-4">
                  от {crew.daily_rate.toLocaleString()} ₽/день
                </div>
                <div className="space-y-3">
                  <Button onClick={handleChatClick} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Написать сообщение
                  </Button>
                  {crew.phone && (
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Позвонить
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {(crew.phone || crew.email) && (
              <Card>
                <CardHeader>
                  <CardTitle>Контакты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {crew.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span>{crew.phone}</span>
                    </div>
                  )}
                  {crew.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span>{crew.email}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </>
  );
}