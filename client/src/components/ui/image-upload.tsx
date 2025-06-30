import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { X, Upload, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
}

export default function ImageUpload({ 
  images, 
  onImagesChange, 
  maxImages = 5,
  label = "Добавить фотографии"
}: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    if (images.length + files.length > maxImages) {
      toast({
        title: 'Слишком много изображений',
        description: `Максимальное количество изображений: ${maxImages}`,
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    const newImages: string[] = [];

    try {
      for (const file of Array.from(files)) {
        // Проверка типа файла
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Неверный тип файла',
            description: 'Пожалуйста, выберите файлы изображений',
            variant: 'destructive',
          });
          continue;
        }

        // Проверка размера файла (максимум 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'Файл слишком большой',
            description: 'Максимальный размер файла: 5MB',
            variant: 'destructive',
          });
          continue;
        }

        // Преобразуем файл в base64
        const reader = new FileReader();
        const fileDataPromise = new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const fileData = await fileDataPromise;

        const response = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            filename: file.name,
            fileData: fileData,
            fileSize: file.size,
            fileType: file.type,
          }),
        });

        if (response.ok) {
          const result = await response.json();
          newImages.push(result.url);
        } else {
          throw new Error(`Ошибка загрузки файла ${file.name}`);
        }
      }

      if (newImages.length > 0) {
        onImagesChange([...images, ...newImages]);
        toast({
          title: 'Изображения загружены',
          description: `Загружено ${newImages.length} изображений`,
        });
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Ошибка загрузки',
        description: 'Не удалось загрузить изображения',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      // Сброс input
      event.target.value = '';
    }
  }, [images, maxImages, onImagesChange, toast]);

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      {/* Превью загруженных изображений */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-lg overflow-hidden border-2 border-gray-200">
                <img
                  src={`/api/files/${image}`}
                  alt={`Изображение ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Кнопка загрузки */}
      {images.length < maxImages && (
        <div>
          <input
            type="file"
            id="image-upload"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            disabled={uploading}
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              className="w-full border-dashed border-2 h-32 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50"
              asChild
            >
              <div>
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                    <span className="mt-2 text-sm">Загрузка...</span>
                  </>
                ) : (
                  <>
                    <Upload className="h-8 w-8 text-gray-400" />
                    <span className="mt-2 text-sm text-gray-600">
                      Нажмите для выбора изображений
                    </span>
                    <span className="text-xs text-gray-400">
                      Максимум {maxImages} изображений, до 5MB каждое
                    </span>
                  </>
                )}
              </div>
            </Button>
          </label>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Загружено: {images.length} из {maxImages} изображений
      </div>
    </div>
  );
}