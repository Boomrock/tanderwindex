import { useEffect, useState } from 'react';
import { useParams, useLocation, Link } from 'wouter';
import { Helmet } from 'react-helmet';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  User, 
  Review, 
  Tender, 
  MarketplaceListing,
  ProfileUpdateFormData 
} from '@/lib/types';
import { useAuth } from '@/lib/authContext';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Edit, 
  MapPin, 
  Star, 
  User as UserIcon, 
  Calendar, 
  CheckCircle,
  MessageCircle,
  ArrowLeft
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { getUserInitials } from '@/lib/utils';
import TenderCard from '@/components/tenders/TenderCard';
import MarketplaceItemCard from '@/components/marketplace/MarketplaceItemCard';
import StarRating from '@/components/shared/StarRating';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export default function Profile() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user: currentUser, isAuthenticated } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProfileUpdateFormData>({
    fullName: '',
    location: '',
    bio: '',
    avatar: '',
    phone: '',
  });

  // Determine if viewing own profile
  const userId = id ? parseInt(id) : currentUser?.id;
  const isOwnProfile = currentUser?.id === userId;

  // Get proper page title
  const getTitle = (userData?: User) => {
    if (isOwnProfile) return 'Мой профиль | СтройТендер';
    return userData ? `${userData.fullName} | Профиль | СтройТендер` : 'Профиль пользователя | СтройТендер';
  };

  // Fetch user data
  const { 
    data: userData, 
    isLoading: isUserLoading, 
    error: userError 
  } = useQuery<User>({
    queryKey: [`/api/users/${userId}`],
    enabled: !!userId,
  });

  // Fetch user reviews
  const { 
    data: userReviews, 
    isLoading: isReviewsLoading 
  } = useQuery<Review[]>({
    queryKey: [`/api/users/${userId}/reviews`],
    enabled: !!userId,
  });

  // Fetch user tenders
  const { 
    data: userTenders, 
    isLoading: isTendersLoading 
  } = useQuery<Tender[]>({
    queryKey: isOwnProfile ? ['/api/users/me/tenders'] : [`/api/tenders?userId=${userId}`],
    enabled: !!userId,
  });

  // Fetch user listings
  const { 
    data: userListings, 
    isLoading: isListingsLoading 
  } = useQuery<MarketplaceListing[]>({
    queryKey: isOwnProfile ? ['/api/users/me/marketplace'] : [`/api/marketplace?userId=${userId}`],
    enabled: !!userId,
  });

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileUpdateFormData) => {
      return apiRequest('PUT', '/api/users/me', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${userId}`] });
      toast({
        title: 'Профиль обновлен',
        description: 'Ваш профиль был успешно обновлен',
      });
      setIsEditDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось обновить профиль',
        variant: 'destructive',
      });
    },
  });

  // Populate form data when user data is loaded
  useEffect(() => {
    if (userData && isOwnProfile) {
      setFormData({
        fullName: userData.fullName || '',
        location: userData.location || '',
        bio: userData.bio || '',
        avatar: userData.avatar || '',
        phone: userData.phone || '',
      });
    }
  }, [userData, isOwnProfile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  // Handle navigation to messages
  const handleMessageUser = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    navigate(`/messages?userId=${userId}`);
  };

  // If user is not found or error
  if ((!isUserLoading && !userData) || userError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-50 text-red-500 p-6 rounded-lg text-center">
          <h2 className="text-xl font-semibold mb-2">Пользователь не найден</h2>
          <p className="mb-4">Пользователь с указанным идентификатором не существует или был удален.</p>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Вернуться на главную
          </Button>
        </div>
      </div>
    );
  }

  // If user is not authenticated and trying to view own profile
  if (!isAuthenticated && !id) {
    navigate('/login');
    return null;
  }

  return (
    <>
      <Helmet>
        <title>{getTitle(userData)}</title>
        <meta
          name="description"
          content={
            userData
              ? `Профиль ${userData.fullName}. ${userData.bio || 'СтройТендер - платформа для тендеров и маркетплейс строительных материалов.'}`
              : 'Профиль пользователя СтройТендер.'
          }
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div>
            <Card>
              <CardHeader className="pb-2">
                {isUserLoading ? (
                  <Skeleton className="h-7 w-40 mb-1" />
                ) : (
                  <CardTitle>{isOwnProfile ? 'Мой профиль' : 'Профиль пользователя'}</CardTitle>
                )}
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center text-center mb-6">
                  {isUserLoading ? (
                    <Skeleton className="h-32 w-32 rounded-full mb-4" />
                  ) : (
                    <Avatar className="h-32 w-32 mb-4">
                      <AvatarImage src={userData?.avatar} alt={userData?.fullName} />
                      <AvatarFallback className="text-2xl">
                        {getUserInitials(userData?.fullName || 'Пользователь')}
                      </AvatarFallback>
                    </Avatar>
                  )}

                  {isUserLoading ? (
                    <>
                      <Skeleton className="h-7 w-48 mb-2" />
                      <Skeleton className="h-5 w-32 mb-2" />
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-semibold mb-1">{userData?.fullName}</h2>
                      <p className="text-sm text-muted-foreground mb-2">
                        {userData?.userType === 'individual'
                          ? 'Физическое лицо'
                          : userData?.userType === 'contractor'
                          ? 'Подрядчик'
                          : 'Компания'}
                      </p>
                      <div className="flex items-center mb-2">
                        <StarRating rating={userData?.rating || 0} showText size="sm" />
                      </div>
                      {userData?.isVerified && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          Проверенный пользователь
                        </Badge>
                      )}
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  {isUserLoading ? (
                    <>
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-5 w-full mb-2" />
                      <Skeleton className="h-5 w-full mb-2" />
                    </>
                  ) : (
                    <>
                      {userData?.location && (
                        <div className="flex items-start gap-2">
                          <MapPin className="h-5 w-5 text-gray-500 mt-0.5" />
                          <span>{userData.location}</span>
                        </div>
                      )}
                      {userData?.bio && (
                        <div className="flex items-start gap-2">
                          <UserIcon className="h-5 w-5 text-gray-500 mt-0.5" />
                          <span>{userData.bio}</span>
                        </div>
                      )}
                      <div className="flex items-start gap-2">
                        <Calendar className="h-5 w-5 text-gray-500 mt-0.5" />
                        <span>
                          На сайте с {userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString() : ''}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="mt-6 space-y-3">
                  {isOwnProfile ? (
                    <Button 
                      variant="outline" 
                      className="w-full flex items-center gap-2"
                      onClick={() => setIsEditDialogOpen(true)}
                    >
                      <Edit className="h-4 w-4" />
                      Редактировать профиль
                    </Button>
                  ) : (
                    <Button 
                      className="w-full flex items-center gap-2"
                      onClick={handleMessageUser}
                    >
                      <MessageCircle className="h-4 w-4" />
                      Написать сообщение
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content Area */}
          <div className="md:col-span-2">
            <Tabs defaultValue="tenders" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="tenders">Тендеры</TabsTrigger>
                <TabsTrigger value="marketplace">Объявления</TabsTrigger>
                <TabsTrigger value="reviews">Отзывы</TabsTrigger>
              </TabsList>

              {/* Tenders Tab */}
              <TabsContent value="tenders" className="space-y-4">
                {isTendersLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="p-5">
                          <div className="flex justify-between mb-4">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                          <Skeleton className="h-8 w-full mb-3" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <div className="flex justify-between items-center mt-4">
                            <div>
                              <Skeleton className="h-4 w-24 mb-2" />
                              <Skeleton className="h-4 w-20" />
                            </div>
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userTenders && userTenders.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {userTenders.map((tender) => (
                      <TenderCard key={tender.id} tender={tender} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        {isOwnProfile 
                          ? 'У вас пока нет созданных тендеров' 
                          : 'У пользователя пока нет созданных тендеров'}
                      </p>
                      {isOwnProfile && (
                        <Link href="/tenders/create">
                          <Button>Создать тендер</Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Marketplace Tab */}
              <TabsContent value="marketplace" className="space-y-4">
                {isListingsLoading ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[1, 2].map((i) => (
                      <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden">
                        <div className="relative">
                          <Skeleton className="w-full h-44" />
                        </div>
                        <div className="p-4">
                          <Skeleton className="h-6 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-3" />
                          <div className="flex justify-between items-center mt-4">
                            <Skeleton className="h-6 w-24" />
                            <Skeleton className="h-8 w-24" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : userListings && userListings.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {userListings.map((listing) => (
                      <MarketplaceItemCard key={listing.id} listing={listing} />
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground mb-4">
                        {isOwnProfile 
                          ? 'У вас пока нет размещенных объявлений' 
                          : 'У пользователя пока нет размещенных объявлений'}
                      </p>
                      {isOwnProfile && (
                        <Link href="/marketplace/create">
                          <Button>Разместить объявление</Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews" className="space-y-4">
                {isReviewsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i}>
                        <CardContent className="pt-6">
                          <div className="flex items-center mb-3">
                            <Skeleton className="h-10 w-10 rounded-full mr-3" />
                            <div>
                              <Skeleton className="h-5 w-32 mb-1" />
                              <Skeleton className="h-4 w-24" />
                            </div>
                            <Skeleton className="h-5 w-20 ml-auto" />
                          </div>
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-full mb-1" />
                          <Skeleton className="h-4 w-2/3" />
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : userReviews && userReviews.length > 0 ? (
                  <div className="space-y-4">
                    {userReviews.map((review) => (
                      <Card key={review.id}>
                        <CardContent className="pt-6">
                          <div className="flex items-center mb-3">
                            <Avatar className="h-10 w-10 mr-3">
                              <AvatarImage 
                                src={review.reviewer?.avatar} 
                                alt={review.reviewer?.fullName || 'Пользователь'} 
                              />
                              <AvatarFallback>
                                {getUserInitials(review.reviewer?.fullName || 'Пользователь')}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <Link 
                                href={`/profile/${review.reviewerId}`} 
                                className="font-medium hover:text-primary"
                              >
                                {review.reviewer?.fullName || 'Пользователь'}
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </div>
                            </div>
                            <div className="ml-auto flex">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star 
                                  key={i} 
                                  className={`h-4 w-4 ${
                                    i < review.rating 
                                      ? 'text-yellow-400 fill-yellow-400' 
                                      : 'text-gray-300'
                                  }`} 
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && (
                            <p className="text-gray-700">{review.comment}</p>
                          )}
                          {(review.tenderId || review.listingId) && (
                            <div className="mt-2 text-xs text-muted-foreground">
                              {review.tenderId ? (
                                <Link href={`/tenders/${review.tenderId}`} className="text-primary hover:underline">
                                  По тендеру #{review.tenderId}
                                </Link>
                              ) : review.listingId ? (
                                <Link href={`/marketplace/${review.listingId}`} className="text-primary hover:underline">
                                  По объявлению #{review.listingId}
                                </Link>
                              ) : null}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card>
                    <CardContent className="pt-6 text-center">
                      <p className="text-muted-foreground">
                        {isOwnProfile 
                          ? 'У вас пока нет полученных отзывов' 
                          : 'У пользователя пока нет полученных отзывов'}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Редактирование профиля</DialogTitle>
            <DialogDescription>
              Обновите информацию о себе, которую видят другие пользователи
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="fullName" className="text-right">
                  Имя
                </Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="location" className="text-right">
                  Местоположение
                </Label>
                <Input
                  id="location"
                  name="location"
                  value={formData.location || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Например: Москва"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="phone" className="text-right">
                  Телефон
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="+7 (XXX) XXX-XX-XX"
                />
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="bio" className="text-right pt-2">
                  О себе
                </Label>
                <Textarea
                  id="bio"
                  name="bio"
                  value={formData.bio || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="Расскажите о себе, своем опыте и навыках"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="avatar" className="text-right">
                  Аватар URL
                </Label>
                <Input
                  id="avatar"
                  name="avatar"
                  value={formData.avatar || ''}
                  onChange={handleInputChange}
                  className="col-span-3"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Отмена
              </Button>
              <Button 
                type="submit"
                disabled={updateProfileMutation.isPending}
              >
                {updateProfileMutation.isPending ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
