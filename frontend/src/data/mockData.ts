export type Role = "farmer" | "buyer" | "admin";

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  stock: number;
  farmer: string;
  location: string;
  image: string;
  rating: number;
  organic: boolean;
}

const img = (q: string) =>
  `https://images.unsplash.com/${q}?auto=format&fit=crop&w=800&q=70`;

export const products: Product[] = [
  { id: "p1", name: "Organic Tomatoes", category: "Vegetables", price: 45, unit: "kg", stock: 120, farmer: "Ravi Kumar", location: "Mysuru, KA", image: img("photo-1592924357228-91a4daadcfea"), rating: 4.8, organic: true },
  { id: "p2", name: "Alphonso Mangoes", category: "Fruits", price: 320, unit: "dozen", stock: 40, farmer: "Sunil Patil", location: "Ratnagiri, MH", image: img("photo-1605027990121-cbae9e0642db"), rating: 4.9, organic: false },
  { id: "p3", name: "Basmati Rice", category: "Grains", price: 95, unit: "kg", stock: 800, farmer: "Harpreet Singh", location: "Karnal, HR", image: img("photo-1586201375761-83865001e31c"), rating: 4.7, organic: false },
  { id: "p4", name: "Fresh Spinach", category: "Vegetables", price: 30, unit: "bunch", stock: 60, farmer: "Lakshmi Devi", location: "Hassan, KA", image: img("photo-1576045057995-568f588f82fb"), rating: 4.6, organic: true },
  { id: "p5", name: "Honey (Wildflower)", category: "Dairy & More", price: 480, unit: "500g", stock: 25, farmer: "Anjali Rao", location: "Coorg, KA", image: img("photo-1587049352846-4a222e784d38"), rating: 5.0, organic: true },
  { id: "p6", name: "Green Chillies", category: "Vegetables", price: 60, unit: "kg", stock: 90, farmer: "Mahesh Yadav", location: "Guntur, AP", image: img("photo-1576763595295-c0371a7b6b76"), rating: 4.5, organic: false },
  { id: "p7", name: "Cold-Pressed Mustard Oil", category: "Pantry", price: 220, unit: "litre", stock: 70, farmer: "Bindu Sharma", location: "Alwar, RJ", image: img("photo-1474979266404-7eaacbcd87c5"), rating: 4.7, organic: true },
  { id: "p8", name: "Farm Eggs", category: "Dairy & More", price: 90, unit: "dozen", stock: 200, farmer: "Joseph T.", location: "Wayanad, KL", image: img("photo-1582722872445-44dc5f7e3c8f"), rating: 4.8, organic: false },
];

export const categories = ["All", "Vegetables", "Fruits", "Grains", "Dairy & More", "Pantry"];

export interface MarketPrice {
  crop: string;
  mandi: string;
  price: number;
  change: number;
}
export const marketPrices: MarketPrice[] = [
  { crop: "Tomato", mandi: "Kolar", price: 42, change: +6.2 },
  { crop: "Onion", mandi: "Lasalgaon", price: 28, change: -3.1 },
  { crop: "Potato", mandi: "Agra", price: 22, change: +1.4 },
  { crop: "Wheat", mandi: "Karnal", price: 24, change: +0.8 },
  { crop: "Paddy", mandi: "Raichur", price: 21, change: -0.5 },
  { crop: "Cotton", mandi: "Adilabad", price: 78, change: +2.9 },
];

export const pricePrediction = [
  { week: "W1", actual: 38, predicted: 39 },
  { week: "W2", actual: 41, predicted: 42 },
  { week: "W3", actual: 44, predicted: 43 },
  { week: "W4", actual: 42, predicted: 45 },
  { week: "W5", actual: null as number | null, predicted: 48 },
  { week: "W6", actual: null as number | null, predicted: 51 },
  { week: "W7", actual: null as number | null, predicted: 49 },
];

export const earningsTrend = [
  { month: "Jan", earnings: 18200 },
  { month: "Feb", earnings: 21500 },
  { month: "Mar", earnings: 19800 },
  { month: "Apr", earnings: 26400 },
  { month: "May", earnings: 31200 },
  { month: "Jun", earnings: 34800 },
];
