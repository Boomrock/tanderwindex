import { useQuery } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { User } from "@shared/schema";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { User as UserIcon, Star, Award, MapPin, Briefcase, MessageCircle, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { useAuth } from "@/lib/authContext";

export default function Specialists() {
  const { user, isAuthenticated } = useAuth();
  
  const {
    data: specialists,
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["/api/users/top?personType=individual"],
  });

  if (isLoading) {
    return (
      <div className="container py-12 flex items-center justify-center min-h-[50vh]">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container py-12">
        <div className="bg-red-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-red-800 mb-2">Ошибка</h2>
          <p className="text-red-700">Не удалось загрузить данные о специалистах</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Специалисты | Windexs-Строй</title>
        <meta
          name="description"
          content="Проверенные индивидуальные специалисты в сфере строительства с высоким рейтингом и портфолио выполненных проектов"
        />
      </Helmet>

      <div className="container py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Специалисты</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Проверенные индивидуальные мастера с высоким рейтингом и обширным портфолио выполненных проектов
          </p>
          
          {isAuthenticated && (
            <div className="mt-6">
              <Link href="/profile/create-specialist">
                <Button size="lg" className="px-8">
                  <UserIcon className="h-5 w-5 mr-2" />
                  Создать анкету специалиста
                </Button>
              </Link>
            </div>
          )}
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {specialists?.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
          {(!specialists || specialists.length === 0) && (
            <div className="col-span-full">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {/* Демонстрационные карточки специалистов */}
                <SpecialistCard specialist={{
                  id: 1,
                  username: "ivan_builder",
                  first_name: "Иван",
                  last_name: "Петров",
                  profession: "Каменщик",
                  bio: "Опытный каменщик с 15-летним стажем. Специализируюсь на кладке кирпича, блоков, декоративного камня.",
                  location: "Москва",
                  rating: 4.8,
                  completed_projects: 127,
                  is_verified: true,
                  userType: "individual",
                  hourly_rate: 2500
                }} />
                
                <SpecialistCard specialist={{
                  id: 2,
                  username: "elena_design",
                  first_name: "Елена",
                  last_name: "Смирнова",
                  profession: "Дизайнер интерьеров",
                  bio: "Создаю уютные и функциональные интерьеры. Работаю в современном и классическом стилях.",
                  location: "Санкт-Петербург",
                  rating: 4.9,
                  completed_projects: 89,
                  is_verified: true,
                  userType: "individual",
                  project_rate: 50000
                }} />
                
                <SpecialistCard specialist={{
                  id: 3,
                  username: "alex_electric",
                  first_name: "Александр",
                  last_name: "Кузнецов",
                  profession: "Электрик",
                  bio: "Электромонтажные работы любой сложности. Подключение, ремонт, модернизация электросетей.",
                  location: "Екатеринбург",
                  rating: 4.7,
                  completed_projects: 203,
                  is_verified: true,
                  userType: "individual",
                  hourly_rate: 1800
                }} />
              </div>
              
              {!isAuthenticated && (
                <div className="text-center mt-8 p-6 bg-gray-50 rounded-lg">
                  <p className="text-muted-foreground mb-4">
                    Хотите разместить свою анкету специалиста?
                  </p>
                  <Link href="/login">
                    <Button variant="outline">
                      Войти в систему
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SpecialistCard({ specialist }: { specialist: User & { hourly_rate?: number; project_rate?: number } }) {
  const getDisplayName = () => {
    if (specialist.first_name && specialist.last_name) {
      return `${specialist.first_name} ${specialist.last_name}`;
    }
    if (specialist.username) {
      return specialist.username;
    }
    return "Неизвестный пользователь";
  };

  const name = getDisplayName();

  const getInitials = (name: string) => {
    if (name === "Неизвестный пользователь") {
      return 'СП';
    }
    const words = name.split(' ');
    return words.map((word: string) => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  const getDescription = () => {
    if (specialist.bio) return specialist.bio;
    if (specialist.profession) return `Специализация: ${specialist.profession}`;
    return "Информация о специалисте отсутствует";
  };

  const getPriceInfo = () => {
    if (specialist.hourly_rate) {
      return `${specialist.hourly_rate.toLocaleString()} ₽/час`;
    }
    if (specialist.project_rate) {
      return `от ${specialist.project_rate.toLocaleString()} ₽/проект`;
    }
    return "Цена договорная";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow overflow-hidden">
      {/* Заглушка фотографии с градиентом */}
      <div className="h-48 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative">
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="text-white text-center">
            <UserIcon className="h-16 w-16 mx-auto mb-2 opacity-80" />
            <p className="text-sm opacity-90">Фото специалиста</p>
          </div>
        </div>
      </div>

      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <p className="text-sm text-muted-foreground">{specialist.profession}</p>
            <div className="flex items-center space-x-2 mt-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm text-muted-foreground">
                {specialist.rating ? specialist.rating.toFixed(1) : "Нет рейтинга"}
              </span>
            </div>
          </div>
          <Badge variant={specialist.is_verified ? "default" : "secondary"} className="text-xs">
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
      </CardHeader>

      <CardContent className="pt-0">
        <CardDescription className="mb-4 line-clamp-3">
          {getDescription()}
        </CardDescription>
        
        <div className="space-y-2 text-sm mb-4">
          {specialist.location && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{specialist.location}</span>
            </div>
          )}
          
          {specialist.completed_projects && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>Выполнено проектов: {specialist.completed_projects}</span>
            </div>
          )}
        </div>

        <div className="bg-gray-50 -mx-6 -mb-6 px-6 py-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-lg text-primary">
              {getPriceInfo()}
            </span>
          </div>
          
          <div className="flex space-x-2">
            <Link href={`/specialists/${specialist.id}`} className="flex-1">
              <Button variant="outline" size="sm" className="w-full">
                <Eye className="h-4 w-4 mr-2" />
                Подробнее
              </Button>
            </Link>
            <Link href={`/messages/new?userId=${specialist.id}`} className="flex-1">
              <Button size="sm" className="w-full">
                <MessageCircle className="h-4 w-4 mr-2" />
                Чат
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}