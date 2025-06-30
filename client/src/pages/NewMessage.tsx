import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'wouter';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send, Search } from 'lucide-react';
import { User } from '@/lib/types';
import { getUserInitials } from '@/lib/utils';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

export default function NewMessage() {
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const { user } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch all users
  const { data: users, isLoading: isUsersLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  // Filter users
  const filteredUsers = users?.filter(u => 
    u.id !== user?.id && 
    (u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
     u.username.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Selected user
  const selectedUser = users?.find(u => u.id === selectedUserId);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUserId || !message.trim()) {
        throw new Error('Выберите получателя и введите сообщение');
      }
      
      return apiRequest('POST', '/api/messages', {
        receiverId: selectedUserId,
        content: message.trim()
      });
    },
    onSuccess: () => {
      toast({
        title: 'Сообщение отправлено',
        description: `Ваше сообщение успешно отправлено ${selectedUser?.fullName}`,
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      // Redirect to the conversation
      navigate(`/messages?userId=${selectedUserId}`);
    },
    onError: (error) => {
      toast({
        title: 'Ошибка отправки',
        description: error.message || 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    },
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const handleSendMessage = () => {
    if (!selectedUserId) {
      toast({
        title: 'Выберите получателя',
        description: 'Пожалуйста, выберите пользователя для отправки сообщения',
        variant: 'destructive',
      });
      return;
    }
    
    if (!message.trim()) {
      toast({
        title: 'Введите сообщение',
        description: 'Пожалуйста, введите текст сообщения',
        variant: 'destructive',
      });
      return;
    }
    
    sendMessageMutation.mutate();
  };

  if (!user) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Helmet>
        <title>Новое сообщение | СтройТендер</title>
        <meta name="description" content="Отправить новое сообщение пользователю платформы СтройТендер." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-6">
          <Button variant="ghost" onClick={() => navigate('/messages')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Назад
          </Button>
          <h1 className="text-2xl font-bold">Новое сообщение</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* User selection */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Выберите получателя</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative mb-4">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Поиск пользователей"
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              {isUsersLoading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex items-center space-x-3 p-2">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="space-y-1">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredUsers && filteredUsers.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto space-y-1">
                  {filteredUsers.map(user => (
                    <div
                      key={user.id}
                      className={`flex items-center space-x-3 p-2 rounded-md cursor-pointer hover:bg-gray-100 ${
                        selectedUserId === user.id ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => setSelectedUserId(user.id)}
                    >
                      <Avatar>
                        <AvatarImage src={user.avatar} alt={user.fullName} />
                        <AvatarFallback>{getUserInitials(user.fullName)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{user.fullName}</div>
                        <div className="text-sm text-gray-500">
                          {user.userType === 'individual' ? 'Физическое лицо' : 
                           user.userType === 'contractor' ? 'Подрядчик' : 'Компания'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  {searchQuery 
                    ? `Не найдено пользователей по запросу "${searchQuery}"` 
                    : 'Нет доступных пользователей'}
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Message compose */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedUser 
                  ? `Сообщение для ${selectedUser.fullName}` 
                  : 'Новое сообщение'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedUser ? (
                <>
                  <div className="flex items-center space-x-3 mb-4 p-2 bg-gray-50 rounded-md">
                    <Avatar>
                      <AvatarImage src={selectedUser.avatar} alt={selectedUser.fullName} />
                      <AvatarFallback>{getUserInitials(selectedUser.fullName)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{selectedUser.fullName}</div>
                      <div className="text-sm text-gray-500">
                        {selectedUser.userType === 'individual' ? 'Физическое лицо' : 
                         selectedUser.userType === 'contractor' ? 'Подрядчик' : 'Компания'}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="ml-auto"
                      onClick={() => setSelectedUserId(null)}
                    >
                      Изменить
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="message">Текст сообщения</Label>
                      <Textarea
                        id="message"
                        placeholder="Введите сообщение..."
                        className="min-h-[120px]"
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                      />
                    </div>
                    
                    <Button 
                      className="w-full"
                      onClick={handleSendMessage}
                      disabled={!message.trim() || sendMessageMutation.isPending}
                    >
                      {sendMessageMutation.isPending ? 'Отправка...' : 'Отправить сообщение'}
                      <Send className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-16 text-gray-500">
                  Пожалуйста, выберите получателя из списка слева
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}