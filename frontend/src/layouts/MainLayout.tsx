import Navbar from "@/components/common/Navbar";
import Footer from "@/components/common/Footer";
import { Outlet } from "react-router-dom";

const MainLayout = () => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1"><Outlet /></main>
    <Footer />
  </div>
);
export default MainLayout;
