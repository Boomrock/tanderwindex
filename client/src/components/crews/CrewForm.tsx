import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { X, Plus } from 'lucide-react';
import ImageUpload from '@/components/ui/image-upload';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';
import { apiRequest } from '@/lib/queryClient';

const crewSchema = z.object({
  title: z.string().min(10, 'Название должно содержать минимум 10 символов'),
  description: z.string().min(50, 'Описание должно содержать минимум 50 символов'),
  specialty: z.string().min(1, 'Выберите специализацию'),
  experience: z.number().min(0, 'Опыт не может быть отрицательным').max(50, 'Опыт не может превышать 50 лет'),
  memberCount: z.number().min(2, 'В бригаде должно быть минимум 2 человека').max(50, 'Максимум 50 человек'),
  dailyRate: z.number().min(5000, 'Минимальная ставка 5,000 ₽/день').max(500000, 'Максимальная ставка 500,000 ₽/день'),
  location: z.string().min(3, 'Укажите местоположение'),
});

type CrewFormData = z.infer<typeof crewSchema>;

const CREW_SPECIALTIES = [
  'Отделочные работы',
  'Общестроительные работы',
  'Кровельные работы',
  'Фасадные работы',
  'Земляные работы',
  'Монтажные работы',
  'Сантехнические работы',
  'Электромонтажные работы',
  'Бетонные работы',
  'Каменные работы',
  'Демонтажные работы',
  'Ремонтные работы',
];

const CREW_SERVICES = [
  'Штукатурка стен',
  'Покраска и побелка',
  'Укладка плитки',
  'Укладка ламината',
  'Натяжные потолки',
  'Гипсокартонные работы',
  'Кирпичная кладка',
  'Бетонирование',
  'Кровельные работы',
  'Утепление фасадов',
  'Монтаж окон',
  'Монтаж дверей',
  'Электропроводка',
  'Сантехника',
  'Отопление',
  'Демонтаж конструкций',
  'Земляные работы',
  'Благоустройство территории',
];

export default function CrewForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const form = useForm<CrewFormData>({
    resolver: zodResolver(crewSchema),
    defaultValues: {
      title: '',
      description: '',
      specialty: '',
      experience: 3,
      memberCount: 4,
      dailyRate: 20000,
      location: '',
    },
  });

  const createCrewMutation = useMutation({
    mutationFn: async (crewData: any) => {
      const response = await apiRequest('POST', '/api/crews', crewData);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Анкета бригады отправлена на модерацию',
        description: 'После проверки администратором ваша анкета будет опубликована',
      });
      navigate('/crews');
    },
    onError: (error: any) => {
      toast({
        title: 'Ошибка создания анкеты бригады',
        description: error.message || 'Произошла ошибка при создании анкеты',
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: CrewFormData) => {
    if (selectedServices.length === 0) {
      toast({
        title: 'Укажите услуги',
        description: 'Добавьте хотя бы одну услугу, которую предоставляет ваша бригада',
        variant: 'destructive',
      });
      return;
    }

    // Здесь можно добавить отправку данных с изображениями
    console.log('Crew form data:', { ...data, services: selectedServices, images });
    
    toast({
      title: 'Анкета бригады отправлена на модерацию',
      description: 'После проверки администратором ваша анкета будет опубликована',
    });
    navigate('/crews');
  };

  const addService = () => {
    if (newService.trim() && !selectedServices.includes(newService.trim())) {
      setSelectedServices([...selectedServices, newService.trim()]);
      setNewService('');
    }
  };

  const removeService = (service: string) => {
    setSelectedServices(selectedServices.filter(s => s !== service));
  };

  const addPredefinedService = (service: string) => {
    if (!selectedServices.includes(service)) {
      setSelectedServices([...selectedServices, service]);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-green-600">Анкета бригады</CardTitle>
        <CardDescription>
          Заполните информацию о вашей строительной бригаде. Анкета будет отправлена на модерацию.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название бригады</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Профессиональная строительная бригада 'Мастер'"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Название, которое будут видеть заказчики
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="specialty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Специализация бригады</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите специализацию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CREW_SPECIALTIES.map((specialty) => (
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Опыт работы (лет)</FormLabel>
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
                name="memberCount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Количество специалистов</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="2"
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
                name="dailyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Стоимость работ (₽/день)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="5000"
                        max="500000"
                        {...field}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
                  <FormLabel>Местоположение</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Москва и Московская область"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Укажите регион, где работает ваша бригада
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Виды работ</Label>
              <div className="space-y-3 mt-2">
                <div className="flex flex-wrap gap-2">
                  {CREW_SERVICES.map((service) => (
                    <Button
                      key={service}
                      type="button"
                      variant={selectedServices.includes(service) ? "default" : "outline"}
                      size="sm"
                      onClick={() => addPredefinedService(service)}
                      className={selectedServices.includes(service) ? "bg-green-600 hover:bg-green-700" : ""}
                    >
                      {service}
                    </Button>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Добавить свой вид работ"
                    value={newService}
                    onChange={(e) => setNewService(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addService())}
                  />
                  <Button type="button" onClick={addService} variant="outline">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {selectedServices.length > 0 && (
                  <div>
                    <Label className="text-sm font-medium">Выбранные виды работ:</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {selectedServices.map((service) => (
                        <Badge key={service} variant="secondary" className="flex items-center gap-1">
                          {service}
                          <button
                            type="button"
                            onClick={() => removeService(service)}
                            className="ml-1 hover:bg-gray-300 rounded-full p-0.5"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={8}
              label="Фотографии выполненных работ (портфолио бригады)"
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подробное описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите о вашей бригаде: опыт, состав, выполненные проекты, особенности работы..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Подробно опишите вашу бригаду и опыт работы
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/crews')}
              >
                Отмена
              </Button>
              <Button
                type="submit"
                className="bg-green-600 hover:bg-green-700"
              >
                Отправить на модерацию
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}