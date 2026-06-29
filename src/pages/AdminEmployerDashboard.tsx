import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { BarChart, TrendingUp, Users, Clock, DollarSign, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";

interface EmployerPerformance {
  id: string;
  name: string;
  firstName: string | null;
  lastName: string | null;
  totalJobs: number;
  approved: number;
  rejected: number;
  pending: number;
  averageApprovalTime: number; // in hours
  totalRevenue: number;
  approvalRate: number;
}

interface GlobalStats {
  totalEmployers: number;
  totalJobs: number;
  approvedJobs: number;
  rejectedJobs: number;
  pendingJobs: number;
  totalRevenue: number;
  averageApprovalTime: number;
}

const AdminEmployerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [globalStats, setGlobalStats] = useState<GlobalStats>({
    totalEmployers: 0,
    totalJobs: 0,
    approvedJobs: 0,
    rejectedJobs: 0,
    pendingJobs: 0,
    totalRevenue: 0,
    averageApprovalTime: 0,
  });
  const [employerPerformance, setEmployerPerformance] = useState<EmployerPerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && !['ADMIN', 'MANAGER'].includes(profile.role)) {
      navigate("/dashboard");
    } else if (profile && ['ADMIN', 'MANAGER'].includes(profile.role)) {
      fetchDashboardData();
    }
  }, [user, profile, loading, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch all employers
      const { data: employers, error: empError } = await supabase
        .from('employers')
        .select('*');

      if (empError) throw empError;

      // Fetch all incoming jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('incoming_jobs')
        .select('*');

      if (jobsError) throw jobsError;

      // Calculate global stats
      const approved = jobs?.filter(j => j.approval_status === 'approved') || [];
      const rejected = jobs?.filter(j => j.approval_status === 'rejected') || [];
      const pending = jobs?.filter(j => j.approval_status === 'pending') || [];

      const totalRevenue = approved.reduce((sum, job) => sum + (job.employer_total_price || 0), 0);

      // Calculate average approval time
      const approvalTimes = approved
        .filter(j => j.created_at && j.approved_at)
        .map(j => {
          const created = new Date(j.created_at).getTime();
          const approved = new Date(j.approved_at!).getTime();
          return (approved - created) / (1000 * 60 * 60); // hours
        });

      const averageApprovalTime = approvalTimes.length > 0
        ? approvalTimes.reduce((sum, t) => sum + t, 0) / approvalTimes.length
        : 0;

      setGlobalStats({
        totalEmployers: employers?.length || 0,
        totalJobs: jobs?.length || 0,
        approvedJobs: approved.length,
        rejectedJobs: rejected.length,
        pendingJobs: pending.length,
        totalRevenue,
        averageApprovalTime,
      });

      // Calculate employer performance
      const performanceData: EmployerPerformance[] = (employers || []).map(employer => {
        const employerJobs = jobs?.filter(j => j.employer_id === employer.id) || [];
        const employerApproved = employerJobs.filter(j => j.approval_status === 'approved');
        const employerRejected = employerJobs.filter(j => j.approval_status === 'rejected');
        const employerPending = employerJobs.filter(j => j.approval_status === 'pending');

        const employerRevenue = employerApproved.reduce((sum, job) => sum + (job.employer_total_price || 0), 0);

        const employerApprovalTimes = employerApproved
          .filter(j => j.created_at && j.approved_at)
          .map(j => {
            const created = new Date(j.created_at).getTime();
            const approved = new Date(j.approved_at!).getTime();
            return (approved - created) / (1000 * 60 * 60);
          });

        const employerAvgTime = employerApprovalTimes.length > 0
          ? employerApprovalTimes.reduce((sum, t) => sum + t, 0) / employerApprovalTimes.length
          : 0;

        const approvalRate = employerJobs.length > 0
          ? (employerApproved.length / employerJobs.length) * 100
          : 0;

        return {
          id: employer.id,
          name: employer.company_name,
          firstName: employer.first_name || null,
          lastName: employer.last_name || null,
          totalJobs: employerJobs.length,
          approved: employerApproved.length,
          rejected: employerRejected.length,
          pending: employerPending.length,
          averageApprovalTime: employerAvgTime,
          totalRevenue: employerRevenue,
          approvalRate,
        };
      });

      // Sort by total jobs
      performanceData.sort((a, b) => b.totalJobs - a.totalJobs);

      setEmployerPerformance(performanceData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatHours = (hours: number) => {
    if (hours < 1) return `${Math.round(hours * 60)} daqiqa`;
    return `${hours.toFixed(1)} soat`;
  };

  const getPerformanceBadge = (rate: number) => {
    if (rate >= 80) return <Badge variant="default">A'lo</Badge>;
    if (rate >= 60) return <Badge variant="secondary">Yaxshi</Badge>;
    if (rate >= 40) return <Badge variant="outline">O'rtacha</Badge>;
    return <Badge variant="destructive">Past</Badge>;
  };

  const getSpeedBadge = (hours: number) => {
    if (hours < 2) return <Badge variant="default">Tez</Badge>;
    if (hours < 24) return <Badge variant="secondary">Normal</Badge>;
    return <Badge variant="destructive">Sekin</Badge>;
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
        <div>
          <h1 className="text-3xl font-bold">Ish Beruvchilar Dashboard</h1>
          <p className="text-muted-foreground">Barcha ish beruvchilar statistikasi va monitoring</p>
        </div>

        {/* Global Stats */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami ish beruvchilar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalEmployers}</div>
              <p className="text-xs text-muted-foreground">Faol ish beruvchilar</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami ishlar</CardTitle>
              <BarChart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{globalStats.totalJobs}</div>
              <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                <span className="text-green-600">✓ {globalStats.approvedJobs}</span>
                <span className="text-yellow-600">⏱ {globalStats.pendingJobs}</span>
                <span className="text-red-600">✗ {globalStats.rejectedJobs}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(globalStats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">Tasdiqlangan ishlardan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">O'rtacha tasdiqlash vaqti</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatHours(globalStats.averageApprovalTime)}</div>
              <p className="text-xs text-muted-foreground">Barcha ish beruvchilar</p>
            </CardContent>
          </Card>
        </div>

        {/* Employer Performance Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Ish beruvchilar reytingi va performans
            </CardTitle>
            <CardDescription>Ish beruvchilar faoliyati va samaradorligi</CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ish beruvchi</TableHead>
                    <TableHead>Jami ishlar</TableHead>
                    <TableHead>Tasdiqlangan</TableHead>
                    <TableHead>Kutilmoqda</TableHead>
                    <TableHead>Rad etilgan</TableHead>
                    <TableHead>Tasdiqlash foizi</TableHead>
                    <TableHead>O'rtacha vaqt</TableHead>
                    <TableHead>Jami daromad</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employerPerformance.map((emp, index) => (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{emp.name}</div>
                            {(emp.firstName || emp.lastName) && (
                              <div className="text-sm text-muted-foreground">
                                {[emp.firstName, emp.lastName].filter(Boolean).join(' ')}
                              </div>
                            )}
                          </div>
                          {index === 0 && <Badge variant="default">TOP 1</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">{emp.totalJobs}</TableCell>
                      <TableCell>
                        <span className="text-green-600 font-medium">{emp.approved}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-yellow-600 font-medium">{emp.pending}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-red-600 font-medium">{emp.rejected}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{emp.approvalRate.toFixed(1)}%</span>
                          {getPerformanceBadge(emp.approvalRate)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{formatHours(emp.averageApprovalTime)}</span>
                          {getSpeedBadge(emp.averageApprovalTime)}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(emp.totalRevenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Alerts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              Ogohlantirishlar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {employerPerformance
                .filter(emp => emp.pending > 5)
                .map(emp => (
                  <div key={emp.id} className="flex items-center gap-3 p-3 border rounded-lg bg-yellow-50">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {emp.pending} ta ish kutilmoqda
                      </div>
                    </div>
                  </div>
                ))}

              {employerPerformance
                .filter(emp => emp.averageApprovalTime > 48)
                .map(emp => (
                  <div key={`slow-${emp.id}`} className="flex items-center gap-3 p-3 border rounded-lg bg-red-50">
                    <Clock className="h-5 w-5 text-red-600" />
                    <div>
                      <div className="font-medium">{emp.name}</div>
                      <div className="text-sm text-muted-foreground">
                        Sekin tasdiqlash: {formatHours(emp.averageApprovalTime)}
                      </div>
                    </div>
                  </div>
                ))}

              {employerPerformance.filter(emp => emp.pending > 5 || emp.averageApprovalTime > 48).length === 0 && (
                <div className="text-center text-muted-foreground py-4">
                  Hozircha ogohlantirishlar yo'q
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminEmployerDashboard;
