import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface IncomingJob {
  id: string;
  job_name: string;
  quantity: number;
  defective_items: number;
  extra_work: number;
  notes?: string;
  date: string;
  created_at: string;
  outgoing_jobs?: { quantity_sent: number }[];
}

const IncomingJobs = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState<IncomingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<IncomingJob | null>(null);
  const [jobName, setJobName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [defectiveItems, setDefectiveItems] = useState("0");
  const [extraWork, setExtraWork] = useState("0");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

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
          outgoing_jobs (quantity_sent)
        `)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingJob) {
        const { error } = await supabase
          .from('incoming_jobs')
          .update({
            job_name: jobName,
            quantity: parseInt(quantity),
            defective_items: parseInt(defectiveItems) || 0,
            extra_work: parseInt(extraWork) || 0,
            notes: notes || null,
            date,
          })
          .eq('id', editingJob.id);
        if (error) throw error;
        toast.success("Yangilandi");
      } else {
        const { error } = await supabase
          .from('incoming_jobs')
          .insert({
            job_name: jobName,
            quantity: parseInt(quantity),
            defective_items: parseInt(defectiveItems) || 0,
            extra_work: parseInt(extraWork) || 0,
            notes: notes || null,
            date,
            created_by: user?.id,
          });
        if (error) throw error;
        toast.success("Qo'shildi");
      }
      resetForm();
      setOpen(false);
      fetchJobs();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      const { error } = await supabase.from('incoming_jobs').delete().eq('id', id);
      if (error) throw error;
      toast.success("O'chirildi");
      fetchJobs();
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const handleEdit = (job: IncomingJob) => {
    setEditingJob(job);
    setJobName(job.job_name);
    setQuantity(job.quantity.toString());
    setDefectiveItems(job.defective_items.toString());
    setExtraWork(job.extra_work.toString());
    setNotes(job.notes || "");
    setDate(job.date);
    setOpen(true);
  };

  const resetForm = () => {
    setJobName("");
    setQuantity("");
    setDefectiveItems("0");
    setExtraWork("0");
    setNotes("");
    setDate(new Date().toISOString().split('T')[0]);
    setEditingJob(null);
  };

  const getTotalSent = (job: IncomingJob) => {
    return job.outgoing_jobs?.reduce((sum, og) => sum + og.quantity_sent, 0) || 0;
  };

  const getStatus = (job: IncomingJob) => {
    const totalSent = getTotalSent(job);
    if (totalSent >= job.quantity) {
      return <Badge className="bg-green-500">To'liq tugagan</Badge>;
    } else if (totalSent > 0) {
      return <Badge variant="secondary">Qisman ketgan</Badge>;
    }
    return <Badge variant="outline">Kutilmoqda</Badge>;
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
            <h1 className="text-3xl font-bold">Kelgan ishlar</h1>
            <p className="text-muted-foreground">Ishxonaga kelgan ishlar ro'yxati</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi ish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingJob ? "Tahrirlash" : "Yangi kelgan ish"}</DialogTitle>
                <DialogDescription>
                  Ishxonaga kelgan ish haqida ma'lumot kiriting
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ish nomi *</Label>
                  <Input
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="Masalan: Ko'ylak"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Soni *</Label>
                  <Input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sana *</Label>
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Yaroqsiz kiyimlar soni</Label>
                  <Input
                    type="number"
                    value={defectiveItems}
                    onChange={(e) => setDefectiveItems(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Ortiqcha ish</Label>
                  <Input
                    type="number"
                    value={extraWork}
                    onChange={(e) => setExtraWork(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Izoh</Label>
                  <Textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Qo'shimcha ma'lumot..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingJob ? "Yangilash" : "Saqlash"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Barcha kelgan ishlar</CardTitle>
          </CardHeader>
          <CardContent>
            {jobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-2">Ishlar yo'q</p>
                <p className="text-muted-foreground">Yangi ish qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Ish nomi</TableHead>
                      <TableHead>Kelgan</TableHead>
                      <TableHead>Ketgan</TableHead>
                      <TableHead>Qolgan</TableHead>
                      <TableHead>Yaroqsiz</TableHead>
                      <TableHead>Ortiqcha</TableHead>
                      <TableHead>Holat</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {jobs.map((job) => {
                      const totalSent = getTotalSent(job);
                      const remaining = job.quantity - totalSent;
                      return (
                        <TableRow key={job.id}>
                          <TableCell>{new Date(job.date).toLocaleDateString('uz-UZ')}</TableCell>
                          <TableCell className="font-medium">{job.job_name}</TableCell>
                          <TableCell>{job.quantity}</TableCell>
                          <TableCell>{totalSent}</TableCell>
                          <TableCell>{remaining}</TableCell>
                          <TableCell>{job.defective_items || 0}</TableCell>
                          <TableCell>{job.extra_work || 0}</TableCell>
                          <TableCell>{getStatus(job)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => handleEdit(job)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-destructive"
                                onClick={() => handleDelete(job.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default IncomingJobs;
