import { useParams, useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MapPin, Star, MessageCircle, Phone, Mail, User, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Helmet } from "react-helmet";

interface Specialist {
  id: number;
  experience_years: number;
  hourly_rate: number;
  specializations: string[];
  description: string;
  location: string;
  images: string[];
  user: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
    rating: number;
    isVerified: boolean;
    completedProjects: number;
  };
}

interface Review {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
  reviewer: {
    id: number;
    username: string;
    firstName?: string;
    lastName?: string;
  };
}

interface User {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

const messageSchema = z.object({
  content: z.string().min(1, "Сообщение не может быть пустым"),
});

const reviewSchema = z.object({
  rating: z.number().min(1, "Выберите рейтинг").max(5, "Максимальный рейтинг 5"),
  comment: z.string().min(1, "Добавьте комментарий к отзыву"),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

function StarRating({ rating, onChange, readOnly = true }: { 
  rating: number; 
  onChange?: (rating: number) => void; 
  readOnly?: boolean 
}) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 cursor-pointer ${
            star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
          }`}
          onClick={() => !readOnly && onChange?.(star)}
        />
      ))}
    </div>
  );
}

export default function SpecialistDetail() {
  const { id } = useParams();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: specialist, isLoading: specialistLoading } = useQuery<Specialist>({
    queryKey: ["/api/specialists", id],
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/specialists", id, "reviews"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/reviews", {
        ...data,
        specialistId: parseInt(id!),
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Отзыв добавлен",
      });
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/specialists", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/specialists", id] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onReviewSubmit = (data: ReviewFormData) => {
    reviewMutation.mutate(data);
  };

  if (specialistLoading || reviewsLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (!specialist) {
    return (
      <div className="container py-12">
        <div className="text-center">Специалист не найден</div>
      </div>
    );
  }

  const displayName = specialist.user?.firstName && specialist.user?.lastName 
    ? `${specialist.user.firstName} ${specialist.user.lastName}` 
    : specialist.user?.username || 'Специалист';

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0;

  return (
    <>
      <Helmet>
        <title>{displayName} - Windexs-Строй</title>
        <meta name="description" content={`Профиль специалиста ${displayName}. ${specialist.description || ''}`} />
      </Helmet>

      <div className="container py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Профиль специалиста */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <div className="flex items-center space-x-4">
                  <Avatar className="h-16 w-16">
                    <AvatarImage src={specialist.images?.[0] ? `/api/files/${specialist.images[0]}` : undefined} />
                    <AvatarFallback>
                      <User className="h-8 w-8" />
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <CardTitle className="text-2xl">{displayName}</CardTitle>
                    <div className="flex items-center mt-2">
                      <StarRating rating={Math.round(specialist.user.rating)} />
                      <span className="text-sm ml-2 text-gray-600">
                        {specialist.user.rating.toFixed(1)} ({reviews.length} отзывов)
                      </span>
                      {specialist.user.isVerified && (
                        <Badge variant="outline" className="ml-2 text-xs bg-green-50 text-green-700 border-green-200">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Проверен
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center mt-1 text-gray-600">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span className="text-sm">{specialist.location}</span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Описание</h3>
                  <p className="text-gray-700">{specialist.description}</p>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Специализации</h3>
                  <div className="flex flex-wrap gap-2">
                    {specialist.specializations.map((spec, index) => (
                      <Badge key={index} variant="secondary">{spec}</Badge>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-semibold mb-1">Опыт работы</h3>
                    <p className="text-gray-700">{specialist.experience_years} лет</p>
                  </div>
                  <div>
                    <h3 className="font-semibold mb-1">Стоимость работ</h3>
                    <p className="text-gray-700">{specialist.hourly_rate.toLocaleString()} ₽/час</p>
                  </div>
                </div>

                {specialist.images && specialist.images.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Фотографии работ</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {specialist.images.map((image, index) => (
                        <img
                          key={index}
                          src={`/api/files/${image}`}
                          alt={`Работа ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Отзывы */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Отзывы ({reviews.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-b-0">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">
                              {review.reviewer.firstName && review.reviewer.lastName 
                                ? `${review.reviewer.firstName} ${review.reviewer.lastName}` 
                                : review.reviewer.username}
                            </span>
                            <StarRating rating={review.rating} />
                          </div>
                          <span className="text-sm text-gray-500">
                            {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Отзывов пока нет</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Сайдбар с контактами и действиями */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Статистика</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Завершенных проектов:</span>
                  <span className="font-semibold">{specialist.user.completedProjects}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Средний рейтинг:</span>
                  <span className="font-semibold">{specialist.user.rating.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Опыт работы:</span>
                  <span className="font-semibold">{specialist.experience_years} лет</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Действия</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    navigate(`/messages?userId=${specialist.user.id}`);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Написать сообщение
                </Button>

                {user && user.id !== specialist.user.id && (
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        <Star className="h-4 w-4 mr-2" />
                        Оставить отзыв
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Оставить отзыв</DialogTitle>
                      </DialogHeader>
                      <Form {...reviewForm}>
                        <form onSubmit={reviewForm.handleSubmit(onReviewSubmit)} className="space-y-4">
                          <FormField
                            control={reviewForm.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Рейтинг</FormLabel>
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
                                    placeholder="Опишите свой опыт работы с этим специалистом..."
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <Button 
                            type="submit" 
                            className="w-full"
                            disabled={reviewMutation.isPending}
                          >
                            {reviewMutation.isPending ? "Отправка..." : "Отправить отзыв"}
                          </Button>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}