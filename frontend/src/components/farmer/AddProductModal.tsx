import { useState, useRef, useCallback } from "react";
import { X, Upload, ImagePlus, Loader2, CheckCircle2, IndianRupee, Package, Tag, FileText, Layers, Ruler } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";


const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const API = axios.create({ baseURL: `${import.meta.env.VITE_API_URL}/api` });

const CATEGORIES = ["vegetables", "fruits", "grains", "dairy", "organic", "others"] as const;
const UNITS = ["kg", "g", "litre", "ml", "piece", "dozen", "bunch", "quintal", "tonne"] as const;

interface ProductDraft {
  name: string;
  description: string;
  price: string;
  stock: string;
  category: string;
  unit: string;
  imageUrl: string;
}

interface Props {
  onClose: () => void;
  onSuccess: (product: any) => void;
}

export default function AddProductModal({ onClose, onSuccess }: Props) {
  const [draft, setDraft] = useState<ProductDraft>({
    name: "", description: "", price: "", stock: "",
    category: "vegetables", unit: "kg", imageUrl: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const set = (k: keyof ProductDraft, v: string) => setDraft(p => ({ ...p, [k]: v }));

  // Handle image file selection
  const handleImage = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return toast.error("Please select an image file");
    if (file.size > 5 * 1024 * 1024) return toast.error("Image must be under 5MB");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }, []);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleImage(file);
  };

  // Upload to Cloudinary directly from frontend
  const uploadToCloudinary = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
    formData.append("folder", "farmconnect/products");

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: formData }
    );
    if (!res.ok) throw new Error("Image upload failed");
    const data = await res.json();
    return data.secure_url;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name || !draft.description || !draft.price || !draft.stock) {
      return toast.error("Please fill all required fields");
    }
    if (!imageFile && !draft.imageUrl) {
      return toast.error("Please upload a product image");
    }

    try {
      setSubmitting(true);
      let imageUrl = draft.imageUrl;

      // Upload image if a new file was selected
      if (imageFile) {
        setUploading(true);
        imageUrl = await uploadToCloudinary(imageFile);
        setUploading(false);
      }

      const token = localStorage.getItem("fc_token");
      const response = await API.post(
        "/products",
        {
          name: draft.name,
          description: draft.description,
          price: Number(draft.price),
          stock: Number(draft.stock),
          category: draft.category,
          unit: draft.unit,
          imageUrl,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success("Product listed successfully! 🌱");
      onSuccess(response.data.data);
      onClose();
    } catch (err: any) {
      setUploading(false);
      toast.error(err?.response?.data?.message || "Failed to create product");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-card border border-border rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border sticky top-0 bg-card z-10">
          <div>
            <h2 className="font-display text-xl font-bold">List New Product</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the details to list your produce</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-secondary rounded-xl transition-colors">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">

          {/* Image Upload */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
              <ImagePlus size={15} className="text-primary" /> Product Photo <span className="text-destructive">*</span>
            </label>
            <div
              className={`relative border-2 border-dashed rounded-2xl transition-all cursor-pointer overflow-hidden
                ${dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-secondary/50"}
                ${imagePreview ? "h-48" : "h-36"}`}
              onClick={() => fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
            >
              {imagePreview ? (
                <>
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-semibold">Click to change</p>
                  </div>
                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <Upload size={24} />
                  <p className="text-sm font-medium">Drop image here or <span className="text-primary">browse</span></p>
                  <p className="text-xs">JPG, PNG, WEBP · Max 5MB</p>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleImage(e.target.files[0])}
              />
            </div>
          </div>

          {/* Name + Category */}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Tag size={14} className="text-primary" /> Product Name <span className="text-destructive">*</span>
              </label>
              <input
                value={draft.name}
                onChange={(e) => set("name", e.target.value)}
                placeholder="e.g. Organic Tomatoes"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Layers size={14} className="text-primary" /> Category <span className="text-destructive">*</span>
              </label>
              <select
                value={draft.category}
                onChange={(e) => set("category", e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all capitalize"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c} className="capitalize">{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
              <FileText size={14} className="text-primary" /> Description <span className="text-destructive">*</span>
            </label>
            <textarea
              value={draft.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Describe your produce — freshness, variety, farming method, harvest date..."
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all resize-none"
            />
          </div>

          {/* Price + Unit + Stock */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                <IndianRupee size={14} className="text-primary" /> Price <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">₹</span>
                <input
                  type="number"
                  min="0"
                  value={draft.price}
                  onChange={(e) => set("price", e.target.value)}
                  placeholder="0"
                  className="w-full bg-secondary border border-border rounded-xl pl-7 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Ruler size={14} className="text-primary" /> Unit
              </label>
              <select
                value={draft.unit}
                onChange={(e) => set("unit", e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              >
                {UNITS.map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                <Package size={14} className="text-primary" /> Stock <span className="text-destructive">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={draft.stock}
                onChange={(e) => set("stock", e.target.value)}
                placeholder="0"
                className="w-full bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
              />
            </div>
          </div>

          {/* Price preview */}
          {draft.price && draft.unit && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl px-4 py-3 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Listed as</span>
              <span className="font-bold text-primary text-lg">₹{draft.price} / {draft.unit}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl"
            >
              {submitting ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={16} className="animate-spin" />
                  {uploading ? "Uploading image..." : "Listing product..."}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <CheckCircle2 size={16} />
                  List Product
                </span>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}