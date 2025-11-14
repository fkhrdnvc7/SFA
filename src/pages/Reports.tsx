import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { BarChart3, DollarSign, Users, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface EarningsReport {
  seamstress_id: string;
  seamstress_name: string;
  total_items: number;
  total_earnings: number;
}

const Reports = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [earningsReport, setEarningsReport] = useState<EarningsReport[]>([]);
  const [totalStats, setTotalStats] = useState({
    totalJobs: 0,
    totalSeamstresses: 0,
    totalEarnings: 0,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchReports();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchReports = async () => {
    try {
      // Get total jobs
      const { data: jobsData } = await supabase
        .from('jobs')
        .select('id');
      
      // Get total seamstresses
      const { data: seamstressesData } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'SEAMSTRESS')
        .eq('is_active', true);

      // Get earnings by seamstress
      const { data: jobItemsData } = await supabase
        .from('job_items')
        .select(`
          seamstress_id,
          quantity,
          unit_price,
          bonus_amount,
          profiles (full_name)
        `)
        .not('seamstress_id', 'is', null);

      // Process earnings data
      const earningsMap = new Map<string, EarningsReport>();
      let totalEarnings = 0;

      jobItemsData?.forEach((item: any) => {
        const earnings = (item.quantity * item.unit_price) + (item.bonus_amount || 0);
        totalEarnings += earnings;

        const existing = earningsMap.get(item.seamstress_id);
        if (existing) {
          existing.total_items += 1;
          existing.total_earnings += earnings;
        } else {
          earningsMap.set(item.seamstress_id, {
            seamstress_id: item.seamstress_id,
            seamstress_name: item.profiles?.full_name || 'Noma\'lum',
            total_items: 1,
            total_earnings: earnings,
          });
        }
      });

      setEarningsReport(Array.from(earningsMap.values()).sort((a, b) => 
        b.total_earnings - a.total_earnings
      ));

      setTotalStats({
        totalJobs: jobsData?.length || 0,
        totalSeamstresses: seamstressesData?.length || 0,
        totalEarnings,
      });
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
          <h1 className="text-3xl font-bold">Hisobotlar</h1>
          <p className="text-muted-foreground">Umumiy statistika va daromadlar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami ishlar</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalJobs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Faol tikuvchilar</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStats.totalSeamstresses}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami daromadlar</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {totalStats.totalEarnings.toLocaleString()} so'm
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Tikuvchilar bo'yicha daromadlar</CardTitle>
            <CardDescription>
              Har bir tikuvchining umumiy daromadlari
            </CardDescription>
          </CardHeader>
          <CardContent>
            {earningsReport.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Hozircha ma'lumotlar yo'q
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tikuvchi</TableHead>
                    <TableHead>Ishlar soni</TableHead>
                    <TableHead>Jami daromad</TableHead>
                    <TableHead>O'rtacha</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {earningsReport.map((report) => (
                    <TableRow key={report.seamstress_id}>
                      <TableCell className="font-medium">
                        {report.seamstress_name}
                      </TableCell>
                      <TableCell>{report.total_items}</TableCell>
                      <TableCell className="font-bold">
                        {report.total_earnings.toLocaleString()} so'm
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {(report.total_earnings / report.total_items).toLocaleString()} so'm
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

export default Reports;
