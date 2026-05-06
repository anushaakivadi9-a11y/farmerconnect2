import { Link } from "react-router-dom";
import { Heart, Package, Truck, CheckCircle2, MapPin } from "lucide-react";
import { motion } from "framer-motion";
import { products } from "@/data/mockData";
import ProductCard from "@/components/buyer/ProductCard";
import WeatherCard from "@/components/widgets/WeatherCard";
import { useAuth } from "@/context/AuthContext";

const orders = [
  { id: "ORD-2841", item: "Organic Tomatoes × 5kg", status: "Delivered", date: "2 days ago", step: 4 },
  { id: "ORD-2839", item: "Alphonso Mangoes × 2 dz", status: "Out for delivery", date: "Today", step: 3 },
  { id: "ORD-2837", item: "Basmati Rice × 10kg", status: "Packed", date: "Today", step: 2 },
];
const steps = ["Confirmed", "Packed", "Shipped", "Delivered"];

const BuyerDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Hello,</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold capitalize">{user?.name || "Buyer"} 👋</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        {[
          { icon: Package, label: "Active Orders", value: "3" },
          { icon: Heart, label: "Wishlist", value: "12" },
          { icon: Truck, label: "Delivered this month", value: "8" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-soft flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center"><s.icon className="text-primary" /></div>
            <div><p className="text-2xl font-bold">{s.value}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold mb-5">Order Tracking</h2>
          <div className="space-y-5">
            {orders.map((o) => (
              <div key={o.id} className="border border-border rounded-xl p-4">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-semibold">{o.item}</p>
                    <p className="text-xs text-muted-foreground">#{o.id} · {o.date}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${o.step === 4 ? "bg-primary/10 text-primary" : "bg-accent/20 text-foreground"}`}>{o.status}</span>
                </div>
                <div className="flex items-center gap-1 mt-4">
                  {steps.map((s, i) => (
                    <div key={s} className="flex-1 flex items-center gap-1">
                      <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold ${i < o.step ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground"}`}>
                        {i < o.step ? <CheckCircle2 size={14} /> : i + 1}
                      </div>
                      {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < o.step - 1 ? "bg-primary" : "bg-border"}`} />}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-muted-foreground">
                  {steps.map((s) => <span key={s}>{s}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
        <WeatherCard />
      </div>

      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-display text-2xl font-bold">Recommended for you</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1"><MapPin size={14} /> Based on your area</p>
        </div>
        <Link to="/products" className="text-sm font-semibold text-primary">View all →</Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {products.slice(0, 4).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};
export default BuyerDashboard;
