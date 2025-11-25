import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  task_description: string;
  task_date: string;
  status: 'bajarilmagan' | 'qisman' | 'bajarilgan';
  notes?: string;
  created_at: string;
}

const MyTasks = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile?.role !== 'SEAMSTRESS') {
      navigate("/dashboard");
    } else if (profile) {
      fetchTasks();
    }
  }, [user, profile, loading, navigate]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_tasks')
        .select('*')
        .eq('seamstress_id', user?.id)
        .order('task_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // Agar jadval mavjud bo'lmasa, bo'sh array qaytar
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('daily_tasks jadvali hali yaratilmagan');
          setTasks([]);
          return;
        }
        throw error;
      }
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      // Agar jadval mavjud bo'lmasa, xatolikni ko'rsatma
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        setTasks([]);
      } else {
        toast.error("Vazifalarni yuklashda xatolik");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateStatus = async (taskId: string, newStatus: 'bajarilmagan' | 'qisman' | 'bajarilgan') => {
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      toast.success("Status yangilandi");
      fetchTasks();
    } catch (error) {
      toast.error("Statusni yangilashda xatolik");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'bajarilgan': { variant: 'default' as const, label: 'Bajarilgan', icon: CheckCircle2 },
      'qisman': { variant: 'secondary' as const, label: 'Qisman', icon: Clock },
      'bajarilmagan': { variant: 'outline' as const, label: 'Bajarilmagan', icon: XCircle },
    };
    const config = variants[status] || variants['bajarilmagan'];
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="flex items-center gap-1 w-fit">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getStatusCounts = () => {
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'bajarilgan').length,
      partial: tasks.filter(t => t.status === 'qisman').length,
      pending: tasks.filter(t => t.status === 'bajarilmagan').length,
    };
  };

  const counts = getStatusCounts();

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
          <h1 className="text-3xl font-bold">Mening vazifalarim</h1>
          <p className="text-muted-foreground">Kunlik vazifalar va ularning holati</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami vazifalar</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{counts.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bajarilgan</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{counts.completed}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Qisman</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-500">{counts.partial}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Bajarilmagan</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{counts.pending}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Vazifalar ro'yxati</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-2">Hozircha vazifalar yo'q</p>
                <p className="text-muted-foreground">Sizga vazifa berilganda bu yerda ko'rinadi</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Vazifa</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tasks.map((task) => (
                      <TableRow key={task.id}>
                        <TableCell>
                          {new Date(task.task_date).toLocaleDateString('uz-UZ')}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{task.task_description}</p>
                            {task.notes && (
                              <p className="text-sm text-muted-foreground mt-1">{task.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant={task.status === 'bajarilmagan' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, 'bajarilmagan')}
                            >
                              Bajarilmagan
                            </Button>
                            <Button
                              variant={task.status === 'qisman' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, 'qisman')}
                            >
                              Qisman
                            </Button>
                            <Button
                              variant={task.status === 'bajarilgan' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => handleUpdateStatus(task.id, 'bajarilgan')}
                            >
                              Bajarilgan
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
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

export default MyTasks;

