import { useEffect, useState } from "react";
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
import { CheckCircle, XCircle, Clock, PackagePlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

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
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      const jobs = data || [];
      setPendingJobs(jobs.filter(j => j.approval_status === 'pending'));
      setApprovedJobs(jobs.filter(j => j.approval_status === 'approved'));
      setRejectedJobs(jobs.filter(j => j.approval_status === 'rejected'));
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error("Ishlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

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
      const { error } = await supabase
        .from('incoming_jobs')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          employer_price_per_unit: price,
          employer_notes: employerNotes || null,
        })
        .eq('id', selectedJob.id);

      if (error) throw error;

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
          <h1 className="text-3xl font-bold">Ish Beruvchi Dashboard</h1>
          <p className="text-muted-foreground">Sizning ishlaringiz</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kutilmoqda</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pendingJobs.length}</div>
              <p className="text-xs text-muted-foreground">Tasdiqlash kerak</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Tasdiqlangan</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approvedJobs.length}</div>
              <p className="text-xs text-muted-foreground">Ishlar tasdiqlandi</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rad etilgan</CardTitle>
              <XCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rejectedJobs.length}</div>
              <p className="text-xs text-muted-foreground">Rad etilgan ishlar</p>
            </CardContent>
          </Card>
        </div>

        {/* Pending Jobs */}
        {pendingJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-yellow-600" />
                Tasdiqlash kutilmoqda
              </CardTitle>
              <CardDescription>Quyidagi ishlarni ko'rib chiqing va tasdiqlang</CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
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
        )}

        {/* Approved Jobs */}
        {approvedJobs.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                Tasdiqlangan ishlar
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px]">
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
                        <TableCell className="font-semibold">{formatCurrency(job.employer_total_price)}</TableCell>
                        <TableCell>{job.approved_at ? formatDate(job.approved_at) : "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* No Jobs Message */}
        {pendingJobs.length === 0 && approvedJobs.length === 0 && rejectedJobs.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <PackagePlus className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Hozircha ishlar yo'q</p>
            </CardContent>
          </Card>
        )}
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
