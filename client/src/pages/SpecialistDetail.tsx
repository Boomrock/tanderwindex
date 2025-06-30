import { Helmet } from 'react-helmet';
import { Link, useParams, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Star, MessageCircle, Phone, Mail, MapPin, Calendar, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';

interface Specialist {
  id: number;
  user_id: number;
  name: string;
  specialty: string;
  experience: number;
  hourly_rate: number;
  rating: number;
  reviewCount: number;
  location: string;
  description: string;
  skills: string[];
  phone?: string;
  email?: string;
  avatar?: string;
  isOnline: boolean;
  completedProjects: number;
  portfolio: string[];
}

export default function SpecialistDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();

  const { data: specialist, isLoading } = useQuery<Specialist>({
    queryKey: [`/api/specialists/${id}`],
  });

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Загрузка...</div>;
  }

  if (!specialist) {
    return <div className="container mx-auto px-4 py-8">Специалист не найден</div>;
  }

  const handleChatClick = () => {
    setLocation(`/messages/new?userId=${specialist.user_id}`);
  };

  return (
    <>
      <Helmet>
        <title>{specialist.name} - Специалист | Windexs-Строй</title>
        <meta name="description" content={`Специалист ${specialist.name} - ${specialist.specialty}. Опыт работы ${specialist.experience} лет.`} />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/specialists">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Назад к специалистам
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
                    {specialist.avatar ? (
                      <img src={specialist.avatar} alt={specialist.name} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-500">
                        {specialist.name.charAt(0)}
                      </span>
                    )}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-2xl flex items-center gap-2">
                      {specialist.name}
                      {specialist.isOnline && (
                        <div className="h-3 w-3 bg-emerald-500 rounded-full"></div>
                      )}
                    </CardTitle>
                    <p className="text-lg text-gray-600 mt-1">{specialist.specialty}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{specialist.rating}</span>
                        <span className="text-gray-500">({specialist.reviewCount} отзывов)</span>
                      </div>
                      <div className="flex items-center gap-1 text-gray-600">
                        <Calendar className="h-4 w-4" />
                        <span>{specialist.experience} лет опыта</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h3 className="font-semibold mb-2">Описание</h3>
                    <p className="text-gray-700">{specialist.description}</p>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-2">Навыки</h3>
                    <div className="flex flex-wrap gap-2">
                      {specialist.skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">{skill}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <MapPin className="h-4 w-4" />
                      <span>{specialist.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Award className="h-4 w-4" />
                      <span>{specialist.completedProjects} завершенных проектов</span>
                    </div>
                  </div>

                  {specialist.portfolio && specialist.portfolio.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Портфолио</h3>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {specialist.portfolio.map((image, index) => (
                          <div key={index} className="aspect-square bg-gray-200 rounded-lg overflow-hidden">
                            <img src={image} alt={`Работа ${index + 1}`} className="w-full h-full object-cover" />
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
                  от {specialist.hourly_rate.toLocaleString()} ₽/час
                </div>
                <div className="space-y-3">
                  <Button onClick={handleChatClick} className="w-full">
                    <MessageCircle className="h-4 w-4 mr-2" />
                    Написать сообщение
                  </Button>
                  {specialist.phone && (
                    <Button variant="outline" className="w-full">
                      <Phone className="h-4 w-4 mr-2" />
                      Позвонить
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {(specialist.phone || specialist.email) && (
              <Card>
                <CardHeader>
                  <CardTitle>Контакты</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {specialist.phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-600" />
                      <span>{specialist.phone}</span>
                    </div>
                  )}
                  {specialist.email && (
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-600" />
                      <span>{specialist.email}</span>
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