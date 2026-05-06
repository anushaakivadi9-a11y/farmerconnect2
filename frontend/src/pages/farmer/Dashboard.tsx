import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Edit2, Trash2, IndianRupee, Package, ShoppingBag, TrendingUp, MessageCircle, X, Send, ChevronLeft, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { earningsTrend } from "@/data/mockData";
import { Product } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import MarketPriceCard from "@/components/farmer/MarketPriceCard";
import WeatherCard from "@/components/widgets/WeatherCard";
import PricePredictionChart from "@/components/widgets/PricePredictionChart";
import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import AddProductModal from "@/components/farmer/AddProductModal";
import axios from "axios";
import { io, Socket } from "socket.io-client";

const API = "http://localhost:5000/api";
const SOCKET_URL = "http://localhost:5000";

const stats = [
  { label: "Total Earnings", value: "₹1,52,400", icon: IndianRupee, change: "+12.4%" },
  { label: "Active Listings", value: "8", icon: Package, change: "+2 new" },
  { label: "Orders this Month", value: "47", icon: ShoppingBag, change: "+18%" },
  { label: "Avg. Rating", value: "4.8★", icon: TrendingUp, change: "↑ 0.2" },
];

// ─── Types ────────────────────────────────────────────────────────────────────
interface Message {
  _id?: string;
  sender: string;
  content: string;
  createdAt?: string;
  pending?: boolean;
}

interface Chat {
  _id: string;
  participants: { _id: string; name: string; role: string }[];
  product: { _id: string; name: string; imageUrl: string };
  messages: Message[];
  lastMessage: string;
  lastMessageAt: string;
}

// unread count per productId
type UnreadMap = Record<string, number>;
// chats per productId
type ProductChatsMap = Record<string, Chat[]>;

let socket: Socket | null = null;
const getSocket = () => {
  if (!socket) socket = io(SOCKET_URL, { transports: ["websocket"] });
  return socket;
};

// ─── Inline Chat Panel ────────────────────────────────────────────────────────
const ChatPanel = ({
  chat,
  myId,
  onBack,
}: {
  chat: Chat;
  myId: string;
  onBack: () => void;
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const token = localStorage.getItem("fc_token");

  const buyer = chat.participants.find((p) => p._id !== myId);

  useEffect(() => {
    const loadMessages = async () => {
      try {
        const { data } = await axios.get(`${API}/chat/${chat._id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMessages(data.data.messages || []);
        getSocket().emit("joinChat", chat._id);
      } catch (err) {
        console.error(err);
      }
    };
    loadMessages();
  }, [chat._id]);

  useEffect(() => {
    const s = getSocket();
    const handler = (msg: Message & { chatId: string }) => {
      if (msg.chatId !== chat._id) return;
      setMessages((prev) => [...prev.filter((m) => !m.pending), msg]);
    };
    s.on("receiveMessage", handler);
    return () => { s.off("receiveMessage", handler); };
  }, [chat._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = () => {
    if (!input.trim()) return;
    const content = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { sender: myId, content, createdAt: new Date().toISOString(), pending: true }]);
    getSocket().emit("sendMessage", {
      chatId: chat._id,
      content,
      senderId: myId,
      receiverId: buyer?._id,
    });
  };

  const fmt = (ts?: string) =>
    ts ? new Date(ts).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "";

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-border">
        <button onClick={onBack} className="p-1.5 hover:bg-secondary rounded-lg">
          <ChevronLeft size={16} />
        </button>
        <div className="w-8 h-8 rounded-full bg-primary/10 grid place-items-center text-sm font-bold text-primary">
          {buyer?.name?.[0]?.toUpperCase() || "B"}
        </div>
        <div>
          <p className="font-semibold text-sm">{buyer?.name || "Buyer"}</p>
          <p className="text-xs text-muted-foreground">{chat.product?.name}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-background/40">
        {messages.map((msg, i) => {
          const mine = String(msg.sender) === String(myId);
          return (
            <div key={msg._id || i} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] px-3 py-2 rounded-2xl text-sm ${
                mine
                  ? `bg-primary text-primary-foreground rounded-br-sm ${msg.pending ? "opacity-60" : ""}`
                  : "bg-card border border-border rounded-bl-sm"
              }`}>
                <p>{msg.content}</p>
                <p className={`text-[10px] mt-0.5 ${mine ? "text-primary-foreground/60 text-right" : "text-muted-foreground"}`}>
                  {fmt(msg.createdAt)}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-border flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Reply..."
          className="flex-1 bg-secondary rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/40"
        />
        <button
          onClick={send}
          disabled={!input.trim()}
          className="w-9 h-9 bg-primary text-primary-foreground rounded-xl grid place-items-center hover:bg-primary/90 disabled:opacity-40"
        >
          <Send size={14} />
        </button>
      </div>
    </div>
  );
};

// ─── Chat Drawer ──────────────────────────────────────────────────────────────
const ChatDrawer = ({
  product,
  chats,
  myId,
  onClose,
}: {
  product: Product;
  chats: Chat[];
  myId: string;
  onClose: () => void;
}) => {
  const [activeChat, setActiveChat] = useState<Chat | null>(null);

  const fmt = (ts?: string) => {
    if (!ts) return "";
    const d = new Date(ts);
    const today = new Date();
    if (d.toDateString() === today.toDateString())
      return d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 260 }}
      className="fixed top-0 right-0 h-full w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col"
    >
      {/* Drawer Header */}
      <div className="flex items-center gap-3 px-4 py-4 border-b border-border bg-primary text-primary-foreground">
        <img
          src={product.imageUrl ?? (product as any).image}
          alt={product.name}
          className="w-9 h-9 rounded-lg object-cover opacity-90"
        />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm truncate">{product.name}</p>
          <p className="text-xs opacity-75">{chats.length} conversation{chats.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={onClose} className="p-1.5 hover:bg-white/20 rounded-lg">
          <X size={16} />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div
              key="chat"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="h-full flex flex-col"
            >
              <ChatPanel chat={activeChat} myId={myId} onBack={() => setActiveChat(null)} />
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full overflow-y-auto"
            >
              {chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full gap-3 p-8 text-center">
                  <MessageCircle size={40} className="text-muted-foreground opacity-20" />
                  <p className="text-sm text-muted-foreground">No messages yet for this product</p>
                </div>
              ) : (
                chats.map((chat) => {
                  const buyer = chat.participants.find((p) => p._id !== myId);
                  return (
                    <button
                      key={chat._id}
                      onClick={() => setActiveChat(chat)}
                      className="w-full flex items-center gap-3 px-4 py-4 hover:bg-secondary/50 border-b border-border text-left transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary/10 grid place-items-center text-primary font-bold text-sm shrink-0">
                        {buyer?.name?.[0]?.toUpperCase() || "B"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm">{buyer?.name || "Buyer"}</p>
                        <p className="text-xs text-muted-foreground truncate mt-0.5">
                          {chat.lastMessage || "Started a conversation"}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] text-muted-foreground">{fmt(chat.lastMessageAt)}</p>
                        <div className="w-2 h-2 rounded-full bg-primary mt-1 ml-auto" />
                      </div>
                    </button>
                  );
                })
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const FarmerDashboard = () => {
  const { user } = useAuth();
  const myId = (user as any)?._id || (user as any)?.id || "";
  const token = localStorage.getItem("fc_token");

  const [list, setList] = useState<Product[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Chat state
  const [productChats, setProductChats] = useState<ProductChatsMap>({});
  const [unread, setUnread] = useState<UnreadMap>({});
  const [drawerProduct, setDrawerProduct] = useState<Product | null>(null);

  // Fetch products
  useEffect(() => {
    const fetchMyProducts = async () => {
      try {
        const { data } = await axios.get(`${API}/products/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setList(Array.isArray(data) ? data : data.data ?? []);
      } catch (err) {
        console.error("Failed to fetch products", err);
      }
    };
    fetchMyProducts();
  }, []);

  // Fetch all chats and group by productId
  useEffect(() => {
    const fetchChats = async () => {
      try {
        const { data } = await axios.get(`${API}/chat/my`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const chats: Chat[] = data.data || [];
        const grouped: ProductChatsMap = {};
        chats.forEach((c) => {
          const pid = c.product?._id;
          if (!pid) return;
          if (!grouped[pid]) grouped[pid] = [];
          grouped[pid].push(c);
        });
        setProductChats(grouped);
      } catch (err) {
        console.error("Failed to fetch chats", err);
      }
    };
    fetchChats();
  }, []);

  // Socket — join room + listen for new messages
  useEffect(() => {
    if (!myId) return;
    const s = getSocket();
    s.emit("join", myId);

    const handleNotification = ({ chatId, senderId, content }: {
      chatId: string; senderId: string; content: string;
    }) => {
      if (String(senderId) === String(myId)) return;

      // Find which product this chat belongs to
      setProductChats((prev) => {
        const allChats = Object.values(prev).flat();
        const chat = allChats.find((c) => c._id === chatId);
        if (!chat) return prev;

        const pid = chat.product?._id;
        if (!pid) return prev;

        // Update lastMessage
        const updated = { ...prev };
        updated[pid] = updated[pid].map((c) =>
          c._id === chatId ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() } : c
        );
        return updated;
      });

      // Increment unread for that product
      setProductChats((prev) => {
        const allChats = Object.values(prev).flat();
        const chat = allChats.find((c) => c._id === chatId);
        if (!chat) return prev;
        const pid = chat.product?._id;
        if (pid) {
          setUnread((u) => ({ ...u, [pid]: (u[pid] || 0) + 1 }));
        }
        return prev;
      });

      toast(`💬 New message from buyer`, { description: content });
    };

    s.on("newMessageNotification", handleNotification);
    return () => { s.off("newMessageNotification", handleNotification); };
  }, [myId]);

  const openDrawer = (product: Product) => {
    const pid = product._id ?? (product as any).id;
    setDrawerProduct(product);
    // Clear unread for this product
    setUnread((u) => ({ ...u, [pid]: 0 }));
  };

  const deleteProduct = async (p: Product) => {
    try {
      await axios.delete(`${API}/products/${p._id ?? (p as any).id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setList(list.filter((x) => (x._id ?? (x as any).id) !== (p._id ?? (p as any).id)));
      toast.success("Product deleted");
    } catch (err) {
      toast.error("Delete failed");
    }
  };

  return (
    <div className="container mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <p className="text-sm text-muted-foreground">Welcome back,</p>
          <h1 className="font-display text-3xl md:text-4xl font-bold capitalize">{user?.name || "Farmer"} 🌱</h1>
        </div>
        <Button onClick={() => setShowModal(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus size={16} /> Add Product
        </Button>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-2xl p-5 shadow-soft">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-primary/10 grid place-items-center"><s.icon className="text-primary" size={18} /></div>
              <span className="text-xs text-primary font-semibold">{s.change}</span>
            </div>
            <p className="text-2xl font-bold mt-3">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {showModal && (
        <AddProductModal
          onClose={() => setShowModal(false)}
          onSuccess={(product) => setList((prev) => [product, ...prev])}
        />
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">

          {/* Products Table */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold mb-4">My Products</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-xs text-muted-foreground uppercase border-b border-border">
                  <tr>
                    <th className="text-left py-3">Product</th>
                    <th>Category</th>
                    <th>Price</th>
                    <th>Stock</th>
                    <th>Messages</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((p) => {
                    const pid = p._id ?? (p as any).id;
                    const chats = productChats[pid] || [];
                    const unreadCount = unread[pid] || 0;
                    const totalBuyers = chats.length;

                    return (
                      <tr key={pid} className="border-b border-border last:border-0">
                        {/* Product */}
                        <td className="py-3">
                          <div className="flex items-center gap-3">
                            <img src={p.imageUrl ?? (p as any).image} alt={p.name}
                              className="w-10 h-10 rounded-lg object-cover" />
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-xs text-muted-foreground">{p.unit || "kg"}</p>
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="text-center capitalize">{p.category}</td>

                        {/* Price */}
                        <td className="text-center font-medium">₹{p.price}/{p.unit || "kg"}</td>

                        {/* Stock */}
                        <td className="text-center">{p.stock}</td>

                        {/* Messages / Notification */}
                        <td className="text-center">
                          <button
                            onClick={() => openDrawer(p)}
                            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
                          >
                            <MessageCircle size={13} />
                            {totalBuyers > 0 ? (
                              <span>{totalBuyers} buyer{totalBuyers !== 1 ? "s" : ""}</span>
                            ) : (
                              <span className="text-muted-foreground">Chat</span>
                            )}
                            {/* Unread badge */}
                            {unreadCount > 0 && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-destructive text-white text-[10px] font-bold rounded-full grid place-items-center animate-pulse">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                        </td>

                        {/* Actions */}
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            <button className="p-2 hover:bg-secondary rounded-lg"><Edit2 size={14} /></button>
                            <button
                              onClick={() => deleteProduct(p)}
                              className="p-2 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Earnings Trend */}
          <div className="bg-card border border-border rounded-2xl p-6 shadow-soft">
            <h2 className="font-display text-xl font-bold mb-4">Earnings Trend</h2>
            <div className="h-56">
              <ResponsiveContainer>
                <LineChart data={earningsTrend} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Line type="monotone" dataKey="earnings" stroke="hsl(var(--primary))" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <PricePredictionChart />
        </div>

        <div className="space-y-6">
          <WeatherCard />
          <MarketPriceCard />
        </div>
      </div>

      {/* Chat Drawer — slides in from right */}
      <AnimatePresence>
        {drawerProduct && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerProduct(null)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />
            <ChatDrawer
              product={drawerProduct}
              chats={productChats[drawerProduct._id ?? (drawerProduct as any).id] || []}
              myId={myId}
              onClose={() => setDrawerProduct(null)}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FarmerDashboard;