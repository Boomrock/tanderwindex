import { Helmet } from 'react-helmet';
import { Link, useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/lib/authContext';
import { useEffect } from 'react';
import { Construction } from 'lucide-react';

export default function Login() {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/profile');
    }
  }, [isAuthenticated, navigate]);

  return (
    <>
      <Helmet>
        <title>Вход | Windexs-Строй</title>
        <meta
          name="description"
          content="Войдите в свой аккаунт Windexs-Строй для доступа к тендерам на строительные работы и маркетплейсу строительных материалов."
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
            <CardTitle className="text-2xl font-bold text-center">Вход</CardTitle>
            <CardDescription className="text-center">
              Введите ваши учетные данные для входа
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoginForm />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
