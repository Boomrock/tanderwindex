import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useAuth } from '@/lib/authContext';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { TENDER_CATEGORIES, SUBCATEGORIES, PERSON_TYPES } from '@/lib/constants';
import { TenderFormData } from '@/lib/types';

// Схема валидации формы тендера
const tenderFormSchema = z.object({
  title: z.string().min(5, { message: 'Название должно содержать минимум 5 символов' }).max(150, { message: 'Название не должно превышать 150 символов' }),
  description: z.string().min(20, { message: 'Описание должно содержать минимум 20 символов' }).max(2000, { message: 'Описание не должно превышать 2000 символов' }),
  category: z.string({ required_error: 'Выберите категорию' }),
  subcategory: z.string().optional(),
  budget: z.number().optional(),
  location: z.string().min(2, { message: 'Укажите местоположение' }),
  deadline: z.date({ required_error: 'Выберите срок выполнения' }),
  personType: z.enum(['individual', 'legal_entity'], { required_error: 'Выберите тип заказчика' }),
});

// Тип данных для формы, соответствующий схеме валидации
type TenderFormValues = z.infer<typeof tenderFormSchema>;

interface TenderFormProps {
  initialData?: TenderFormData;
  isEditing?: boolean;
}

export default function TenderForm({ initialData, isEditing = false }: TenderFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();

  // Инициализируем форму
  const form = useForm<TenderFormValues>({
    resolver: zodResolver(tenderFormSchema),
    defaultValues: initialData ? {
      ...initialData,
      deadline: initialData.deadline ? new Date(initialData.deadline) : undefined,
    } : {
      title: '',
      description: '',
      category: '',
      subcategory: '',
      budget: undefined,
      location: '',
      deadline: undefined,
      personType: 'individual',
    },
  });

  // Отслеживаем изменение категории для отображения подкатегорий
  const watchCategory = form.watch('category');
  useEffect(() => {
    setSelectedCategory(watchCategory);
    // Если категория изменилась, сбрасываем подкатегорию
    if (watchCategory !== selectedCategory) {
      form.setValue('subcategory', '');
    }
  }, [watchCategory, form, selectedCategory]);

  const onSubmit = async (data: TenderFormValues) => {
    if (!user) {
      toast({
        title: 'Ошибка',
        description: 'Вы должны быть авторизованы для создания тендера',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      // Форматируем данные для API (userId автоматически добавляется сервером)
      const tenderData = {
        ...data,
        budget: data.budget || undefined,
        deadline: data.deadline.toISOString(),
        personType: data.personType,
        // Для редактирования добавляем ID
        ...(isEditing && initialData?.id && { id: initialData.id }),
      };

      if (isEditing && initialData?.id) {
        await apiRequest('PUT', `/api/tenders/${initialData.id}`, tenderData);
        toast({
          title: 'Тендер обновлен',
          description: 'Ваш тендер был успешно обновлен',
        });
        // Полностью очищаем кэш тендеров
        queryClient.removeQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/tenders'
        });
        await queryClient.refetchQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/tenders'
        });
      } else {
        await apiRequest('POST', '/api/tenders', tenderData);
        toast({
          title: 'Тендер создан',
          description: 'Ваш тендер был успешно создан',
        });
        // Полностью очищаем кэш тендеров и принудительно перезагружаем
        queryClient.removeQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/tenders'
        });
        await queryClient.refetchQueries({ 
          predicate: (query) => query.queryKey[0] === '/api/tenders'
        });
      }
      
      navigate('/tenders');
    } catch (error: any) {
      console.error('Error submitting tender:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Произошла ошибка при сохранении тендера',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название тендера</FormLabel>
              <FormControl>
                <Input placeholder="Например: Аренда экскаватора на 2 дня" {...field} />
              </FormControl>
              <FormDescription>
                Укажите краткое и понятное название для вашего тендера
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Описание работ</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Опишите подробно какие работы нужно выполнить, укажите важные детали и требования"
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Чем подробнее вы опишете работы, тем более точные предложения получите
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TENDER_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Выберите категорию, соответствующую вашему тендеру
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedCategory && (
            <FormField
              control={form.control}
              name="subcategory"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Подкатегория</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Выберите подкатегорию" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {SUBCATEGORIES[selectedCategory as keyof typeof SUBCATEGORIES]?.map((subcategory) => (
                        <SelectItem key={subcategory.value} value={subcategory.value}>
                          {subcategory.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Уточните подкатегорию для более точного поиска
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="budget"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Бюджет (₽)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Укажите бюджет в рублях"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Оставьте пустым, если бюджет договорной
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="location"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Местоположение</FormLabel>
                <FormControl>
                  <Input placeholder="Например: Москва, ул. Ленина" {...field} />
                </FormControl>
                <FormDescription>
                  Укажите город и район проведения работ
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="deadline"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Срок выполнения до</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={`w-full pl-3 text-left font-normal ${
                          !field.value ? "text-muted-foreground" : ""
                        }`}
                      >
                        {field.value ? (
                          format(field.value, "PPP", { locale: ru })
                        ) : (
                          <span>Выберите дату</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  Укажите дату, до которой нужно выполнить работы
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="personType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип заказчика</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип заказчика" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PERSON_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Укажите, от чьего имени публикуется тендер
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/tenders')}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : isEditing ? 'Обновить тендер' : 'Создать тендер'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
