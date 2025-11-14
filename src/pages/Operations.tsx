import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Scissors } from "lucide-react";
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
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Operation {
  id: string;
  code?: string;
  name: string;
  default_price: number;
  unit: string;
}

const Operations = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [operations, setOperations] = useState<Operation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [open, setOpen] = useState(false);
  
  // Form state
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [defaultPrice, setDefaultPrice] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchOperations();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('operations')
        .select('*')
        .order('name');

      if (error) throw error;
      setOperations(data || []);
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error("Operatsiyalarni yuklashda xatolik");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      const { error } = await supabase
        .from('operations')
        .insert({
          name: name,
          code: code || null,
          default_price: defaultPrice ? parseFloat(defaultPrice) : 0,
        });

      if (error) throw error;

      toast.success("Operatsiya muvaffaqiyatli yaratildi");
      setName("");
      setCode("");
      setDefaultPrice("");
      setOpen(false);
      fetchOperations();
    } catch (error: any) {
      console.error('Error creating operation:', error);
      toast.error("Operatsiya yaratishda xatolik");
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
            <h1 className="text-3xl font-bold">Operatsiyalar</h1>
            <p className="text-muted-foreground">Tikuv operatsiyalarini boshqarish</p>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi operatsiya
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi operatsiya yaratish</DialogTitle>
                <DialogDescription>
                  Yangi tikuv operatsiyasi qo'shing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateOperation} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Operatsiya nomi *</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Masalan: йелка а/в"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="code">Kod</Label>
                  <Input
                    id="code"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    placeholder="Masalan: op001"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Standart narx (so'm)</Label>
                  <Input
                    id="price"
                    type="number"
                    value={defaultPrice}
                    onChange={(e) => setDefaultPrice(e.target.value)}
                    placeholder="5000"
                    step="0.01"
                  />
                </div>
                <Button type="submit" className="w-full">
                  Yaratish
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {operations.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium mb-2">Hozircha operatsiyalar yo'q</p>
              <p className="text-muted-foreground mb-4">Yangi operatsiya qo'shing</p>
              <Button onClick={() => setOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Birinchi operatsiya yaratish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Barcha operatsiyalar</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Kod</TableHead>
                    <TableHead>Nomi</TableHead>
                    <TableHead>Standart narx</TableHead>
                    <TableHead>Birlik</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {operations.map((operation) => (
                    <TableRow key={operation.id}>
                      <TableCell className="font-mono text-muted-foreground">
                        {operation.code || '—'}
                      </TableCell>
                      <TableCell className="font-medium">{operation.name}</TableCell>
                      <TableCell>{operation.default_price.toLocaleString()} so'm</TableCell>
                      <TableCell>{operation.unit}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Operations;
