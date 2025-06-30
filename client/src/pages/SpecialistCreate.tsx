import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import SpecialistForm from '@/components/specialists/SpecialistForm';
import { useAuth } from '@/lib/authContext';
import { Redirect } from 'wouter';

export default function SpecialistCreate() {
  const { isAuthenticated, isLoading } = useAuth();

  // Wait for auth state to be determined
  if (isLoading) {
    return <div className="container mx-auto px-4 py-8">Загрузка...</div>;
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return (
    <>
      <Helmet>
        <title>Создание анкеты специалиста | Windexs-Строй</title>
        <meta
          name="description"
          content="Создайте анкету специалиста для поиска работы в строительной сфере. Укажите ваши навыки, опыт и стоимость услуг."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/specialists">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Назад к специалистам
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-green-600">
            Создание анкеты специалиста
          </h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <SpecialistForm />
        </div>
      </div>
    </>
  );
}