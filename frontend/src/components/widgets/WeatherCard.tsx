import { Cloud, CloudRain, Sun, Wind, Droplets } from "lucide-react";
import { motion } from "framer-motion";

const days = [
  { d: "Today", t: 29, icon: Sun, c: "Sunny" },
  { d: "Tue", t: 27, icon: Cloud, c: "Cloudy" },
  { d: "Wed", t: 24, icon: CloudRain, c: "Showers" },
  { d: "Thu", t: 26, icon: Cloud, c: "Cloudy" },
  { d: "Fri", t: 30, icon: Sun, c: "Sunny" },
];

const WeatherCard = () => (
  <motion.div
    initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
    className="bg-card border border-border rounded-2xl p-6 shadow-soft"
  >
    <div className="flex items-start justify-between mb-5">
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Weather Insights</p>
        <h3 className="text-2xl font-display font-bold mt-1">Mysuru, Karnataka</h3>
      </div>
      <div className="text-right">
        <div className="text-4xl font-bold text-foreground">29°</div>
        <div className="text-xs text-muted-foreground">Sunny · Feels 31°</div>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-3 mb-5 text-sm">
      <div className="flex items-center gap-2 text-muted-foreground"><Droplets size={16} className="text-primary" />62% hum</div>
      <div className="flex items-center gap-2 text-muted-foreground"><Wind size={16} className="text-primary" />12 km/h</div>
      <div className="flex items-center gap-2 text-muted-foreground"><CloudRain size={16} className="text-primary" />20% rain</div>
    </div>
    <div className="grid grid-cols-5 gap-2 pt-4 border-t border-border">
      {days.map(({ d, t, icon: Ic, c }) => (
        <div key={d} className="text-center">
          <p className="text-xs text-muted-foreground mb-1">{d}</p>
          <Ic size={20} className="mx-auto text-accent" />
          <p className="text-sm font-semibold mt-1">{t}°</p>
          <p className="text-[10px] text-muted-foreground">{c}</p>
        </div>
      ))}
    </div>
    <p className="mt-5 text-xs bg-accent/10 text-foreground rounded-lg p-3 border border-accent/30">
      💡 <span className="font-semibold">Advisory:</span> Light showers Wednesday — ideal for transplanting; delay pesticide spray.
    </p>
  </motion.div>
);
export default WeatherCard;
