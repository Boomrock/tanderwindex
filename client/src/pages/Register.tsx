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
        <title>Регистрация | Windexs-Строй</title>
        <meta
          name="description"
          content="Зарегистрируйтесь в Windexs-Строй для участия в тендерах на строительные работы и торговли на маркетплейсе строительных материалов."
        />
      </Helmet>

      <div className="flex items-center justify-center min-h-screen bg-gray-100 py-12 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-6">
              <Link href="/" className="flex items-center gap-2">
                <Construction className="h-6 w-6 text-green-600" />
                <span className="font-bold text-xl text-green-600">Windexs-Строй</span>
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
