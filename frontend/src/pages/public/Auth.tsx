import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sprout, ShoppingBag, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import type { Role } from "@/data/mockData";
import { toast } from "sonner";

const roles: { id: Role; label: string; desc: string; icon: any }[] = [
  { id: "farmer", label: "Farmer", desc: "Sell your produce directly", icon: Sprout },
  { id: "buyer", label: "Buyer", desc: "Source fresh from the farm", icon: ShoppingBag },
  { id: "admin", label: "Admin", desc: "Manage the platform", icon: Shield },
];

const AuthLayout = ({ mode }: { mode: "login" | "register" }) => {
  const [role, setRole] = useState<Role>("buyer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const nav = useNavigate();

  const { login, register, user } = useAuth();  // ← also destructure register

  // Redirect after user is set in context
    useEffect(() => {
  // Only redirect on LOGIN page
  if (user && mode === "login") {
    nav(`/${user.role}`);
  }
}, [user, mode]);
    
    
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !pw) return toast.error("Please fill all fields");
    if (mode === "register" && !name) return toast.error("Name is required");
    try {
      if (mode === "login") {
        await login(email, pw);         // login sets user in context
      } else {
        await register(name, email, pw, role);
      }
      toast.success(mode === "login" ? "Welcome back!" : "Account created!");
      // ❌ Don't use local `role` state — read from auth context after login
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Auth failed");
    }
  };

  return (
    
  <div className="min-h-[calc(100vh-4rem)] grid lg:grid-cols-2">
    <div className="hidden lg:flex bg-hero-gradient text-primary-foreground p-12 flex-col justify-between relative overflow-hidden">
      <div>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-accent grid place-items-center"><Sprout className="text-accent-foreground" size={22} /></div>
          <span className="font-display text-2xl font-extrabold">FarmConnect</span>
        </div>
      </div>
      <div className="relative">
        <h2 className="font-display text-5xl font-extrabold leading-tight">Grow more.<br />Earn more.<br /><span className="text-accent">Together.</span></h2>
        <p className="mt-5 text-primary-foreground/80 max-w-md">Join thousands of farmers and buyers building a fairer food system.</p>
      </div>
      <p className="text-xs text-primary-foreground/60 relative">© 2026 FarmConnect</p>
    </div>

    <div className="flex items-center justify-center p-6 sm:p-12">
      <div className="w-full max-w-md">
        <h1 className="font-display text-3xl font-bold mb-2">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="text-muted-foreground text-sm mb-7">
          {mode === "login" ? "Log in to continue to FarmConnect." : "Pick your role and get started in seconds."}
        </p>

        <div className="grid grid-cols-3 gap-2 mb-6">
          {roles.map((r) => (
            <button key={r.id} type="button" onClick={() => setRole(r.id)}
              className={`p-3 rounded-xl border text-left transition-all ${role === r.id ? "border-primary bg-primary/5 shadow-soft" : "border-border hover:border-primary/40"}`}>
              <r.icon size={18} className={role === r.id ? "text-primary" : "text-muted-foreground"} />
              <p className="font-semibold text-sm mt-2">{r.label}</p>
              <p className="text-[11px] text-muted-foreground leading-tight mt-0.5">{r.desc}</p>
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">
          {mode === "register" && (
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name"
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          )}
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email address" required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Password" required
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40" />
          <Button type="submit" size="lg" className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
            {mode === "login" ? "Log in" : "Create account"}
          </Button>
        </form>

        <p className="text-sm text-muted-foreground mt-6 text-center">
          {mode === "login" ? (
            <>New here? <Link to="/register" className="text-primary font-semibold">Create an account</Link></>
          ) : (
            <>Already have one? <Link to="/login" className="text-primary font-semibold">Log in</Link></>
          )}
        </p>
      </div>
    </div>
  </div>
  );
};

export const Login = () => <AuthLayout mode="login" />;
export const Register = () => <AuthLayout mode="register" />;
