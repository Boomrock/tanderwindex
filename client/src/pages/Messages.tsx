import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { User } from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import MessagesList from '@/components/messaging/MessagesList';
import ChatBox from '@/components/messaging/ChatBox';
import { Button } from '@/components/ui/button';
import { MessageCircle } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

export default function Messages() {
  const [, navigate] = useLocation();
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const isMobile = useIsMobile();
  
  // Get userId from query string if provided
  const [location] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const initialUserId = searchParams.get('userId');
  
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(
    initialUserId ? parseInt(initialUserId) : undefined
  );

  // Update selectedUserId when URL changes
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const urlUserId = searchParams.get('userId');
    if (urlUserId && parseInt(urlUserId) !== selectedUserId) {
      setSelectedUserId(parseInt(urlUserId));
    }
  }, [location, selectedUserId]);
  const [showMessages, setShowMessages] = useState(!isMobile || !selectedUserId);
  const [showChat, setShowChat] = useState(!isMobile || !!selectedUserId);

  // Fetch user if userId provided
  const { data: selectedUser, isLoading: isUserLoading } = useQuery<User>({
    queryKey: [`/api/users/${selectedUserId}`],
    enabled: !!selectedUserId,
  });

  // Handle selecting a user to chat with
  const handleSelectUser = (userId: number) => {
    setSelectedUserId(userId);
    
    if (isMobile) {
      setShowMessages(false);
      setShowChat(true);
    }
  };

  // Handle back button in mobile view
  const handleBackToList = () => {
    if (isMobile) {
      setShowChat(false);
      setShowMessages(true);
    }
  };

  // Update UI when screen size changes
  useEffect(() => {
    if (!isMobile) {
      setShowMessages(true);
      setShowChat(true);
    } else if (selectedUserId && showChat) {
      setShowMessages(false);
    } else {
      setShowMessages(true);
      setShowChat(false);
    }
  }, [isMobile, selectedUserId, showChat]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthLoading, isAuthenticated, navigate]);

  if (isAuthLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-40 mb-6" />
        <div className="bg-white rounded-lg shadow-sm overflow-hidden h-[600px]">
          <Skeleton className="h-full w-full" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <>
      <Helmet>
        <title>
          {selectedUser 
            ? `Чат с ${selectedUser.fullName} | Windexs-Строй` 
            : 'Сообщения | Windexs-Строй'}
        </title>
        <meta name="description" content="Общайтесь с заказчиками, подрядчиками и продавцами. Обсуждайте детали тендеров и объявлений." />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">Сообщения</h1>
        
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 md:grid-cols-3 h-[600px]">
            {/* Messages List */}
            {showMessages && (
              <div className={`${!isMobile ? 'border-r' : ''} h-full`}>
                <MessagesList 
                  selectedUserId={selectedUserId} 
                  onSelectUser={handleSelectUser} 
                />
              </div>
            )}
            
            {/* Chat Box */}
            {showChat && (
              <div className={`${!isMobile ? 'col-span-2' : ''} h-full`}>
                {selectedUserId ? (
                  <ChatBox 
                    userId={selectedUserId} 
                    onBack={handleBackToList}
                    isMobile={isMobile}
                  />
                ) : (
                  <div className="h-full flex flex-col items-center justify-center p-4 text-center">
                    <MessageCircle className="h-16 w-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">Выберите диалог</h3>
                    <p className="text-gray-500 mb-4">
                      Выберите диалог из списка или начните новый разговор
                    </p>
                    <Link href="/messages/new">
                      <Button>Новое сообщение</Button>
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
