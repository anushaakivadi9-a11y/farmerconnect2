import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Truck, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

declare global {
  interface Window {
    Razorpay: any;
  }
}

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) return resolve(true);
    const script = document.createElement("script");
    script.id = "razorpay-script";
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const Checkout = () => {
  const { items, total, clear } = useCart();
  const { user } = useAuth();
  const nav = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState<"cod" | "online">("cod");
  const [loading, setLoading] = useState(false);
  const [address, setAddress] = useState({
    street: "", city: "", state: "", pincode: "", phone: "",
  });

  const platformFee = 15;
  const grandTotal = total + platformFee;

  const token = localStorage.getItem("fc_token");
  const authHeader = { Authorization: `Bearer ${token}` };

  const validateAddress = () => {
    if (!address.street || !address.city || !address.state || !address.pincode || !address.phone) {
      toast.error("Please fill in all delivery address fields");
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error("Enter a valid 6-digit pincode");
      return false;
    }
    if (!/^\d{10}$/.test(address.phone)) {
      toast.error("Enter a valid 10-digit phone number");
      return false;
    }
    return true;
  };

  const saveOrderToDB = async (
    paymentStatus: string,
    razorpayOrderId?: string,
    razorpayPaymentId?: string
  ) => {
    const orderData = {
      items: items.map(({ product, qty }) => ({
        product: product._id,   // ✅ FIXED: real MongoDB ObjectId (was product.id)
        quantity: qty,
        price: product.price,
      })),
      totalAmount: grandTotal,
      paymentMethod,
      paymentStatus,
      deliveryAddress: address,
      ...(razorpayOrderId && { razorpayOrderId }),
      ...(razorpayPaymentId && { razorpayPaymentId }),
    };

    const res = await axios.post(`${API_BASE}/orders`, orderData, { headers: authHeader });
    return res.data;
  };

  const handleCOD = async () => {
    if (!validateAddress()) return;
    setLoading(true);
    try {
      await saveOrderToDB("pending");
      clear();
      toast.success("Order placed! You'll pay on delivery.");
      nav("/buyer");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  const handleRazorpay = async () => {
    if (!validateAddress()) return;
    setLoading(true);

    try {
      const loaded = await loadRazorpayScript();
      if (!loaded) {
        toast.error("Failed to load Razorpay. Check your internet connection.");
        setLoading(false);
        return;
      }

      const { data } = await axios.post(
        `${API_BASE}/payments/orders`,
        { amount: grandTotal, receipt: `order_${Date.now()}` },
        { headers: authHeader }
      );

      const razorpayOrder = data.order;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: "FarmConnect",
        description: "Fresh from the farm",
        order_id: razorpayOrder.id,
        prefill: {
          name: user?.name,
          email: user?.email,
          contact: address.phone,
        },
        theme: { color: "#2D6A4F" },
        handler: async (response: any) => {
          try {
            await axios.post(
              `${API_BASE}/payments/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: authHeader }
            );

            await saveOrderToDB("paid", response.razorpay_order_id, response.razorpay_payment_id);
            clear();
            toast.success("Payment successful! Order confirmed.");
            nav("/buyer");
          } catch {
            toast.error("Payment verification failed. Contact support.");
          }
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            toast.error("Payment cancelled");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Payment failed");
      setLoading(false);
    }
  };

  const handlePlaceOrder = () => {
    if (paymentMethod === "cod") handleCOD();
    else handleRazorpay();
  };

  if (!items.length) {
    nav("/cart");
    return null;
  }

  return (
    <div className="container mx-auto px-6 py-10 grid lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
            <MapPin size={20} className="text-primary" /> Delivery Address
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { key: "street", label: "Street / House No.", span: true },
              { key: "city", label: "City" },
              { key: "state", label: "State" },
              { key: "pincode", label: "Pincode" },
              { key: "phone", label: "Phone Number" },
            ].map(({ key, label, span }) => (
              <input
                key={key}
                placeholder={label}
                value={address[key as keyof typeof address]}
                onChange={(e) => setAddress((a) => ({ ...a, [key]: e.target.value }))}
                className={`bg-background border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 ${span ? "sm:col-span-2" : ""}`}
              />
            ))}
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
          <h2 className="font-display text-xl font-bold mb-5 flex items-center gap-2">
            <CreditCard size={20} className="text-primary" /> Payment Method
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {[
              { id: "cod", label: "Cash on Delivery", desc: "Pay when your order arrives", icon: Truck },
              { id: "online", label: "Pay Online", desc: "UPI, Cards, Net Banking via Razorpay", icon: CreditCard },
            ].map(({ id, label, desc, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setPaymentMethod(id as "cod" | "online")}
                className={`p-4 rounded-xl border text-left transition-all ${
                  paymentMethod === id
                    ? "border-primary bg-primary/5 shadow-soft"
                    : "border-border hover:border-primary/40"
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon size={18} className={paymentMethod === id ? "text-primary" : "text-muted-foreground"} />
                  <span className="font-semibold text-sm">{label}</span>
                  {paymentMethod === id && <CheckCircle2 size={14} className="text-primary ml-auto" />}
                </div>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <aside className="bg-card border border-border rounded-2xl p-6 h-fit shadow-soft sticky top-20">
        <h2 className="font-display text-xl font-bold mb-4">Order Summary</h2>

        <div className="space-y-3 mb-4 max-h-48 overflow-y-auto">
          {items.map(({ product, qty }) => (
            <div key={product._id} className="flex gap-3 items-center">
              <img src={product.imageUrl} alt={product.name} className="w-12 h-12 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{product.name}</p>
                <p className="text-xs text-muted-foreground">× {qty} {product.unit}</p>
              </div>
              <span className="text-sm font-semibold">₹{product.price * qty}</span>
            </div>
          ))}
        </div>

        <div className="space-y-2 text-sm pb-4 border-b border-border">
          <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>₹{total}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Delivery</span><span className="text-primary font-semibold">Free</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Platform fee</span><span>₹{platformFee}</span></div>
        </div>

        <div className="flex justify-between font-bold text-lg pt-4 mb-5">
          <span>Total</span><span>₹{grandTotal}</span>
        </div>

        <Button
          size="lg"
          className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
          onClick={handlePlaceOrder}
          disabled={loading}
        >
          {loading ? (
            <><Loader2 size={16} className="animate-spin mr-2" /> Processing...</>
          ) : paymentMethod === "cod" ? (
            "Place Order (COD)"
          ) : (
            "Pay Now"
          )}
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-3">
          {paymentMethod === "online" ? "Secured by Razorpay" : "Pay cash when your order arrives"}
        </p>
      </aside>
    </div>
  );
};

export default Checkout;