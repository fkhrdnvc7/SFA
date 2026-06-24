import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Building2, DollarSign, TrendingDown, TrendingUp, Eye, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

interface EmployerFinanceRow {
  id: string;
  name: string;
  phone: string | null;
  totalReceived: number;
  totalPaid: number;
  totalQuantity: number;
  avgPrice: number;
  balance: number;
}

const formatMoney = (amount: number) =>
  `${amount.toLocaleString("uz-UZ")} so'm`;

const EmployerFinance = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [rows, setRows] = useState<EmployerFinanceRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [paymentOpen, setPaymentOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState<EmployerFinanceRow | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [paymentNotes, setPaymentNotes] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && profile.role === "ADMIN") {
      fetchData();
    } else if (profile) {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate, dateFrom, dateTo]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      let txQuery = supabase
        .from("employer_transactions")
        .select("employer_id, transaction_type, total_amount, quantity, price_per_unit, transaction_date");

      if (dateFrom) txQuery = txQuery.gte("transaction_date", dateFrom);
      if (dateTo) txQuery = txQuery.lte("transaction_date", dateTo);

      const [{ data: employers, error: empError }, { data: txData, error: txError }] =
        await Promise.all([
          supabase.from("employers").select("id, name, phone").order("name"),
          txQuery,
        ]);

      if (empError) throw empError;
      if (txError) throw txError;

      const statsMap = new Map<
        string,
        { received: number; paid: number; quantity: number; totalPrice: number }
      >();

      (txData || []).forEach((tx) => {
        const current = statsMap.get(tx.employer_id) || {
          received: 0,
          paid: 0,
          quantity: 0,
          totalPrice: 0,
        };
        if (tx.transaction_type === "received") {
          current.received += Number(tx.total_amount) || 0;
          current.quantity += Number(tx.quantity) || 0;
          current.totalPrice += Number(tx.total_amount) || 0;
        } else if (tx.transaction_type === "payment") {
          current.paid += Number(tx.total_amount) || 0;
        }
        statsMap.set(tx.employer_id, current);
      });

      const result: EmployerFinanceRow[] = (employers || []).map((emp) => {
        const stats = statsMap.get(emp.id) || { received: 0, paid: 0, quantity: 0, totalPrice: 0 };
        return {
          id: emp.id,
          name: emp.name,
          phone: emp.phone,
          totalReceived: stats.received,
          totalPaid: stats.paid,
          totalQuantity: stats.quantity,
          avgPrice: stats.quantity > 0 ? stats.totalPrice / stats.quantity : 0,
          balance: stats.received - stats.paid,
        };
      });

      setRows(result);
    } catch {
      toast.error("Ma'lumotlarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const summary = useMemo(() => {
    return {
      totalEmployers: rows.length,
      totalReceived: rows.reduce((s, r) => s + r.totalReceived, 0),
      totalPaid: rows.reduce((s, r) => s + r.totalPaid, 0),
      totalDebt: rows.reduce((s, r) => s + r.balance, 0),
    };
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!search.trim()) return rows;
    const q = search.toLowerCase();
    return rows.filter(
      (r) => r.name.toLowerCase().includes(q) || (r.phone || "").includes(q),
    );
  }, [rows, search]);

  const openPayment = (row: EmployerFinanceRow) => {
    setSelectedRow(row);
    setPaymentAmount("");
    setPaymentDate(new Date().toISOString().split("T")[0]);
    setPaymentNotes("");
    setPaymentOpen(true);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRow || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast.error("To'g'ri summa kiriting");
      return;
    }

    try {
      const { error } = await supabase.from("employer_transactions").insert({
        employer_id: selectedRow.id,
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
        body: `${selectedRow.name} ga ${formatMoney(amount)} to'landi`,
        type: "success",
        related_table: "employer_transactions",
      });

      toast.success("To'lov saqlandi");
      setPaymentOpen(false);
      fetchData();
    } catch {
      toast.error("To'lov saqlashda xatolik");
    }
  };

  if (loading || isLoading) {
    return (
      <Layout>
        <div className="space-y-4">
          <Skeleton className="h-10 w-64" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-24" />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Ish olish hisobi</h1>
          <p className="text-muted-foreground">Ish beruvchilar bo'yicha moliyaviy hisobot</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami ish beruvchilar</CardTitle>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{summary.totalEmployers} ta</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami qabul qilingan</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMoney(summary.totalReceived)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami to'langan</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{formatMoney(summary.totalPaid)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami qolgan qarz</CardTitle>
              <TrendingDown className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-destructive">{formatMoney(summary.totalDebt)}</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <CardTitle>Ish beruvchilar jadvali</CardTitle>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    className="pl-8 w-full sm:w-48"
                    placeholder="Qidiruv..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
                <Input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full sm:w-36"
                  placeholder="Dan"
                />
                <Input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full sm:w-36"
                  placeholder="Gacha"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[500px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Ism</TableHead>
                    <TableHead>Tel</TableHead>
                    <TableHead>Jami olindi</TableHead>
                    <TableHead>Jami berildi</TableHead>
                    <TableHead>Qanchadan</TableHead>
                    <TableHead>Qolgan qarz</TableHead>
                    <TableHead className="text-right">Amallar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRows.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell>{row.phone || "—"}</TableCell>
                      <TableCell>{formatMoney(row.totalReceived)}</TableCell>
                      <TableCell>{formatMoney(row.totalPaid)}</TableCell>
                      <TableCell>
                        {row.avgPrice > 0 ? formatMoney(row.avgPrice) : "—"}
                      </TableCell>
                      <TableCell className={row.balance > 0 ? "font-semibold text-destructive" : ""}>
                        {formatMoney(row.balance)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/employers`)}
                          >
                            <Eye className="mr-1 h-4 w-4" />
                            Ko'rish
                          </Button>
                          <Button size="sm" onClick={() => openPayment(row)}>
                            <DollarSign className="mr-1 h-4 w-4" />
                            To'lov
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>

        <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>To'lov qilish</DialogTitle>
              <DialogDescription>{selectedRow?.name}</DialogDescription>
            </DialogHeader>
            <form onSubmit={handlePayment} className="space-y-4">
              <div className="space-y-2">
                <Label>Ish beruvchi</Label>
                <Input value={selectedRow?.name || ""} readOnly />
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-sm text-muted-foreground">Joriy qarz</p>
                <p className="text-lg font-bold text-destructive">
                  {formatMoney(selectedRow?.balance || 0)}
                </p>
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
                <Label>Sana *</Label>
                <Input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
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

export default EmployerFinance;
