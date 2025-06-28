import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Helmet } from "react-helmet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus, Upload } from "lucide-react";
import { useLocation } from "wouter";

const crewSchema = z.object({
  name: z.string().min(3, "Название бригады должно содержать минимум 3 символа"),
  specialty: z.string().min(1, "Выберите специализацию"),
  experience: z.number().min(0, "Опыт не может быть отрицательным").max(50, "Максимальный опыт 50 лет"),
  location: z.string().min(1, "Укажите город"),
  dailyRate: z.number().min(1000, "Минимальная ставка 1000 рублей").max(500000, "Максимальная ставка 500,000 рублей"),
  memberCount: z.number().min(2, "Минимум 2 специалиста в бригаде").max(50, "Максимум 50 специалистов"),
  description: z.string().min(100, "Описание должно содержать минимум 100 символов"),
  phone: z.string().optional(),
  email: z.string().email("Некорректный email").optional()
});

type CrewFormData = z.infer<typeof crewSchema>;

const specialties = [
  "Общестроительные работы",
  "Отделочные работы",
  "Кровельные работы",
  "Фасадные работы",
  "Земляные работы",
  "Монтажные работы",
  "Сантехнические работы",
  "Электромонтажные работы",
  "Ландшафтные работы",
  "Демонтажные работы"
];

export default function CrewCreate() {
  const [, setLocation] = useLocation();
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [avatar, setAvatar] = useState<string>("");

  const form = useForm<CrewFormData>({
    resolver: zodResolver(crewSchema),
    defaultValues: {
      name: "",
      specialty: "",
      experience: 0,
      location: "",
      dailyRate: 15000,
      memberCount: 4,
      description: "",
      phone: "",
      email: ""
    }
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

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatar(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onSubmit = async (data: CrewFormData) => {
    try {
      // В реальном приложении здесь будет API запрос
      console.log("Создание объявления бригады:", {
        ...data,
        services,
        avatar
      });
      
      // Перенаправление на страницу бригад
      setLocation("/crews");
    } catch (error) {
      console.error("Ошибка создания объявления:", error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Создать объявление бригады | Windexs-Строй</title>
        <meta name="description" content="Создайте объявление строительной бригады для поиска крупных проектов" />
      </Helmet>

      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl text-green-600">Создать объявление бригады</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Фотография */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Фотография бригады</label>
                  <div className="flex items-center space-x-4">
                    {avatar ? (
                      <img src={avatar} alt="Фото бригады" className="w-20 h-20 rounded-lg object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Название бригады *</FormLabel>
                      <FormControl>
                        <Input placeholder="Строительная бригада Мастер" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Специализация *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите специализацию" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {specialties.map((specialty) => (
                            <SelectItem key={specialty} value={specialty}>
                              {specialty}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Опыт (лет) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="memberCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Количество *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="4" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="dailyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ставка (₽/день) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="15000" 
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Город *</FormLabel>
                      <FormControl>
                        <Input placeholder="Москва" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Услуги */}
                <div className="space-y-3">
                  <label className="text-sm font-medium">Выполняемые работы</label>
                  <div className="flex space-x-2">
                    <Input
                      placeholder="Добавить тип работ"
                      value={newService}
                      onChange={(e) => setNewService(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                    />
                    <Button type="button" onClick={addService} variant="outline">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {services.map((service) => (
                      <Badge key={service} variant="secondary" className="flex items-center gap-1">
                        {service}
                        <X 
                          className="h-3 w-3 cursor-pointer hover:text-red-500" 
                          onClick={() => removeService(service)}
                        />
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Телефон</FormLabel>
                        <FormControl>
                          <Input placeholder="+7 (999) 123-45-67" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Описание *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Расскажите о бригаде: опыт, квалификация участников, крупные выполненные проекты, специализация..."
                          rows={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                    Создать объявление
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setLocation("/crews")}>
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