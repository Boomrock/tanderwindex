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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function TopSpecialists() {
  const {
    data: individuals,
    isLoading: isLoadingIndividuals,
    error: individualsError,
  } = useQuery<User[]>({
    queryKey: ["/api/users/top?personType=individual"],
  });

  const {
    data: companies,
    isLoading: isLoadingCompanies,
    error: companiesError,
  } = useQuery<User[]>({
    queryKey: ["/api/users/top?personType=company"],
  });

  const isLoading = isLoadingIndividuals || isLoadingCompanies;
  const error = individualsError || companiesError;

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
          <p className="text-red-700">Не удалось загрузить данные о лучших специалистах</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Лучшие специалисты | Windex-Строй</title>
        <meta
          name="description"
          content="Лучшие специалисты и компании в сфере строительства с высоким рейтингом и обширным портфолио выполненных проектов"
        />
      </Helmet>

      <div className="container py-12">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold mb-4">Лучшие специалисты</h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Проверенные мастера и компании с высоким рейтингом и большим количеством выполненных проектов
          </p>
        </div>

        <Tabs defaultValue="individuals" className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="individuals">Физические лица</TabsTrigger>
            <TabsTrigger value="companies">Юридические лица</TabsTrigger>
          </TabsList>
          
          <TabsContent value="individuals" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {individuals?.map((specialist) => (
                <SpecialistCard key={specialist.id} specialist={specialist} />
              ))}
              {(!individuals || individuals.length === 0) && (
                <div className="col-span-full text-center p-8">
                  <p className="text-muted-foreground">Нет данных о лучших специалистах</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="companies" className="mt-8">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {companies?.map((company) => (
                <SpecialistCard key={company.id} specialist={company} />
              ))}
              {(!companies || companies.length === 0) && (
                <div className="col-span-full text-center p-8">
                  <p className="text-muted-foreground">Нет данных о лучших компаниях</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

interface SpecialistCardProps {
  specialist: User;
}

function SpecialistCard({ specialist }: SpecialistCardProps) {
  const getDisplayName = () => {
    if (specialist.fullName) return specialist.fullName;
    if (specialist.firstName && specialist.lastName) 
      return `${specialist.firstName} ${specialist.lastName}`;
    return specialist.username || "Неизвестный пользователь";
  };

  const getInitials = () => {
    const name = getDisplayName();
    if (name === "Неизвестный пользователь") {
      return specialist.userType === 'company' ? 'ЮЛ' : 'ФЛ';
    }
    const words = name.split(' ');
    return words.map(word => word.charAt(0)).join('').toUpperCase().substring(0, 2);
  };

  const getDescription = () => {
    if (specialist.bio) return specialist.bio;
    if (specialist.profession) return `Специализация: ${specialist.profession}`;
    return "Информация о специалисте отсутствует";
  };

  return (
    <Card className="h-full transition-all hover:shadow-lg border-0 shadow-md">
      <CardHeader className="pb-4">
        <div className="flex items-start gap-4">
          <Avatar className="h-16 w-16 border-2 border-primary/20">
            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground text-lg font-semibold">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-bold mb-2 line-clamp-1">
              {getDisplayName()}
            </CardTitle>
            
            <div className="flex flex-wrap gap-2 mb-3">
              <Badge variant="outline" className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 stroke-yellow-400" />
                <span>{(specialist.rating || 0).toFixed(1)}</span>
              </Badge>
              <Badge variant="secondary" className="flex items-center gap-1">
                <Award className="h-3 w-3" />
                <span>{specialist.completedProjects || 0} проектов</span>
              </Badge>
            </div>

            <Badge 
              variant={specialist.userType === "individual" ? "default" : "outline"} 
              className="mb-2"
            >
              {specialist.userType === "individual" ? "Физическое лицо" : "Юридическое лицо"}
            </Badge>

            {specialist.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-2">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{specialist.location}</span>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <CardDescription className="line-clamp-3 text-sm leading-relaxed">
          {getDescription()}
        </CardDescription>
        
        {specialist.profession && (
          <div className="mt-3 pt-3 border-t">
            <Badge variant="outline" className="text-xs">
              {specialist.profession}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}