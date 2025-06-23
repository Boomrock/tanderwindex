import { useState } from 'react';
import { useParams, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, User, Star, Award, Clock, DollarSign, FileText, Loader2 } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface TenderBid {
  id: number;
  tenderId: number;
  userId: number;
  amount: number;
  description: string;
  timeframe: number;
  documents: string[];
  status: 'pending' | 'approved' | 'rejected';
  isAccepted: boolean;
  rejectionReason?: string;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    fullName: string;
    rating: number;
    avatar?: string;
    email?: string;
    phone?: string;
  };
}

interface Tender {
  id: number;
  title: string;
  description: string;
  budget: number;
  deadline: string;
  location: string;
  userId: number;
}

export default function TenderBids() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedBid, setSelectedBid] = useState<TenderBid | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const tenderId = parseInt(id || '0');

  // Получение данных тендера
  const { data: tender, isLoading: isLoadingTender } = useQuery<Tender>({
    queryKey: ['/api/tenders', tenderId],
    enabled: !!tenderId,
  });

  // Получение заявок на тендер
  const { data: bids, isLoading: isLoadingBids } = useQuery<TenderBid[]>({
    queryKey: [`/api/tenders/${tenderId}/bids`],
    enabled: !!tenderId,
  });

  // Мутация для одобрения заявки
  const approveBidMutation = useMutation({
    mutationFn: async (bidId: number) => {
      const response = await apiRequest('POST', `/api/tenders/bids/${bidId}/approve`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}/bids`] });
      toast({
        title: "Заявка одобрена",
        description: "Исполнитель получит уведомление о допуске к участию в тендере",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка одобрения заявки",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Мутация для отклонения заявки
  const rejectBidMutation = useMutation({
    mutationFn: async ({ bidId, reason }: { bidId: number; reason?: string }) => {
      const response = await apiRequest('POST', `/api/tenders/bids/${bidId}/reject`, { reason });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/tenders/${tenderId}/bids`] });
      setRejectDialogOpen(false);
      setRejectionReason('');
      setSelectedBid(null);
      toast({
        title: "Заявка отклонена",
        description: "Исполнитель получит уведомление об отказе",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Ошибка отклонения заявки",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleApproveBid = (bid: TenderBid) => {
    approveBidMutation.mutate(bid.id);
  };

  const handleRejectBid = (bid: TenderBid) => {
    setSelectedBid(bid);
    setRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (selectedBid) {
      rejectBidMutation.mutate({ bidId: selectedBid.id, reason: rejectionReason });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary">На рассмотрении</Badge>;
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Одобрена</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Отклонена</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Не указан';
    try {
      return new Date(dateString).toLocaleDateString('ru-RU');
    } catch (e) {
      return 'Некорректная дата';
    }
  };

  if (isLoadingTender || isLoadingBids) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!tender) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Тендер не найден</h1>
          <Button onClick={() => setLocation('/tenders')}>
            Вернуться к тендерам
          </Button>
        </div>
      </div>
    );
  }

  const pendingBids = bids?.filter(bid => bid.status === 'pending') || [];
  const approvedBids = bids?.filter(bid => bid.status === 'approved') || [];
  const rejectedBids = bids?.filter(bid => bid.status === 'rejected') || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button 
          variant="outline" 
          onClick={() => setLocation(`/tenders/${tenderId}`)}
          className="mb-4"
        >
          ← Вернуться к тендеру
        </Button>
        
        <h1 className="text-3xl font-bold mb-2">Управление заявками</h1>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{tender.title}</CardTitle>
            <CardDescription>
              Бюджет: {tender.budget ? tender.budget.toLocaleString() : 'Не указан'} ₽ | 
              Срок: {tender.deadline ? formatDate(tender.deadline) : 'Не указан'} | 
              Локация: {tender.location || 'Не указана'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="pending">
            На рассмотрении ({pendingBids.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Одобренные ({approvedBids.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Отклоненные ({rejectedBids.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingBids.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет заявок на рассмотрении</p>
            </div>
          ) : (
            pendingBids.map((bid) => (
              <Card key={bid.id} className="border-l-4 border-l-yellow-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>{bid.user?.fullName || bid.user?.username || 'Пользователь'}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{bid.user?.rating?.toFixed(1) || '0.0'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(bid.createdAt)}</span>
                          </span>
                          {bid.user?.email && (
                            <span className="text-sm text-gray-500">{bid.user.email}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(bid.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">{bid.amount.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>{bid.timeframe} дней</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Описание предложения:</span>
                    </h4>
                    <p className="text-gray-600">{bid.description}</p>
                  </div>

                  {bid.documents && bid.documents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Документы:</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {bid.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Документ {index + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex space-x-2 pt-4 border-t">
                    <Button
                      onClick={() => handleApproveBid(bid)}
                      disabled={approveBidMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {approveBidMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle className="h-4 w-4 mr-2" />
                      )}
                      Одобрить
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleRejectBid(bid)}
                      disabled={rejectBidMutation.isPending}
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Отклонить
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedBids.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет одобренных заявок</p>
            </div>
          ) : (
            approvedBids.map((bid) => (
              <Card key={bid.id} className="border-l-4 border-l-green-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>{bid.user?.fullName || bid.user?.username || 'Пользователь'}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{bid.user?.rating?.toFixed(1) || '0.0'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(bid.createdAt)}</span>
                          </span>
                          {bid.user?.email && (
                            <span className="text-sm text-gray-500">{bid.user.email}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(bid.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">{bid.amount.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>{bid.timeframe} дней</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Описание предложения:</span>
                    </h4>
                    <p className="text-gray-600">{bid.description}</p>
                  </div>

                  {bid.documents && bid.documents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Документы:</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {bid.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Документ {index + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedBids.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Нет отклоненных заявок</p>
            </div>
          ) : (
            rejectedBids.map((bid) => (
              <Card key={bid.id} className="border-l-4 border-l-red-500">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center space-x-4">
                      <div>
                        <CardTitle className="text-lg flex items-center space-x-2">
                          <User className="h-5 w-5" />
                          <span>{bid.user?.fullName || bid.user?.username || 'Пользователь'}</span>
                        </CardTitle>
                        <CardDescription className="flex items-center space-x-4 mt-1">
                          <span className="flex items-center space-x-1">
                            <Star className="h-4 w-4" />
                            <span>{bid.user?.rating?.toFixed(1) || '0.0'}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(bid.createdAt)}</span>
                          </span>
                          {bid.user?.email && (
                            <span className="text-sm text-gray-500">{bid.user.email}</span>
                          )}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(bid.status)}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <DollarSign className="h-5 w-5 text-green-600" />
                      <span className="font-semibold">{bid.amount.toLocaleString()} ₽</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <span>{bid.timeframe} дней</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <h4 className="font-medium mb-2 flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Описание предложения:</span>
                    </h4>
                    <p className="text-gray-600">{bid.description}</p>
                  </div>

                  {bid.documents && bid.documents.length > 0 && (
                    <div className="mb-4">
                      <h4 className="font-medium mb-2 flex items-center space-x-2">
                        <FileText className="h-4 w-4" />
                        <span>Документы:</span>
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {bid.documents.map((doc, index) => (
                          <a
                            key={index}
                            href={doc}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
                          >
                            <FileText className="h-3 w-3" />
                            <span>Документ {index + 1}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {bid.rejectionReason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <h4 className="font-medium text-red-800 mb-1">Причина отклонения:</h4>
                      <p className="text-red-700">{bid.rejectionReason}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Диалог отклонения заявки */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Отклонить заявку</DialogTitle>
            <DialogDescription>
              Вы можете указать причину отклонения заявки. Исполнитель получит уведомление.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-reason">Причина отклонения (необязательно)</Label>
              <Textarea
                id="rejection-reason"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Укажите причину отклонения заявки..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectDialogOpen(false)}
            >
              Отмена
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmReject}
              disabled={rejectBidMutation.isPending}
            >
              {rejectBidMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Отклонить заявку
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}