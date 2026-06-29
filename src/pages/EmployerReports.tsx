import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, Package, CheckCircle, XCircle, Clock, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { formatMonthYear } from "@/lib/dateFormat";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface JobStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

interface MonthlyStats {
  month: string;
  total_quantity: number;
  job_count: number;
}

const EmployerReports = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobStats, setJobStats] = useState<JobStats>({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && profile.role === 'ISH_BERUVCHI') {
      fetchReports();
    } else if (profile) {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchReports = async () => {
    try {
      // Get employer ID
      const { data: employerData } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user!.id)
        .single();

      if (!employerData) {
        toast.error("Ish beruvchi ma'lumotlari topilmadi");
        return;
      }

      // Get job statistics
      const { data: jobsData } = await supabase
        .from('incoming_jobs')
        .select('approval_status')
        .eq('employer_id', employerData.id);

      const stats: JobStats = {
        total: jobsData?.length || 0,
        pending: jobsData?.filter(j => j.approval_status === 'pending').length || 0,
        approved: jobsData?.filter(j => j.approval_status === 'approved').length || 0,
        rejected: jobsData?.filter(j => j.approval_status === 'rejected').length || 0,
      };
      setJobStats(stats);

      // Get monthly statistics (last 6 months)
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const { data: monthlyData } = await supabase
        .from('incoming_jobs')
        .select('date, quantity, job_name')
        .eq('employer_id', employerData.id)
        .gte('date', sixMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Group by month
      const monthlyMap = new Map<string, { total_quantity: number; job_count: number }>();
      monthlyData?.forEach((job) => {
        const date = new Date(job.date);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        const existing = monthlyMap.get(monthKey);
        if (existing) {
          existing.total_quantity += job.quantity;
          existing.job_count += 1;
        } else {
          monthlyMap.set(monthKey, {
            total_quantity: job.quantity,
            job_count: 1,
          });
        }
      });

      const monthlyArray: MonthlyStats[] = Array.from(monthlyMap.entries())
        .map(([key, value]) => {
          const [year, month] = key.split('-');
          const date = new Date(parseInt(year), parseInt(month) - 1);
          return {
            month: formatMonthYear(date),
            total_quantity: value.total_quantity,
            job_count: value.job_count,
          };
        })
        .sort((a, b) => {
          // Sort by year-month descending
          const [monthA, yearA] = a.month.split(' ');
          const [monthB, yearB] = b.month.split(' ');
          if (yearA !== yearB) return parseInt(yearB) - parseInt(yearA);
          return b.month.localeCompare(a.month);
        });

      setMonthlyStats(monthlyArray);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error("Hisobotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Hisobotlar</h1>
          <p className="text-muted-foreground">Ishlaringiz bo'yicha statistika</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami Ishlar</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobStats.total}</div>
              <p className="text-xs text-muted-foreground">
                Barcha yuborilgan ishlar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobStats.pending}</div>
              <p className="text-xs text-muted-foreground">
                Tasdiq kutilmoqda
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasdiqlangan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobStats.approved}</div>
              <p className="text-xs text-muted-foreground">
                Qabul qilingan ishlar
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rad etilgan</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobStats.rejected}</div>
              <p className="text-xs text-muted-foreground">
                Qaytarilgan ishlar
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Monthly Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Oylik Statistika
            </CardTitle>
            <CardDescription>
              So'nggi 6 oylik ishlar statistikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyStats.length === 0 ? (
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground">So'nggi 6 oyda ishlar yo'q</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Oy</TableHead>
                    <TableHead className="text-right">Ishlar soni</TableHead>
                    <TableHead className="text-right">Jami miqdor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyStats.map((stat, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{stat.month}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline">{stat.job_count} ta</Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {stat.total_quantity} dona
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default EmployerReports;
