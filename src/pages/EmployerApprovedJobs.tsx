import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CheckCircle } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IncomingJob {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
  approval_status: string | null;
  approved_at: string | null;
  employer_price_per_unit: number | null;
  employer_total_price: number | null;
  employer_notes: string | null;
  created_at: string;
}

const EmployerApprovedJobs = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState<IncomingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && profile.role !== 'ISH_BERUVCHI') {
      navigate("/dashboard");
    } else if (profile && profile.role === 'ISH_BERUVCHI') {
      fetchJobs();
    }
  }, [user, profile, loading, navigate]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('incoming_jobs')
        .select('*')
        .eq('approval_status', 'approved')
        .order('approved_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error("Ishlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ');
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
          <h1 className="text-3xl font-bold">Tasdiqlangan Ishlar</h1>
          <p className="text-muted-foreground">Siz tomonidan tasdiqlangan ishlar ro'yxati</p>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Hozircha tasdiqlangan ishlar yo'q</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Tasdiqlangan ishlar ({jobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Ish nomi</TableHead>
                      <TableHead>Soni</TableHead>
                      <TableHead>Ish sanasi</TableHead>
                      <TableHead>Narx (dona)</TableHead>
                      <TableHead>Jami narx</TableHead>
                      <TableHead>Tasdiqlangan sana</TableHead>
                      <TableHead>Izoh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => (
                      <TableRow key={job.id}>
                        <TableCell className="font-medium">{job.job_name}</TableCell>
                        <TableCell>{job.quantity} dona</TableCell>
                        <TableCell>{formatDate(job.date)}</TableCell>
                        <TableCell>{formatCurrency(job.employer_price_per_unit)}</TableCell>
                        <TableCell className="font-semibold">{formatCurrency(job.employer_total_price)}</TableCell>
                        <TableCell>{job.approved_at ? formatDate(job.approved_at) : "—"}</TableCell>
                        <TableCell className="max-w-xs truncate">{job.employer_notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default EmployerApprovedJobs;
