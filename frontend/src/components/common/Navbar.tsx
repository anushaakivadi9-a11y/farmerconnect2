import { Link, NavLink, useNavigate } from "react-router-dom";
import { Sprout, ShoppingCart, Menu, X, LogOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();

  const dashHref = user ? `/${user.role}` : "/login";

  const links = [
    { to: "/", label: "Home" },
    { to: "/products", label: "Marketplace" },
    { to: "/about", label: "About" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-background/85 backdrop-blur-xl border-b border-border">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-hero-gradient grid place-items-center shadow-soft">
            <Sprout className="text-primary-foreground" size={20} />
          </div>
          <span className="font-display font-extrabold text-xl text-foreground">FarmConnect</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                `text-sm font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`
              }
              end={l.to === "/"}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-2">
          <Link to="/cart" className="relative p-2 rounded-lg hover:bg-secondary transition-colors">
            <ShoppingCart size={20} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-accent-foreground text-[10px] font-bold rounded-full w-5 h-5 grid place-items-center">{count}</span>
            )}
          </Link>
          {user ? (
            <>
              <Button variant="ghost" size="sm" onClick={() => nav(dashHref)}>
                {user.name} · <span className="text-primary capitalize ml-1">{user.role}</span>
              </Button>
              <Button variant="outline" size="sm" onClick={() => { logout(); nav("/"); }}>
                <LogOut size={14} />
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" size="sm" asChild><Link to="/login">Log in</Link></Button>
              <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}
        </div>

        <button className="md:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-background px-6 py-4 space-y-3">
          {links.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block text-sm font-medium">{l.label}</Link>
          ))}
          <Link to="/cart" onClick={() => setOpen(false)} className="block text-sm font-medium">Cart ({count})</Link>
          {user ? (
            <>
              <Link to={dashHref} onClick={() => setOpen(false)} className="block text-sm font-medium text-primary">My Dashboard</Link>
              <button onClick={() => { logout(); setOpen(false); nav("/"); }} className="text-sm">Log out</button>
            </>
          ) : (
            <div className="flex gap-2 pt-2">
              <Button variant="outline" size="sm" asChild className="flex-1"><Link to="/login">Log in</Link></Button>
              <Button size="sm" className="flex-1 bg-primary text-primary-foreground" asChild><Link to="/register">Sign up</Link></Button>
            </div>
          )}
        </div>
      )}
    </header>
  );
};

export default Navbar;
