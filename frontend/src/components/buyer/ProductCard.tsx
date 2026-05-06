import { Link, useNavigate } from "react-router-dom";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";

const Cart = () => {
  const { items, setQty, remove, total } = useCart();
  const nav = useNavigate();

  if (!items.length) {
    return (
      <div className="container mx-auto px-6 py-24 text-center">
        <ShoppingBag size={48} className="mx-auto text-muted-foreground mb-4" />
        <h1 className="font-display text-3xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-muted-foreground mb-6">Discover fresh produce from local farmers.</p>
        <Button asChild className="bg-primary text-primary-foreground">
          <Link to="/products">Browse Marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <h1 className="font-display text-3xl font-bold mb-6">Your Cart ({items.length})</h1>
        <div className="space-y-3">
          {items.map(({ product, qty }) => (
            <div key={product.id} className="bg-card border border-border rounded-2xl p-4 flex gap-4 items-center">
              <img src={product.imageUrl} alt={product.name} className="w-20 h-20 object-cover rounded-xl" />
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.farmer} · ₹{product.price}/{product.unit}</p>
              </div>
              <div className="flex items-center gap-2 bg-secondary rounded-lg p-1">
                <button onClick={() => setQty(product.id, qty - 1)} className="p-1 hover:bg-background rounded">
                  <Minus size={14} />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{qty}</span>
                <button onClick={() => setQty(product.id, qty + 1)} className="p-1 hover:bg-background rounded">
                  <Plus size={14} />
                </button>
              </div>
              <p className="font-bold w-20 text-right">₹{product.price * qty}</p>
              <button onClick={() => remove(product.id)} className="text-muted-foreground hover:text-destructive">
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <aside className="bg-card border border-border rounded-2xl p-6 h-fit shadow-soft sticky top-20">
        <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>
        <div className="space-y-2 text-sm pb-4 border-b border-border">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>₹{total}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Delivery</span>
            <span className="text-primary font-semibold">Free</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Platform fee</span>
            <span>₹15</span>
          </div>
        </div>
        <div className="flex justify-between font-bold text-lg pt-4 mb-4">
          <span>Total</span>
          <span>₹{total + 15}</span>
        </div>
        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={() => nav("/checkout")}
        >
          Place Order
        </Button>
      </aside>
    </div>
  );
};

export default Cart;