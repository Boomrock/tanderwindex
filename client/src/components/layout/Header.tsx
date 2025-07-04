import { Link, useLocation } from "wouter";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/authContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getUserInitials } from "@/lib/utils";
import towerLogo from "@assets/Снимок экрана 2025-07-04 в 11.49.23_1751655127229.png";
import brandLogo from "@assets/Снимок экрана 2025-07-04 в 11.43.28_1751655129311.png";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  User, 
  LogOut, 
  Settings, 
  MessageCircle, 
  PlusCircle, 
  Search,
  Menu,
  X,
  Construction,
  ShieldCheck,
  Wallet,
  Shield
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import NotificationBell from "@/components/notifications/NotificationBell";

const Header = () => {
  const [location] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/tenders", label: "Тендеры" },
    { href: "/marketplace", label: "Маркетплейс" },
    { href: "/specialists", label: "Специалисты" },
    { href: "/crews", label: "Бригады" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  // Fetch unread messages count
  const { data: messages } = useQuery({
    queryKey: ["/api/messages"],
    enabled: isAuthenticated,
  });

  // Calculate unread messages count
  const messagesArray = Array.isArray(messages) ? messages : [];
  const unreadMessagesCount = isAuthenticated && messagesArray.length > 0
    ? messagesArray.filter((message: any) => !message.isRead && message.receiverId === user?.id).length 
    : 0;

  return (
    <header className="shadow-sm" style={{ backgroundColor: '#f7f7f7' }}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <div className="flex-shrink-0 flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <img 
                src={towerLogo} 
                alt="Windexs-Строй Tower Logo" 
                className="h-20 w-20 object-contain"
              />
              <div className="hidden sm:flex flex-col items-center">
                <img 
                  src={brandLogo} 
                  alt="Windexs Brand Logo" 
                  className="h-9 object-contain"
                />
                <span className="text-green-600 font-bold text-lg leading-none mt-2">Строй</span>
              </div>
              <span className="font-bold text-lg text-green-600 sm:hidden">W-S</span>
            </Link>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-medium ${
                  location === link.href
                    ? "text-green-600"
                    : "text-gray-700 hover:text-green-600"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          
          {/* Auth Section */}
          <div className="flex items-center space-x-4">
            
            {isAuthenticated ? (
              <>
                <Link href="/messages" className="relative hidden md:inline-flex items-center text-sm font-medium text-gray-700 hover:text-green-600">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Сообщения
                  {unreadMessagesCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center p-0">
                      {unreadMessagesCount}
                    </Badge>
                  )}
                </Link>
                
                <NotificationBell />
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user?.avatar} alt={user?.fullName} />
                        <AvatarFallback>{getUserInitials(user?.fullName || '')}</AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user?.fullName}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href="/profile">
                        <User className="mr-2 h-4 w-4" />
                        Профиль
                      </Link>
                    </DropdownMenuItem>

                    <DropdownMenuItem asChild>
                      <Link href="/messages">
                        <MessageCircle className="mr-2 h-4 w-4" />
                        Сообщения
                        {unreadMessagesCount > 0 && (
                          <Badge className="ml-auto bg-red-500 text-white text-xs p-1">
                            {unreadMessagesCount}
                          </Badge>
                        )}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />

                    <DropdownMenuItem asChild>
                      <Link href="/tenders/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Создать тендер
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href="/marketplace/create">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Разместить объявление
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {user?.isAdmin && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/admin">
                            <Shield className="mr-2 h-4 w-4" />
                            Панель администратора
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem onClick={logout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Выйти
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="link" className="text-primary">
                    Войти
                  </Button>
                </Link>
                <Link href="/register">
                  <Button>Регистрация</Button>
                </Link>
              </>
            )}
            
            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={toggleMobileMenu}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </Button>
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden px-2 pt-2 pb-3 space-y-1 bg-white border-t">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                location === link.href
                  ? "text-primary bg-blue-50"
                  : "text-gray-700 hover:text-primary hover:bg-gray-100"
              }`}
              onClick={() => setMobileMenuOpen(false)}
            >
              {link.label}
            </Link>
          ))}
          
          {isAuthenticated && (
            <>
              <Link
                href="/profile"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Профиль
              </Link>

              <Link
                href="/messages"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Сообщения
                {unreadMessagesCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {unreadMessagesCount}
                  </Badge>
                )}
              </Link>

              <Link
                href="/tenders/create"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Создать тендер
              </Link>
              <Link
                href="/marketplace/create"
                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100"
                onClick={() => setMobileMenuOpen(false)}
              >
                Разместить объявление
              </Link>
              {user?.isAdmin && (
                <Link
                  href="/admin"
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Панель администратора
                </Link>
              )}
              <button
                className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-primary hover:bg-gray-100"
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
              >
                Выйти
              </button>
            </>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
