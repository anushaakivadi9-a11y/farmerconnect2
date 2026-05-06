import { useState } from "react";
import { ShoppingCart, MessageCircle, MapPin } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import { useCart } from "@/context/CartContext";
import { Product } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import ChatWindow from "@/components/chat/ChatWindow";
import { useNavigate } from "react-router-dom";

interface Props {
  product: Product;
}

const ProductCard = ({ product }: Props) => {
  const { add, items } = useCart();
  const { user } = useAuth();
  const [chatOpen, setChatOpen] = useState(false);
const navigate = useNavigate();

  const inCart = items.some((i) => i.product._id === product._id);

  // farmer can be populated object { _id, name } or raw string
  const farmerId =
    typeof product.farmer === "object" && product.farmer !== null
      ? (product.farmer as any)._id
      : product.farmer;

  const farmerName =
    typeof product.farmer === "object" && product.farmer !== null
      ? (product.farmer as any).name
      : "Farmer";

  const handleAdd = () => {
    add(product);
    toast.success(`${product.name} added to cart`);
  };

  const handleChat = () => {
    if (!user) {
      toast.error("Please log in to chat with the seller");
      return;
    }
    const myId = (user as any)?._id || (user as any)?.id;
    if (String(myId) === String(farmerId)) {
      toast.info("This is your own listing");
      return;
    }
    setChatOpen(true);
  };

  return (
    <>
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-soft hover:shadow-md transition-shadow group cursor-pointer "
      onClick={() => navigate(`/products/${product._id}`)}   
      >
        {/* Image */}
        <div className="relative h-44 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {product.isVerified && (
            <span className="absolute top-2 left-2 text-[10px] font-semibold bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              ✓ Verified
            </span>
          )}
          <span className="absolute top-2 right-2 text-[10px] font-semibold bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full capitalize">
            {product.category}
          </span>
        </div>

        {/* Body */}
        <div className="p-4">
          <h3 className="font-semibold text-base truncate capitalize">{product.name}</h3>

          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
            <MapPin size={11} />
            {farmerName}
          </p>

          {/* Price + Add to Cart */}
          <div className="flex items-center justify-between mt-3">
            <div>
              <span className="text-lg font-bold">₹{product.price}</span>
              <span className="text-xs text-muted-foreground">/{product.unit}</span>
            </div>
            <button
              onClick={handleAdd}
              disabled={product.stock === 0}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-40 ${
                inCart
                  ? "bg-primary/10 text-primary"
                  : "bg-primary text-primary-foreground hover:bg-primary/90"
              }`}
            >
              <ShoppingCart size={13} />
              {inCart ? "Added" : "Add"}
            </button>
          </div>

          {/* Chat with Seller */}
          <button
            onClick={handleChat}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 hover:text-primary transition-all"
          >
            <MessageCircle size={13} />
            Chat with Seller
          </button>

          {product.stock <= 10 && product.stock > 0 && (
            <p className="text-[10px] text-orange-500 font-medium mt-2">
              Only {product.stock} {product.unit} left!
            </p>
          )}
          {product.stock === 0 && (
            <p className="text-[10px] text-destructive font-medium mt-2">Out of stock</p>
          )}
        </div>
      </div>

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
    </>
  );
};

export default ProductCard;