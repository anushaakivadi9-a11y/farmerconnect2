import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Heart, Package, Truck, CheckCircle2, MapPin, Clock, RefreshCw, ChevronDown, ChevronUp, IndianRupee } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "@/components/buyer/ProductCard";
import WeatherCard from "@/components/widgets/WeatherCard";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { toast } from "sonner";

const API_BASE = import.meta.env.VITE_API_BASE;

// Order status config — maps backend enum → display info
const STATUS_STEPS = ["confirmed", "processing", "shipped", "delivered"] as const;

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "Pending",    color: "text-yellow-600",  bg: "bg-yellow-50 dark:bg-yellow-900/20" },
  confirmed:  { label: "Confirmed",  color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-900/20" },
  processing: { label: "Processing", color: "text-orange-600",  bg: "bg-orange-50 dark:bg-orange-900/20" },
  shipped:    { label: "Shipped",    color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-900/20" },
  delivered:  { label: "Delivered",  color: "text-primary",     bg: "bg-primary/10" },
  cancelled:  { label: "Cancelled",  color: "text-destructive", bg: "bg-destructive/10" },
};

const STEP_LABELS = ["Confirmed", "Processing", "Shipped", "Delivered"];

interface OrderItem {
  product: {
    _id: string;
    name: string;
    imageUrl: string;
    unit: string;
    price: number;
  };
  quantity: number;
  price: number;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  orderStatus: string;
  paymentStatus: string;
  paymentMethod: string;
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    phone: string;
  };
  createdAt: string;
}

// Single order card with expandable item list
const OrderCard = ({ order }: { order: Order }) => {
  const [expanded, setExpanded] = useState(false);

  const stepIndex = STATUS_STEPS.indexOf(order.orderStatus as any);
  // pending → treat as step 0 (confirmed), cancelled → -1
  const activeStep = order.orderStatus === "cancelled" ? -1
    : order.orderStatus === "pending" ? 0
    : stepIndex + 1;   // how many steps are "done" (1-based)

  const meta = STATUS_META[order.orderStatus] ?? STATUS_META.pending;
  const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric",
  });

  return (

    
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="border border-border rounded-2xl overflow-hidden bg-card shadow-soft"
    >
      {/* Header */}
      <div className="p-4 flex flex-wrap items-center gap-3 justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center">
            <Package size={18} className="text-primary" />
          </div>
          <div>
            <p className="font-semibold text-sm">Order #{order._id.slice(-6).toUpperCase()}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={11} /> {date}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${meta.bg} ${meta.color}`}>
            {meta.label}
          </span>
          <span className="text-sm font-bold flex items-center gap-0.5">
            <IndianRupee size={13} />{order.totalAmount}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 hover:bg-secondary rounded-lg transition-colors"
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* Progress bar — skip for cancelled */}
      {order.orderStatus !== "cancelled" && (
        <div className="px-4 pb-4">
          <div className="flex items-center gap-1">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex-1 flex items-center gap-1">
                <div className="flex flex-col items-center gap-1 flex-1">
                  <div className={`w-7 h-7 rounded-full grid place-items-center text-xs font-bold transition-colors ${
                    i < activeStep
                      ? "bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground"
                  }`}>
                    {i < activeStep ? <CheckCircle2 size={14} /> : i + 1}
                  </div>
                  <span className="text-[10px] text-muted-foreground text-center leading-tight">{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 transition-colors ${i < activeStep - 1 ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Expandable: items + address */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-border"
          >
            <div className="p-4 grid sm:grid-cols-2 gap-4">
              {/* Items */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Items</p>
                <div className="space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3">
                      <img
                        src={item.product?.imageUrl}
                        alt={item.product?.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product?.name}</p>
                        <p className="text-xs text-muted-foreground">
                          × {item.quantity} {item.product?.unit} · ₹{item.price}/{item.product?.unit}
                        </p>
                      </div>
                      <span className="text-sm font-semibold">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Delivery address */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">Delivery Address</p>
                <div className="bg-secondary rounded-xl p-3 text-sm space-y-0.5">
                  <p className="font-medium">{order.deliveryAddress.street}</p>
                  <p className="text-muted-foreground">
                    {order.deliveryAddress.city}, {order.deliveryAddress.state} – {order.deliveryAddress.pincode}
                  </p>
                  <p className="text-muted-foreground">📞 {order.deliveryAddress.phone}</p>
                </div>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded-full font-medium ${
                    order.paymentStatus === "paid"
                      ? "bg-primary/10 text-primary"
                      : "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.paymentStatus === "paid" ? "✓ Paid" : "COD"}
                  </span>
                  <span className="text-muted-foreground capitalize">{order.paymentMethod}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

const BuyerDashboard = () => {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
const [recommended, setRecommended] = useState<any[]>([]);

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const token = localStorage.getItem("fc_token");
      const { data } = await axios.get(`${API_BASE}/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      toast.error("Could not load orders");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);
  useEffect(() => {
  const fetchRecommended = async () => {
    try {
      const { data } = await axios.get(`${API_BASE}/products?limit=4`);
      setRecommended(Array.isArray(data) ? data : data.data ?? []);
    } catch (err) {
      console.error("Failed to load recommended products");
    }
  };
  fetchRecommended();
}, []);

  const activeOrders  = orders.filter(o => !["delivered", "cancelled"].includes(o.orderStatus));
  const deliveredCount = orders.filter(o => o.orderStatus === "delivered").length;

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <p className="text-sm text-muted-foreground">Hello,</p>
        <h1 className="font-display text-3xl md:text-4xl font-bold capitalize">
          {user?.name || "Buyer"} 👋
        </h1>
      </div>

      {/* Stats */}
      <div className="grid lg:grid-cols-3 gap-4 mb-10">
        {[
          { icon: Package, label: "Active Orders",          value: String(activeOrders.length) },
          { icon: Heart,   label: "Wishlist",               value: "12" },
          { icon: Truck,   label: "Delivered this month",   value: String(deliveredCount) },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-6 shadow-soft flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-primary/10 grid place-items-center">
              <s.icon className="text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground">{s.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Order Tracking + Weather */}
      <div className="grid lg:grid-cols-3 gap-6 mb-10">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-display text-xl font-bold">My Orders</h2>
            <button
              onClick={() => fetchOrders(true)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2].map(n => (
                <div key={n} className="h-28 bg-card border border-border rounded-2xl animate-pulse" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-card border border-border rounded-2xl p-10 text-center">
              <Package size={40} className="mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Your placed orders will appear here
              </p>
              <Link
                to="/products"
                className="mt-4 inline-block text-sm font-semibold text-primary"
              >
                Start shopping →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => (
                <OrderCard key={order._id} order={order} />
              ))}
            </div>
          )}
        </div>

        <WeatherCard />
      </div>

      {/* Recommended */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h2 className="font-display text-2xl font-bold">Recommended for you</h2>
          <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
            <MapPin size={14} /> Based on your area
          </p>
        </div>
        <Link to="/products" className="text-sm font-semibold text-primary">
          View all →
        </Link>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
{recommended.map(p => <ProductCard key={p._id} product={p} />)}
      </div>
    </div>
  );
};

export default BuyerDashboard;