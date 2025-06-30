import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import ImageUpload from '@/components/ui/image-upload';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLocation } from 'wouter';

const specialistSchema = z.object({
  title: z.string().min(10, 'Название должно содержать минимум 10 символов'),
  description: z.string().min(50, 'Описание должно содержать минимум 50 символов'),
  specialty: z.string().min(1, 'Выберите специальность'),
  experience: z.number().min(0, 'Опыт не может быть отрицательным').max(50, 'Опыт не может превышать 50 лет'),
  hourlyRate: z.number().min(100, 'Минимальная ставка 100 ₽/час').max(50000, 'Максимальная ставка 50,000 ₽/час'),
  location: z.string().min(3, 'Укажите местоположение'),
});

type SpecialistFormData = z.infer<typeof specialistSchema>;

const SPECIALTIES = [
  'Электрик',
  'Сантехник', 
  'Плотник',
  'Маляр',
  'Штукатур',
  'Плиточник',
  'Кровельщик',
  'Сварщик',
  'Каменщик',
  'Монтажник',
  'Отделочник',
  'Дизайнер',
  'Прораб',
];

const SERVICES = [
  'Электромонтаж',
  'Сантехнические работы',
  'Плотницкие работы', 
  'Покраска',
  'Штукатурка',
  'Укладка плитки',
  'Кровельные работы',
  'Сварочные работы',
  'Кладка кирпича',
  'Монтаж конструкций',
  'Отделка помещений',
  'Дизайн интерьера',
  'Управление проектом',
  'Утепление',
  'Гидроизоляция',
  'Демонтаж',
];

export default function SpecialistForm() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [newService, setNewService] = useState('');
  const [images, setImages] = useState<string[]>([]);

  const form = useForm<SpecialistFormData>({
    resolver: zodResolver(specialistSchema),
    defaultValues: {
      title: '',
      description: '',
      specialty: '',
      experience: 1,
      hourlyRate: 1000,
      location: '',
    },
  });

  const onSubmit = (data: SpecialistFormData) => {
    if (selectedServices.length === 0) {
      toast({
        title: 'Укажите услуги',
        description: 'Добавьте хотя бы одну услугу, которую вы предоставляете',
        variant: 'destructive',
      });
      return;
    }

    // Здесь можно добавить отправку данных с изображениями
    console.log('Form data:', { ...data, services: selectedServices, images });
    
    toast({
      title: 'Анкета отправлена на модерацию',
      description: 'После проверки администратором ваша анкета будет опубликована',
    });
    navigate('/specialists');
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
        <CardTitle className="text-green-600">Анкета специалиста</CardTitle>
        <CardDescription>
          Заполните информацию о себе и ваших услугах. Анкета будет отправлена на модерацию.
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
                  <FormLabel>Название анкеты</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Например: Профессиональный электрик с 10-летним опытом"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Краткое описание, которое привлечет внимание заказчиков
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
                  <FormLabel>Специальность</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите специальность" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SPECIALTIES.map((specialty) => (
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                name="hourlyRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Стоимость работ (₽/час)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="100"
                        max="50000"
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
                      placeholder="Например: Москва, САО"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Укажите город и район, где вы работаете
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <Label>Предоставляемые услуги</Label>
              <div className="space-y-3 mt-2">
                <div className="flex flex-wrap gap-2">
                  {SERVICES.map((service) => (
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
                    placeholder="Добавить свою услугу"
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
                    <Label className="text-sm font-medium">Выбранные услуги:</Label>
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
              maxImages={5}
              label="Фотографии работ (портфолио)"
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подробное описание</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите о своем опыте, образовании, особенностях работы, выполненных проектах..."
                      className="min-h-32"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Подробно опишите ваши навыки и опыт работы
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/specialists')}
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