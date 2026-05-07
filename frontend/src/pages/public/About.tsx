import { Info, Leaf, Users, ShieldCheck } from "lucide-react";

const About = () => {
  return (
    <div className="container mx-auto px-6 py-16">
      <div className="max-w-3xl mx-auto text-center mb-16">
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4">About FarmConnect</h1>
        <p className="text-muted-foreground text-lg">
          Connecting local farmers directly with buyers to ensure fresh produce and fair pricing for everyone.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-16">
        <div className="p-6 bg-card border border-border rounded-2xl text-center">
          <Leaf className="mx-auto mb-4 text-primary" size={32} />
          <h3 className="font-bold text-xl mb-2">Fresh Produce</h3>
          <p className="text-sm text-muted-foreground">Straight from the fields to your kitchen, reducing transit time and waste.</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-2xl text-center">
          <Users className="mx-auto mb-4 text-primary" size={32} />
          <h3 className="font-bold text-xl mb-2">Direct Trade</h3>
          <p className="text-sm text-muted-foreground">Eliminating middlemen so farmers earn more and you pay less.</p>
        </div>
        <div className="p-6 bg-card border border-border rounded-2xl text-center">
          <ShieldCheck className="mx-auto mb-4 text-primary" size={32} />
          <h3 className="font-bold text-xl mb-2">Verified Farmers</h3>
          <p className="text-sm text-muted-foreground">Every farmer on our platform is verified to ensure quality standards.</p>
        </div>
      </div>
    </div>
  );
};

export default About;