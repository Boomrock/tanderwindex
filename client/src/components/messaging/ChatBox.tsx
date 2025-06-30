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

  // Helper function to get user display name
  const getUserDisplayName = (user: User) => {
    if (user.fullName) return user.fullName;
    if ((user as any).full_name) return (user as any).full_name;
    return user.username || "Неизвестный пользователь";
  };

  // Fetch user details
  const { data: otherUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
  });

  // Fetch messages for conversation
  const { data: messages, isLoading: isMessagesLoading } = useQuery<Message[]>({
    queryKey: [`/api/messages/${userId}`],
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest('POST', '/api/messages', {
        receiverId: userId,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/messages/${userId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/messages'] });
      setMessage('');
    },
    onError: (error: Error) => {
      toast({
        title: "Ошибка",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

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
        <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm flex items-center gap-3">
          {isMobile && onBack && (
            <Button variant="ghost" size="sm" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-4 w-32 mb-1" />
            <Skeleton className="h-3 w-20" />
          </div>
        </div>
        <div className="flex-1 p-4 space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
              <Skeleton className={`h-12 ${i % 2 === 0 ? 'w-48' : 'w-32'} rounded-lg`} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!otherUser) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Пользователь не найден</p>
          {isMobile && onBack && (
            <Button variant="outline" className="mt-4" onClick={onBack}>
              Назад
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border bg-background/50 backdrop-blur-sm flex items-center gap-3">
        {isMobile && onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <Avatar>
          <AvatarImage src={otherUser.avatar || undefined} />
          <AvatarFallback>{getUserInitials(getUserDisplayName(otherUser))}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Link to={`/profile/${otherUser.id}`}>
            <h3 className="font-medium text-foreground hover:text-primary transition-colors">
              {getUserDisplayName(otherUser)}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground">
            {otherUser.userType === 'contractor' ? 'Подрядчик' : otherUser.userType === 'company' ? 'Компания' : 'Пользователь'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {!messages || messages.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            <p>Нет сообщений</p>
            <p className="text-sm mt-1">Начните разговор!</p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.senderId === user?.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${
                  msg.senderId === user?.id 
                    ? 'text-primary-foreground/70' 
                    : 'text-muted-foreground/70'
                }`}>
                  {formatDate(msg.createdAt)}
                  {msg.senderId !== user?.id && !msg.isRead && (
                    <span className="ml-2 text-xs">●</span>
                  )}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input */}
      <div className="p-4 border-t border-border bg-background/50 backdrop-blur-sm">
        <div className="flex gap-2">
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            className="min-h-[44px] max-h-32 resize-none"
            disabled={sendMessageMutation.isPending}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!message.trim() || sendMessageMutation.isPending}
            size="icon"
            className="h-[44px] w-[44px] shrink-0"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}