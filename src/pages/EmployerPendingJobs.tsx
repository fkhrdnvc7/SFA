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
import { CheckCircle, XCircle, Clock, CheckSquare } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import EmployerJobFilters, { JobFilters } from "@/components/EmployerJobFilters";
import BulkApprovalDialog from "@/components/BulkApprovalDialog";
import AuditLogViewer from "@/components/AuditLogViewer";
import PriceHistoryViewer from "@/components/PriceHistoryViewer";
import { useIncomingJobsRealtime } from "@/lib/realtimeNotifications";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface IncomingJob {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
  notes: string | null;
  approval_status: string | null;
  created_at: string;
}

const EmployerPendingJobs = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState<IncomingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<IncomingJob | null>(null);
  const [approvalOpen, setApprovalOpen] = useState(false);
  const [pricePerUnit, setPricePerUnit] = useState("");
  const [employerNotes, setEmployerNotes] = useState("");
  const [bulkApprovalOpen, setBulkApprovalOpen] = useState(false);
  const [filters, setFilters] = useState<JobFilters>({
    searchTerm: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
    priceMin: "",
    priceMax: "",
  });
  const [employerId, setEmployerId] = useState<string | null>(null);

  // Set up real-time updates
  useIncomingJobsRealtime(employerId || undefined, fetchJobs);

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
      // Get employer ID first
      const { data: employerData } = await supabase
        .from('employers')
        .select('id')
        .eq('user_id', user?.id)
        .single();

      if (employerData) {
        setEmployerId(employerData.id);
      }

      const { data, error } = await supabase
        .from('incoming_jobs')
        .select('*')
        .eq('approval_status', 'pending')
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(data || []);
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
      console.log('Approving job:', selectedJob.id, 'with price:', price);

      const { data, error } = await supabase
        .from('incoming_jobs')
        .update({
          approval_status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
          employer_price_per_unit: price,
          employer_notes: employerNotes || null,
        })
        .eq('id', selectedJob.id)
        .select()
        .single();

      if (error) {
        console.error('Approval error:', error);
        throw error;
      }

      console.log('Job approved successfully:', data);

      toast.success("Ish tasdiqlandi");

      // Reset all form states
      setApprovalOpen(false);
      setSelectedJob(null);
      setPricePerUnit("");
      setEmployerNotes("");

      fetchJobs();

      // Send notification to admins
      await supabase.from('notifications').insert({
        title: 'Ish tasdiqlandi',
        body: `${selectedJob.job_name} — ${selectedJob.quantity} dona tasdiqlandi. Narx: ${price} so'm`,
        type: 'success',
        related_table: 'incoming_jobs',
        related_id: selectedJob.id,
        user_id: null,
      });
    } catch (error: any) {
      console.error('Error approving job:', error);
      toast.error(error.message || "Xatolik yuz berdi");
    }
  };

  const handleReject = async (job: IncomingJob) => {
    if (!confirm("Ishni rad etmoqchimisiz?")) return;

    try {
      console.log('Rejecting job:', job.id);

      const { data, error } = await supabase
        .from('incoming_jobs')
        .update({
          approval_status: 'rejected',
          approved_at: new Date().toISOString(),
          approved_by: user?.id,
        })
        .eq('id', job.id)
        .select()
        .single();

      if (error) {
        console.error('Rejection error:', error);
        throw error;
      }

      console.log('Job rejected successfully:', data);

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
    } catch (error: any) {
      console.error('Error rejecting job:', error);
      toast.error(error.message || "Xatolik yuz berdi");
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return "—";
    return new Intl.NumberFormat('uz-UZ').format(amount) + " so'm";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('uz-UZ');
  };

  // Apply filters
  const filteredJobs = jobs.filter(job => {
    if (filters.searchTerm && !job.job_name.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.dateFrom && new Date(job.date) < new Date(filters.dateFrom)) {
      return false;
    }
    if (filters.dateTo && new Date(job.date) > new Date(filters.dateTo)) {
      return false;
    }
    return true;
  });

  const handleExport = (format: 'excel' | 'pdf') => {
    console.log(`Exporting to ${format}:`, filteredJobs);
    // TODO: Implement actual export functionality
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
          <h1 className="text-3xl font-bold">Kutilayotgan Ishlar</h1>
          <p className="text-muted-foreground">Tasdiqlash kerak bo'lgan ishlar</p>
        </div>

        {/* Filters */}
        <EmployerJobFilters
          filters={filters}
          onFiltersChange={setFilters}
          onExport={handleExport}
          showExport={filteredJobs.length > 0}
        />

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Hozircha kutilayotgan ishlar yo'q</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-yellow-600" />
                    Tasdiqlash kutilmoqda ({filteredJobs.length})
                  </CardTitle>
                  <CardDescription>Quyidagi ishlarni ko'rib chiqing va tasdiqlang</CardDescription>
                </div>
                {filteredJobs.length > 1 && (
                  <Button onClick={() => setBulkApprovalOpen(true)}>
                    <CheckSquare className="mr-2 h-4 w-4" />
                    Ommaviy tasdiqlash
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px]">
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
                    {filteredJobs.map((job) => (
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

      {/* Bulk Approval Dialog */}
      <BulkApprovalDialog
        open={bulkApprovalOpen}
        onOpenChange={setBulkApprovalOpen}
        jobs={filteredJobs}
        onSuccess={fetchJobs}
        userId={user?.id}
      />

      {/* Additional Features Tabs */}
      <div className="mt-6">
        <Tabs defaultValue="audit" className="w-full">
          <TabsList>
            <TabsTrigger value="audit">Tarix va Audit</TabsTrigger>
            <TabsTrigger value="price">Narxlar tarixi</TabsTrigger>
          </TabsList>
          <TabsContent value="audit" className="mt-4">
            <AuditLogViewer limit={20} />
          </TabsContent>
          <TabsContent value="price" className="mt-4">
            <PriceHistoryViewer limit={15} />
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmployerPendingJobs;
