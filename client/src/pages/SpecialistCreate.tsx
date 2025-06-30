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
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const specialistSchema = z.object({
  name: z.string().min(2, "Имя должно содержать минимум 2 символа"),
  specialty: z.string().min(1, "Выберите специальность"),
  experience: z.number().min(0, "Опыт не может быть отрицательным").max(50, "Максимальный опыт 50 лет"),
  location: z.string().min(1, "Укажите город"),
  hourlyRate: z.number().min(100, "Минимальная ставка 100 рублей").max(50000, "Максимальная ставка 50,000 рублей"),
  description: z.string().min(50, "Описание должно содержать минимум 50 символов"),
  phone: z.string().optional(),
  email: z.string().optional().refine((val) => !val || z.string().email().safeParse(val).success, {
    message: "Некорректный email"
  })
});

type SpecialistFormData = z.infer<typeof specialistSchema>;

const specialties = [
  "Электрик",
  "Сантехник", 
  "Плотник",
  "Маляр",
  "Плиточник",
  "Штукатур",
  "Кровельщик",
  "Каменщик",
  "Сварщик",
  "Дизайнер интерьера"
];

export default function SpecialistCreate() {
  const [, setLocation] = useLocation();
  const [services, setServices] = useState<string[]>([]);
  const [newService, setNewService] = useState("");
  const [avatar, setAvatar] = useState<string>("");
  const { toast } = useToast();

  const form = useForm<SpecialistFormData>({
    resolver: zodResolver(specialistSchema),
    defaultValues: {
      name: "",
      specialty: "",
      experience: 0,
      location: "",
      hourlyRate: 1000,
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

  // Mutation for creating specialist
  const createSpecialistMutation = useMutation({
    mutationFn: async (data: SpecialistFormData) => {
      const specialistData = {
        name: data.name,
        specialty: data.specialty,
        experience: Number(data.experience),
        hourlyRate: Number(data.hourlyRate), // Ensure it's a number
        location: data.location,
        description: data.description,
        skills: services.join(','), // Convert services array to comma-separated string
        phone: data.phone,
        email: data.email,
        avatar: avatar || null,
        portfolio: '' // Empty portfolio for now as string
      };
      
      console.log("Создание объявления специалиста:", specialistData);
      console.log("hourlyRate value:", data.hourlyRate, "type:", typeof data.hourlyRate);
      console.log("converted hourlyRate:", Number(data.hourlyRate));
      
      const response = await apiRequest('POST', '/api/specialists', specialistData);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Ошибка создания специалиста');
      }
      
      // Проверяем, что ответ действительно содержит JSON
      const responseText = await response.text();
      console.log("Текст ответа сервера:", responseText);
      
      if (!responseText || responseText.trim() === '') {
        // Если ответ пустой, считаем операцию успешной
        return { success: true };
      }
      
      try {
        const result = JSON.parse(responseText);
        console.log("Распарсенный ответ сервера:", result);
        return result;
      } catch (parseError) {
        console.error("Ошибка парсинга JSON:", parseError);
        console.error("Проблемный текст:", responseText);
        // Если не можем распарсить, но статус успешный, считаем операцию выполненной
        return { success: true };
      }
    },
    onSuccess: () => {
      toast({
        title: 'Объявление создано',
        description: 'Ваше объявление отправлено на модерацию и появится в списке после одобрения.',
      });
      setLocation("/specialists");
    },
    onError: (error: any) => {
      console.error("Полная ошибка:", error);
      console.error("Стек ошибки:", error.stack);
      toast({
        title: 'Ошибка создания',
        description: error.message || 'Не удалось создать объявление',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: SpecialistFormData) => {
    createSpecialistMutation.mutate(data);
  };

  return (
    <>
      <Helmet>
        <title>Создать объявление специалиста | Windexs-Строй</title>
        <meta name="description" content="Создайте объявление специалиста для поиска работы в строительной сфере" />
      </Helmet>

      <div className="container py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="text-2xl">Создать объявление специалиста</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Фотография */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Фотография</label>
                  <div className="flex items-center space-x-4">
                    {avatar ? (
                      <img src={avatar} alt="Аватар" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-gray-400" />
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Имя *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ваше полное имя" {...field} />
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
                      <FormLabel>Специальность *</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Выберите специальность" />
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

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="experience"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Опыт работы (лет) *</FormLabel>
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
                    name="hourlyRate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ставка (₽/час) *</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="1000" 
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
                          placeholder="Расскажите о своем опыте, квалификации и выполненных проектах..."
                          rows={6}
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex space-x-4">
                  <Button type="submit" className="flex-1" disabled={createSpecialistMutation.isPending}>
                    {createSpecialistMutation.isPending ? 'Создание...' : 'Создать объявление'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setLocation("/specialists")}>
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