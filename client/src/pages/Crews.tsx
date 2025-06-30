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
import { Users, Star, Award, MapPin, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Crews() {
  const {
    data: crews,
    isLoading,
    error,
  } = useQuery<User[]>({
    queryKey: ["/api/users/top?personType=company"],
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
          <p className="text-red-700">Не удалось загрузить данные о бригадах</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Бригады | Windexs-Строй</title>
        <meta
          name="description"
          content="Проверенные строительные бригады и компании с высоким рейтингом и портфолио выполненных проектов"
        />
      </Helmet>

      <div className="container py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Бригады</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Проверенные строительные бригады и компании с высоким рейтингом и обширным портфолио выполненных проектов
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {crews?.map((crew) => (
            <CrewCard key={crew.id} crew={crew} />
          ))}
          {(!crews || crews.length === 0) && (
            <div className="col-span-full text-center p-8">
              <p className="text-muted-foreground">Нет данных о бригадах</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function CrewCard({ crew }: { crew: User }) {
  const getDisplayName = () => {
    if (crew.first_name && crew.last_name) {
      return `${crew.first_name} ${crew.last_name}`;
    }
    if (crew.username) {
      return crew.username;
    }
    return "Неизвестная компания";
  };

  const name = getDisplayName();

  const getInitials = (name: string) => {
    if (name === "Неизвестная компания") {
      return 'БР';
    }
    const words = name.split(' ');
    return words.map((word: string) => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  const getDescription = () => {
    if (crew.bio) return crew.bio;
    if (crew.profession) return `Специализация: ${crew.profession}`;
    return "Информация о бригаде отсутствует";
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-center space-x-4">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="bg-blue-600 text-white text-lg">
              {getInitials(name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <CardTitle className="text-lg">{name}</CardTitle>
            <div className="flex items-center space-x-2 mt-1">
              <Star className="h-4 w-4 text-yellow-500 fill-current" />
              <span className="text-sm text-muted-foreground">
                {crew.rating ? crew.rating.toFixed(1) : "Нет рейтинга"}
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
          {crew.location && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <MapPin className="h-4 w-4" />
              <span>{crew.location}</span>
            </div>
          )}
          
          {crew.completed_projects && (
            <div className="flex items-center space-x-2 text-muted-foreground">
              <Briefcase className="h-4 w-4" />
              <span>Выполнено проектов: {crew.completed_projects}</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between mt-4">
          <Badge variant={crew.is_verified ? "default" : "secondary"}>
            {crew.is_verified ? (
              <>
                <Award className="h-3 w-3 mr-1" />
                Проверена
              </>
            ) : (
              <>
                <Users className="h-3 w-3 mr-1" />
                Не проверена
              </>
            )}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}