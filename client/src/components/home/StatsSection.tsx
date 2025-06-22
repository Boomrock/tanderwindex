import { useQuery } from '@tanstack/react-query';

const StatsSection = () => {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/stats'],
    queryFn: async () => {
      const response = await fetch('/api/stats');
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const displayStats = [
    { value: isLoading ? "..." : `${stats?.activeTenders || 0}`, label: "Активных тендеров" },
    { value: isLoading ? "..." : `${stats?.totalMarketplaceListings || 0}+`, label: "Объявлений" },
    { value: isLoading ? "..." : `${stats?.totalUsers || 0}+`, label: "Пользователей" },
    { value: isLoading ? "..." : `${stats?.completedProjects || 0}+`, label: "Завершенных проектов" },
  ];

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          {displayStats.map((stat, index) => (
            <div key={index} className="p-4">
              <div className="text-2xl md:text-3xl font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
