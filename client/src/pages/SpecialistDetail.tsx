import { useParams, Link } from "wouter";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User as UserIcon, 
  Star, 
  Award, 
  MapPin, 
  Briefcase, 
  MessageCircle, 
  Phone, 
  Mail,
  Calendar,
  ArrowLeft,
  Clock,
  RussianRuble
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function SpecialistDetail() {
  const { id } = useParams();
  
  // Демонстрационные данные (в реальном проекте - запрос к API)
  const getSpecialistData = (id: string) => {
    const specialists = {
      "1": {
        id: 1,
        username: "ivan_builder",
        first_name: "Иван",
        last_name: "Петров", 
        profession: "Каменщик",
        bio: "Опытный каменщик с 15-летним стажем. Специализируюсь на кладке кирпича, блоков, декоративного камня. Работаю как с частными заказчиками, так и со строительными компаниями.",
        location: "Москва",
        rating: 4.8,
        completed_projects: 127,
        is_verified: true,
        userType: "individual",
        hourly_rate: 2500,
        experience_years: 15,
        phone: "+7 (903) 123-45-67",
        email: "ivan.petrov@example.com",
        services: [
          "Кладка кирпича",
          "Кладка блоков",
          "Декоративная кладка",
          "Ремонт кладки",
          "Облицовка камнем"
        ],
        portfolio: [
          "Частный дом 150 кв.м - кладка несущих стен",
          "Коттедж в Подмосковье - декоративная отделка",
          "Ремонт фасада многоквартирного дома",
          "Строительство бани из кирпича"
        ],
        reviews: [
          {
            id: 1,
            author: "Анна К.",
            rating: 5,
            text: "Отличная работа! Иван выполнил кладку стен качественно и в срок.",
            date: "2024-06-15"
          },
          {
            id: 2,
            author: "Михаил С.",
            rating: 5,
            text: "Профессионал своего дела. Рекомендую!",
            date: "2024-05-20"
          }
        ]
      },
      "2": {
        id: 2,
        username: "elena_design",
        first_name: "Елена",
        last_name: "Смирнова",
        profession: "Дизайнер интерьеров",
        bio: "Создаю уютные и функциональные интерьеры. Работаю в современном и классическом стилях. Помогу воплотить ваши мечты в реальность.",
        location: "Санкт-Петербург",
        rating: 4.9,
        completed_projects: 89,
        is_verified: true,
        userType: "individual",
        project_rate: 50000,
        experience_years: 8,
        phone: "+7 (921) 987-65-43",
        email: "elena.design@example.com",
        services: [
          "Дизайн квартир",
          "Дизайн домов",
          "Дизайн офисов",
          "3D визуализация",
          "Авторский надзор"
        ],
        portfolio: [
          "Квартира-студия 45 кв.м в современном стиле",
          "Загородный дом 200 кв.м в классическом стиле",
          "Офис IT-компании 300 кв.м",
          "Детская комната для двоих детей"
        ],
        reviews: [
          {
            id: 1,
            author: "Мария П.",
            rating: 5,
            text: "Елена превратила нашу квартиру в произведение искусства!",
            date: "2024-06-10"
          }
        ]
      },
      "3": {
        id: 3,
        username: "alex_electric",
        first_name: "Александр",
        last_name: "Кузнецов",
        profession: "Электрик",
        bio: "Электромонтажные работы любой сложности. Подключение, ремонт, модернизация электросетей. Работаю с соблюдением всех норм безопасности.",
        location: "Екатеринбург",
        rating: 4.7,
        completed_projects: 203,
        is_verified: true,
        userType: "individual",
        hourly_rate: 1800,
        experience_years: 12,
        phone: "+7 (343) 555-12-34",
        email: "alex.electric@example.com",
        services: [
          "Замена проводки",
          "Установка щитков",
          "Подключение бытовой техники",
          "Монтаж освещения",
          "Ремонт электрооборудования"
        ],
        portfolio: [
          "Полная замена проводки в 3-комнатной квартире",
          "Монтаж электросистемы в частном доме",
          "Установка системы умный дом",
          "Подключение промышленного оборудования"
        ],
        reviews: [
          {
            id: 1,
            author: "Дмитрий В.",
            rating: 5,
            text: "Качественно и быстро заменил всю проводку. Рекомендую!",
            date: "2024-06-01"
          }
        ]
      }
    };
    
    return specialists[id as keyof typeof specialists];
  };

  const specialist = getSpecialistData(id!);

  if (!specialist) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Специалист не найден</h1>
          <Link href="/specialists">
            <Button variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к списку
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const getDisplayName = () => {
    return `${specialist.first_name} ${specialist.last_name}`;
  };

  const getInitials = (name: string) => {
    const words = name.split(' ');
    return words.map((word: string) => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  const getPriceInfo = () => {
    const spec = specialist as any;
    if (spec.hourly_rate) {
      return `${spec.hourly_rate.toLocaleString()} ₽/час`;
    }
    if (spec.project_rate) {
      return `от ${spec.project_rate.toLocaleString()} ₽/проект`;
    }
    return "Цена договорная";
  };

  const name = getDisplayName();

  return (
    <>
      <Helmet>
        <title>{name} - {specialist.profession} | Windexs-Строй</title>
        <meta name="description" content={specialist.bio} />
      </Helmet>

      <div className="container py-8">
        {/* Навигация */}
        <div className="mb-6">
          <Link href="/specialists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Назад к списку специалистов
            </Button>
          </Link>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Основная информация */}
          <div className="lg:col-span-2 space-y-6">
            {/* Профиль специалиста */}
            <Card>
              <CardHeader>
                <div className="flex items-start space-x-6">
                  {/* Фото */}
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <UserIcon className="h-16 w-16 text-white" />
                  </div>
                  
                  {/* Основная информация */}
                  <div className="flex-1">
                    <CardTitle className="text-2xl mb-2">{name}</CardTitle>
                    <p className="text-lg text-muted-foreground mb-3">{specialist.profession}</p>
                    
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-5 w-5 text-yellow-500 fill-current" />
                        <span className="font-semibold">{specialist.rating.toFixed(1)}</span>
                        <span className="text-sm text-muted-foreground">({specialist.reviews.length} отзывов)</span>
                      </div>
                      
                      <Badge variant={specialist.is_verified ? "default" : "secondary"}>
                        {specialist.is_verified ? (
                          <>
                            <Award className="h-3 w-3 mr-1" />
                            Проверен
                          </>
                        ) : (
                          "Не проверен"
                        )}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span>{specialist.location}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                        <span>{specialist.completed_projects} проектов</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{specialist.experience_years} лет опыта</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <p className="text-gray-700 leading-relaxed">{specialist.bio}</p>
              </CardContent>
            </Card>

            {/* Услуги */}
            <Card>
              <CardHeader>
                <CardTitle>Предоставляемые услуги</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {specialist.services.map((service, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                      <span>{service}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Портфолио */}
            <Card>
              <CardHeader>
                <CardTitle>Выполненные проекты</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {specialist.portfolio.map((project, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <p>{project}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Отзывы */}
            <Card>
              <CardHeader>
                <CardTitle>Отзывы клиентов</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {specialist.reviews.map((review) => (
                    <div key={review.id} className="border-b border-gray-100 last:border-b-0 pb-4 last:pb-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold">{review.author}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-4 w-4 ${i < review.rating ? 'text-yellow-500 fill-current' : 'text-gray-300'}`} 
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
                      </div>
                      <p className="text-gray-700">{review.text}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Боковая панель */}
          <div className="space-y-6">
            {/* Стоимость и контакты */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <RussianRuble className="h-5 w-5" />
                  <span>Стоимость работ</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary mb-4">
                  {getPriceInfo()}
                </div>
                
                <div className="space-y-3 mb-6">
                  <div className="flex items-center space-x-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>Быстрый отклик</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Award className="h-4 w-4 text-muted-foreground" />
                    <span>Гарантия качества</span>
                  </div>
                </div>

                <div className="space-y-3">
                  <Link href={`/messages/new?userId=${specialist.id}`}>
                    <Button className="w-full" size="lg">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Написать сообщение
                    </Button>
                  </Link>
                  
                  <Button variant="outline" className="w-full" size="lg">
                    <Phone className="h-4 w-4 mr-2" />
                    Показать телефон
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Контактная информация */}
            <Card>
              <CardHeader>
                <CardTitle>Контакты</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center space-x-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{specialist.phone}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{specialist.email}</span>
                </div>
                <div className="flex items-center space-x-3">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{specialist.location}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}