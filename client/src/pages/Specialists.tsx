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
import { Spinner } from "@/components/ui/spinner";
import { User as UserIcon, Star, Award, MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Specialists() {
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
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {specialists?.map((specialist) => (
            <SpecialistCard key={specialist.id} specialist={specialist} />
          ))}
          {(!specialists || specialists.length === 0) && (
            <div className="col-span-full text-center p-8">
              <p className="text-muted-foreground">Нет данных о специалистах</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function SpecialistCard({ specialist }: { specialist: User }) {
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

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-primary text-primary-foreground text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm text-muted-foreground">
                {specialist.rating ? specialist.rating.toFixed(1) : "Нет рейтинга"}
              </span>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4">
          {getDescription()}
        </CardDescription>
        
        <div className="space-y-2 text-sm">
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

        <div className="flex items-center justify-between mt-4">
          <Badge variant={specialist.is_verified ? "default" : "secondary"}>
            {specialist.is_verified ? (
              <>
                <Award className="h-3 w-3 mr-1" />
                Проверен
              </>
            ) : (
              <>
                <UserIcon className="h-3 w-3 mr-1" />
                Не проверен
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}