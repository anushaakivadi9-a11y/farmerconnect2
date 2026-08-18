import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE;

interface WishlistContextType {
  wishlist: string[]; // product ids
  toggleWishlist: (productId: string) => void;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export const WishlistProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState<string[]>([]);

  const fetchWishlist = async () => {
    if (!user) return;
    try {
      const token = localStorage.getItem("fc_token");
      const { data } = await axios.get(`${API_BASE}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(data.map((p: any) => p._id));
    } catch {
      toast.error("error in finding wishlist");
    }
  };

  useEffect(() => { fetchWishlist(); }, [user]);

  const toggleWishlist = async (productId: string) => {
    // optimistic update
    const wasWishlisted = wishlist.includes(productId);
    setWishlist(prev =>
      wasWishlisted ? prev.filter(id => id !== productId) : [...prev, productId]
    );
    try {
      const token = localStorage.getItem("fc_token");
      await axios.post(`${API_BASE}/wishlist/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success(wasWishlisted ? "Removed from wishlist" : "Added to wishlist");
    } catch {
      // revert on failure
      setWishlist(prev =>
        wasWishlisted ? [...prev, productId] : prev.filter(id => id !== productId)
      );
      toast.error("Couldn't update wishlist");
    }
  };

  const isWishlisted = (productId: string) => wishlist.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlist, toggleWishlist, isWishlisted }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
};