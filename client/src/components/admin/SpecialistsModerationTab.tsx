import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  CheckCircle, 
  XCircle, 
  Eye, 
  User, 
  Users, 
  MapPin, 
  Clock,
  DollarSign
} from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Specialist {
  id: number;
  userId: number;
  title: string;
  description: string;
  specialty: string;
  experience: number;
  hourlyRate: number;
  services: string[];
  location: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  moderationComment?: string;
  createdAt: string;
  user: {
    username: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

interface Crew {
  id: number;
  userId: number;
  title: string;
  description: string;
  specialty: string;
  experience: number;
  dailyRate: number;
  memberCount: number;
  services: string[];
  location: string;
  avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  moderationComment?: string;
  createdAt: string;
  user: {
    username: string;
    fullName: string;
    email: string;
    phone?: string;
  };
}

export default function SpecialistsModerationTab() {
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [selectedCrew, setSelectedCrew] = useState<Crew | null>(null);
  const [moderationComment, setModerationComment] = useState('');
  const { toast } = useToast();

  // Временные данные для демонстрации
  const specialists: Specialist[] = [];
  const crews: Crew[] = [];

  const handleApproveSpecialist = (specialist: Specialist) => {
    toast({ title: 'Анкета специалиста одобрена', variant: 'default' });
    setSelectedSpecialist(null);
    setModerationComment('');
  };

  const handleRejectSpecialist = (specialist: Specialist) => {
    if (!moderationComment.trim()) {
      toast({ title: 'Укажите причину отклонения', variant: 'destructive' });
      return;
    }
    toast({ title: 'Анкета специалиста отклонена', variant: 'destructive' });
    setSelectedSpecialist(null);
    setModerationComment('');
  };

  const handleApproveCrew = (crew: Crew) => {
    toast({ title: 'Анкета бригады одобрена', variant: 'default' });
    setSelectedCrew(null);
    setModerationComment('');
  };

  const handleRejectCrew = (crew: Crew) => {
    if (!moderationComment.trim()) {
      toast({ title: 'Укажите причину отклонения', variant: 'destructive' });
      return;
    }
    toast({ title: 'Анкета бригады отклонена', variant: 'destructive' });
    setSelectedCrew(null);
    setModerationComment('');
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Модерация специалистов и бригад</h2>
        <p className="text-gray-600">
          Управляйте анкетами специалистов и бригад, ожидающими модерации
        </p>
      </div>

      <Tabs defaultValue="specialists" className="w-full">
        <TabsList>
          <TabsTrigger value="specialists">
            Специалисты ({specialists.filter(s => s.status === 'pending').length})
          </TabsTrigger>
          <TabsTrigger value="crews">
            Бригады ({crews.filter(c => c.status === 'pending').length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="specialists" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Нет анкет специалистов, ожидающих модерации
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="crews" className="space-y-4">
          <Card>
            <CardContent className="p-6 text-center text-gray-500">
              Нет анкет бригад, ожидающих модерации
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}