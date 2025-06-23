import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/authContext";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Calendar, MapPin, DollarSign, Loader2 } from "lucide-react";
import { formatPrice, formatDate } from "@/lib/utils";
import { getImageUrl } from "@/lib/gradient-generator";

// Интерфейс для тендеров
interface Tender {
  id: number;
  title: string;
  description: string;
  category: string;
  subcategory: string;
  budget: number;
  location: string;
  status: string;
  createdAt: string;
  images?: string[];
}

const HeroSection = () => {
  const { isAuthenticated } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  
  // Получаем данные о тендерах
  const { 
    data: tenders = [], 
    isLoading, 
    error 
  } = useQuery<Tender[]>({
    queryKey: ['/api/tenders'],
  });

  // Сортируем тендеры по дате создания (новые сначала)
  const sortedTenders = [...tenders].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Переключаем тендеры каждые 5 секунд
  useEffect(() => {
    if (sortedTenders.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === sortedTenders.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [sortedTenders.length]);

  // Текущий отображаемый тендер
  const currentTender = sortedTenders[currentIndex];

  // Получаем статус тендера для отображения
  const getStatusText = (status: string) => {
    switch(status) {
      case 'open': return 'Открыт';
      case 'in_progress': return 'В работе';
      case 'completed': return 'Завершен';
      case 'canceled': return 'Отменен';
      default: return 'Неизвестно';
    }
  };

  return (
    <section className="bg-primary bg-gradient-to-br from-primary to-primary-dark text-white py-12 md:py-20">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4">
              Строительные тендеры и маркетплейс в одном месте
            </h1>
            <p className="text-lg md:text-xl mb-8 text-white text-opacity-90">
              Размещайте заказы на строительные работы, продавайте и арендуйте 
              оборудование и материалы на единой безопасной платформе
            </p>
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
              <Link href={isAuthenticated ? "/tenders/create" : "/login"}>
                <Button 
                  size="lg"
                  className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100 hover:text-primary-dark"
                >
                  Создать тендер
                </Button>
              </Link>
              <Link href={isAuthenticated ? "/marketplace/create" : "/login"}>
                <Button 
                  size="lg"
                  className="w-full sm:w-auto bg-amber-500 text-white hover:bg-amber-600"
                >
                  Разместить объявление
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="md:w-1/2 flex justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-64 w-full bg-gray-800 bg-opacity-30 rounded-lg">
                <Loader2 className="h-12 w-12 animate-spin mb-4 text-white" />
                <p className="text-white text-opacity-80">Загрузка последних тендеров...</p>
              </div>
            ) : error || sortedTenders.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 w-full bg-gray-800 bg-opacity-30 rounded-lg">
                <p className="text-white text-opacity-80">Нет доступных тендеров</p>
              </div>
            ) : (
              <div className="w-full max-w-lg relative">
                <Card className="bg-white text-gray-900 shadow-xl overflow-hidden h-[420px] flex flex-col">
                  {/* Фиксированная высота для изображения */}
                  <div className="relative h-48 overflow-hidden flex-shrink-0">
                    <img 
                      src={getImageUrl(currentTender.images, currentTender.title)} 
                      alt={currentTender.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-4">
                      <Badge className="bg-amber-500 hover:bg-amber-600">
                        {currentTender.category} / {currentTender.subcategory}
                      </Badge>
                    </div>
                  </div>
                  
                  {/* Фиксированная высота для контента */}
                  <CardContent className="p-4 flex-grow flex flex-col">
                    {/* Заголовок с фиксированной высотой */}
                    <div className="mb-2 h-14 overflow-hidden">
                      <h3 className="text-lg font-bold line-clamp-2">{currentTender.title}</h3>
                    </div>
                    
                    {/* Описание с фиксированной высотой */}
                    <div className="mb-4 h-10 overflow-hidden">
                      <p className="text-sm text-gray-600 line-clamp-2">{currentTender.description}</p>
                    </div>
                    
                    {/* Блок с информацией - фиксированный */}
                    <div className="flex flex-col space-y-2 text-sm mb-4">
                      <div className="flex items-center text-gray-600">
                        <MapPin className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span className="truncate">{currentTender.location}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <DollarSign className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{formatPrice(currentTender.budget)}</span>
                      </div>
                      <div className="flex items-center text-gray-600">
                        <Calendar className="h-4 w-4 mr-2 flex-shrink-0" />
                        <span>{formatDate(currentTender.createdAt, 'dd.MM.yyyy')}</span>
                      </div>
                    </div>
                    
                    {/* Футер с кнопками - всегда в нижней части карточки */}
                    <div className="mt-auto flex justify-between items-center">
                      <Badge variant="outline" className={
                        currentTender.status === 'open' ? 'text-green-600 border-green-600' : 
                        currentTender.status === 'in_progress' ? 'text-blue-600 border-blue-600' : 
                        'text-gray-600 border-gray-600'
                      }>
                        {getStatusText(currentTender.status)}
                      </Badge>
                      
                      <Link href={`/tenders/${currentTender.id}`}>
                        <Button variant="ghost" size="sm" className="text-primary flex items-center">
                          Подробнее <ArrowRight className="ml-1 h-4 w-4" />
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Индикатор прогресса */}
                {sortedTenders.length > 1 && (
                  <div className="mt-2 flex justify-center space-x-2">
                    {sortedTenders.map((_, index) => (
                      <button
                        key={index}
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          index === currentIndex ? 'bg-white' : 'bg-white bg-opacity-40'
                        }`}
                        onClick={() => setCurrentIndex(index)}
                      />
                    ))}
                  </div>
                )}
                
                {/* Прогресс-бар */}
                {sortedTenders.length > 1 && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-800 bg-opacity-20">
                    <div 
                      className="h-full bg-white transition-all duration-300" 
                      style={{ width: `${((currentIndex + 1) / sortedTenders.length) * 100}%` }}
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
