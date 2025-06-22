import { Helmet } from 'react-helmet';
import { Link, useParams } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TenderForm from '@/components/tenders/TenderForm';
import { useAuth } from '@/lib/authContext';
import { Redirect } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Tender } from '@shared/sqlite-schema';

export default function TenderCreate() {
  const { isAuthenticated, isLoading } = useAuth();
  const { id } = useParams();

  // Check if we're in edit mode
  const isEditMode = !!id;
  
  // Fetch tender data if editing
  const { data: tender, isLoading: isTenderLoading } = useQuery<Tender>({
    queryKey: [`/api/tenders/${id}`],
    enabled: isEditMode,
  });

  // Wait for auth state to be determined
  if (isLoading || (isEditMode && isTenderLoading)) {
    return <div className="container mx-auto px-4 py-8">Загрузка...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <>
      <Helmet>
        <title>{isEditMode ? 'Редактирование тендера' : 'Создание нового тендера'} | СтройТендер</title>
        <meta
          name="description"
          content={isEditMode ? 'Редактируйте ваш тендер на строительные работы.' : 'Создайте новый тендер на строительные работы. Опишите свой проект, установите бюджет и сроки выполнения, чтобы найти исполнителей.'}
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href={isEditMode ? `/tenders/${id}` : "/tenders"}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Назад
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">
            {isEditMode ? 'Редактирование тендера' : 'Создание нового тендера'}
          </h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <TenderForm tender={tender} isEditMode={isEditMode} />
        </div>
      </div>
    </>
  );
}
