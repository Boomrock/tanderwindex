import { useState } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Helmet } from "react-helmet";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  MapPin, 
  Clock, 
  DollarSign, 
  Award, 
  MessageCircle, 
  Star 
} from "lucide-react";

interface Crew {
  id: number;
  name: string;
  description: string;
  location: string;
  experience_years: number;
  team_size: number;
  hourly_rate: number;
  specializations: string[];
  images: string[];
  status: string;
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

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  comment: z.string().min(10, "Комментарий должен содержать минимум 10 символов"),
  crewId: z.number(),
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

export default function CrewDetail() {
  const { id } = useParams();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: crew, isLoading: crewLoading } = useQuery<Crew>({
    queryKey: ["/api/crews", id],
  });

  const { data: reviews = [], isLoading: reviewsLoading } = useQuery<Review[]>({
    queryKey: ["/api/crews", id, "reviews"],
  });

  const { data: user } = useQuery<User>({
    queryKey: ["/api/users/me"],
  });

  const reviewForm = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 5,
      comment: "",
      crewId: parseInt(id!),
    },
  });

  const reviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest("POST", "/api/reviews", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Успешно",
        description: "Отзыв добавлен",
      });
      reviewForm.reset();
      queryClient.invalidateQueries({ queryKey: ["/api/crews", id, "reviews"] });
      queryClient.invalidateQueries({ queryKey: ["/api/crews", id] });
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

  if (crewLoading || reviewsLoading) {
    return (
      <div className="container py-12">
        <div className="text-center">Загрузка...</div>
      </div>
    );
  }

  if (!crew) {
    return (
      <div className="container py-12">
        <div className="text-center">Бригада не найдена</div>
      </div>
    );
  }

  const displayName = crew.user.firstName && crew.user.lastName 
    ? `${crew.user.firstName} ${crew.user.lastName}` 
    : crew.user.username;

  return (
    <>
      <Helmet>
        <title>{crew.name} - Windexs-Строй</title>
        <meta name="description" content={`Профиль бригады ${crew.name}. Опыт: ${crew.experience_years} лет, команда из ${crew.team_size} специалистов.`} />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="container py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Основная информация */}
            <div className="space-y-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-shrink-0">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={crew.images[0] || undefined} alt={crew.name} />
                        <AvatarFallback className="text-lg">
                          {crew.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div>
                          <h1 className="text-2xl font-bold text-gray-900 mb-2">
                            {crew.name}
                          </h1>
                          <div className="flex items-center space-x-4 mb-3">
                            <div className="flex items-center">
                              <StarRating rating={crew.user.rating} />
                              <span className="ml-2 text-sm text-gray-600">
                                ({reviews.length} отзывов)
                              </span>
                            </div>
                            {crew.user.isVerified && (
                              <Badge variant="secondary" className="bg-green-100 text-green-800">
                                <Award className="h-3 w-3 mr-1" />
                                Проверена
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <div className="flex items-center">
                              <MapPin className="h-4 w-4 mr-1" />
                              {crew.location}
                            </div>
                            <div className="flex items-center">
                              <Clock className="h-4 w-4 mr-1" />
                              {crew.experience_years} лет опыта
                            </div>
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-1" />
                              {crew.team_size} специалистов
                            </div>
                            <div className="flex items-center">
                              <DollarSign className="h-4 w-4 mr-1" />
                              {crew.hourly_rate} ₽/час
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex flex-col space-y-2">
                          <Button className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700">
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Написать сообщение
                          </Button>
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
                    {crew.specializations.map((specialization, index) => (
                      <Badge
                        key={index}
                        variant="outline"
                        className="bg-emerald-50 text-emerald-700 border-emerald-200"
                      >
                        {specialization}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Описание */}
              <Card>
                <CardHeader>
                  <CardTitle>О бригаде</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-700 leading-relaxed">
                    {crew.description}
                  </p>
                </CardContent>
              </Card>

              {/* Портфолио */}
              {crew.images.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Портфолио</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {crew.images.map((image, index) => (
                        <div key={index} className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                          <img
                            src={image}
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
                      <StarRating rating={crew.user.rating || 0} />
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
                                    placeholder="Поделитесь своим опытом работы с этой бригадой..."
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
                            disabled={reviewMutation.isPending}
                            className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                          >
                            {reviewMutation.isPending ? "Отправка..." : "Отправить отзыв"}
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}

                  {/* Список отзывов */}
                  <div className="space-y-4">
                    {reviews.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">Пока нет отзывов</p>
                    ) : (
                      reviews.map((review) => {
                        const reviewerName = review.reviewer.firstName && review.reviewer.lastName 
                          ? `${review.reviewer.firstName} ${review.reviewer.lastName}` 
                          : review.reviewer.username;
                        
                        return (
                          <div key={review.id} className="border-b border-gray-200 pb-4 last:border-b-0">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center space-x-2">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback className="text-xs">
                                    {reviewerName.charAt(0)}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium text-sm">{reviewerName}</p>
                                  <div className="flex items-center">
                                    <StarRating rating={review.rating} />
                                  </div>
                                </div>
                              </div>
                              <span className="text-xs text-gray-500">
                                {new Date(review.createdAt).toLocaleDateString('ru-RU')}
                              </span>
                            </div>
                            <p className="text-gray-700 text-sm">{review.comment}</p>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}