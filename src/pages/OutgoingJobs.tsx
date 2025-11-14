import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Plus, Edit, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface IncomingJob {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
}

interface OutgoingJob {
  id: string;
  quantity_sent: number;
  notes?: string;
  date: string;
  created_at: string;
}

const OutgoingJobs = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [incomingJob, setIncomingJob] = useState<IncomingJob | null>(null);
  const [outgoingJobs, setOutgoingJobs] = useState<OutgoingJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<OutgoingJob | null>(null);
  const [quantitySent, setQuantitySent] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchData();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate, id]);

  const fetchData = async () => {
    try {
      const { data: incomingData, error: incomingError } = await supabase
        .from('incoming_jobs')
        .select('*')
        .eq('id', id)
        .single();
      if (incomingError) throw incomingError;
      setIncomingJob(incomingData);

      const { data: outgoingData, error: outgoingError } = await supabase
        .from('outgoing_jobs')
        .select('*')
        .eq('incoming_job_id', id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false });
      if (outgoingError) throw outgoingError;
      setOutgoingJobs(outgoingData || []);
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
          .from('outgoing_jobs')
          .update({
            quantity_sent: parseInt(quantitySent),
            notes: notes || null,
            date,
          })
          .eq('id', editingJob.id);
        if (error) throw error;
        toast.success("Yangilandi");
      } else {
        const { error } = await supabase
          .from('outgoing_jobs')
          .insert({
            incoming_job_id: id,
            quantity_sent: parseInt(quantitySent),
            notes: notes || null,
            date,
            created_by: user?.id,
          });
        if (error) throw error;
        toast.success("Qo'shildi");
      }
      resetForm();
      setOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Xatolik yuz berdi");
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!confirm("O'chirilsinmi?")) return;
    try {
      const { error } = await supabase.from('outgoing_jobs').delete().eq('id', jobId);
      if (error) throw error;
      toast.success("O'chirildi");
      fetchData();
    } catch (error) {
      toast.error("Xatolik");
    }
  };

  const handleEdit = (job: OutgoingJob) => {
    setEditingJob(job);
    setQuantitySent(job.quantity_sent.toString());
    setNotes(job.notes || "");
    setDate(job.date);
    setOpen(true);
  };

  const resetForm = () => {
    setQuantitySent("");
    setNotes("");
    setDate(new Date().toISOString().split('T')[0]);
    setEditingJob(null);
  };

  const getTotalSent = () => {
    return outgoingJobs.reduce((sum, job) => sum + job.quantity_sent, 0);
  };

  const getRemaining = () => {
    if (!incomingJob) return 0;
    return incomingJob.quantity - getTotalSent();
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

  if (!incomingJob) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-lg">Ish topilmadi</p>
        </div>
      </Layout>
    );
  }

  const totalSent = getTotalSent();
  const remaining = getRemaining();
  const isCompleted = remaining <= 0;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/outgoing-jobs-list')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">{incomingJob.job_name}</h1>
              {isCompleted ? (
                <Badge className="bg-green-500">To'liq tugagan</Badge>
              ) : (
                <Badge variant="secondary">Jarayonda</Badge>
              )}
            </div>
            <p className="text-muted-foreground mt-1">
              Kelgan: {incomingJob.quantity} | Ketgan: {totalSent} | Qolgan: {remaining}
            </p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button disabled={isCompleted}>
                <Plus className="h-4 w-4 mr-2" />
                Ketgan ish qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingJob ? "Tahrirlash" : "Ketgan ish qo'shish"}</DialogTitle>
                <DialogDescription>
                  Ketgan ish haqida ma'lumot kiriting
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label>Ketgan soni *</Label>
                  <Input
                    type="number"
                    value={quantitySent}
                    onChange={(e) => setQuantitySent(e.target.value)}
                    placeholder="0"
                    max={remaining}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Maksimal: {remaining}
                  </p>
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
            <CardTitle>Ketgan ishlar ro'yxati</CardTitle>
          </CardHeader>
          <CardContent>
            {outgoingJobs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-2">Ketgan ishlar yo'q</p>
                <p className="text-muted-foreground">Yangi ketgan ish qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Sana</TableHead>
                    <TableHead>Ketgan soni</TableHead>
                    <TableHead>Berish raqami</TableHead>
                    <TableHead>Izoh</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {outgoingJobs.map((job, index) => (
                    <TableRow key={job.id}>
                      <TableCell>{new Date(job.date).toLocaleDateString('uz-UZ')}</TableCell>
                      <TableCell className="font-medium">{job.quantity_sent}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{outgoingJobs.length - index}-marta</Badge>
                      </TableCell>
                      <TableCell>{job.notes || '—'}</TableCell>
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

export default OutgoingJobs;
