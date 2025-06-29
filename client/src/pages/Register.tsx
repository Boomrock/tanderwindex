import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import RegisterForm from '@/components/auth/RegisterForm';
import { useAuth } from '@/lib/authContext';
import { useEffect } from 'react';
import { Construction } from 'lucide-react';

export default function Register() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Helmet>
        <title>Регистрация | СтройТендер</title>
        <meta
          name="description"
          content="Зарегистрируйтесь на платформе СтройТендер для доступа к тендерам на строительные работы и маркетплейсу строительных материалов."
        />
      </Helmet>

      <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex items-center gap-2">
                <Construction className="h-6 w-6 text-primary" />
                <span className="font-bold text-xl text-primary">СтройТендер</span>
              </Link>
            </div>
            <CardTitle className="text-2xl font-bold text-center">Регистрация</CardTitle>
            <CardDescription className="text-center">
              Создайте аккаунт для доступа к платформе
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RegisterForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
