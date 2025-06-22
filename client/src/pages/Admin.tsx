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
import { Loader2, UserPlus, DollarSign, Check, X } from 'lucide-react';
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
      </Tabs>
    </div>
  );
}