import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Star } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const reviewSchema = z.object({
  rating: z.number().min(1, 'Выберите оценку').max(5, 'Максимальная оценка 5'),
  comment: z.string().min(10, 'Комментарий должен содержать минимум 10 символов'),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewFormProps {
  specialistId: number;
  specialistName: string;
  onReviewSubmitted?: () => void;
}

export default function ReviewForm({ specialistId, specialistName, onReviewSubmitted }: ReviewFormProps) {
  const [open, setOpen] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const { toast } = useToast();

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      rating: 0,
      comment: '',
    },
  });

  const submitReviewMutation = useMutation({
    mutationFn: async (data: ReviewFormData) => {
      const response = await apiRequest('POST', '/api/reviews', {
        ...data,
        revieweeId: specialistId,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/specialists'] });
      queryClient.invalidateQueries({ queryKey: ['/api/crews'] });
      queryClient.invalidateQueries({ queryKey: [`/api/specialists/${specialistId}/reviews`] });
      toast({
        title: 'Отзыв отправлен',
        description: 'Спасибо за ваш отзыв!',
      });
      setOpen(false);
      form.reset();
      onReviewSubmitted?.();
    },
    onError: (error: Error) => {
      toast({
        title: 'Ошибка отправки отзыва',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (data: ReviewFormData) => {
    submitReviewMutation.mutate(data);
  };

  const handleRatingClick = (rating: number) => {
    form.setValue('rating', rating);
  };

  const currentRating = form.watch('rating');

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="border-green-300 text-green-600 hover:bg-green-50">
          Оставить отзыв
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Отзыв о работе {specialistName}</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="rating"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Оценка</FormLabel>
                  <FormControl>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => handleRatingClick(star)}
                          onMouseEnter={() => setHoveredRating(star)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className="p-1 focus:outline-none"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              star <= (hoveredRating || currentRating)
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          />
                        </button>
                      ))}
                      <span className="ml-2 text-sm text-gray-600">
                        {currentRating > 0 && `${currentRating} из 5`}
                      </span>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Комментарий</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Расскажите о качестве выполненной работы, соблюдении сроков, профессионализме..."
                      className="min-h-24"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button
                type="submit"
                disabled={submitReviewMutation.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                {submitReviewMutation.isPending ? 'Отправка...' : 'Отправить отзыв'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}