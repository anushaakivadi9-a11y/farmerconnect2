import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ShoppingCart, MapPin, Star, ArrowLeft,
  Package, CheckCircle, Loader2, MessageCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { io, Socket } from "socket.io-client";
import { useCart, Product } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import ChatWindow from "@/components/chat/ChatWindow";

const API_BASE = import.meta.env.VITE_API_BASE;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL;

interface Review {
  _id: string;
  user: { _id: string; name: string } | string;
  rating: number;
  comment: string;
  createdAt: string;
}

type FullProduct = Product & { description?: string; reviews?: Review[] };

// ── shared socket (same singleton as ChatWindow) ──────────────────────────────
let _socket: Socket | null = null;
const getSocket = () => {
  if (!_socket) _socket = io(SOCKET_URL, { transports: ["websocket"] });
  return _socket;
};

// ── Star row helper ───────────────────────────────────────────────────────────
const Stars = ({
  value,
  interactive = false,
  onChange,
  size = 14,
}: {
  value: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
  size?: number;
}) => (
  <div className="flex items-center gap-0.5">
    {[1, 2, 3, 4, 5].map((s) => (
      <button
        key={s}
        type="button"
        disabled={!interactive}
        onClick={() => onChange?.(s)}
        className={interactive ? "cursor-pointer" : "cursor-default pointer-events-none"}
      >
        <Star
          size={size}
          className={
            s <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-muted-foreground"
          }
        />
      </button>
    ))}
  </div>
);

// ── Main page ─────────────────────────────────────────────────────────────────
const ProductDetail = () => {
  const { id }    = useParams<{ id: string }>();
  const navigate  = useNavigate();
  const { add, items } = useCart();
  const { user }  = useAuth();

  const [product,    setProduct]    = useState<FullProduct | null>(null);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState("");
  const [chatOpen,   setChatOpen]   = useState(false);
  const [unread,     setUnread]     = useState(0);

  // review form
  const [rating,     setRating]     = useState(5);
  const [comment,    setComment]    = useState("");
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem("fc_token");
  const myId  = (user as any)?._id || (user as any)?.id;

  // ── fetch product ────────────────────────────────────────────────────────
  const fetchProduct = useCallback(async () => {
  try {
    setLoading(true);
    const { data } = await axios.get(`${API_BASE}/products/${id}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}  // ← add this
    });
    setProduct(data.data ?? data);
  } catch (err: any) {
    setError(err?.response?.data?.message || "Failed to load product");
  } finally {
    setLoading(false);
  }
}, [id, token]);  // ← add token to deps



  useEffect(() => { if (id) fetchProduct(); }, [fetchProduct]);

  // ── socket: listen for incoming messages when chat is CLOSED ────────────
  useEffect(() => {
    if (!myId || !id) return;
    const s = getSocket();
    s.emit("join", myId);

    const handleReceive = (msg: { sender: string; chatId: string }) => {
      if (String(msg.sender) !== String(myId)) {
        // increment only when panel is closed
        setChatOpen((open) => {
          if (!open) setUnread((n) => n + 1);
          return open;
        });
      }
    };

    s.on("receiveMessage", handleReceive);
    return () => { s.off("receiveMessage", handleReceive); };
  }, [myId, id]);

  // ── derived ──────────────────────────────────────────────────────────────
  if (loading)
    return (
      <div className="flex justify-center py-32">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );

  if (error || !product)
    return (
      <div className="text-center py-32 text-destructive">
        {error || "Product not found"}
      </div>
    );

  const farmerId   = typeof product.farmer === "object"
    ? (product.farmer as any)._id : product.farmer;
  const farmerName = typeof product.farmer === "object"
    ? (product.farmer as any).name : "Farmer";

  const inCart  = items.some((i) => i.product._id === product._id);
  const isOwner = String(myId) === String(farmerId);
  const reviews = product.reviews ?? [];
  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  const handleAdd = () => {
    add(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleOpenChat = () => {
    if (!user)    { toast.error("Please log in to chat with the seller"); return; }
    if (isOwner)  { toast.info("This is your own listing"); return; }
    setChatOpen(true);
    setUnread(0);
  };

  const submitReview = async () => {
    if (!user)          { toast.error("Please log in to leave a review"); return; }
    if (!comment.trim()) { toast.error("Please write a comment"); return; }
    try {
      setSubmitting(true);
      await axios.post(
        `${API_BASE}/products/${id}/reviews`,
        { rating, comment },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Review submitted!");
      setComment(""); setRating(5);
      fetchProduct(); // refresh reviews
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Failed to submit review");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-10 max-w-5xl">

      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft size={16} /> Back to products
      </button>

      {/* ── Product info ────────────────────────────────────────────────── */}
      <div className="grid md:grid-cols-2 gap-10 mb-14">

        {/* Image */}
        <div className="rounded-2xl overflow-hidden aspect-square bg-card border border-border">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Details */}
        <div className="flex flex-col gap-4">

          <div className="flex items-start justify-between gap-2">
            <h1 className="font-display text-3xl font-bold capitalize leading-tight">
              {product.name}
            </h1>
            {product.isVerified && (
              <span className="flex items-center gap-1 text-xs font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-full whitespace-nowrap mt-1">
                <CheckCircle size={11} /> Verified
              </span>
            )}
          </div>

          <p className="text-muted-foreground flex items-center gap-1.5 text-sm">
            <MapPin size={14} /> {farmerName}
          </p>

          {reviews.length > 0 && (
            <div className="flex items-center gap-2">
              <Stars value={Math.round(avgRating)} size={15} />
              <span className="text-sm text-muted-foreground">
                {avgRating.toFixed(1)} · {reviews.length} review{reviews.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          <div>
            <span className="text-3xl font-bold">₹{product.price}</span>
            <span className="text-muted-foreground text-sm ml-1">/ {product.unit}</span>
          </div>

          <span className="text-xs capitalize bg-secondary px-3 py-1 rounded-full self-start border border-border">
            <Package size={10} className="inline mr-1" />
            {product.category}
          </span>

          {product.description && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {product.description}
            </p>
          )}

          {product.stock > 0 && product.stock <= 10 && (
            <p className="text-sm text-orange-500 font-medium">
              Only {product.stock} {product.unit} left!
            </p>
          )}
          {product.stock === 0 && (
            <p className="text-sm text-destructive font-medium">Out of stock</p>
          )}

          {/* CTA buttons */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 ${
                inCart
                  ? "bg-primary/10 text-primary"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <ShoppingCart size={16} />
              {inCart ? "Added to Cart" : "Add to Cart"}
            </button>

            {!isOwner && (
              <button
                onClick={handleOpenChat}
                className="relative flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
              >
                <MessageCircle size={16} />
                Chat with Seller

                {/* Unread badge */}
                <AnimatePresence>
                  {unread > 0 && (
                    <motion.span
                      key="badge"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 25 }}
                      className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1 bg-red-500 text-white text-[11px] font-bold rounded-full flex items-center justify-center shadow"
                    >
                      {unread > 9 ? "9+" : unread}
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Reviews ─────────────────────────────────────────────────────── */}
      <div className="border-t border-border pt-10">
        <h2 className="font-display text-2xl font-bold mb-8">
          Reviews{" "}
          {reviews.length > 0 && (
            <span className="text-muted-foreground font-normal text-lg">
              ({reviews.length})
            </span>
          )}
        </h2>

        {/* Write a review */}
        {user && !isOwner && (
          <div className="bg-card border border-border rounded-2xl p-6 mb-8">
            <p className="font-semibold text-sm mb-4">Write a Review</p>

            <div className="mb-4">
              <p className="text-xs text-muted-foreground mb-1.5">Your rating</p>
              <Stars value={rating} interactive onChange={setRating} size={22} />
            </div>

            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience with this product…"
              rows={3}
              className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40 resize-none mb-4"
            />

            <button
              onClick={submitReview}
              disabled={submitting}
              className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-all"
            >
              {submitting && <Loader2 size={13} className="animate-spin" />}
              Submit Review
            </button>
          </div>
        )}

        {/* Review list */}
        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-sm text-center py-16">
            No reviews yet — be the first!
          </p>
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => {
              const name = typeof r.user === "object" ? (r.user as any).name : "User";
              return (
                <div key={r._id} className="bg-card border border-border rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric", month: "short", year: "numeric",
                      })}
                    </p>
                  </div>
                  <Stars value={r.rating} size={13} />
                  <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                    {r.comment}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {chatOpen && (
          <ChatWindow
            productId={product._id}
            productName={product.name}
            productImage={product.imageUrl}
            farmerId={farmerId}
            farmerName={farmerName}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ProductDetail;