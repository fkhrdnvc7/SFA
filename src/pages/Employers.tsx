import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Eye, DollarSign, Building2 } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { createNotification } from "@/lib/notifications";

interface Employer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
}

interface Transaction {
  id: string;
  transaction_type: string;
  quantity: number | null;
  price_per_unit: number | null;
  total_amount: number;
  paid_amount: number | null;
  transaction_date: string;
  notes: string | null;
  incoming_jobs?: { job_name: string } | null;
}

interface EmployerWithStats extends Employer {
  totalReceived: number;
  totalPaid: number;
  balance: number;
}

const formatMoney = (amount: number) =>
  `${amount.toLocaleString("uz-UZ")} so'm`;

const Employers = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [employers, setEmployers] = useState<EmployerWithStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingEmployer, setEditingEmployer] = useState<Employer | null>(null);
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerWithStats | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isActive, setIsActive] = useState(true);

  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");

  const isAdmin = profile?.role === "ADMIN";

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === "ADMIN" || profile.role === "MANAGER")) {
      fetchEmployers();
    } else if (profile) {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchEmployers = async () => {
    try {
      const { data: employersData, error: empError } = await supabase
        .from("employers")
        .select("*")
        .order("name");

      if (empError) throw empError;

      const { data: txData, error: txError } = await supabase
        .from("employer_transactions")
        .select("employer_id, transaction_type, total_amount");

      if (txError) throw txError;

      const statsMap = new Map<string, { received: number; paid: number }>();
      (txData || []).forEach((tx) => {
        const current = statsMap.get(tx.employer_id) || { received: 0, paid: 0 };
        if (tx.transaction_type === "received") {
          current.received += Number(tx.total_amount) || 0;
        } else if (tx.transaction_type === "payment") {
          current.paid += Number(tx.total_amount) || 0;
        }
        statsMap.set(tx.employer_id, current);
      });

      const withStats: EmployerWithStats[] = (employersData || []).map((emp) => {
        const stats = statsMap.get(emp.id) || { received: 0, paid: 0 };
        return {
          ...emp,
          totalReceived: stats.received,
          totalPaid: stats.paid,
          balance: stats.received - stats.paid,
        };
      });

      setEmployers(withStats);
    } catch {
      toast.error("Ish beruvchilarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (employerId: string) => {
    setTransactionsLoading(true);
    try {
      const { data, error } = await supabase
        .from("employer_transactions")
        .select(`
          *,
          incoming_jobs (job_name)
        `)
        .eq("employer_id", employerId)
        .order("transaction_date", { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch {
      toast.error("Tranzaksiyalarni yuklashda xatolik");
    } finally {
      setTransactionsLoading(false);
    }
  };

  const resetForm = () => {
    setName("");
    setPhone("");
    setAddress("");
    setNotes("");
    setIsActive(true);
    setEditingEmployer(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Ism majburiy");
      return;
    }

    try {
      if (editingEmployer) {
        const { error } = await supabase
          .from("employers")
          .update({
            name: name.trim(),
            phone: phone || null,
            address: address || null,
            notes: notes || null,
            is_active: isActive,
          })
          .eq("id", editingEmployer.id);
        if (error) throw error;
        toast.success("Ish beruvchi yangilandi");
      } else {
        const { error } = await supabase.from("employers").insert({
          name: name.trim(),
          phone: phone || null,
          address: address || null,
          notes: notes || null,
          is_active: isActive,
          created_by: user!.id,
        });
        if (error) throw error;
        toast.success("Ish beruvchi qo'shildi");
      }
      resetForm();
      setOpen(false);
      fetchEmployers();
    } catch {
      toast.error("Saqlashda xatolik");
    }
  };

  const handleEdit = (employer: Employer) => {
    setEditingEmployer(employer);
    setName(employer.name);
    setPhone(employer.phone || "");
    setAddress(employer.address || "");
    setNotes(employer.notes || "");
    setIsActive(employer.is_active);
    setOpen(true);
  };

  const openDetail = (employer: EmployerWithStats) => {
    setSelectedEmployer(employer);
    setDetailOpen(true);
    fetchTransactions(employer.id);
  };

  const openPayment = (employer: EmployerWithStats) => {
    setSelectedEmployer(employer);
    setPaymentAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
    setPaymentOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmployer || !paymentAmount) {
      toast.error("To'lov summasi majburiy");
      return;
    }

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("To'g'ri summa kiriting");
      return;
    }

    try {
      const { error } = await supabase.from("employer_transactions").insert({
        employer_id: selectedEmployer.id,
        transaction_type: "payment",
        total_amount: amount,
        paid_amount: amount,
        transaction_date: paymentDate,
        notes: paymentNotes || null,
        created_by: user!.id,
      });
      if (error) throw error;

      await createNotification({
        title: "Ish beruvchiga to'lov qilindi",
        body: `${selectedEmployer.name} ga ${formatMoney(amount)} to'landi`,
        type: "success",
        related_table: "employer_transactions",
      });

      toast.success("To'lov saqlandi");
      setPaymentOpen(false);
      fetchEmployers();
      if (detailOpen) fetchTransactions(selectedEmployer.id);
    } catch {
      toast.error("To'lov saqlashda xatolik");
    }
  };

  const detailStats = useMemo(() => {
    if (!selectedEmployer) return { received: 0, paid: 0, balance: 0 };
    return {
      received: selectedEmployer.totalReceived,
      paid: selectedEmployer.totalPaid,
      balance: selectedEmployer.balance,
    };
  }, [selectedEmployer]);

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-40" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ish beruvchilar</h1>
            <p className="text-muted-foreground">Ish beruvchilar va moliyaviy hisoblar</p>
          </div>
          {isAdmin && (
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Ish beruvchi qo'shish
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingEmployer ? "Ish beruvchini tahrirlash" : "Yangi ish beruvchi"}
                  </DialogTitle>
                  <DialogDescription>Ish beruvchi ma'lumotlarini kiriting</DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Ism *</Label>
                    <Input value={name} onChange={(e) => setName(e.target.value)} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefon</Label>
                    <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998..." />
                  </div>
                  <div className="space-y-2">
                    <Label>Manzil</Label>
                    <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Izoh</Label>
                    <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch checked={isActive} onCheckedChange={setIsActive} />
                    <Label>Aktiv</Label>
                  </div>
                  <Button type="submit" className="w-full">Saqlash</Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {employers.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg">Ish beruvchilar yo'q</p>
              <p className="text-muted-foreground">Yangi ish beruvchi qo'shing</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {employers.map((emp) => (
              <Card key={emp.id} className="flex flex-col">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{emp.name}</CardTitle>
                    <Badge variant={emp.is_active ? "default" : "secondary"}>
                      {emp.is_active ? "Aktiv" : "Noaktiv"}
                    </Badge>
                  </div>
                  {emp.phone && <p className="text-sm text-muted-foreground">{emp.phone}</p>}
                  {emp.address && <p className="text-sm text-muted-foreground">{emp.address}</p>}
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-3">
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Qabul qilingan:</span>
                      <span className="font-medium">{formatMoney(emp.totalReceived)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">To'langan:</span>
                      <span className="font-medium">{formatMoney(emp.totalPaid)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Qarz:</span>
                      <span className={`font-semibold ${emp.balance > 0 ? "text-destructive" : "text-green-600"}`}>
                        {formatMoney(emp.balance)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-auto flex gap-2 pt-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => openDetail(emp)}>
                      <Eye className="mr-1 h-4 w-4" />
                      Batafsil
                    </Button>
                    <Button size="sm" className="flex-1" onClick={() => openPayment(emp)}>
                      <DollarSign className="mr-1 h-4 w-4" />
                      To'lov
                    </Button>
                    {isAdmin && (
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(emp)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Detail Dialog */}
        <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedEmployer?.name} — Moliyaviy hisob</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Jami qabul qilingan</p>
                  <p className="text-xl font-bold">{formatMoney(detailStats.received)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Jami to'langan</p>
                  <p className="text-xl font-bold">{formatMoney(detailStats.paid)}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Joriy qarz</p>
                  <p className={`text-xl font-bold ${detailStats.balance > 0 ? "text-destructive" : ""}`}>
                    {formatMoney(detailStats.balance)}
                  </p>
                </CardContent>
              </Card>
            </div>
            <div className="flex justify-end">
              <Button onClick={() => selectedEmployer && openPayment(selectedEmployer)}>
                <DollarSign className="mr-2 h-4 w-4" />
                To'lov qo'shish
              </Button>
            </div>
            {transactionsLoading ? (
              <Skeleton className="h-48" />
            ) : (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sana</TableHead>
                      <TableHead>Tur</TableHead>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead>Miqdor</TableHead>
                      <TableHead>Birlik narxi</TableHead>
                      <TableHead>Jami</TableHead>
                      <TableHead>Izoh</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>
                          {new Date(tx.transaction_date).toLocaleDateString("uz-UZ")}
                        </TableCell>
                        <TableCell>
                          {tx.transaction_type === "received" ? "Ish qabul qilindi 📥" : "To'lov qilindi 💸"}
                        </TableCell>
                        <TableCell>{tx.incoming_jobs?.job_name || "—"}</TableCell>
                        <TableCell>{tx.quantity ?? "—"}</TableCell>
                        <TableCell>
                          {tx.price_per_unit ? formatMoney(Number(tx.price_per_unit)) : "—"}
                        </TableCell>
                        <TableCell className="font-medium">{formatMoney(Number(tx.total_amount))}</TableCell>
                        <TableCell className="max-w-[150px] truncate">{tx.notes || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            )}
          </DialogContent>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>To'lov qo'shish</DialogTitle>
              <DialogDescription>{selectedEmployer?.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Joriy qarz</p>
                <p className="text-lg font-bold text-destructive">
                  {formatMoney(selectedEmployer?.balance || 0)}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Sana *</Label>
                <Input type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label>To'lov summasi *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Izoh</Label>
                <Textarea value={paymentNotes} onChange={(e) => setPaymentNotes(e.target.value)} rows={2} />
              </div>
              <Button type="submit" className="w-full">Saqlash</Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
};

export default Employers;
