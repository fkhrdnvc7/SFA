import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { DollarSign, Package, Briefcase } from "lucide-react";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface JobItem {
  id: string;
  quantity: number;
  unit_price: number;
  bonus_amount: number | null;
  bonus_note: string | null;
  color: string | null;
  size: string | null;
  created_at: string;
  job_id: string;
  jobs: {
    job_name: string;
    status: string;
  };
  operations: {
    name: string;
  };
}

const MyEarnings = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobItems, setJobItems] = useState<JobItem[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile?.role !== 'SEAMSTRESS') {
      navigate("/dashboard");
    } else if (profile) {
      fetchEarnings();
    }
  }, [user, profile, loading, navigate]);

  const fetchEarnings = async () => {
    try {
      const { data, error } = await supabase
        .from('job_items')
        .select(`
          *,
          jobs (job_name, status),
          operations (name)
        `)
        .eq('seamstress_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setJobItems(data || []);
      
      const total = data?.reduce((sum, item) => {
        return sum + (item.quantity * item.unit_price) + (item.bonus_amount || 0);
      }, 0) || 0;
      
      setTotalEarnings(total);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error("Daromadlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateItemEarnings = (item: JobItem) => {
    return (item.quantity * item.unit_price) + (item.bonus_amount || 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
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
          <h1 className="text-3xl font-bold">Mening daromadlarim</h1>
          <p className="text-muted-foreground">Barcha ishlar va daromadlar</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalEarnings)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami ishlar</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{jobItems.length}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aktiv ishlar</CardTitle>
              <Briefcase className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {jobItems.filter(item => item.jobs?.status === 'ochiq').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Ishlar ro'yxati</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ish nomi</TableHead>
                  <TableHead>Operatsiya</TableHead>
                  <TableHead>Miqdor</TableHead>
                  <TableHead>O'lcham</TableHead>
                  <TableHead>Rang</TableHead>
                  <TableHead>Narx</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead className="text-right">Jami</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      Hali ishlar yo'q
                    </TableCell>
                  </TableRow>
                ) : (
                  jobItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.jobs?.job_name}</TableCell>
                      <TableCell>{item.operations?.name}</TableCell>
                      <TableCell>{item.quantity}</TableCell>
                      <TableCell>{item.size || '—'}</TableCell>
                      <TableCell>{item.color || '—'}</TableCell>
                      <TableCell>{formatCurrency(item.unit_price)}</TableCell>
                      <TableCell>
                        {item.bonus_amount ? (
                          <div>
                            <div>{formatCurrency(item.bonus_amount)}</div>
                            {item.bonus_note && (
                              <div className="text-xs text-muted-foreground">{item.bonus_note}</div>
                            )}
                          </div>
                        ) : '—'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {formatCurrency(calculateItemEarnings(item))}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyEarnings;
