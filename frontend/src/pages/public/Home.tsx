import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sprout, Truck, ShieldCheck, Leaf, BarChart3, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImg from "@/assets/hero-farm.jpg";
import WeatherCard from "@/components/widgets/WeatherCard";
import PricePredictionChart from "@/components/widgets/PricePredictionChart";

const features = [
  { icon: Leaf, title: "Farm-Fresh Direct", desc: "Skip middlemen. Produce moves from farm to plate in under 24 hours." },
  { icon: ShieldCheck, title: "Verified Farmers", desc: "Every farmer is KYC-verified with traceable origin and quality grades." },
  { icon: BarChart3, title: "Smart Pricing", desc: "AI-powered price predictions help farmers earn 30% more on average." },
  { icon: Truck, title: "Cold-chain Logistics", desc: "Same-day refrigerated delivery preserves freshness and nutrition." },
];
const steps = [
  { n: "01", title: "Farmers list produce", desc: "Add crops, set prices, snap photos — listing live in 60 seconds." },
  { n: "02", title: "Buyers discover & order", desc: "Restaurants, retailers, and households order with one tap." },
  { n: "03", title: "Direct payout & delivery", desc: "Settled within 24h. Cold-chain delivery handled end-to-end." },
];

const Home = () => (
  <>
    {/* HERO */}
    <section className="relative overflow-hidden">
      <div className="absolute inset-0">
        <img src={heroImg} alt="Rolling green farmland at sunset" className="w-full h-full object-cover" width={1600} height={1024} />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/30" />
      </div>
      <div className="relative container mx-auto px-6 pt-16 pb-24 lg:pt-24 lg:pb-36 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/20 border border-accent/40 text-xs font-semibold text-foreground mb-5">
            <Sprout size={14} className="text-primary" /> Direct from 12,000+ farmers
          </span>
          <h1 className="font-display text-5xl md:text-6xl lg:text-7xl font-extrabold leading-[0.95] text-foreground text-balance">
            From farm <span className="text-primary">to your fork</span>, fairly.
          </h1>
          <p className="mt-6 text-lg text-muted-foreground max-w-lg">
            FarmConnect is the marketplace where farmers earn more and buyers get fresher produce. Real-time prices, verified growers, transparent supply.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-soft" asChild>
              <Link to="/products">Shop Marketplace <ArrowRight size={18} /></Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/register">Sell as a Farmer</Link>
            </Button>
          </div>
          <div className="mt-10 flex items-center gap-8 text-sm">
            {[["12K+", "Farmers"], ["85K+", "Buyers"], ["₹4.2Cr", "Paid out"]].map(([n, l]) => (
              <div key={l}><div className="text-2xl font-display font-bold text-foreground">{n}</div><div className="text-muted-foreground text-xs">{l}</div></div>
            ))}
          </div>
        </motion.div>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.2 }} className="hidden lg:block">
          <PricePredictionChart />
        </motion.div>
      </div>
    </section>

    {/* FEATURES */}
    <section className="container mx-auto px-6 py-20">
      <div className="max-w-2xl mb-12">
        <p className="text-xs uppercase tracking-wider text-primary font-semibold">Why FarmConnect</p>
        <h2 className="font-display text-4xl md:text-5xl font-bold mt-2">Built for the people who feed us.</h2>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {features.map((f, i) => (
          <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-2xl p-6 hover:border-primary/40 hover:shadow-soft transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/10 grid place-items-center mb-4"><f.icon className="text-primary" size={20} /></div>
            <h3 className="font-bold text-lg mb-1.5">{f.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>

    {/* HOW IT WORKS */}
    <section className="bg-secondary/40 py-20 border-y border-border">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <p className="text-xs uppercase tracking-wider text-primary font-semibold">How it works</p>
          <h2 className="font-display text-4xl md:text-5xl font-bold mt-2">Three steps from soil to sale.</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s) => (
            <div key={s.n} className="bg-card border border-border rounded-2xl p-7 relative">
              <span className="font-display text-6xl font-extrabold text-primary/15 absolute top-3 right-5">{s.n}</span>
              <h3 className="font-bold text-xl mb-2 relative">{s.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed relative">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* INSIGHTS */}
    <section className="container mx-auto px-6 py-20 grid lg:grid-cols-2 gap-6">
      <WeatherCard />
      <div className="lg:hidden"><PricePredictionChart /></div>
      <div className="hidden lg:block bg-hero-gradient rounded-2xl p-10 text-primary-foreground shadow-soft relative overflow-hidden">
        <Users size={120} className="absolute -bottom-6 -right-6 opacity-10" />
        <p className="text-xs uppercase tracking-wider opacity-80 font-semibold">Join the movement</p>
        <h3 className="font-display text-4xl font-bold mt-2 max-w-sm">Empower a farmer with every order.</h3>
        <p className="mt-3 text-primary-foreground/80 max-w-md">Transparent commissions. Fair payouts. Real impact on rural livelihoods.</p>
        <Button size="lg" className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90 shadow-gold" asChild>
          <Link to="/register">Create your account</Link>
        </Button>
      </div>
    </section>
  </>
);

export default Home;
