import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

interface Size {
  id: string;
  name: string;
}

const Sizes = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [sizes, setSizes] = useState<Size[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newSizeName, setNewSizeName] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (profile && profile.role !== "ADMIN" && profile.role !== "MANAGER") {
      navigate("/dashboard");
      return;
    }

    if (profile) {
      fetchSizes();
    }
  }, [user, profile, navigate]);

  const fetchSizes = async () => {
    try {
      const { data, error } = await supabase
        .from("sizes")
        .select("*")
        .order("name");

      if (error) throw error;
      setSizes(data || []);
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSize = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newSizeName.trim()) {
      toast({
        title: "Xatolik",
        description: "O'lcham nomini kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("sizes")
        .insert([{ name: newSizeName.trim() }]);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli",
        description: "O'lcham qo'shildi",
      });

      setNewSizeName("");
      setIsDialogOpen(false);
      fetchSizes();
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteSize = async (id: string) => {
    if (!confirm("Ushbu o'lchamni o'chirmoqchimisiz?")) return;

    try {
      const { error } = await supabase
        .from("sizes")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli",
        description: "O'lcham o'chirildi",
      });

      fetchSizes();
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
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
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">O'lchamlar</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                O'lcham qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi o'lcham qo'shish</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateSize} className="space-y-4">
                <div>
                  <Input
                    placeholder="O'lcham nomi"
                    value={newSizeName}
                    onChange={(e) => setNewSizeName(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">
                  Qo'shish
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {sizes.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Hozircha o'lchamlar yo'q</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Birinchi o'lchamni qo'shing
            </Button>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>O'lcham nomi</TableHead>
                  <TableHead className="w-[100px]">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sizes.map((size) => (
                  <TableRow key={size.id}>
                    <TableCell>{size.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSize(size.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Sizes;
