import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { useAuth } from "@/lib/authContext";

const CallToAction = () => {
  const { isAuthenticated } = useAuth();

  return (
    <section className="bg-primary rounded-lg shadow-lg overflow-hidden mb-12">
      <div className="px-6 py-12 md:py-16 md:px-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4 text-white">Готовы начать работу на платформе?</h2>
        <p className="text-lg mb-8 max-w-2xl mx-auto text-white opacity-90">
          Присоединяйтесь к тысячам пользователей, которые уже нашли лучшие 
          предложения для своих строительных проектов
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4">
          <Link href={isAuthenticated ? "/tenders/create" : "/login"}>
            <Button 
              size="lg"
              className="w-full sm:w-auto bg-white text-primary hover:bg-gray-100 border-2 border-white font-semibold"
            >
              Создать тендер
            </Button>
          </Link>
          <Link href={isAuthenticated ? "/marketplace/create" : "/login"}>
            <Button 
              size="lg"
              variant="outline" 
              className="w-full sm:w-auto bg-transparent text-white border-2 border-white hover:bg-white hover:text-primary font-semibold"
            >
              Разместить объявление
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
