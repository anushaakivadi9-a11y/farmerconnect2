import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";
import { TrendingUp } from "lucide-react";
import { pricePrediction } from "@/data/mockData";

const PricePredictionChart = () => (
  <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
    <div className="flex items-start justify-between mb-4">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">AI Forecast</p>
        <h3 className="text-2xl font-display font-bold mt-1">Tomato Price Prediction</h3>
        <p className="text-sm text-muted-foreground mt-1">Next 3 weeks · ₹/kg</p>
      </div>
      <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
        <TrendingUp size={14} /> +14% expected
      </div>
    </div>
    <div className="h-64">
      <ResponsiveContainer>
        <LineChart data={pricePrediction} margin={{ top: 8, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
          <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
          <Legend wrapperStyle={{ fontSize: 12 }} />
          <Line type="monotone" dataKey="actual" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4 }} name="Actual" />
          <Line type="monotone" dataKey="predicted" stroke="hsl(var(--accent))" strokeWidth={3} strokeDasharray="6 4" dot={{ r: 4 }} name="Predicted" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);
export default PricePredictionChart;