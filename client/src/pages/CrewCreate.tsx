import { Helmet } from 'react-helmet';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import CrewForm from '@/components/crews/CrewForm';
import { useAuth } from '@/lib/authContext';
import { Redirect } from 'wouter';

export default function CrewCreate() {
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
        <title>Создание анкеты бригады | Windexs-Строй</title>
        <meta
          name="description"
          content="Создайте анкету строительной бригады для поиска заказов. Укажите состав бригады, опыт и стоимость услуг."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Link href="/crews">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Назад к бригадам
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-green-600">
            Создание анкеты бригады
          </h1>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <CrewForm />
        </div>
      </div>
    </>
  );
}