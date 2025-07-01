import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Message, User } from '@/lib/types';
import { formatDate, getUserInitials } from '@/lib/utils';
import { useAuth } from '@/lib/authContext';

interface MessagesListProps {
  selectedUserId?: number;
  onSelectUser: (userId: number) => void;
}

interface ConversationUser {
  id: number;
  fullName: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}

export default function MessagesList({ selectedUserId, onSelectUser }: MessagesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [conversations, setConversations] = useState<ConversationUser[]>([]);
  const { user } = useAuth();
  const [, navigate] = useLocation();

  // Fetch all user messages
  const { data: messages, isLoading } = useQuery<Message[]>({
    queryKey: ['/api/messages'],
    staleTime: 10000, // 10 seconds
    refetchInterval: 15000, // 15 seconds
  });

  // Fetch all users data
  const { data: users } = useQuery<User[]>({
    queryKey: ['/api/users'],
    staleTime: 3600000, // 1 hour
  });

  // Process messages to create conversations list
  useEffect(() => {
    if (!messages || !users || !user) return;

    const currentUserId = user.id;
    const conversationMap = new Map<number, ConversationUser>();

    // Group messages by conversation
    messages.forEach(message => {
      const otherUserId = message.senderId === currentUserId ? message.receiverId : message.senderId;
      const otherUser = users.find(u => u.id === otherUserId);
      
      if (!otherUser) return;
      
      const existingConversation = conversationMap.get(otherUserId);
      const messageTime = new Date(message.createdAt);
      
      if (!existingConversation || new Date(existingConversation.lastMessageTime) < messageTime) {
        const fullName = otherUser.firstName && otherUser.lastName 
          ? `${otherUser.firstName} ${otherUser.lastName}` 
          : otherUser.username;
        
        conversationMap.set(otherUserId, {
          id: otherUserId,
          fullName: fullName,
          avatar: otherUser.avatar,
          lastMessage: message.content,
          lastMessageTime: message.createdAt,
          unreadCount: existingConversation ? existingConversation.unreadCount : 0
        });
      }
      
      // Count unread messages
      if (message.receiverId === currentUserId && !message.isRead) {
        const conversation = conversationMap.get(otherUserId);
        if (conversation) {
          conversation.unreadCount += 1;
          conversationMap.set(otherUserId, conversation);
        }
      }
    });
    
    // Convert map to array and sort by most recent message
    const sortedConversations = Array.from(conversationMap.values())
      .sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());
    
    setConversations(sortedConversations);
  }, [messages, users, user]);

  // Filter conversations by search query
  const filteredConversations = searchQuery 
    ? conversations.filter(
        conv => conv.fullName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : conversations;

  // Handle new message button
  const handleNewMessage = () => {
    navigate('/messages/new');
  };

  // If still loading
  if (isLoading) {
    return (
      <div className="h-full flex flex-col">
        <div className="px-4 py-3 border-b">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Сообщения</h2>
            <Button size="sm" disabled>Новое сообщение</Button>
          </div>
          <Skeleton className="h-9 w-full" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-2 p-2">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="p-2 rounded-md flex items-center space-x-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-3 w-10" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Сообщения</h2>
          <Button size="sm" onClick={handleNewMessage}>Новое сообщение</Button>
        </div>
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Поиск по диалогам"
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {filteredConversations.length > 0 ? (
          <div className="space-y-1 p-2">
            {filteredConversations.map((conversation) => (
              <div
                key={conversation.id}
                className={`p-2 rounded-md cursor-pointer hover:bg-gray-100 flex items-start space-x-3 ${
                  selectedUserId === conversation.id ? 'bg-blue-50' : ''
                }`}
                onClick={() => onSelectUser(conversation.id)}
              >
                <Avatar>
                  <AvatarImage src={conversation.avatar} alt={conversation.fullName} />
                  <AvatarFallback>{getUserInitials(conversation.fullName)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-gray-900 truncate">{conversation.fullName}</h3>
                    <span className="text-xs text-gray-500">
                      {formatDate(conversation.lastMessageTime, 'HH:mm')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate">{conversation.lastMessage}</p>
                </div>
                {conversation.unreadCount > 0 && (
                  <Badge className="ml-auto bg-primary">
                    {conversation.unreadCount}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : searchQuery ? (
          <div className="p-8 text-center text-gray-500">
            Не найдено диалогов по запросу "{searchQuery}"
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            У вас пока нет сообщений
          </div>
        )}
      </div>
    </div>
  );
}
