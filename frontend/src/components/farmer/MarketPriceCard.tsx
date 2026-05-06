import { TrendingDown, TrendingUp } from "lucide-react";
import { marketPrices } from "@/data/mockData";

const MarketPriceCard = () => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
    <div className="flex items-center justify-between mb-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Mandi Prices · Live</p>
        <h3 className="text-xl font-display font-bold mt-1">Today's Rates (₹/kg)</h3>
      </div>
      <span className="text-xs px-2 py-1 rounded-full bg-primary/10 text-primary font-semibold">Updated 2m ago</span>
    </div>
    <div className="divide-y divide-border">
      {marketPrices.map((m) => (
        <div key={m.crop} className="py-3 flex items-center justify-between">
          <div>
            <p className="font-semibold">{m.crop}</p>
            <p className="text-xs text-muted-foreground">{m.mandi}</p>
          </div>
          <div className="text-right">
            <p className="font-bold">₹{m.price}</p>
            <p className={`text-xs flex items-center justify-end gap-1 ${m.change >= 0 ? "text-primary" : "text-destructive"}`}>
              {m.change >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {m.change > 0 ? "+" : ""}{m.change}%
            </p>
          </div>
        </div>
      ))}
    </div>
  </div>
);
export default MarketPriceCard;
