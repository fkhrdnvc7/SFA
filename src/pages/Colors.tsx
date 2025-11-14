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

interface Color {
  id: string;
  name: string;
}

const Colors = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile } = useAuth();
  const [colors, setColors] = useState<Color[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newColorName, setNewColorName] = useState("");

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
      fetchColors();
    }
  }, [user, profile, navigate]);

  const fetchColors = async () => {
    try {
      const { data, error } = await supabase
        .from("colors")
        .select("*")
        .order("name");

      if (error) throw error;
      setColors(data || []);
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

  const handleCreateColor = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newColorName.trim()) {
      toast({
        title: "Xatolik",
        description: "Rang nomini kiriting",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("colors")
        .insert([{ name: newColorName.trim() }]);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli",
        description: "Rang qo'shildi",
      });

      setNewColorName("");
      setIsDialogOpen(false);
      fetchColors();
    } catch (error: any) {
      toast({
        title: "Xatolik",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteColor = async (id: string) => {
    if (!confirm("Ushbu rangni o'chirmoqchimisiz?")) return;

    try {
      const { error } = await supabase
        .from("colors")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Muvaffaqiyatli",
        description: "Rang o'chirildi",
      });

      fetchColors();
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
          <h1 className="text-3xl font-bold">Ranglar</h1>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Rang qo'shish
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Yangi rang qo'shish</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateColor} className="space-y-4">
                <div>
                  <Input
                    placeholder="Rang nomi"
                    value={newColorName}
                    onChange={(e) => setNewColorName(e.target.value)}
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

        {colors.length === 0 ? (
          <Card className="p-6 text-center">
            <p className="text-muted-foreground mb-4">Hozircha ranglar yo'q</p>
            <Button onClick={() => setIsDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Birinchi rangni qo'shing
            </Button>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rang nomi</TableHead>
                  <TableHead className="w-[100px]">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {colors.map((color) => (
                  <TableRow key={color.id}>
                    <TableCell>{color.name}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteColor(color.id)}
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

export default Colors;
