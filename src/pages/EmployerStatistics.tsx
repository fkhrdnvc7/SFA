import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, CheckCircle, XCircle, Clock, TrendingUp, DollarSign, Calendar } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Statistics {
  total: number;
  approved: number;
  rejected: number;
  pending: number;
  totalRevenue: number;
  averagePrice: number;
  monthlyData: Array<{ month: string; count: number; revenue: number }>;
}

const EmployerStatistics = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [stats, setStats] = useState<Statistics>({
    total: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    totalRevenue: 0,
    averagePrice: 0,
    monthlyData: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'year'>('month');

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && profile.role !== 'ISH_BERUVCHI') {
      navigate("/dashboard");
    } else if (profile && profile.role === 'ISH_BERUVCHI') {
      fetchStatistics();
    }
  }, [user, profile, loading, navigate, timeRange]);

  const fetchStatistics = async () => {
    try {
      // Get employer ID from profile
      const { data: employerData } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (!employerData) {
        toast.error("Ish beruvchi topilmadi");
        return;
      }

      // Calculate date range
      const now = new Date();
      const startDate = new Date();
      if (timeRange === 'week') {
        startDate.setDate(now.getDate() - 7);
      } else if (timeRange === 'month') {
        startDate.setMonth(now.getMonth() - 1);
      } else {
        startDate.setFullYear(now.getFullYear() - 1);
      }

      // Fetch all jobs for this employer
      const { data: jobs, error } = await supabase
        .from('incoming_jobs')
        .select('*')
        .eq('employer_id', employerData.id)
        .gte('created_at', startDate.toISOString());

      if (error) throw error;

      // Calculate statistics
      const approved = jobs?.filter(j => j.approval_status === 'approved') || [];
      const rejected = jobs?.filter(j => j.approval_status === 'rejected') || [];
      const pending = jobs?.filter(j => j.approval_status === 'pending') || [];

      const totalRevenue = approved.reduce((sum, job) => sum + (job.employer_total_price || 0), 0);
      const averagePrice = approved.length > 0 ? totalRevenue / approved.length : 0;

      // Monthly data
      const monthlyMap = new Map<string, { count: number; revenue: number }>();
      approved.forEach(job => {
        const month = new Date(job.date).toLocaleDateString('uz-UZ', { year: 'numeric', month: 'short' });
        const existing = monthlyMap.get(month) || { count: 0, revenue: 0 };
        monthlyMap.set(month, {
          count: existing.count + 1,
          revenue: existing.revenue + (job.employer_total_price || 0),
        });
      });

      const monthlyData = Array.from(monthlyMap.entries())
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setStats({
        total: jobs?.length || 0,
        approved: approved.length,
        rejected: rejected.length,
        pending: pending.length,
        totalRevenue,
        averagePrice,
        monthlyData,
      });
    } catch (error) {
      console.error('Error fetching statistics:', error);
      toast.error("Statistikani yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-muted-foreground">Yuklanmoqda...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Statistika</h1>
            <p className="text-muted-foreground">Ishlar va moliyaviy hisobotlar</p>
          </div>
          <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
            <TabsList>
              <TabsTrigger value="week">Hafta</TabsTrigger>
              <TabsTrigger value="month">Oy</TabsTrigger>
              <TabsTrigger value="year">Yil</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {/* Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami ishlar</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {timeRange === 'week' ? 'So\'nggi hafta' : timeRange === 'month' ? 'So\'nggi oy' : 'So\'nggi yil'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasdiqlangan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.approved}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.approved / stats.total) * 100) : 0}% jami ishlardan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Tasdiq kutilmoqda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rad etilgan</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
              <p className="text-xs text-muted-foreground">
                {stats.total > 0 ? Math.round((stats.rejected / stats.total) * 100) : 0}% jami ishlardan
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Financial Stats */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                Tasdiqlangan ishlardan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha narx</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.averagePrice)}</div>
              <p className="text-xs text-muted-foreground">
                Har bir ish uchun
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Chart */}
        {stats.monthlyData.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Oylik statistika
              </CardTitle>
              <CardDescription>Ishlar soni va daromad</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.monthlyData.map((item, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium">{item.month}</div>
                      <div className="text-xs text-muted-foreground">{item.count} ta ish</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold">{formatCurrency(item.revenue)}</div>
                      <div className="w-64 bg-secondary rounded-full h-2 mt-1">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{
                            width: `${(item.revenue / Math.max(...stats.monthlyData.map(d => d.revenue))) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default EmployerStatistics;
