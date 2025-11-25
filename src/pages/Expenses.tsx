import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash2, Edit, TrendingDown, Wallet, Receipt, TrendingUp } from "lucide-react";
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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Expense {
  id: string;
  expense_name: string;
  description?: string;
  amount: number;
  expense_date: string;
  created_at: string;
}

const Expenses = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomingJobs, setIncomingJobs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [expenseName, setExpenseName] = useState("");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchExpenses();
      fetchIncomingJobs();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchExpenses = async () => {
    try {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) {
        // Agar jadval mavjud bo'lmasa, bo'sh array qaytar
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          console.warn('expenses jadvali hali yaratilmagan');
          setExpenses([]);
          return;
        }
        throw error;
      }
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      // Agar jadval mavjud bo'lmasa, xatolikni ko'rsatma
      if (error?.code === '42P01' || error?.message?.includes('does not exist')) {
        setExpenses([]);
      } else {
        toast.error("Xarajatlarni yuklashda xatolik");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const fetchIncomingJobs = async () => {
    try {
      const { data, error } = await supabase
        .from('incoming_jobs')
        .select('*')
        .order('date', { ascending: false });

      if (error) throw error;
      setIncomingJobs(data || []);
    } catch (error) {
      console.error('Error fetching incoming jobs:', error);
    }
  };

  const calculateAdminProfit = useMemo(() => {
    return incomingJobs.reduce((sum, job) => {
      const quantity = job.quantity || 0;
      const clientRate = job.client_price_per_unit || 0;
      const workerRate = job.worker_cost_per_unit || 0;
      const unitProfit = clientRate - workerRate;
      return sum + (unitProfit * quantity);
    }, 0);
  }, [incomingJobs]);

  const calculateTotalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  const calculateNetProfit = useMemo(() => {
    return calculateAdminProfit - calculateTotalExpenses;
  }, [calculateAdminProfit, calculateTotalExpenses]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseName.trim() || !amount) {
      toast.error("Xarajat nomi va narxni kiriting");
      return;
    }

    try {
      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update({
            expense_name: expenseName,
            description: description || null,
            amount: parseFloat(amount),
            expense_date: expenseDate,
          })
          .eq('id', editingExpense.id);

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            toast.error("Jadval hali yaratilmagan. Iltimos, migratsiyani qo'llang.");
            return;
          }
          throw error;
        }
        toast.success("Xarajat yangilandi");
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert({
            expense_name: expenseName,
            description: description || null,
            amount: parseFloat(amount),
            expense_date: expenseDate,
            created_by: user?.id,
          });

        if (error) {
          if (error.code === '42P01' || error.message?.includes('does not exist')) {
            toast.error("Jadval hali yaratilmagan. Iltimos, migratsiyani qo'llang.");
            return;
          }
          throw error;
        }
        toast.success("Xarajat qo'shildi");
      }

      resetForm();
      setOpen(false);
      fetchExpenses();
    } catch (error: any) {
      console.error('Error saving expense:', error);
      toast.error("Xarajatni saqlashda xatolik");
    }
  };

  const handleDelete = async (expenseId: string) => {
    if (!confirm("Xarajatni o'chirishni tasdiqlaysizmi?")) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      toast.success("Xarajat o'chirildi");
      fetchExpenses();
    } catch (error) {
      toast.error("Xarajatni o'chirishda xatolik");
    }
  };

  const handleEdit = (expense: Expense) => {
    setEditingExpense(expense);
    setExpenseName(expense.expense_name);
    setDescription(expense.description || "");
    setAmount(expense.amount.toString());
    setExpenseDate(expense.expense_date);
    setOpen(true);
  };

  const resetForm = () => {
    setExpenseName("");
    setDescription("");
    setAmount("");
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setEditingExpense(null);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Xarajatlar</h1>
            <p className="text-muted-foreground">Barcha xarajatlar va daromad hisoboti</p>
          </div>
          <Dialog open={open} onOpenChange={(isOpen) => { setOpen(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi xarajat
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingExpense ? "Tahrirlash" : "Yangi xarajat"}</DialogTitle>
                <DialogDescription>
                  Xarajat haqida ma'lumot kiriting
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="expense-name">Xarajat nomi *</Label>
                  <Input
                    id="expense-name"
                    value={expenseName}
                    onChange={(e) => setExpenseName(e.target.value)}
                    placeholder="Masalan: Materiallar, Oylik maosh"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Izoh</Label>
                  <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Qo'shimcha ma'lumotlar..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount">Narxi *</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date">Sana *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  {editingExpense ? "Yangilash" : "Saqlash"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admin foydasi</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{formatCurrency(calculateAdminProfit)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami xarajatlar</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{formatCurrency(calculateTotalExpenses)}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Sof foyda</CardTitle>
              <Wallet className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${calculateNetProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {formatCurrency(calculateNetProfit)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Barcha xarajatlar</CardTitle>
          </CardHeader>
          <CardContent>
            {expenses.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-lg mb-2">Xarajatlar yo'q</p>
                <p className="text-muted-foreground">Yangi xarajat qo'shish uchun yuqoridagi tugmani bosing</p>
              </div>
            ) : (
              <ScrollArea className="h-[600px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Xarajat nomi</TableHead>
                      <TableHead>Izoh</TableHead>
                      <TableHead className="text-right">Narxi</TableHead>
                      <TableHead className="text-right">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {expenses.map((expense) => (
                      <TableRow key={expense.id}>
                        <TableCell>
                          {new Date(expense.expense_date).toLocaleDateString('uz-UZ')}
                        </TableCell>
                        <TableCell className="font-medium">{expense.expense_name}</TableCell>
                        <TableCell>{expense.description || '—'}</TableCell>
                        <TableCell className="text-right font-semibold">
                          {formatCurrency(expense.amount)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEdit(expense)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDelete(expense.id)}
                            >
                              <Trash2 className="h-4 w-4" />
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

export default Expenses;

