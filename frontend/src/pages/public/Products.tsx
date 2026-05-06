import { useMemo, useState, useEffect } from "react";
import { Search, SlidersHorizontal, Loader2 } from "lucide-react";
import { categories } from "@/data/mockData";   // keep non-product exports
import ProductCard from "@/components/buyer/ProductCard";
import { Product } from "@/context/CartContext";
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE;

const Products = () => {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [sort, setSort] = useState("popular");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`${API_BASE}/products`);
        // Support both { products: [...] } and plain array responses
        setProducts(Array.isArray(data) ? data : data.
        products?? []);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const filtered = useMemo(() => {
    let r = products.filter((p) => {
      const categoryMatch =
        cat === "All" ||
        p.category.toLowerCase() === cat.toLowerCase();
      const searchMatch =
        p.name.toLowerCase().includes(q.toLowerCase());
      return categoryMatch && searchMatch;
    });
    if (sort === "low") r = [...r].sort((a, b) => a.price - b.price);
    if (sort === "high") r = [...r].sort((a, b) => b.price - a.price);
    return r;
  }, [q, cat, sort, products]);

  if (loading) {
    return (
      <div className="container mx-auto px-6 py-24 flex justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-24 text-center text-destructive">
        {error}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-10">
      <div className="mb-8">
        <h1 className="font-display text-4xl md:text-5xl font-bold">Marketplace</h1>
        <p className="text-muted-foreground mt-2">
          Browse {products.length} products from verified farmers across India.
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search produce…"
            className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-sm outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="bg-card border border-border rounded-xl px-4 py-3 text-sm outline-none"
        >
          <option value="popular">Most Popular</option>
          <option value="low">Price: Low to High</option>
          <option value="high">Price: High to Low</option>
        </select>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap border transition-all ${
              cat === c
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-card text-foreground border-border hover:border-primary/50"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <SlidersHorizontal className="mx-auto mb-3" /> No products match your filters.
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filtered.map((p) => (
            <ProductCard key={p._id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Products;