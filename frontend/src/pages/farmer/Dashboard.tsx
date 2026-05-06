import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Edit2, Trash2, IndianRupee, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { products as seed, earningsTrend, type Product } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";
import MarketPriceCard from "@/components/farmer/MarketPriceCard";
import WeatherCard from "@/components/widgets/WeatherCard";
import PricePredictionChart from "@/components/widgets/PricePredictionChart";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import AddProductModal from "@/components/farmer/AddProductModal";

const stats = [
  { label: "Total Earnings", value: "₹1,52,400", icon: IndianRupee, change: "+12.4%" },
  { label: "Active Listings", value: "8", icon: Package, change: "+2 new" },
  { label: "Orders this Month", value: "47", icon: ShoppingBag, change: "+18%" },
  { label: "Avg. Rating", value: "4.8★", icon: TrendingUp, change: "↑ 0.2" },
];

const FarmerDashboard = () => {
  const { user } = useAuth();
  const [list, setList] = useState<Product[]>(seed.slice(0, 5));
  const [show, setShow] = useState(false);
  const [draft, setDraft] = useState({ name: "", price: "", stock: "", category: "Vegetables", unit: "kg" });
  const [showModal, setShowModal] = useState(false);

  const addProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name || !draft.price) return;
    const p: Product = {
      id: `n${Date.now()}`, name: draft.name, category: draft.category,
      price: +draft.price, unit: draft.unit, stock: +draft.stock || 0,
      farmer: user?.name || "You", location: "Your Farm",
      image: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=70",
      rating: 5, organic: true,
    };
    setList([p, ...list]);
    setDraft({ name: "", price: "", stock: "", category: "Vegetables", unit: "kg" });
    setShow(false);
    toast.success("Product listed");
  };

  return (
    <div className="container mx-auto px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold capitalize">{user?.name || "Farmer"} 🌱</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center"><s.icon className="text-primary" size={18} /></div>
              <span className="text-xs text-primary font-semibold">{s.change}</span>
            </div>
            <p className="text-2xl font-bold mt-3">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {show && (
        <form onSubmit={addProduct} className="bg-card border border-border rounded-2xl p-6 mb-6 grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <input placeholder="Product name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none" />
          <select value={draft.category} onChange={(e) => setDraft({ ...draft, category: e.target.value })} className="bg-secondary rounded-lg px-3 py-2.5 text-sm">
            {["Vegetables", "Fruits", "Grains", "Dairy & More", "Pantry"].map((c) => <option key={c}>{c}</option>)}
          </select>
          <input placeholder="Price ₹" type="number" value={draft.price} onChange={(e) => setDraft({ ...draft, price: e.target.value })} className="bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none" />
          <input placeholder="Stock" type="number" value={draft.stock} onChange={(e) => setDraft({ ...draft, stock: e.target.value })} className="bg-secondary rounded-lg px-3 py-2.5 text-sm outline-none" />
          <Button type="submit" className="bg-primary text-primary-foreground">List Product</Button>
        </form>
      )}

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onSuccess={(product) => {
            setList(prev => [product, ...prev]);
          }}
        />
      )}
      
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold mb-4">My Products</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                  <tr><th className="text-left py-3">Product</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
                </thead>
                <tbody>
                  {list.map((p) => (
                    <tr key={p.id} className="border-b border-border last:border-0">
                      <td className="py-3 flex items-center gap-3"><img src={p.image} alt="" className="w-10 h-10 rounded-lg object-cover" /><span className="font-semibold">{p.name}</span></td>
                      <td className="text-center text-muted-foreground">{p.category}</td>
                      <td className="text-center font-semibold">₹{p.price}/{p.unit}</td>
                      <td className="text-center">{p.stock}</td>
                      <td className="text-right">
                        <button className="p-2 hover:bg-secondary rounded-lg"><Edit2 size={14} /></button>
                        <button onClick={() => { setList(list.filter((x) => x.id !== p.id)); toast.success("Removed"); }} className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg"><Trash2 size={14} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold mb-4">Earnings Trend</h2>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={earningsTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <PricePredictionChart />
        </div>

        <div className="space-y-6">
          <WeatherCard />
          <MarketPriceCard />
        </div>
      </div>
    </div>
  );
};
export default FarmerDashboard;
