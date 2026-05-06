import { Users, Package, IndianRupee, AlertCircle, CheckCircle2, X } from "lucide-react";
import { motion } from "framer-motion";
import { BarChart, Bar, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";

const traffic = [
  { day: "Mon", orders: 240 }, { day: "Tue", orders: 320 }, { day: "Wed", orders: 280 },
  { day: "Thu", orders: 410 }, { day: "Fri", orders: 520 }, { day: "Sat", orders: 680 }, { day: "Sun", orders: 590 },
];
const split = [
  { name: "Vegetables", value: 42, color: "hsl(var(--primary))" },
  { name: "Fruits", value: 26, color: "hsl(var(--accent))" },
  { name: "Grains", value: 18, color: "hsl(110 35% 55%)" },
  { name: "Dairy", value: 14, color: "hsl(38 90% 65%)" },
];
const users = [
  { name: "Ravi Kumar", role: "Farmer", joined: "Mar 2026", status: "Verified" },
  { name: "Bistro & Co", role: "Buyer", joined: "Apr 2026", status: "Active" },
  { name: "Lakshmi Devi", role: "Farmer", joined: "Apr 2026", status: "Pending" },
  { name: "Anjali Rao", role: "Farmer", joined: "May 2026", status: "Verified" },
];
const queue = [
  { id: "M-101", farmer: "Mahesh Yadav", item: "Green Chillies", reason: "New listing review" },
  { id: "M-102", farmer: "Joseph T.", item: "Farm Eggs", reason: "Price flagged" },
];

const AdminDashboard = () => {
  const { user } = useAuth();
  return (
    <div className="container mx-auto px-6 py-8">
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Admin Console</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold">Welcome, {user?.name || "Admin"}</h1>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Users, label: "Total Users", value: "97,420", trend: "+8.2%" },
          { icon: Package, label: "Listings", value: "12,840", trend: "+312" },
          { icon: IndianRupee, label: "GMV (Month)", value: "₹4.2 Cr", trend: "+24%" },
          { icon: AlertCircle, label: "Open Disputes", value: "7", trend: "−3" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center"><s.icon className="text-primary" size={18} /></div>
              <span className="text-xs text-primary font-semibold">{s.trend}</span>
            </div>
            <p className="text-2xl font-bold mt-3">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold mb-4">Order Volume (7d)</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={traffic} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold mb-4">Category Mix</h2>
          <div className="h-64">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={split} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                  {split.map((s) => <Cell key={s.name} fill={s.color} />)}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold mb-4">Recent Users</h2>
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground uppercase border-b border-border">
              <tr><th className="text-left py-2">Name</th><th>Role</th><th>Joined</th><th className="text-right">Status</th></tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.name} className="border-b border-border last:border-0">
                  <td className="py-3 font-semibold">{u.name}</td>
                  <td className="text-center text-muted-foreground">{u.role}</td>
                  <td className="text-center text-muted-foreground">{u.joined}</td>
                  <td className="text-right">
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${u.status === "Verified" ? "bg-primary/10 text-primary" : u.status === "Active" ? "bg-accent/20 text-foreground" : "bg-muted text-muted-foreground"}`}>{u.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold mb-4">Moderation Queue</h2>
          <div className="space-y-3">
            {queue.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 bg-secondary/50 rounded-xl">
                <div>
                  <p className="font-semibold text-sm">{q.item}</p>
                  <p className="text-xs text-muted-foreground">{q.farmer} · {q.reason}</p>
                </div>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" className="text-primary"><CheckCircle2 size={16} /></Button>
                  <Button size="sm" variant="ghost" className="text-destructive"><X size={16} /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default AdminDashboard;
