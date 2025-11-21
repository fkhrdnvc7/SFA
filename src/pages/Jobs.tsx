import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Briefcase, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Job {
  id: string;
  job_name: string;
  status: 'ochiq' | 'yopiq';
  created_at: string;
  notes?: string;
  total_estimated_amount: number;
}

const Jobs = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Form state
  const [jobName, setJobName] = useState("");
  const [notes, setNotes] = useState("");

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
        .from('jobs')
        .select('*')
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

  const handleCreateJob = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobName.trim()) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .insert({
          job_name: jobName,
          created_by: user?.id,
          notes: notes || null,
        });

      if (error) throw error;

      toast.success("Ish muvaffaqiyatli yaratildi");
      setJobName("");
      setNotes("");
      setOpen(false);
      fetchJobs();
    } catch (error: any) {
      console.error('Error creating job:', error);
      toast.error("Ish yaratishda xatolik");
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm("Ishni o'chirishni tasdiqlaysizmi?")) return;

    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      toast.success("Ish o'chirildi");
      fetchJobs();
    } catch (error: any) {
      console.error('Error deleting job:', error);
      toast.error("Ishni o'chirishda xatolik");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Ishlar</h1>
            <p className="text-muted-foreground">Barcha ishlarni boshqarish</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi ish
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[95vw] max-w-md">
              <DialogHeader>
                <DialogTitle>Yangi ish yaratish</DialogTitle>
                <DialogDescription>
                  Yangi ish yarating va keyinchalik unga operatsiyalar qo'shing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateJob} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="job-name">Ish nomi *</Label>
                  <Input
                    id="job-name"
                    value={jobName}
                    onChange={(e) => setJobName(e.target.value)}
                    placeholder="Masalan: Qishki kiyim to'plami"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Izohlar</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Qo'shimcha ma'lumotlar..."
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full">
                  Yaratish
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {jobs.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Briefcase className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium mb-2">Hozircha ishlar yo'q</p>
              <p className="text-muted-foreground mb-4">Yangi ish yarating va boshlang</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Birinchi ish yaratish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle 
                      className="text-lg cursor-pointer flex-1" 
                      onClick={() => navigate(`/jobs/${job.id}`)}
                    >
                      {job.job_name}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant={job.status === 'ochiq' ? 'default' : 'secondary'}>
                        {job.status === 'ochiq' ? 'Ochiq' : 'Yopiq'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteJob(job.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>
                    {new Date(job.created_at).toLocaleDateString('uz-UZ')}
                  </CardDescription>
                </CardHeader>
                {job.notes && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {job.notes}
                    </p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Jobs;
