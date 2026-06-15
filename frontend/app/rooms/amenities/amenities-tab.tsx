"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Plus, Pencil, Trash2, Wifi, Tv, Wind, Wine, Fence, 
  UtensilsCrossed, Sofa, Bath, Lock, Coffee, Shirt
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Amenity } from "@/lib/types";

// Ánh xạ tất cả icon tiện nghi cục bộ cho tab Tiện nghi
const amenityIcons: Record<string, React.ElementType> = { 
  Wifi, 
  Tv, 
  Wind, 
  Wine, 
  Fence, 
  UtensilsCrossed, 
  Sofa, 
  Bath, 
  Lock, 
  Coffee, 
  Shirt 
};

interface AmenitiesTabProps {
  amenities: Amenity[];
  categories: readonly string[];
  onSave: (amenity: Amenity) => void;
  onDelete: (id: string) => void;
}

export function AmenitiesTab({ amenities, categories, onSave, onDelete }: AmenitiesTabProps) {
  // State Dialog và Form cục bộ
  const [isOpen, setIsOpen] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState<Amenity | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("COMFORT");
  const [icon, setIcon] = useState("Wifi");

  const handleAdd = () => {
    setEditingAmenity(null);
    setName("");
    setCategory("COMFORT");
    setIcon("Wifi");
    setIsOpen(true);
  };

  const handleEdit = (a: Amenity) => {
    setEditingAmenity(a);
    setName(a.name);
    setCategory(a.category);
    setIcon(a.icon);
    setIsOpen(true);
  };

  const handleSave = () => {
    if (!name.trim()) {
      alert("Vui lòng nhập tên tiện nghi!");
      return;
    }

    const data: Amenity = {
      id: editingAmenity?.id || "a-" + Math.random().toString(36).substr(2, 9),
      name: name.trim(),
      category: category as any,
      icon
    };

    onSave(data);
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm("Bạn có chắc chắn muốn xóa tiện nghi này không?")) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold uppercase tracking-wider">Quản lý tiện nghi</h2>
        <Button onClick={handleAdd} className="bg-primary">
          <Plus className="mr-2 size-4" /> Thêm tiện nghi
        </Button>
      </div>

      <div className="grid gap-6">
        {categories.map((category) => {
          const catItems = amenities.filter(a => a.category === category);
          if (catItems.length === 0) return null;
          
          const categoryNameVi = 
            category === "COMFORT" ? "Tiện nghi phòng" :
            category === "ENTERTAINMENT" ? "Giải trí" :
            category === "BATHROOM" ? "Phòng tắm" :
            category === "KITCHEN" ? "Nhà bếp" : 
            category === "OUTDOOR" ? "Ngoài trời" : category;

          return (
            <Card key={category} className="shadow-sm">
              <CardHeader className="bg-muted/30 py-3">
                <CardTitle className="text-sm font-bold text-muted-foreground uppercase">
                  {categoryNameVi}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 p-4">
                {catItems.map((amenity) => {
                  const Icon = amenityIcons[amenity.icon] || Wifi;
                  return (
                    <div key={amenity.id} className="group flex items-center justify-between border p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3">
                        <Icon className="size-4 text-primary" />
                        <span className="font-medium text-sm">{amenity.name}</span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleEdit(amenity)}>
                          <Pencil className="size-3.5 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive" onClick={() => handleDelete(amenity.id)}>
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* --- DIALOG THÊM / SỬA TIỆN NGHI NỘI BỘ --- */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {editingAmenity ? `Chỉnh sửa tiện nghi: ${editingAmenity.name}` : "Thêm tiện nghi mới"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4 text-left">
            <div className="space-y-2">
              <Label className="font-semibold">Tên tiện nghi *</Label>
              <Input 
                placeholder="Ví dụ: Lò vi sóng" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Danh mục tiện nghi *</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue placeholder="Chọn danh mục" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="COMFORT">Tiện nghi phòng (Comfort)</SelectItem>
                  <SelectItem value="ENTERTAINMENT">Giải trí (Entertainment)</SelectItem>
                  <SelectItem value="BATHROOM">Phòng tắm (Bathroom)</SelectItem>
                  <SelectItem value="KITCHEN">Nhà bếp (Kitchen)</SelectItem>
                  <SelectItem value="OUTDOOR">Ngoài trời (Outdoor)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold">Chọn Icon *</Label>
              <Select value={icon} onValueChange={setIcon}>
                <SelectTrigger>
                  <SelectValue placeholder="Chọn icon" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(amenityIcons).map((key) => {
                    const IconComp = amenityIcons[key];
                    return (
                      <SelectItem key={key} value={key}>
                        <span className="flex items-center gap-2">
                          <IconComp className="size-4 text-primary" />
                          {key}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>Hủy</Button>
            <Button onClick={handleSave} className="px-6">Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
