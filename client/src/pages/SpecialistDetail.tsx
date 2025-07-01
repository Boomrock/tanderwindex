import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams, Link, useLocation } from "wouter";
import { Helmet } from "react-helmet";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  MapPin, 
  Clock, 
  Star, 
  MessageCircle, 
  Phone, 
  Mail, 
  Award,
  User,
  ArrowLeft,
  Calendar,
  DollarSign
} from "lucide-react";

const StarRating = ({ rating, onChange, readOnly = true }: { rating: number; onChange?: (rating: number) => void; readOnly?: boolean }) => {
  return (
    <div className="flex items-center space-x-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-5 w-5 cursor-pointer ${
            star <= rating 
              ? "fill-yellow-400 text-yellow-400" 
              : "text-gray-300"
          }`}
          onClick={() => !readOnly && onChange?.(star)}
        />
      ))}
    </div>
  );
};

interface Specialist {
  id: number;
  name: string;
  description: string;
  location: string;
  experience_years: number;
  hourly_rate: number;
  specializations: string[];
  images: string[];
  status: string;
  user: {
    id: number;
    username: string;
    fullName: string;
    rating: number;
    isVerified: boolean;
    completedProjects: number;
  };
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  reviewerId: number;
  revieweeId: number;
  createdAt: string;
  reviewer: {
    username: string;
    fullName: string;
  };
}

const messageSchema = z.object({
  content: z.string().min(1, "Сообщение не может быть пустым"),
});

const reviewSchema = z.object({
  rating: z.number().min(1, "Выберите рейтинг").max(5, "Максимальный рейтинг 5"),
  comment: z.string().min(1, "Добавьте комментарий к отзыву"),
});

export default function SpecialistDetail() {
  const params = useParams();
  const specialistId = params.id;
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();

  const { data: specialist, isLoading } = useQuery<Specialist>({
    queryKey: ["/api/specialists", specialistId],
    queryFn: async () => {
      const response = await fetch(`/api/specialists/${specialistId}`);
      if (!response.ok) {
        throw new Error('Специалист не найден');
      }
      return response.json();
    }
  });

  const { data: reviews = [] } = useQuery<Review[]>({
    queryKey: ["/api/specialists", specialistId, "reviews"],
    queryFn: async () => {
      const response = await fetch(`/api/specialists/${specialistId}/reviews`);
      if (!response.ok) return [];
      return response.json();
    }
  });

  const messageForm = useForm<z.infer<typeof messageSchema>>({
    resolver: zodResolver(messageSchema),
    defaultValues: {
      content: "",
    },
  });

  const reviewForm = useForm<z.infer<typeof reviewSchema>>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: "",
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (data: z.infer<typeof messageSchema>) => {
      return apiRequest("POST", "/api/messages", {
        content: data.content,
        receiverId: specialist?.user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Сообщение отправлено",
        description: "Ваше сообщение успешно отправлено специалисту",
      });
      messageForm.reset();
      setLocation("/messages");
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить сообщение",
        variant: "destructive",
      });
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: z.infer<typeof reviewSchema>) => {
      return apiRequest("POST", "/api/reviews", {
        rating: data.rating,
        comment: data.comment,
        revieweeId: specialist?.user.id,
      });
    },
    onSuccess: () => {
      toast({
        title: "Отзыв отправлен",
        description: "Ваш отзыв успешно добавлен",
      });
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/specialists", specialistId, "reviews"] });
    },
    onError: (error) => {
      toast({
        title: "Ошибка",
        description: "Не удалось отправить отзыв",
        variant: "destructive",
      });
    },
  });

  const onMessageSubmit = async (data: z.infer<typeof messageSchema>) => {
    if (!user) {
      toast({
        title: "Авторизация требуется",
        description: "Войдите в систему для отправки сообщений",
        variant: "destructive",
      });
      return;
    }
    sendMessageMutation.mutate(data);
  };

  const onReviewSubmit = async (data: z.infer<typeof reviewSchema>) => {
    submitReviewMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Специалист не найден</h2>
          <Link href="/specialists">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Вернуться к специалистам
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{specialist.name} - Специалист по {specialist.specializations.join(", ")} | Windexs-Строй</title>
        <meta name="description" content={`Профиль специалиста ${specialist.name}. ${specialist.description}`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-green-50 to-gray-50">
        <div className="container mx-auto px-4 py-8">
          {/* Навигация */}
          <div className="mb-6">
            <Link href="/specialists">
              <Button variant="ghost" className="text-green-600 hover:text-green-700">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Назад к специалистам
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Основная информация */}
            <div className="lg:col-span-2 space-y-6">
              {/* Заголовок профиля */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={specialist.images[0]} alt={specialist.name} />
                        <AvatarFallback className="text-lg">
                          {specialist.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {specialist.name}
                          </h1>
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center">
                              <StarRating rating={specialist.user.rating} />
                              <span className="ml-2 text-sm text-gray-600">
                                ({reviews.length} отзывов)
                              </span>
                            </div>
                            {specialist.user.isVerified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <Award className="h-3 w-3 mr-1" />
                                Проверен
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {specialist.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {specialist.experience_years} лет опыта
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {specialist.hourly_rate} ₽/час
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Специализации */}
              <Card>
                <CardHeader>
                  <CardTitle>Специализации</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {specialist.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-green-700 border-green-200">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Описание */}
              <Card>
                <CardHeader>
                  <CardTitle>О специалисте</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {specialist.description}
                  </p>
                </CardContent>
              </Card>

              {/* Портфолио */}
              {specialist.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Портфолио</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {specialist.images.map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={`/api/files/${image}`}
                            alt={`Работа ${index + 1}`}
                            className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
                          />
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Секция отзывов */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Отзывы</CardTitle>
                    <div className="flex items-center space-x-2">
                      <StarRating rating={specialist?.user.rating || 0} />
                      <span className="text-sm text-gray-600">({reviews.length} отзывов)</span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {user && (
                    <div className="mb-6 p-4 border rounded-lg bg-gray-50">
                      <h4 className="font-semibold mb-3">Оставить отзыв</h4>
                      <Form {...reviewForm}>
                        <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                          <FormField
                            control={reviewForm.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Оценка</FormLabel>
                                <FormControl>
                                  <StarRating 
                                    rating={field.value} 
                                    onChange={field.onChange}
                                    readOnly={false}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={reviewForm.control}
                            name="comment"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Комментарий</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Поделитесь своим опытом работы с этим специалистом..."
                                    className="min-h-[80px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="bg-green-600 hover:bg-green-700"
                            disabled={submitReviewMutation.isPending}
                          >
                            {submitReviewMutation.isPending ? "Отправка..." : "Оставить отзыв"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}

                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-8">Пока нет отзывов</p>
                    ) : (
                      reviews.map((review) => (
                        <div key={review.id} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {review.reviewer.fullName.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium text-sm">{review.reviewer.fullName}</p>
                                <StarRating rating={review.rating} />
                              </div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{review.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Боковая панель */}
            <div className="space-y-6">
              {/* Статистика */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Статистика</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Завершенных проектов</span>
                    <span className="font-semibold">{specialist.user.completedProjects}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Рейтинг</span>
                    <div className="flex items-center">
                      <StarRating rating={specialist.user.rating} />
                      <span className="ml-2 font-semibold">
                        {specialist.user.rating.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Опыт работы</span>
                    <span className="font-semibold">{specialist.experience_years} лет</span>
                  </div>
                </CardContent>
              </Card>

              {/* Связаться */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Связаться</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="w-full bg-green-600 hover:bg-green-700">
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Написать специалисту
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Отправить сообщение</DialogTitle>
                        <DialogDescription>
                          Опишите ваш проект и ожидания
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...messageForm}>
                        <form onSubmit={messageForm.handleSubmit(onMessageSubmit)} className="space-y-4">
                          <FormField
                            control={messageForm.control}
                            name="content"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Сообщение</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Опишите ваш проект, сроки и бюджет..."
                                    className="min-h-[100px]"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <div className="flex justify-end space-x-2">
                            <Button type="submit" disabled={sendMessageMutation.isPending}>
                              {sendMessageMutation.isPending ? "Отправка..." : "Отправить"}
                            </Button>
                          </div>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}