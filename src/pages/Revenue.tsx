import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { TrendingUp, Wallet, UsersRound, Receipt } from "lucide-react";

interface RevenueJob {
  id: string;
  job_name: string;
  quantity: number;
  date: string;
  created_at: string;
  client_price_per_unit: number | null;
  worker_cost_per_unit: number | null;
}

const Revenue = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [jobs, setJobs] = useState<RevenueJob[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<RevenueJob | null>(null);
  const [clientPrice, setClientPrice] = useState("");
  const [workerCost, setWorkerCost] = useState("");

  const fetchJobs = useCallback(async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("incoming_jobs")
        .select("*")
        .order("date", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error) {
      console.error("Error fetching revenue data:", error);
      toast.error("Daromad ma'lumotlarini yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (profile?.role === "SEAMSTRESS") {
      navigate("/dashboard");
      return;
    }

    if (profile && (profile.role === "ADMIN" || profile.role === "MANAGER")) {
      fetchJobs();
    }
  }, [user, profile, loading, navigate, fetchJobs]);

  const handleEditClick = (job: RevenueJob) => {
    setEditingJob(job);
    setClientPrice(job.client_price_per_unit?.toString() || "");
    setWorkerCost(job.worker_cost_per_unit?.toString() || "");
    setIsDialogOpen(true);
  };

  const handleDialogChange = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  const resetForm = () => {
    setEditingJob(null);
    setClientPrice("");
    setWorkerCost("");
  };

  const handleSaveRates = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingJob) return;

    const clientValue = parseFloat(clientPrice) || 0;
    const workerValue = parseFloat(workerCost) || 0;

    try {
      const { error } = await supabase
        .from("incoming_jobs")
        .update({
          client_price_per_unit: clientValue,
          worker_cost_per_unit: workerValue,
        })
        .eq("id", editingJob.id);

      if (error) throw error;
      toast.success("Narxlar saqlandi");
      handleDialogChange(false);
      fetchJobs();
    } catch (error) {
      console.error("Failed to update revenue rates:", error);
      toast.error("Narxlarni saqlashda xatolik");
    }
  };

  const summary = useMemo(() => {
    return jobs.reduce(
      (acc, job) => {
        const quantity = job.quantity || 0;
        const clientRate = job.client_price_per_unit || 0;
        const workerRate = job.worker_cost_per_unit || 0;

        return {
          totalQuantity: acc.totalQuantity + quantity,
          totalRevenue: acc.totalRevenue + clientRate * quantity,
          totalWorkerCost: acc.totalWorkerCost + workerRate * quantity,
        };
      },
      { totalQuantity: 0, totalRevenue: 0, totalWorkerCost: 0 }
    );
  }, [jobs]);

  const adminProfit = summary.totalRevenue - summary.totalWorkerCost;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ").format(amount) + " so'm";
  };

  const renderContent = () => {
    if (isLoading || loading) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Yuklanmoqda...</p>
        </div>
      );
    }

    if (jobs.length === 0) {
      return (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg mb-2">Kelgan ishlar topilmadi</p>
            <p className="text-muted-foreground">
              Avval &quot;Kelgan ish&quot; bo'limida ma'lumot kiriting
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle>Daromad jadvali</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>Ish nomi</TableHead>
                <TableHead>Kelgan soni</TableHead>
                <TableHead>Mijoz narxi (dona)</TableHead>
                <TableHead>Ishchi xarajati (dona)</TableHead>
                <TableHead>Farq (dona)</TableHead>
                <TableHead>Admin foydasi</TableHead>
                <TableHead className="text-right">Amallar</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {jobs.map((job) => {
                const clientRate = job.client_price_per_unit || 0;
                const workerRate = job.worker_cost_per_unit || 0;
                const unitProfit = clientRate - workerRate;
                const totalProfit = unitProfit * job.quantity;

                return (
                  <TableRow key={job.id}>
                    <TableCell>
                      {new Date(job.date).toLocaleDateString("uz-UZ")}
                    </TableCell>
                    <TableCell className="font-medium">{job.job_name}</TableCell>
                    <TableCell>{job.quantity}</TableCell>
                    <TableCell>{formatCurrency(clientRate)}</TableCell>
                    <TableCell>{formatCurrency(workerRate)}</TableCell>
                    <TableCell>{formatCurrency(unitProfit)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(totalProfit)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEditClick(job)}
                      >
                        Narxni sozlash
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Daromad</h1>
            <p className="text-muted-foreground">
              Kelgan ishlar bo'yicha admin daromadi
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/incoming-jobs")}>
            Kelgan ishlar
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Kelgan ishlar</CardTitle>
              <UsersRound className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{summary.totalQuantity}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Jami tushum</CardTitle>
              <Receipt className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalRevenue)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ishchi xarajati</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.totalWorkerCost)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Admin foydasi</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(adminProfit)}</div>
            </CardContent>
          </Card>
        </div>

        {renderContent()}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingJob ? `${editingJob.job_name} uchun narxlar` : "Narxni sozlash"}
            </DialogTitle>
            <DialogDescription>
              Kelgan ish uchun qancha so'm olganingiz va ishchilarga qancha berilganini kiriting
            </DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleSaveRates}>
            <div className="space-y-2">
              <Label>Mijozdan olingan narx (1 dona)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={clientPrice}
                onChange={(event) => setClientPrice(event.target.value)}
                placeholder="0"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Ishchilarga to'langan (1 dona)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={workerCost}
                onChange={(event) => setWorkerCost(event.target.value)}
                placeholder="0"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={!editingJob}>
              Saqlash
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </Layout>
  );
};

export default Revenue;

