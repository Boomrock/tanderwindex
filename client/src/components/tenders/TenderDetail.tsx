import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'wouter';
import { 
  Clock, 
  MapPin, 
  Eye, 
  User, 
  CalendarDays, 
  Tag, 
  FileText, 
  MessageCircle
} from 'lucide-react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import StarRating from '@/components/shared/StarRating';
import { Tender, TenderBid } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { formatDate, getUserInitials, getStatusColor, getCategoryColor } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

interface TenderDetailProps {
  tenderId: number;
}

export default function TenderDetail({ tenderId }: TenderDetailProps) {
  const [isBidDialogOpen, setIsBidDialogOpen] = useState(false);
  const [bidAmount, setBidAmount] = useState('');
  const [bidDescription, setBidDescription] = useState('');
  const [bidTimeframe, setBidTimeframe] = useState('');
  const [bidDocuments, setBidDocuments] = useState<string[]>([]);
  const [isSubmittingBid, setIsSubmittingBid] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const { user, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Fetch tender details
  const { data: tender, isLoading: isTenderLoading, error: tenderError } = useQuery<Tender>({
    queryKey: [`/api/tenders/${tenderId}`],
  });

  // Fetch tender bids (only if authenticated)
  const { 
    data: tenderBids, 
    isLoading: isBidsLoading, 
    error: bidsError 
  } = useQuery<TenderBid[]>({
    queryKey: [`/api/tenders/${tenderId}/bids`],
    enabled: !!tenderId && isAuthenticated,
  });

  // Submit bid mutation
  const submitBidMutation = useMutation({
    mutationFn: async (bidData: { amount: number; description: string; timeframe?: number; documents?: string[] | null }) => {
      return apiRequest('POST', `/api/tenders/${tenderId}/bids`, bidData);
    },
    onSuccess: async () => {
      // Create automatic chat between tender owner and bidder
      try {
        const chatMessage = `Здравствуйте! Я подал заявку на ваш тендер "${tender?.title}".

Моя заявка:
• Стоимость: ${parseInt(bidAmount).toLocaleString()} ₽
${bidTimeframe ? `• Срок выполнения: ${bidTimeframe} дней` : ''}
• Описание: ${bidDescription}

Готов обсудить детали проекта.`;

        await apiRequest('POST', '/api/messages', {
          recipientId: tender?.userId,
          content: chatMessage
        });
      } catch (error) {
        console.log('Failed to create chat:', error);
      }

      // Инвалидируем кэш для обеих страниц
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}/bids`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}`] });
      setIsBidDialogOpen(false);
      setBidAmount('');
      setBidDescription('');
      setBidTimeframe('');
      setBidDocuments([]);
      toast({
        title: 'Заявка отправлена',
        description: 'Заявка отправлена и создан чат с заказчиком',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось отправить заявку на участие',
        variant: 'destructive',
      });
    },
  });

  // Accept bid mutation
  const acceptBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      return apiRequest('POST', `/api/tenders/bids/${bidId}/accept`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}/bids`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}`] });
      toast({
        title: 'Заявка принята',
        description: 'Вы успешно приняли заявку на выполнение тендера',
      });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось принять заявку',
        variant: 'destructive',
      });
    },
  });

  // Delete tender mutation
  const deleteTenderMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('DELETE', `/api/tenders/${tenderId}`, {});
    },
    onSuccess: () => {
      toast({
        title: 'Тендер удален',
        description: 'Ваш тендер был успешно удален',
      });
      navigate('/tenders');
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось удалить тендер',
        variant: 'destructive',
      });
    },
  });

  const handleBidSubmit = async () => {
    if (!bidAmount || !bidDescription) {
      toast({
        title: 'Ошибка',
        description: 'Укажите сумму и описание заявки',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmittingBid(true);
    
    try {
      await submitBidMutation.mutateAsync({
        amount: parseInt(bidAmount),
        description: bidDescription,
        timeframe: bidTimeframe ? parseInt(bidTimeframe) : undefined,
        documents: bidDocuments.length > 0 ? bidDocuments : null,
      });
    } finally {
      setIsSubmittingBid(false);
    }
  };

  const handleAcceptBid = async (bidId: number) => {
    await acceptBidMutation.mutateAsync(bidId);
  };
  
  const handleDeleteTender = async () => {
    await deleteTenderMutation.mutateAsync();
  };

  // If tender is loading, show skeleton
  if (isTenderLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-10 w-3/4" />
            <div className="flex gap-2">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-6 w-24" />
            </div>
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Skeleton className="h-20 w-full" />
                
                <div className="pt-4 space-y-2 border-t">
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <Skeleton className="h-5 w-40" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <Skeleton className="h-5 w-32" />
                  </div>
                  <div className="flex items-center">
                    <Skeleton className="h-5 w-5 mr-2" />
                    <Skeleton className="h-5 w-36" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="mt-6">
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-40" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // If tender error occurred
  if (tenderError || !tender) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Ошибка загрузки данных</h2>
          <p className="text-gray-500 mb-4">
            Не удалось загрузить информацию о тендере. Пожалуйста, попробуйте позже.
          </p>
          <Button onClick={() => navigate('/tenders')}>Вернуться к списку тендеров</Button>
        </div>
      </Card>
    );
  }

  // Check if user is the tender owner
  const isOwner = isAuthenticated && user?.id === tender.userId;
  
  // Check if user has already bid
  const userHasBid = isAuthenticated && tenderBids?.some(bid => bid.userId === user?.id);
  
  // Find accepted bid
  const acceptedBid = tenderBids?.find(bid => bid.isAccepted);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{tender.title}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge 
              variant="secondary"
              className={getStatusColor(tender.status)}
            >
              {tender.status === 'open' ? 'Актуален' : 
               tender.status === 'in_progress' ? 'В работе' : 
               tender.status === 'completed' ? 'Завершен' : 'Отменен'}
            </Badge>
            {tender.category && (
              <Badge 
                variant="secondary"
                className={getCategoryColor(tender.category)}
              >
                {tender.category.charAt(0).toUpperCase() + tender.category.slice(1)}
              </Badge>
            )}
          </div>
        </div>
        
        {isOwner && tender.status === 'open' && (
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => navigate(`/tenders/${tender.id}/bids`)}>
              Управление заявками
            </Button>
            <Button variant="outline" onClick={() => navigate(`/tenders/${tender.id}/edit`)}>
              Редактировать
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              Удалить
            </Button>
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Описание тендера</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="whitespace-pre-line">{tender.description}</p>
              
              <div className="pt-4 space-y-3 border-t">
                <div className="flex items-center text-sm text-gray-600">
                  <CalendarDays className="mr-2 h-4 w-4" />
                  <span>Срок выполнения до: <strong>{formatDate(tender.deadline)}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <MapPin className="mr-2 h-4 w-4" />
                  <span>Местоположение: <strong>{tender.location}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Tag className="mr-2 h-4 w-4" />
                  <span>Бюджет: <strong>{tender.budget ? `${tender.budget.toLocaleString()} ₽` : 'Договорной'}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Clock className="mr-2 h-4 w-4" />
                  <span>Дата публикации: <strong>{formatDate(tender.createdAt)}</strong></span>
                </div>
                <div className="flex items-center text-sm text-gray-600">
                  <Eye className="mr-2 h-4 w-4" />
                  <span>Просмотров: <strong>{tender.viewCount}</strong></span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Bids Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Заявки на участие {tenderBids && tenderBids.length > 0 && `(${tenderBids.length})`}</CardTitle>
            </CardHeader>
            <CardContent>
              {isBidsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="border rounded-lg p-4">
                      <div className="flex items-center mb-4">
                        <Skeleton className="h-10 w-10 rounded-full mr-3" />
                        <div>
                          <Skeleton className="h-4 w-40 mb-1" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                      <Skeleton className="h-16 w-full mb-2" />
                      <div className="flex justify-between">
                        <Skeleton className="h-5 w-24" />
                        <Skeleton className="h-9 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : bidsError ? (
                <p className="text-center text-gray-500">
                  {!isAuthenticated 
                    ? "Войдите в систему, чтобы видеть заявки" 
                    : "Не удалось загрузить заявки. Пожалуйста, попробуйте позже."
                  }
                </p>
              ) : tenderBids && tenderBids.length > 0 ? (
                <div className="space-y-4">
                  {tenderBids.map((bid) => (
                    <div 
                      key={bid.id} 
                      className={`border rounded-lg p-4 ${bid.isAccepted ? 'bg-green-50 border-green-200' : ''}`}
                    >
                      <div className="flex items-center mb-2">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={bid.user?.avatar} alt={bid.user?.fullName || 'Пользователь'} />
                          <AvatarFallback>{getUserInitials(bid.user?.fullName || 'Пользователь')}</AvatarFallback>
                        </Avatar>
                        <div>
                          <Link href={`/profile/${bid.userId}`} className="font-medium text-gray-900 hover:text-primary">
                            {bid.user?.fullName || 'Пользователь'}
                          </Link>
                          <div className="flex items-center">
                            <StarRating rating={bid.user?.rating || 0} size="xs" showText />
                          </div>
                        </div>
                        {bid.isAccepted && (
                          <Badge className="ml-auto" variant="success">Принято</Badge>
                        )}
                      </div>
                      
                      <p className="text-gray-600 mb-3">{bid.description}</p>
                      
                      <div className="flex flex-wrap items-center justify-between">
                        <div className="space-x-4">
                          <span className="inline-block text-lg font-bold text-primary">{bid.amount.toLocaleString()} ₽</span>
                          {bid.timeframe && (
                            <span className="inline-block text-sm text-gray-500">
                              Срок выполнения: {bid.timeframe} {bid.timeframe === 1 ? 'день' : bid.timeframe < 5 ? 'дня' : 'дней'}
                            </span>
                          )}
                        </div>
                        
                        {isOwner && tender.status === 'open' && !bid.isAccepted && (
                          <Button 
                            onClick={() => handleAcceptBid(bid.id)}
                            disabled={acceptBidMutation.isPending}
                          >
                            {acceptBidMutation.isPending ? 'Принятие...' : 'Принять заявку'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500">
                  {!isAuthenticated ? "Войдите в систему, чтобы видеть заявки на участие" : "Пока нет заявок на участие в тендере."}
                </p>
              )}
              
              {isAuthenticated && !isOwner && tender.status === 'open' && !userHasBid && (
                <div className="mt-4 text-center">
                  <Button onClick={() => setIsBidDialogOpen(true)}>Подать заявку на участие</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Заказчик</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <Avatar className="h-12 w-12">
                  <AvatarImage 
                    src={tender.user?.avatar} 
                    alt={tender.user?.fullName || 'Заказчик'} 
                  />
                  <AvatarFallback>
                    {getUserInitials(tender.user?.fullName || 'Заказчик')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <Link 
                    href={`/profile/${tender.userId}`}
                    className="font-medium text-gray-900 hover:text-primary"
                  >
                    {tender.user?.fullName || 'Заказчик'}
                  </Link>
                  <div className="flex items-center">
                    <StarRating rating={tender.user?.rating || 0} size="xs" showText />
                  </div>
                </div>
              </div>
              
              {isAuthenticated && !isOwner && (
                <Link href={`/messages?userId=${tender.userId}`}>
                  <Button className="w-full" variant="outline">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    Написать заказчику
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
          
          {tender.status === 'in_progress' && acceptedBid && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Исполнитель</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage 
                      src={acceptedBid.user?.avatar} 
                      alt={acceptedBid.user?.fullName || 'Исполнитель'} 
                    />
                    <AvatarFallback>
                      {getUserInitials(acceptedBid.user?.fullName || 'Исполнитель')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link 
                      href={`/profile/${acceptedBid.userId}`}
                      className="font-medium text-gray-900 hover:text-primary"
                    >
                      {acceptedBid.user?.fullName || 'Исполнитель'}
                    </Link>
                    <div className="flex items-center">
                      <StarRating rating={acceptedBid.user?.rating || 0} size="xs" showText />
                    </div>
                  </div>
                </div>
                
                {isAuthenticated && isOwner && (
                  <Link href={`/messages?userId=${acceptedBid.userId}`}>
                    <Button className="w-full" variant="outline">
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Написать исполнителю
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          )}
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Похожие тендеры</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center text-gray-500 py-3">
                Функция "Похожие тендеры" будет доступна в ближайшее время.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Submit Bid Dialog */}
      <Dialog open={isBidDialogOpen} onOpenChange={setIsBidDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Подать заявку на участие</DialogTitle>
            <DialogDescription>
              Заполните форму, чтобы подать заявку на участие в тендере
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <label htmlFor="bid-amount" className="text-sm font-medium">
                Сумма заявки (₽) *
              </label>
              <Input
                id="bid-amount"
                type="number"
                placeholder="Укажите стоимость работ"
                value={bidAmount}
                onChange={(e) => setBidAmount(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="bid-timeframe" className="text-sm font-medium">
                Срок выполнения (дней)
              </label>
              <Input
                id="bid-timeframe"
                type="number"
                placeholder="Укажите количество дней на выполнение"
                value={bidTimeframe}
                onChange={(e) => setBidTimeframe(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="bid-description" className="text-sm font-medium">
                Описание заявки *
              </label>
              <Textarea
                id="bid-description"
                placeholder="Опишите ваш опыт, подход к работе и другие важные детали"
                value={bidDescription}
                onChange={(e) => setBidDescription(e.target.value)}
                className="min-h-32"
              />
            </div>
            <div className="grid gap-2">
              <label htmlFor="bid-documents" className="text-sm font-medium">
                Документы (необязательно)
              </label>
              <Input
                id="bid-documents"
                type="file"
                multiple
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                onChange={async (e) => {
                  const files = Array.from(e.target.files || []);
                  const uploadedUrls: string[] = [];
                  
                  for (const file of files) {
                    const reader = new FileReader();
                    reader.onload = async () => {
                      try {
                        const response = await fetch('/api/upload', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ file: reader.result })
                        });
                        const result = await response.json();
                        uploadedUrls.push(result.url);
                        setBidDocuments([...uploadedUrls]);
                      } catch (error) {
                        console.error('Upload failed:', error);
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
                className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <p className="text-xs text-gray-500">
                Поддерживаемые форматы: PDF, DOC, DOCX, JPG, PNG. Максимум 5 файлов.
              </p>
              {bidDocuments.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm font-medium mb-1">Загруженные документы:</p>
                  <ul className="text-sm text-gray-600">
                    {bidDocuments.map((doc, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        <span>Документ {index + 1}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setBidDocuments(bidDocuments.filter((_, i) => i !== index))}
                          className="text-red-500 hover:text-red-700"
                        >
                          Удалить
                        </Button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsBidDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              onClick={handleBidSubmit}
              disabled={isSubmittingBid}
            >
              {isSubmittingBid ? 'Отправка...' : 'Отправить заявку'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие не может быть отменено. Тендер будет удален безвозвратно.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteTender}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
