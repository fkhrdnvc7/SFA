import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, X, Download } from "lucide-react";
import { toast } from "sonner";

export interface JobFilters {
  searchTerm: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  priceMin: string;
  priceMax: string;
}

interface EmployerJobFiltersProps {
  filters: JobFilters;
  onFiltersChange: (filters: JobFilters) => void;
  onExport?: (format: 'excel' | 'pdf') => void;
  showExport?: boolean;
}

const EmployerJobFilters = ({ filters, onFiltersChange, onExport, showExport = true }: EmployerJobFiltersProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleChange = (key: keyof JobFilters, value: string) => {
    onFiltersChange({ ...filters, [key]: value });
  };

  const handleReset = () => {
    onFiltersChange({
      searchTerm: "",
      status: "all",
      dateFrom: "",
      dateTo: "",
      priceMin: "",
      priceMax: "",
    });
  };

  const hasActiveFilters =
    filters.searchTerm ||
    filters.status !== 'all' ||
    filters.dateFrom ||
    filters.dateTo ||
    filters.priceMin ||
    filters.priceMax;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Search and Quick Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ish nomini qidirish..."
                value={filters.searchTerm}
                onChange={(e) => handleChange('searchTerm', e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filters.status} onValueChange={(v) => handleChange('status', v)}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Barchasi</SelectItem>
                <SelectItem value="pending">Kutilmoqda</SelectItem>
                <SelectItem value="approved">Tasdiqlangan</SelectItem>
                <SelectItem value="rejected">Rad etilgan</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant="outline"
              onClick={() => setIsExpanded(!isExpanded)}
              className="w-full sm:w-auto"
            >
              <Filter className="h-4 w-4 mr-2" />
              {isExpanded ? 'Yashirish' : 'Ko\'proq filterlar'}
            </Button>
          </div>

          {/* Advanced Filters */}
          {isExpanded && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <Label htmlFor="dateFrom">Sanadan</Label>
                <Input
                  id="dateFrom"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleChange('dateFrom', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="dateTo">Sanagacha</Label>
                <Input
                  id="dateTo"
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleChange('dateTo', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="priceMin">Min narx</Label>
                <Input
                  id="priceMin"
                  type="number"
                  placeholder="0"
                  value={filters.priceMin}
                  onChange={(e) => handleChange('priceMin', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="priceMax">Max narx</Label>
                <Input
                  id="priceMax"
                  type="number"
                  placeholder="999999"
                  value={filters.priceMax}
                  onChange={(e) => handleChange('priceMax', e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 items-center justify-between pt-2">
            <div>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4 mr-2" />
                  Filterlarni tozalash
                </Button>
              )}
            </div>
            {showExport && onExport && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onExport('excel');
                    toast.success("Excel faylga eksport qilindi");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onExport('pdf');
                    toast.success("PDF faylga eksport qilindi");
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmployerJobFilters;
