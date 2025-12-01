import { useDashboard } from '@/hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Calendar, DollarSign } from 'lucide-react';

export default function Dashboard() {
  const { data, isLoading, error } = useDashboard();

  if (isLoading) return <div>Loading dashboard...</div>;
  if (error) return <div>Error loading dashboard</div>;

  const stats = [
    {
      title: "Total Users",
      value: data?.userStats?.totalUsers || 0,
      icon: Users,
      description: "Active users in the system"
    },
    {
      title: "Total Courses",
      value: data?.courseStats?.totalCourses || 0,
      icon: BookOpen,
      description: "Available courses"
    },
    {
      title: "Total Bookings",
      value: data?.bookingStats?.totalBookings || 0,
      icon: Calendar,
      description: "All time bookings"
    },
    {
      title: "Revenue",
      value: new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(data?.revenue || 0),
      icon: DollarSign,
      description: "Total revenue"
    }
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
      {/* Add more charts or lists here if needed */}
    </div>
  );
}
