import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/lib/auth";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Edit, Trash2, ChevronDown, ChevronUp, Scissors } from "lucide-react";
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
import { ScrollArea } from "@/components/ui/scroll-area";

interface OperationCategory {
  id: string;
  name: string;
  code_prefix: string;
  display_order: number;
  created_at: string;
  updated_at: string | null;
}

interface Operation {
  id: string;
  code?: string;
  name: string;
  default_price: number;
  unit: string;
  category_id?: string | null;
  created_at: string;
}

const Operations = () => {
  const navigate = useNavigate();
  const { user, profile, loading } = useAuth();
  const [categories, setCategories] = useState<OperationCategory[]>([]);
  const [uncategorizedOps, setUncategorizedOps] = useState<Operation[]>([]);
  const [categoryOps, setCategoryOps] = useState<Record<string, Operation[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<Record<string, boolean>>({});

  // Category Dialog state
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<OperationCategory | null>(null);
  const [categoryName, setCategoryName] = useState("");
  const [categoryPrefix, setCategoryPrefix] = useState("");

  // Operation Dialog state
  const [openOpDialog, setOpenOpDialog] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editingOperation, setEditingOperation] = useState<Operation | null>(null);
  const [opName, setOpName] = useState("");
  const [opPrice, setOpPrice] = useState("");
  const [opUnit, setOpUnit] = useState("dona");
  const [opCode, setOpCode] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (profile && (profile.role === 'ADMIN' || profile.role === 'MANAGER')) {
      fetchData();
    } else if (profile && profile.role === 'SEAMSTRESS') {
      navigate("/dashboard");
    }
  }, [user, profile, loading, navigate]);

  const fetchData = async () => {
    try {
      await Promise.all([fetchCategories(), fetchOperations()]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('operation_categories')
        .select('*')
        .order('display_order', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
      // Initialize expanded state for all categories
      const newExpanded: Record<string, boolean> = {};
      (data || []).forEach(cat => {
        newExpanded[cat.id] = true; // Expanded by default
      });
      setExpandedCategories(newExpanded);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error("Kategoriyalarni yuklashda xatolik");
    }
  };

  const fetchOperations = async () => {
    try {
      const { data, error } = await supabase
        .from('operations')
        .select('*')
        .order('code', { ascending: true, nullsFirst: true });

      if (error) throw error;

      const ops = data || [];

      // Separate categorized and uncategorized operations
      const grouped: Record<string, Operation[]> = {};
      const uncategorized: Operation[] = [];

      ops.forEach(op => {
        if (op.category_id) {
          if (!grouped[op.category_id]) {
            grouped[op.category_id] = [];
          }
          grouped[op.category_id].push(op);
        } else {
          uncategorized.push(op);
        }
      });

      setCategoryOps(grouped);
      setUncategorizedOps(uncategorized);
    } catch (error) {
      console.error('Error fetching operations:', error);
      toast.error("Operatsiyalarni yuklashda xatolik");
    }
  };

  const generateOperationCode = async (codePrefix: string, categoryId: string): Promise<string> => {
    try {
      // Get all operations for this category
      const { data, error } = await supabase
        .from('operations')
        .select('code')
        .eq('category_id', categoryId)
        .like('code', `${codePrefix}%`)
        .order('code', { ascending: false })
        .limit(1);

      if (error) throw error;

      let nextNumber = 1;
      if (data && data.length > 0) {
        const lastCode = data[0].code;
        const match = lastCode?.match(/\d+$/);
        if (match) {
          nextNumber = parseInt(match[0]) + 1;
        }
      }

      const paddedNumber = String(nextNumber).padStart(3, '0');
      return `${codePrefix}${paddedNumber}`;
    } catch (error) {
      console.error('Error generating code:', error);
      return `${codePrefix}001`;
    }
  };

  // Category Management Functions
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoryName.trim() || !categoryPrefix.trim()) {
      toast.error("Kategoriya nomi va koodi talab qilinadi");
      return;
    }

    try {
      if (editingCategory) {
        const { error } = await supabase
          .from('operation_categories')
          .update({
            name: categoryName,
            code_prefix: categoryPrefix,
          })
          .eq('id', editingCategory.id);

        if (error) throw error;
        toast.success("Kategoriya yangilandi");
      } else {
        const { error } = await supabase
          .from('operation_categories')
          .insert({
            name: categoryName,
            code_prefix: categoryPrefix.toLowerCase(),
            display_order: categories.length,
          });

        if (error) throw error;
        toast.success("Kategoriya yaratildi");
      }

      resetCategoryForm();
      setOpenCategoryDialog(false);
      fetchCategories();
    } catch (error: any) {
      console.error('Error saving category:', error);
      if (error.code === '23505') {
        toast.error("Bu kod allaqachon mavjud");
      } else {
        toast.error("Kategoriya saqlashda xatolik");
      }
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Kategoriya va uning barcha operatsiyalari o'chiriladi. Rostlaysizmi?")) return;

    try {
      const { error } = await supabase
        .from('operation_categories')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Kategoriya o'chirildi");
      fetchData();
    } catch (error: any) {
      console.error('Error deleting category:', error);
      toast.error("Kategoriya o'chirishda xatolik");
    }
  };

  const handleEditCategory = (category: OperationCategory) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryPrefix(category.code_prefix);
    setOpenCategoryDialog(true);
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryPrefix("");
    setEditingCategory(null);
  };

  // Operation Management Functions
  const handleOpenOpDialog = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);
    const category = categories.find(c => c.id === categoryId);
    if (category) {
      const code = await generateOperationCode(category.code_prefix, categoryId);
      setOpCode(code);
    }
    setOpenOpDialog(true);
  };

  const handleCreateOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opName.trim() || !selectedCategoryId) return;

    try {
      if (editingOperation) {
        const { error } = await supabase
          .from('operations')
          .update({
            name: opName,
            default_price: opPrice ? parseFloat(opPrice) : 0,
            unit: opUnit || 'dona',
          })
          .eq('id', editingOperation.id);

        if (error) throw error;
        toast.success("Operatsiya yangilandi");
      } else {
        const { error } = await supabase
          .from('operations')
          .insert({
            name: opName,
            code: opCode,
            default_price: opPrice ? parseFloat(opPrice) : 0,
            unit: opUnit || 'dona',
            category_id: selectedCategoryId,
          });

        if (error) throw error;
        toast.success("Operatsiya yaratildi");
      }

      resetOpForm();
      setOpenOpDialog(false);
      fetchOperations();
    } catch (error: any) {
      console.error('Error saving operation:', error);
      toast.error("Operatsiya saqlashda xatolik");
    }
  };

  const handleDeleteOperation = async (id: string) => {
    if (!confirm("Operatsiya o'chirilsinmi?")) return;

    try {
      const { error } = await supabase
        .from('operations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success("Operatsiya o'chirildi");
      fetchOperations();
    } catch (error: any) {
      console.error('Error deleting operation:', error);
      toast.error("Operatsiya o'chirishda xatolik");
    }
  };

  const handleEditOperation = async (operation: Operation) => {
    setEditingOperation(operation);
    setSelectedCategoryId(operation.category_id || null);
    setOpName(operation.name);
    setOpCode(operation.code || "");
    setOpPrice(operation.default_price.toString());
    setOpUnit(operation.unit);
    setOpenOpDialog(true);
  };

  const resetOpForm = () => {
    setOpName("");
    setOpPrice("");
    setOpUnit("dona");
    setOpCode("");
    setSelectedCategoryId(null);
    setEditingOperation(null);
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
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
            <p className="text-muted-foreground">Tikuv operatsiyalari va kategoriyalarini boshqarish</p>
          </div>
          <Dialog open={openCategoryDialog} onOpenChange={(isOpen) => {
            setOpenCategoryDialog(isOpen);
            if (!isOpen) resetCategoryForm();
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Yangi kategoriya
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingCategory ? "Kategoriyani tahrirlash" : "Yangi kategoriya yaratish"}</DialogTitle>
                <DialogDescription>
                  Operatsiyalar uchun yangi kategoriya qo'shing
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="cat-name">Kategoriya nomi *</Label>
                  <Input
                    id="cat-name"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    placeholder="Masalan: Uzun Ko'ylayk"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cat-prefix">Kod prefiksi *</Label>
                  <Input
                    id="cat-prefix"
                    value={categoryPrefix}
                    onChange={(e) => setCategoryPrefix(e.target.value.toLowerCase())}
                    placeholder="Masalan: uz"
                    required
                    maxLength={3}
                  />
                  <p className="text-xs text-muted-foreground">Misol: uz001, uz002, uz003...</p>
                </div>
                <Button type="submit" className="w-full">
                  {editingCategory ? "Yangilash" : "Yaratish"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Categories Grid */}
        {categories.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Scissors className="h-16 w-16 text-muted-foreground mb-4" />
              <p className="text-xl font-medium mb-2">Hozircha kategoriyalar yo'q</p>
              <p className="text-muted-foreground mb-4">Yangi kategoriya qo'shing va operatsiyalarni guruhlang</p>
              <Button onClick={() => setOpenCategoryDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Birinchi kategoriya yaratish
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categories.map((category) => (
              <Card key={category.id} className="flex flex-col">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription className="font-mono text-sm mt-1">
                        {category.code_prefix.toUpperCase()}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditCategory(category)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteCategory(category.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="secondary">
                      {(categoryOps[category.id] || []).length} operatsiya
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 space-y-3">
                  {categoryOps[category.id] && categoryOps[category.id].length > 0 ? (
                    <div className="space-y-2">
                      {expandedCategories[category.id] ? (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {categoryOps[category.id].map((op) => (
                            <div key={op.id} className="flex items-center justify-between text-sm p-2 bg-muted rounded">
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-xs text-muted-foreground">{op.code}</p>
                                <p className="truncate">{op.name}</p>
                                <p className="text-xs text-muted-foreground">{op.default_price.toLocaleString()} so'm</p>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() => handleEditOperation(op)}
                                >
                                  <Edit className="h-3 w-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 text-destructive"
                                  onClick={() => handleDeleteOperation(op.id)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground py-2">
                          {categoryOps[category.id].length} operatsiya mavjud
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => toggleCategory(category.id)}
                      >
                        {expandedCategories[category.id] ? (
                          <>
                            <ChevronUp className="h-4 w-4 mr-2" />
                            Yashir
                          </>
                        ) : (
                          <>
                            <ChevronDown className="h-4 w-4 mr-2" />
                            Ko'rsatish
                          </>
                        )}
                      </Button>
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Hozircha operatsiyalar yo'q
                    </p>
                  )}

                  <Dialog open={openOpDialog && selectedCategoryId === category.id} onOpenChange={(isOpen) => {
                    if (!isOpen) {
                      resetOpForm();
                    }
                    setOpenOpDialog(isOpen);
                  }}>
                    <DialogTrigger asChild>
                      <Button
                        variant="default"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenOpDialog(category.id)}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Operatsiya qo'shish
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{editingOperation ? "Operatsiyani tahrirlash" : "Yangi operatsiya"}</DialogTitle>
                        <DialogDescription>
                          {category.name} kategoriyasiga operatsiya qo'shing
                        </DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleCreateOperation} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="op-code">Kod</Label>
                          <Input
                            id="op-code"
                            value={opCode}
                            disabled
                            className="bg-muted"
                          />
                          <p className="text-xs text-muted-foreground">Kod avtomatik tuziladi</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="op-name">Operatsiya nomi *</Label>
                          <Input
                            id="op-name"
                            value={opName}
                            onChange={(e) => setOpName(e.target.value)}
                            placeholder="Masalan: sil"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="op-price">Standart narx (so'm)</Label>
                          <Input
                            id="op-price"
                            type="number"
                            value={opPrice}
                            onChange={(e) => setOpPrice(e.target.value)}
                            placeholder="5000"
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="op-unit">Birlik</Label>
                          <Input
                            id="op-unit"
                            value={opUnit}
                            onChange={(e) => setOpUnit(e.target.value)}
                            placeholder="dona"
                          />
                        </div>
                        <Button type="submit" className="w-full">
                          {editingOperation ? "Yangilash" : "Qo'shish"}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Uncategorized Operations Section */}
        {uncategorizedOps.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Kategoriyasiz operatsiyalar</CardTitle>
              <CardDescription>
                Eski tizimdagi operatsiyalar (kategoriyaga biriktirilmagan)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Kod</TableHead>
                      <TableHead>Nomi</TableHead>
                      <TableHead>Standart narx</TableHead>
                      <TableHead className="w-[100px]">Amallar</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {uncategorizedOps.map((op) => (
                      <TableRow key={op.id}>
                        <TableCell className="font-mono text-muted-foreground">
                          {op.code || '—'}
                        </TableCell>
                        <TableCell>{op.name}</TableCell>
                        <TableCell>{op.default_price.toLocaleString()} so'm</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => handleEditOperation(op)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive"
                              onClick={() => handleDeleteOperation(op.id)}
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
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Operations;
