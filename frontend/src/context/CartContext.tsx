import { createContext, useContext, useState, ReactNode } from "react";

// Matches your MongoDB Product schema fields
export interface Product {
  _id: string;          // MongoDB ObjectId — this is what the Order schema needs
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  farmer: string;       // populated farmerInfo name, or raw ObjectId string
  imageUrl: string;     // your schema uses imageUrl (not image)
  isActive: boolean;
  isVerified: boolean;
  description?: string;
}

interface CartItem {
  product: Product;
  qty: number;
}

interface CartContextType {
  items: CartItem[];
  add: (product: Product) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const add = (product: Product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product._id === product._id);
      if (existing) {
        return prev.map((i) =>
          i.product._id === product._id ? { ...i, qty: i.qty + 1 } : i
        );
      }
      return [...prev, { product, qty: 1 }];
    });
  };

  const remove = (id: string) =>
    setItems((prev) => prev.filter((i) => i.product._id !== id));

  const setQty = (id: string, qty: number) => {
    if (qty <= 0) return remove(id);
    setItems((prev) =>
      prev.map((i) => (i.product._id === id ? { ...i, qty } : i))
    );
  };

  const clear = () => setItems([]);

  const total = items.reduce((sum, { product, qty }) => sum + product.price * qty, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
};