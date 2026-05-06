import { useState, useEffect } from "react";
import axios from "axios";

const API_BASE = "http://localhost:5000/api";

export interface Product {
  id: string;
  _id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl: string;
  unit: string;
  isActive: boolean;
  isVerified: boolean;
  farmer: {
    _id: string;
    name: string;
  };
}

interface UseProductsOptions {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  page?: number;
  limit?: number;
}

export const useProducts = (options: UseProductsOptions = {}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const params: Record<string, any> = {};
        if (options.category) params.category = options.category;
        if (options.minPrice) params.minPrice = options.minPrice;
        if (options.maxPrice) params.maxPrice = options.maxPrice;
        if (options.page) params.page = options.page;
        if (options.limit) params.limit = options.limit;

        const { data } = await axios.get(`${API_BASE}/products`, { params });

        // Normalize _id to id for frontend use
        const normalized = data.data.map((p: any) => ({
          ...p,
          id: p._id,
        }));

        setProducts(normalized);
        setTotal(data.total);
        setPages(data.pages);
      } catch (err: any) {
        setError(err?.response?.data?.message || "Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [options.category, options.minPrice, options.maxPrice, options.page, options.limit]);

  return { products, loading, error, total, pages };
};