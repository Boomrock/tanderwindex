import { useState } from "react";
import { Helmet } from "react-helmet";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Plus, X } from "lucide-react";
import { useAuth } from "@/lib/authContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const specialistProfileSchema = z.object({
  profession: z.string().min(1, "Укажите вашу профессию"),
  bio: z.string().min(10, "Расскажите о себе (минимум 10 символов)"),
  experience_years: z.number().min(0, "Опыт не может быть отрицательным").max(50, "Максимум 50 лет"),
  hourly_rate: z.number().optional(),
  project_rate: z.number().optional(),
  services: z.array(z.string()).min(1, "Добавьте хотя бы одну услугу"),
  portfolio_items: z.array(z.string()).optional(),
  location: z.string().min(1, "Укажите ваше местоположение"),
});

type SpecialistProfileForm = z.infer<typeof specialistProfileSchema>;

export default function CreateSpecialistProfile() {
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [portfolioItems, setPortfolioItems] = useState<string[]>([]);
  const [newPortfolioItem, setNewPortfolioItem] = useState("");

  const form = useForm<SpecialistProfileForm>({
    resolver: zodResolver(specialistProfileSchema),
    defaultValues: {
      profession: "",
      bio: "",
      experience_years: 0,
      services: [],
      portfolio_items: [],
      location: "",
    },
  });

  const createProfileMutation = useMutation({
    mutationFn: async (data: SpecialistProfileForm) => {
      const response = await apiRequest("POST", "/api/users/specialist-profile", {
        ...data,
        services,
        portfolio_items: portfolioItems,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Анкета создана",
        description: "Ваша анкета специалиста успешно создана",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users/top"] });
      navigate("/specialists");
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const addService = () => {
    if (newService.trim() && !services.includes(newService.trim())) {
      setServices([...services, newService.trim()]);
      setNewService("");
    }
  };

  const removeService = (service: string) => {
    setServices(services.filter(s => s !== service));
  };

  const addPortfolioItem = () => {
    if (newPortfolioItem.trim() && !portfolioItems.includes(newPortfolioItem.trim())) {
      setPortfolioItems([...portfolioItems, newPortfolioItem.trim()]);
      setNewPortfolioItem("");
    }
  };

  const removePortfolioItem = (item: string) => {
    setPortfolioItems(portfolioItems.filter(i => i !== item));
  };

  const onSubmit = (data: SpecialistProfileForm) => {
    createProfileMutation.mutate({
      ...data,
      services,
      portfolio_items: portfolioItems,
    });
  };

  if (!user) {
    return (
      <div className="container py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Требуется авторизация</h1>
          <p className="mb-4">Для создания анкеты специалиста необходимо войти в систему</p>
          <Button onClick={() => navigate("/login")}>Войти</Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Создать анкету специалиста | Windexs-Строй</title>
        <meta name="description" content="Создайте профессиональную анкету специалиста для поиска клиентов" />
      </Helmet>

      <div className="container py-8 max-w-4xl">
        {/* Навигация */}
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/specialists")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Назад к списку специалистов
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Создание анкеты специалиста</CardTitle>
            <p className="text-muted-foreground">
              Заполните информацию о ваших услугах, чтобы клиенты могли найти вас
            </p>
          </CardHeader>

          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Основная информация */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Основная информация</h3>
                  
                  <FormField
                    control={form.control}
                    name="profession"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Профессия *</FormLabel>
                        <FormControl>
                          <Input placeholder="Например: Каменщик, Электрик, Сантехник" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>О себе *</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Расскажите о своем опыте, специализации и подходе к работе..."
                            className="min-h-24"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="experience_years"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Опыт работы (лет) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              max="50"
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Местоположение *</FormLabel>
                          <FormControl>
                            <Input placeholder="Город, регион" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Стоимость услуг */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Стоимость услуг</h3>
                  <p className="text-sm text-muted-foreground">
                    Укажите один из вариантов оплаты (можете оставить пустым, если цена договорная)
                  </p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="hourly_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Стоимость за час (₽)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Например: 1500"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="project_rate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Стоимость проекта от (₽)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="0"
                              placeholder="Например: 50000"
                              {...field}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <Separator />

                {/* Услуги */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Предоставляемые услуги *</h3>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Добавить услугу"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                    />
                    <Button type="button" onClick={addService} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {services.map((service, index) => (
                      <Badge key={index} variant="secondary" className="px-3 py-1">
                        {service}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="ml-2 h-auto p-0"
                          onClick={() => removeService(service)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>

                  {services.length === 0 && (
                    <p className="text-sm text-red-500">Добавьте хотя бы одну услугу</p>
                  )}
                </div>

                <Separator />

                {/* Портфолио */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Портфолио (необязательно)</h3>
                  <p className="text-sm text-muted-foreground">
                    Опишите выполненные проекты для демонстрации вашего опыта
                  </p>
                  
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Описание выполненного проекта"
                      value={newPortfolioItem}
                      onChange={(e) => setNewPortfolioItem(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addPortfolioItem())}
                    />
                    <Button type="button" onClick={addPortfolioItem} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {portfolioItems.map((item, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm">{item}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removePortfolioItem(item)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                {/* Кнопки */}
                <div className="flex space-x-4">
                  <Button
                    type="submit"
                    disabled={createProfileMutation.isPending || services.length === 0}
                    className="flex-1"
                  >
                    {createProfileMutation.isPending ? "Создание..." : "Создать анкету"}
                  </Button>
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate("/specialists")}
                  >
                    Отмена
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </>
  );
}