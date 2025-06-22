import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Send } from 'lucide-react';
import { Message, User } from '@/lib/types';
import { formatDate, getUserInitials } from '@/lib/utils';
import { useAuth } from '@/lib/authContext';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface ChatBoxProps {
  userId: number;
  onBack?: () => void;
  isMobile?: boolean;
}

export default function ChatBox({ userId, onBack, isMobile = false }: ChatBoxProps) {
  const [message, setMessage] = useState('');
  const { user } = useAuth();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const processedMessageIds = useRef<Set<number>>(new Set());

  // Fetch user details
  const { data: otherUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  // Fetch conversation
  const { 
    data: messages, 
    isLoading: isMessagesLoading,
    refetch: refetchMessages
  } = useQuery<Message[]>({
    queryKey: [`/api/messages/${userId}`],
    refetchInterval: 10000, // 10 seconds
  });

  // Mark messages as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: async (messageId: number) => {
      return apiRequest('PUT', `/api/messages/${messageId}/read`, {});
    },
    onSuccess: () => {
      // Invalidate messages cache to update unread count in the list
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('POST', '/api/messages', {
        receiverId: userId,
        content,
      });
    },
    onSuccess: () => {
      setMessage('');
      refetchMessages();
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
    },
    onError: (error) => {
      toast({
        title: 'Ошибка отправки',
        description: error.message || 'Не удалось отправить сообщение',
        variant: 'destructive',
      });
    },
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Mark unread messages as read (only once when messages load)
  useEffect(() => {
    if (!messages || !user || markAsReadMutation.isPending) return;
    
    // Find unread messages sent to current user that haven't been processed yet
    const unreadMessages = messages.filter(
      msg => msg.receiverId === user.id && !msg.isRead && !processedMessageIds.has(msg.id)
    );
    
    // Mark each unread message as read (only if there are any)
    if (unreadMessages.length > 0) {
      const newProcessedIds = new Set(processedMessageIds);
      unreadMessages.forEach(msg => {
        newProcessedIds.add(msg.id);
        markAsReadMutation.mutate(msg.id);
      });
      setProcessedMessageIds(newProcessedIds);
    }
  }, [messages, user?.id, markAsReadMutation.isPending, processedMessageIds]);

  const handleSendMessage = () => {
    if (!message.trim()) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Loading state
  if (isUserLoading || isMessagesLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b flex items-center">
          {isMobile && (
            <Button variant="ghost" size="icon" className="mr-2" disabled>
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <Skeleton className="h-10 w-10 rounded-full mr-3" />
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] ${i % 2 === 0 ? 'bg-primary text-white' : 'bg-gray-100'} rounded-lg p-3`}>
                <Skeleton className={`h-12 w-48 ${i % 2 === 0 ? 'bg-primary-dark' : 'bg-gray-200'}`} />
              </div>
            </div>
          ))}
        </div>
        <div className="border-t p-3">
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  // User not found
  if (!otherUser) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-4">
        <p className="mb-4 text-gray-500">Пользователь не найден</p>
        <Button onClick={onBack} variant="outline">
          Назад к списку сообщений
        </Button>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b flex items-center">
        {isMobile && (
          <Button variant="ghost" size="icon" className="mr-2" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Avatar className="h-10 w-10 mr-3">
          <AvatarImage src={otherUser.avatar} alt={otherUser.fullName} />
          <AvatarFallback>{getUserInitials(otherUser.fullName)}</AvatarFallback>
        </Avatar>
        <div>
          <Link href={`/profile/${otherUser.id}`} className="font-semibold hover:text-primary">
            {otherUser.fullName}
          </Link>
          <div className="text-xs text-gray-500">
            {otherUser.userType === 'individual' ? 'Физическое лицо' : 
             otherUser.userType === 'contractor' ? 'Подрядчик' : 'Компания'}
          </div>
        </div>
      </div>
      
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages && messages.length > 0 ? (
          <>
            {messages.map((msg) => {
              const isOwnMessage = msg.senderId === user?.id;
              return (
                <div key={msg.id} className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[80%] ${
                    isOwnMessage 
                      ? 'bg-primary text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg' 
                      : 'bg-gray-100 text-gray-800 rounded-tl-lg rounded-tr-lg rounded-br-lg'
                  } p-3`}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <div className={`text-xs mt-1 ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
                      {formatDate(msg.createdAt, 'HH:mm')}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500">
            Начните диалог, отправив сообщение
          </div>
        )}
      </div>
      
      {/* Message input */}
      <div className="border-t p-3">
        <div className="flex space-x-2">
          <Textarea
            placeholder="Введите сообщение..."
            className="min-h-[80px] resize-none"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <Button 
            className="self-end"
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
