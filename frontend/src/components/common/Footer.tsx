import { Sprout } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border bg-secondary/40 mt-24">
    <div className="container mx-auto px-6 py-12 grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-lg bg-hero-gradient grid place-items-center"><Sprout size={16} className="text-primary-foreground" /></div>
          <span className="font-display font-extrabold text-lg">FarmConnect</span>
        </div>
        <p className="text-sm text-muted-foreground max-w-xs">Connecting farmers and buyers — fair prices, fresher food, stronger communities.</p>
      </div>
      {[
        { h: "Marketplace", l: ["Browse", "Categories", "Seasonal", "Bulk Orders"] },
        { h: "For Farmers", l: ["Sell on FarmConnect", "Market Prices", "Resources", "Success Stories"] },
        { h: "Company", l: ["About", "Careers", "Press", "Contact"] },
      ].map((c) => (
        <div key={c.h}>
          <h4 className="font-semibold text-sm mb-3">{c.h}</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {c.l.map((x) => <li key={x}><a href="#" className="hover:text-foreground">{x}</a></li>)}
          </ul>
        </div>
      ))}
    </div>
    <div className="border-t border-border py-6 text-center text-xs text-muted-foreground">© 2026 FarmConnect. Grown with care.</div>
  </footer>
);
export default Footer;
