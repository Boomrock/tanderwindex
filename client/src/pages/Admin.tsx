import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/authContext';
import { useLocation } from 'wouter';
import { 
  Card, 
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCaption, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, DollarSign, Check, X, CheckCircle, XCircle, Trash2 } from 'lucide-react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

// Типы пользователей
type UserType = 'individual' | 'contractor' | 'company';

export default function Admin() {
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('dashboard');

  // Проверка доступа - только для администраторов
  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else if (user && !user.isAdmin) {
      navigate('/');
      toast({
        title: "Доступ запрещен",
        description: "У вас нет прав администратора для доступа к этой странице.",
        variant: "destructive",
      });
    }
  }, [user, navigate, toast]);

  // Типы данных для статистики и пользователей
  interface AdminStats {
    stats: {
      users: number;
      tenders: number;
      listings: number;
      activeUsers: number;
    }
  }

  interface AdminUser {
    id: number;
    username: string;
    email: string;
    fullName: string;
    userType: UserType;
    walletBalance?: number;
    isVerified: boolean;
    isAdmin: boolean;
    isTopSpecialist?: boolean;
    rating?: number;
  }

  // Получение статистики
  const { data: stats, isLoading: isLoadingStats } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
    enabled: !!user?.isAdmin,
  });

  // Получение списка пользователей
  const { data: users, isLoading: isLoadingUsers } = useQuery<AdminUser[]>({
    queryKey: ['/api/admin/users'],
    enabled: !!user?.isAdmin && activeTab === 'users',
  });

  // Получение тендеров на модерацию
  const { data: pendingTenders, isLoading: isLoadingTenders } = useQuery({
    queryKey: ['/api/admin/moderation/tenders'],
    enabled: !!user?.isAdmin && activeTab === 'tender-moderation',
  });

  // Получение объявлений маркетплейса на модерацию
  const { data: pendingListings, isLoading: isLoadingListings } = useQuery({
    queryKey: ['/api/admin/moderation/marketplace'],
    enabled: !!user?.isAdmin && activeTab === 'marketplace-moderation',
  });

  // Мутация для изменения прав администратора
  const toggleAdminMutation = useMutation({
    mutationFn: async ({ userId, isAdmin }: { userId: number, isAdmin: boolean }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { isAdmin });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Права администратора обновлены",
        description: "Изменения вступят в силу немедленно",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка обновления прав",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Мутация для изменения верификации пользователя
  const toggleVerificationMutation = useMutation({
    mutationFn: async ({ userId, isVerified }: { userId: number, isVerified: boolean }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { isVerified });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      toast({
        title: "Верификация пользователя обновлена",
        description: "Изменения вступят в силу немедленно",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка обновления верификации",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Мутации для модерации тендеров
  const approveTenderMutation = useMutation({
    mutationFn: async ({ tenderId, comment }: { tenderId: number, comment?: string }) => {
      const response = await apiRequest('POST', `/api/admin/moderation/tenders/${tenderId}/approve`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/tenders'] });
      toast({
        title: "Тендер одобрен",
        description: "Тендер теперь виден всем пользователям",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка одобрения тендера",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const rejectTenderMutation = useMutation({
    mutationFn: async ({ tenderId, comment }: { tenderId: number, comment: string }) => {
      const response = await apiRequest('POST', `/api/admin/moderation/tenders/${tenderId}/reject`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/tenders'] });
      toast({
        title: "Тендер отклонен",
        description: "Тендер скрыт от публичного просмотра",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка отклонения тендера",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Мутации для модерации маркетплейса
  const approveListingMutation = useMutation({
    mutationFn: async ({ listingId, comment }: { listingId: number, comment?: string }) => {
      const response = await apiRequest('POST', `/api/admin/moderation/marketplace/${listingId}/approve`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/marketplace'] });
      toast({
        title: "Объявление одобрено",
        description: "Объявление теперь видно всем пользователям",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка одобрения объявления",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const rejectListingMutation = useMutation({
    mutationFn: async ({ listingId, comment }: { listingId: number, comment: string }) => {
      const response = await apiRequest('POST', `/api/admin/moderation/marketplace/${listingId}/reject`, { comment });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/marketplace'] });
      toast({
        title: "Объявление отклонено",
        description: "Объявление скрыто от публичного просмотра",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка отклонения объявления",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Мутации для удаления
  const deleteTenderMutation = useMutation({
    mutationFn: async (tenderId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/tenders/${tenderId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/tenders'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenders'] });
      toast({
        title: "Тендер удален",
        description: "Тендер был полностью удален из системы",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка удаления тендера",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const deleteListingMutation = useMutation({
    mutationFn: async (listingId: number) => {
      const response = await apiRequest('DELETE', `/api/admin/marketplace/${listingId}`, {});
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/moderation/marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['/api/marketplace'] });
      toast({
        title: "Объявление удалено",
        description: "Объявление было полностью удалено из системы",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка удаления объявления",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  // Мутация для управления лучшими специалистами
  const toggleTopSpecialistMutation = useMutation({
    mutationFn: async ({ userId, isTopSpecialist }: { userId: number, isTopSpecialist: boolean }) => {
      const response = await apiRequest('PUT', `/api/admin/users/${userId}`, { isTopSpecialist });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users/top'] });
      toast({
        title: "Статус лучшего специалиста обновлен",
        description: "Изменения отображены на главной странице",
      });
    },
    onError: (error) => {
      toast({
        title: "Ошибка обновления статуса",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  if (!user?.isAdmin) {
    return null;
  }

  const handleAdminToggle = (userId: number, currentValue: boolean) => {
    toggleAdminMutation.mutate({ userId, isAdmin: !currentValue });
  };

  const handleVerificationToggle = (userId: number, currentValue: boolean) => {
    toggleVerificationMutation.mutate({ userId, isVerified: !currentValue });
  };

  const getUserTypeLabel = (type: UserType) => {
    switch (type) {
      case 'individual': return 'Физ. лицо';
      case 'contractor': return 'Подрядчик';
      case 'company': return 'Компания';
      default: return type;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Панель администратора</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="dashboard">Дашборд</TabsTrigger>
          <TabsTrigger value="users">Пользователи</TabsTrigger>
          <TabsTrigger value="top-specialists">Лучшие специалисты</TabsTrigger>
          <TabsTrigger value="tender-moderation">Модерация тендеров</TabsTrigger>
          <TabsTrigger value="marketplace-moderation">Модерация маркетплейса</TabsTrigger>
        </TabsList>
        
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {isLoadingStats ? (
              Array(4).fill(0).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-2">
                    <CardTitle className="h-6 bg-gray-200 rounded w-32"></CardTitle>
                    <CardDescription className="h-4 bg-gray-100 rounded w-24"></CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="h-9 bg-gray-300 rounded w-16"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Пользователи</CardTitle>
                    <CardDescription>Всего зарегистрировано</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.stats.users || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Активных</CardTitle>
                    <CardDescription>Пользователей с тендерами/объявлениями</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.stats.activeUsers || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Тендеры</CardTitle>
                    <CardDescription>Всего тендеров</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.stats.tenders || 0}</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle>Объявления</CardTitle>
                    <CardDescription>Всего объявлений в маркетплейсе</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold">{stats?.stats.listings || 0}</div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Управление пользователями</CardTitle>
              <CardDescription>
                Всего пользователей: {users?.length || 0}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="mr-2 h-8 w-8 animate-spin" />
                  <span>Загрузка списка пользователей...</span>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableCaption>Список всех пользователей платформы</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>Имя пользователя</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Тип</TableHead>
                        <TableHead>Баланс</TableHead>
                        <TableHead>Верифицирован</TableHead>
                        <TableHead>Админ</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users && users.length > 0 ? (
                        users.map((user) => (
                          <TableRow key={user.id}>
                            <TableCell>{user.id}</TableCell>
                            <TableCell>{user.username}</TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {getUserTypeLabel(user.userType)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {user.walletBalance !== null && user.walletBalance !== undefined
                                ? `${user.walletBalance} ₽`
                                : "0 ₽"}
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={user.isVerified} 
                                onCheckedChange={() => handleVerificationToggle(user.id, user.isVerified)}
                              />
                            </TableCell>
                            <TableCell>
                              <Switch 
                                checked={user.isAdmin} 
                                onCheckedChange={() => handleAdminToggle(user.id, user.isAdmin)}
                              />
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">
                            Пользователи не найдены
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tender-moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Модерация тендеров</CardTitle>
              <CardDescription>
                Ожидающие модерации тендеры
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingTenders ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingTenders && pendingTenders.length > 0 ? (
                    pendingTenders.map((tender: any) => (
                      <Card key={tender.id} className="border-l-4 border-l-yellow-500">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{tender.title}</CardTitle>
                              <CardDescription>
                                Бюджет: {tender.budget?.toLocaleString()} ₽ | 
                                Создан: {new Date(tender.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveTenderMutation.mutate({ tenderId: tender.id })}
                                disabled={approveTenderMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {approveTenderMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Одобрить
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectTenderMutation.mutate({ 
                                  tenderId: tender.id, 
                                  comment: "Нарушение правил публикации" 
                                })}
                                disabled={rejectTenderMutation.isPending}
                              >
                                {rejectTenderMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Отклонить
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => deleteTenderMutation.mutate(tender.id)}
                                disabled={deleteTenderMutation.isPending}
                              >
                                {deleteTenderMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Удалить
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-2">{tender.description}</p>
                          <div className="text-xs text-gray-500">
                            Категория: {tender.category} | Локация: {tender.location}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Нет тендеров на модерации
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplace-moderation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Модерация маркетплейса</CardTitle>
              <CardDescription>
                Ожидающие модерации объявления
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingListings ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingListings && pendingListings.length > 0 ? (
                    pendingListings.map((listing: any) => (
                      <Card key={listing.id} className="border-l-4 border-l-blue-500">
                        <CardHeader>
                          <div className="flex justify-between items-start">
                            <div>
                              <CardTitle className="text-lg">{listing.title}</CardTitle>
                              <CardDescription>
                                Цена: {listing.price?.toLocaleString()} ₽ | 
                                Тип: {listing.listingType} |
                                Создано: {new Date(listing.createdAt).toLocaleDateString()}
                              </CardDescription>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                onClick={() => approveListingMutation.mutate({ listingId: listing.id })}
                                disabled={approveListingMutation.isPending}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                {approveListingMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    Одобрить
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => rejectListingMutation.mutate({ 
                                  listingId: listing.id, 
                                  comment: "Нарушение правил публикации" 
                                })}
                                disabled={rejectListingMutation.isPending}
                              >
                                {rejectListingMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <XCircle className="h-4 w-4 mr-1" />
                                    Отклонить
                                  </>
                                )}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-300 text-red-600 hover:bg-red-50"
                                onClick={() => deleteListingMutation.mutate(listing.id)}
                                disabled={deleteListingMutation.isPending}
                              >
                                {deleteListingMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Удалить
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-gray-600 mb-2">{listing.description}</p>
                          <div className="text-xs text-gray-500">
                            Категория: {listing.category} | Локация: {listing.location}
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Нет объявлений на модерации
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-specialists" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Управление лучшими специалистами</CardTitle>
              <CardDescription>
                Выберите специалистов для отображения на главной странице
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingUsers ? (
                <div className="flex items-center justify-center p-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Пользователь</TableHead>
                      <TableHead>Тип</TableHead>
                      <TableHead>Рейтинг</TableHead>
                      <TableHead>Верификация</TableHead>
                      <TableHead>Лучший специалист</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users?.map((user: AdminUser) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.fullName}</div>
                            <div className="text-sm text-gray-500">@{user.username}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getUserTypeLabel(user.userType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            <span className="mr-1">⭐</span>
                            <span>{user.rating || 0}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {user.isVerified ? (
                            <Badge className="bg-green-100 text-green-800">Верифицирован</Badge>
                          ) : (
                            <Badge variant="secondary">Не верифицирован</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Switch
                            checked={user.isTopSpecialist || false}
                            onCheckedChange={(checked) => 
                              toggleTopSpecialistMutation.mutate({
                                userId: user.id,
                                isTopSpecialist: checked
                              })
                            }
                            disabled={toggleTopSpecialistMutation.isPending}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}