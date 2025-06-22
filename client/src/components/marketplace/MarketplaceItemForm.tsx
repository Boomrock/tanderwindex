import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocation } from 'wouter';
import { ImagePlus, X } from 'lucide-react';

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
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { 
  MARKETPLACE_CATEGORIES, 
  MARKETPLACE_SUBCATEGORIES, 
  LISTING_TYPES 
} from '@/lib/constants';
import { MarketplaceItemFormData } from '@/lib/types';

const marketplaceItemSchema = z.object({
  title: z.string().min(5, { message: 'Название должно содержать минимум 5 символов' }).max(150, { message: 'Название не должно превышать 150 символов' }),
  description: z.string().min(20, { message: 'Описание должно содержать минимум 20 символов' }).max(2000, { message: 'Описание не должно превышать 2000 символов' }),
  price: z.number().min(1, { message: 'Укажите цену' }),
  listingType: z.string({ required_error: 'Выберите тип объявления' }),
  category: z.string({ required_error: 'Выберите категорию' }),
  subcategory: z.string().optional(),
  condition: z.string().optional(),
  location: z.string().min(2, { message: 'Укажите местоположение' }),
  images: z.array(z.string()).default([]),
});

interface MarketplaceItemFormProps {
  initialData?: MarketplaceItemFormData;
  isEditing?: boolean;
}

export default function MarketplaceItemForm({ initialData, isEditing = false }: MarketplaceItemFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(initialData?.category || '');
  const [uploadedImages, setUploadedImages] = useState<string[]>(initialData?.images || []);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  const form = useForm<z.infer<typeof marketplaceItemSchema>>({
    resolver: zodResolver(marketplaceItemSchema),
    defaultValues: initialData || {
      title: '',
      description: '',
      price: undefined,
      listingType: 'sell',
      category: '',
      subcategory: '',
      condition: '',
      location: '',
      images: [],
    },
  });

  const onSubmit = async (data: z.infer<typeof marketplaceItemSchema>) => {
    setIsSubmitting(true);
    try {
      // Format the data to match the API requirements
      const listingData: MarketplaceItemFormData = {
        ...data,
        images: uploadedImages,
      };

      if (isEditing && initialData?.id) {
        await apiRequest('PUT', `/api/marketplace/${initialData.id}`, listingData);
        toast({
          title: 'Объявление обновлено',
          description: 'Ваше объявление было успешно обновлено',
        });
      } else {
        await apiRequest('POST', '/api/marketplace', listingData);
        toast({
          title: 'Объявление создано',
          description: 'Ваше объявление было успешно создано',
        });
      }
      
      // Clear all marketplace cache after successful operation
      queryClient.clear();
      
      navigate('/marketplace');
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: error.message || 'Произошла ошибка при сохранении объявления',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
    form.setValue('category', value);
    form.setValue('subcategory', ''); // Reset subcategory when category changes
  };

  const handleImageUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = false;
    
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: 'Ошибка',
          description: 'Размер файла не должен превышать 5 МБ',
          variant: 'destructive',
        });
        return;
      }
      
      try {
        // Create canvas for image compression
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = async () => {
          // Set smaller max dimensions to reduce file size
          const maxWidth = 600;
          const maxHeight = 400;
          let { width, height } = img;
          
          // Calculate new dimensions maintaining aspect ratio
          const aspectRatio = width / height;
          if (width > maxWidth || height > maxHeight) {
            if (aspectRatio > 1) {
              width = maxWidth;
              height = maxWidth / aspectRatio;
            } else {
              height = maxHeight;
              width = maxHeight * aspectRatio;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress with higher compression
          ctx?.drawImage(img, 0, 0, width, height);
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.5);
          const base64Data = compressedBase64.split(',')[1];
          
          try {
            const response = await apiRequest('POST', '/api/upload', {
              image: base64Data,
              filename: file.name,
            });
            
            const result = await response.json();
            const updatedImages = [...uploadedImages, result.url];
            setUploadedImages(updatedImages);
            form.setValue('images', updatedImages);
            
            toast({
              title: 'Изображение загружено',
              description: 'Изображение успешно добавлено к объявлению',
            });
          } catch (error) {
            toast({
              title: 'Ошибка загрузки',
              description: 'Не удалось загрузить изображение',
              variant: 'destructive',
            });
          }
        };
        
        // Load image from file
        const fileReader = new FileReader();
        fileReader.onload = (e) => {
          img.src = e.target?.result as string;
        };
        fileReader.readAsDataURL(file);
      } catch (error) {
        toast({
          title: 'Ошибка',
          description: 'Произошла ошибка при обработке файла',
          variant: 'destructive',
        });
      }
    };
    
    input.click();
  };

  const removeImage = (index: number) => {
    const updatedImages = [...uploadedImages];
    updatedImages.splice(index, 1);
    setUploadedImages(updatedImages);
    form.setValue('images', updatedImages);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Название товара/услуги</FormLabel>
              <FormControl>
                <Input placeholder="Например: Экскаватор CAT 325 или Перфоратор Bosch" {...field} />
              </FormControl>
              <FormDescription>
                Укажите краткое и понятное название для вашего объявления
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
              <FormLabel>Описание</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Опишите подробно что вы продаете или сдаете в аренду, укажите важные детали и характеристики"
                  className="min-h-32"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                Чем подробнее описание, тем больше шансов найти покупателя или арендатора
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="listingType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Тип объявления</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите тип объявления" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {LISTING_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Цена (₽)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="Укажите стоимость"
                    {...field}
                    onChange={(e) => {
                      const value = e.target.value ? parseInt(e.target.value) : undefined;
                      field.onChange(value);
                    }}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormDescription>
                  Для аренды укажите стоимость за день
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Категория</FormLabel>
                <Select 
                  onValueChange={handleCategoryChange} 
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Выберите категорию" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {MARKETPLACE_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="subcategory"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подкатегория</FormLabel>
                <Select 
                  onValueChange={field.onChange} 
                  defaultValue={field.value}
                  disabled={!selectedCategory}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={selectedCategory ? "Выберите подкатегорию" : "Сначала выберите категорию"} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {selectedCategory && 
                     MARKETPLACE_SUBCATEGORIES[selectedCategory as keyof typeof MARKETPLACE_SUBCATEGORIES]?.map((subcategory) => (
                      <SelectItem key={subcategory.value} value={subcategory.value}>
                        {subcategory.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="condition"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Состояние товара</FormLabel>
                <FormControl>
                  <Input placeholder="Например: Новый, Б/У, Отличное и т.д." {...field} />
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
                <FormLabel>Местоположение</FormLabel>
                <FormControl>
                  <Input placeholder="Например: Москва, ул. Ленина" {...field} />
                </FormControl>
                <FormDescription>
                  Укажите город и район
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="images"
          render={() => (
            <FormItem>
              <FormLabel>Фотографии</FormLabel>
              <FormControl>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                    {uploadedImages.map((image, index) => (
                      <div key={index} className="relative group">
                        <img 
                          src={image} 
                          alt={`Изображение ${index + 1}`}
                          className="h-32 w-full object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          className="absolute top-2 right-2 p-1 bg-white rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removeImage(index)}
                        >
                          <X className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={handleImageUpload}
                      className="h-32 border-2 border-dashed border-gray-300 rounded-md flex flex-col items-center justify-center text-gray-500 hover:text-primary hover:border-primary transition-colors"
                    >
                      <ImagePlus className="h-8 w-8 mb-2" />
                      <span className="text-sm">Добавить фото</span>
                    </button>
                  </div>
                  <FormDescription>
                    Добавьте до 10 фотографий. Первая фотография будет главной в объявлении
                  </FormDescription>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => navigate('/marketplace')}
          >
            Отмена
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Сохранение...' : isEditing ? 'Обновить объявление' : 'Опубликовать объявление'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
