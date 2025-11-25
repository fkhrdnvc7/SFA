import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, User, Filter, Pencil, Trash2 } from "lucide-react";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Task {
  id: string;
  seamstress_id: string;
  task_description: string;
  task_date: string;
  status: 'bajarilmagan' | 'qisman' | 'bajarilgan';
  notes?: string;
  created_at: string;
  seamstress?: {
    full_name: string;
  } | null;
}

const Tasks = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [seamstresses, setSeamstresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [selectedSeamstress, setSelectedSeamstress] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDate, setTaskDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterSeamstress, setFilterSeamstress] = useState("all");
  const [filterDate, setFilterDate] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchTasks();
      fetchSeamstresses();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchTasks = async () => {
    try {
      let query = supabase
        .from('daily_tasks')
        .select(`
          *,
          seamstress:profiles!daily_tasks_seamstress_id_fkey(full_name)
        `)
        .order('task_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (filterSeamstress && filterSeamstress !== 'all') {
        query = query.eq('seamstress_id', filterSeamstress);
      }
      if (filterDate) {
        query = query.eq('task_date', filterDate);
      }
      if (filterStatus && filterStatus !== 'all') {
        query = query.eq('status', filterStatus as 'bajarilmagan' | 'qisman' | 'bajarilgan');
      }

      const { data, error } = await query;
      if (error) {
        // Agar jadval mavjud bo'lmasa, bo'sh array qaytar
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('daily_tasks jadvali hali yaratilmagan');
          setTasks([]);
          return;
        }
        console.error('Supabase error:', error);
        throw error;
      }
      setTasks(data || []);
    } catch (error: any) {
      console.error('Error fetching tasks:', error);
      // Agar jadval mavjud bo'lmasa, xatolikni ko'rsatma
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        setTasks([]);
      } else {
        const errorMessage = error?.message || error?.error_description || 'Noma\'lum xatolik';
        console.error('Full error details:', error);
        toast.error(`Vazifalarni yuklashda xatolik: ${errorMessage}`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchSeamstresses = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'SEAMSTRESS')
      .eq('is_active', true)
      .order('full_name');
    setSeamstresses(data || []);
  };

  useEffect(() => {
    fetchTasks();
  }, [filterSeamstress, filterDate, filterStatus]);

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeamstress || !taskDescription.trim()) {
      toast.error("Tikuvchi va vazifa tavsifini kiriting");
      return;
    }

    try {
      if (editingTask) {
        const { error } = await supabase
          .from('daily_tasks')
          .update({
            seamstress_id: selectedSeamstress,
            task_description: taskDescription,
            task_date: taskDate,
            notes: notes || null,
          })
          .eq('id', editingTask.id);

        if (error) throw error;
        toast.success("Vazifa yangilandi");
      } else {
        const { error } = await supabase
          .from('daily_tasks')
          .insert({
            seamstress_id: selectedSeamstress,
            task_description: taskDescription,
            task_date: taskDate,
            notes: notes || null,
            created_by: user?.id,
          });

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            toast.error("Jadval hali yaratilmagan. Iltimos, migratsiyani qo'llang.");
            return;
          }
          throw error;
        }

        toast.success("Vazifa muvaffaqiyatli qo'shildi");
      }
      resetForm();
      setOpen(false);
      fetchTasks();
    } catch (error: any) {
      console.error('Error saving task:', error);
      toast.error("Vazifani saqlashda xatolik");
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

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Vazifa o'chirilsinmi?")) return;
    try {
      const { error } = await supabase
        .from('daily_tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;
      toast.success("Vazifa o'chirildi");
      fetchTasks();
    } catch (error) {
      toast.error("Vazifani o'chirishda xatolik");
    }
  };

  const resetForm = () => {
    setSelectedSeamstress("");
    setTaskDescription("");
    setTaskDate(new Date().toISOString().split('T')[0]);
    setNotes("");
    setEditingTask(null);
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setSelectedSeamstress(task.seamstress_id);
    setTaskDescription(task.task_description);
    setTaskDate(task.task_date);
    setNotes(task.notes || "");
    setOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const configs: Record<
      string,
      { label: string; color: string; bg: string }
    > = {
      bajarilgan: { label: "Bajarilgan", color: "text-green-700", bg: "bg-green-100" },
      qisman: { label: "Qisman", color: "text-yellow-700", bg: "bg-yellow-100" },
      bajarilmagan: { label: "Bajarilmagan", color: "text-red-700", bg: "bg-red-100" },
    };
    const config = configs[status] || configs["bajarilmagan"];
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${config.bg} ${config.color}`}>
        {config.label}
      </span>
    );
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
            <h1 className="text-3xl font-bold">Vazifa berish</h1>
            <p className="text-muted-foreground">Tikuvchilarga kunlik vazifalar berish</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi vazifa
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTask ? "Vazifani tahrirlash" : "Yangi vazifa berish"}</DialogTitle>
                <DialogDescription>
                  Tikuvchiga kunlik vazifa bering
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSaveTask} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="seamstress">Tikuvchi *</Label>
                  <Select value={selectedSeamstress} onValueChange={setSelectedSeamstress} required>
                    <SelectTrigger>
                      <SelectValue placeholder="Tikuvchini tanlang" />
                    </SelectTrigger>
                    <SelectContent>
                      {seamstresses.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Sana *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={taskDate}
                    onChange={(e) => setTaskDate(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Vazifa tavsifi *</Label>
                  <Textarea
                    id="description"
                    value={taskDescription}
                    onChange={(e) => setTaskDescription(e.target.value)}
                    placeholder="Vazifa haqida batafsil ma'lumot..."
                    rows={4}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Qo'shimcha izohlar</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Qo'shimcha ma'lumotlar..."
                    rows={2}
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingTask ? "Vazifani yangilash" : "Vazifa berish"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Filtrlar</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Tikuvchi</Label>
                <Select value={filterSeamstress} onValueChange={setFilterSeamstress}>
                  <SelectTrigger>
                    <SelectValue placeholder="Barchasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    {seamstresses.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Sana</Label>
                <Input
                  type="date"
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Barchasi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Barchasi</SelectItem>
                    <SelectItem value="bajarilmagan">Bajarilmagan</SelectItem>
                    <SelectItem value="qisman">Qisman</SelectItem>
                    <SelectItem value="bajarilgan">Bajarilgan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Barcha vazifalar</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-2">Vazifalar yo'q</p>
                <p className="text-muted-foreground">Yangi vazifa qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Tikuvchi</TableHead>
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
                      <TableCell className="font-medium">
                        {task.seamstress?.full_name || 'Noma\'lum'}
                      </TableCell>
                        <TableCell>
                          <div>
                            <p>{task.task_description}</p>
                            {task.notes && (
                              <p className="text-xs text-muted-foreground mt-1">{task.notes}</p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(task.status)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col items-end gap-2">
                            <div className="flex flex-wrap gap-2 justify-end">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(task.id, 'bajarilmagan')}
                                disabled={task.status === 'bajarilmagan'}
                              >
                                Bajarilmagan
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(task.id, 'qisman')}
                                disabled={task.status === 'qisman'}
                              >
                                Qisman
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUpdateStatus(task.id, 'bajarilgan')}
                                disabled={task.status === 'bajarilgan'}
                              >
                                Bajarilgan
                              </Button>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                onClick={() => handleEditTask(task)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="icon"
                                onClick={() => handleDeleteTask(task.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
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

export default Tasks;

