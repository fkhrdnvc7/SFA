import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Eye, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface IncomingJobWithOutgoing {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
  created_at: string;
  outgoing_jobs?: { id: string; quantity_sent: number; date: string }[];
}

const OutgoingJobsList = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState<IncomingJobWithOutgoing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchJobs();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('incoming_jobs')
        .select(`
          *,
          outgoing_jobs (id, quantity_sent, date)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTotalSent = (job: IncomingJobWithOutgoing) => {
    return job.outgoing_jobs?.reduce((sum, og) => sum + og.quantity_sent, 0) || 0;
  };

  const getStatus = (job: IncomingJobWithOutgoing) => {
    const totalSent = getTotalSent(job);
    if (totalSent >= job.quantity) {
      return <Badge className="bg-green-500">To'liq tugagan</Badge>;
    } else if (totalSent > 0) {
      return <Badge variant="secondary">Qisman ketgan</Badge>;
    }
    return <Badge variant="outline">Kutilmoqda</Badge>;
  };

  const getDeliveryCount = (job: IncomingJobWithOutgoing) => {
    return job.outgoing_jobs?.length || 0;
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <p>Yuklanmoqda...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ketgan ishlar</h1>
            <p className="text-muted-foreground">Ishxonadan ketgan ishlar ro'yxati</p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Barcha ketgan ishlar</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-2">Ishlar yo'q</p>
                <p className="text-muted-foreground">Avval kelgan ish qo'shish kerak</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Ish nomi</TableHead>
                    <TableHead>Jami kelgan</TableHead>
                    <TableHead>Ketgan</TableHead>
                    <TableHead>Qolgan</TableHead>
                    <TableHead>Berilgan soni</TableHead>
                    <TableHead>Holat</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => {
                    const totalSent = getTotalSent(job);
                    const remaining = job.quantity - totalSent;
                    const deliveryCount = getDeliveryCount(job);
                    return (
                      <TableRow key={job.id}>
                        <TableCell>{new Date(job.date).toLocaleDateString('uz-UZ')}</TableCell>
                        <TableCell className="font-medium">{job.job_name}</TableCell>
                        <TableCell>{job.quantity}</TableCell>
                        <TableCell>{totalSent}</TableCell>
                        <TableCell>{remaining}</TableCell>
                        <TableCell>
                          {deliveryCount === 0 ? (
                            <span className="text-muted-foreground">—</span>
                          ) : (
                            <Badge variant="outline">{deliveryCount}-marta</Badge>
                          )}
                        </TableCell>
                        <TableCell>{getStatus(job)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => navigate(`/outgoing-jobs/${job.id}`)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {remaining > 0 && (
                              <Button
                                variant="default"
                                size="sm"
                                onClick={() => navigate(`/outgoing-jobs/${job.id}`)}
                              >
                                <Plus className="h-4 w-4 mr-1" />
                                Berish
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default OutgoingJobsList;
