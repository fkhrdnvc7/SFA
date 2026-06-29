import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, XCircle, Clock, PackagePlus, TrendingUp, DollarSign } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formatDateDashboard, formatDateShort } from "@/lib/dateFormat";

interface IncomingJob {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
  notes: string | null;
  approval_status: string | null;
  approved_at: string | null;
  employer_price_per_unit: number | null;
  employer_total_price: number | null;
  employer_notes: string | null;
  created_at: string;
}

const EmployerDashboard = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [pendingJobs, setPendingJobs] = useState<IncomingJob[]>([]);
  const [approvedJobs, setApprovedJobs] = useState<IncomingJob[]>([]);
  const [rejectedJobs, setRejectedJobs] = useState<IncomingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<IncomingJob | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [employerNotes, setEmployerNotes] = useState("");
  const [totalRevenue, setTotalRevenue] = useState(0);

  const fetchJobs = useCallback(async () => {
    if (!user) return;

    try {
      // First, get the employer_id for this user
      const { data: employerData, error: employerError } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (employerError) {
        console.error('Error fetching employer:', employerError);
        toast.error("Employer ma'lumotlarini yuklashda xatolik");
        setIsLoading(false);
        return;
      }

      if (!employerData) {
        console.log('No employer found for user:', user.id);
        // User has ISH_BERUVCHI role but no employer record yet
        // Show empty state
        setPendingJobs([]);
        setApprovedJobs([]);
        setRejectedJobs([]);
        setTotalRevenue(0);
        setIsLoading(false);
        return;
      }

      // Fetch jobs for this employer
      const { data, error } = await supabase
        .from('incoming_jobs')
        .select('*')
        .eq('employer_id', employerData.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobs = data || [];
      setPendingJobs(jobs.filter(j => j.approval_status === 'pending'));
      setApprovedJobs(jobs.filter(j => j.approval_status === 'approved'));
      setRejectedJobs(jobs.filter(j => j.approval_status === 'rejected'));

      // Calculate total revenue
      const revenue = jobs
        .filter(j => j.approval_status === 'approved')
        .reduce((sum, job) => sum + (job.employer_total_price || 0), 0);
      setTotalRevenue(revenue);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error("Ishlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && profile.role !== 'ISH_BERUVCHI') {
      navigate("/dashboard");
    } else if (profile && profile.role === 'ISH_BERUVCHI') {
      fetchJobs();
    }
  }, [user, profile, loading, navigate, fetchJobs]);

  const handleApprovalClick = (job: IncomingJob) => {
    setSelectedJob(job);
    setPricePerUnit("");
    setEmployerNotes("");
    setApprovalOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedJob) return;

    const price = parseFloat(pricePerUnit);
    if (!price || price <= 0) {
      toast.error("Narxni to'g'ri kiriting");
      return;
    }

    try {
      const totalPrice = price * selectedJob.quantity;

      const { error } = await supabase
        .from('incoming_jobs')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          employer_price_per_unit: price,
          employer_total_price: totalPrice,
          employer_notes: employerNotes || null,
        })
        .eq('id', selectedJob.id);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      toast.success("Ish tasdiqlandi");
      setApprovalOpen(false);
      fetchJobs();

      // Send notification to admins
      await supabase.from('notifications').insert({
        title: 'Ish tasdiqlandi',
        body: `${selectedJob.job_name} — ${selectedJob.quantity} dona tasdiqlandi. Narx: ${price} so'm`,
        type: 'success',
        related_table: 'incoming_jobs',
        related_id: selectedJob.id,
        user_id: null, // null means all admins/managers will see it
      });
    } catch (error) {
      console.error('Error approving job:', error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleReject = async (job: IncomingJob) => {
    if (!confirm("Ishni rad etmoqchimisiz?")) return;

    try {
      const { error } = await supabase
        .from('incoming_jobs')
        .update({
          approval_status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', job.id);

      if (error) throw error;

      toast.success("Ish rad etildi");
      fetchJobs();

      // Send notification to admins
      await supabase.from('notifications').insert({
        title: 'Ish rad etildi',
        body: `${job.job_name} — ${job.quantity} dona rad etildi`,
        type: 'warning',
        related_table: 'incoming_jobs',
        related_id: job.id,
        user_id: null,
      });
    } catch (error) {
      console.error('Error rejecting job:', error);
      toast.error("Xatolik yuz berdi");
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
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
            <h1 className="text-3xl font-bold tracking-tight">Ish Beruvchi Dashboard</h1>
            <p className="text-muted-foreground">Sizning ishlaringiz va statistika</p>
          </div>
          <Button onClick={() => navigate("/employer-pending-jobs")} variant="default">
            <Clock className="mr-2 h-4 w-4" />
            Kutilayotgan ishlar
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-yellow-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{pendingJobs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasdiqlash kerak</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasdiqlangan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{approvedJobs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Ishlar tasdiqlandi</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rad etilgan</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{rejectedJobs.length}</div>
              <p className="text-xs text-muted-foreground mt-1">Rad etilgan ishlar</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-background">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Jami daromad</CardTitle>
              <DollarSign className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(totalRevenue)}</div>
              <p className="text-xs text-muted-foreground mt-1">Tasdiqlangan ishlardan</p>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for job lists */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pending" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Kutilmoqda ({pendingJobs.length})
            </TabsTrigger>
            <TabsTrigger value="approved" className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Tasdiqlangan ({approvedJobs.length})
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex items-center gap-2">
              <XCircle className="h-4 w-4" />
              Rad etilgan ({rejectedJobs.length})
            </TabsTrigger>
          </TabsList>

          {/* Pending Jobs Tab */}
          <TabsContent value="pending" className="space-y-4">
            {pendingJobs.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Tasdiqlash kutilmoqda
                  </CardTitle>
                  <CardDescription>Quyidagi ishlarni ko'rib chiqing va tasdiqlang</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ish nomi</TableHead>
                          <TableHead>Soni</TableHead>
                          <TableHead>Sana</TableHead>
                          <TableHead>Izoh</TableHead>
                          <TableHead className="text-right">Amallar</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pendingJobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.job_name}</TableCell>
                            <TableCell>{job.quantity} dona</TableCell>
                            <TableCell>{formatDate(job.date)}</TableCell>
                            <TableCell className="max-w-xs truncate">{job.notes || "—"}</TableCell>
                            <TableCell className="text-right space-x-2">
                              <Button size="sm" onClick={() => handleApprovalClick(job)}>
                                <CheckCircle className="mr-1 h-4 w-4" />
                                Tasdiqlash
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleReject(job)}>
                                <XCircle className="mr-1 h-4 w-4" />
                                Rad etish
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Clock className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Kutilayotgan ishlar yo'q</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Approved Jobs Tab */}
          <TabsContent value="approved" className="space-y-4">
            {approvedJobs.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Tasdiqlangan ishlar
                  </CardTitle>
                  <CardDescription>Siz tomondan tasdiqlangan ishlar ro'yxati</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ish nomi</TableHead>
                          <TableHead>Soni</TableHead>
                          <TableHead>Sana</TableHead>
                          <TableHead>Narx (dona)</TableHead>
                          <TableHead>Jami narx</TableHead>
                          <TableHead>Tasdiqlangan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {approvedJobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.job_name}</TableCell>
                            <TableCell>{job.quantity} dona</TableCell>
                            <TableCell>{formatDate(job.date)}</TableCell>
                            <TableCell>{formatCurrency(job.employer_price_per_unit)}</TableCell>
                            <TableCell className="font-semibold text-green-600">{formatCurrency(job.employer_total_price)}</TableCell>
                            <TableCell>{job.approved_at ? formatDate(job.approved_at) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Tasdiqlangan ishlar yo'q</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Rejected Jobs Tab */}
          <TabsContent value="rejected" className="space-y-4">
            {rejectedJobs.length > 0 ? (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    Rad etilgan ishlar
                  </CardTitle>
                  <CardDescription>Rad etilgan ishlar ro'yxati</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ish nomi</TableHead>
                          <TableHead>Soni</TableHead>
                          <TableHead>Sana</TableHead>
                          <TableHead>Izoh</TableHead>
                          <TableHead>Rad etilgan</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rejectedJobs.map((job) => (
                          <TableRow key={job.id}>
                            <TableCell className="font-medium">{job.job_name}</TableCell>
                            <TableCell>{job.quantity} dona</TableCell>
                            <TableCell>{formatDate(job.date)}</TableCell>
                            <TableCell className="max-w-xs truncate">{job.notes || "—"}</TableCell>
                            <TableCell>{job.approved_at ? formatDate(job.approved_at) : "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </ScrollArea>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <XCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Rad etilgan ishlar yo'q</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Approval Dialog */}
      <Dialog open={approvalOpen} onOpenChange={setApprovalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ishni tasdiqlash</DialogTitle>
            <DialogDescription>
              Ish: <strong>{selectedJob?.job_name}</strong> — <strong>{selectedJob?.quantity} dona</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="price">Narx (dona uchun) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="Masalan: 15000"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
              />
              {pricePerUnit && (
                <p className="text-sm text-muted-foreground mt-1">
                  Jami: {formatCurrency(parseFloat(pricePerUnit) * (selectedJob?.quantity || 0))}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="notes">Izoh (ixtiyoriy)</Label>
              <Textarea
                id="notes"
                placeholder="Qo'shimcha izoh..."
                value={employerNotes}
                onChange={(e) => setEmployerNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setApprovalOpen(false)}>
                Bekor qilish
              </Button>
              <Button onClick={handleApprove}>
                <CheckCircle className="mr-2 h-4 w-4" />
                Tasdiqlash
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default EmployerDashboard;
