import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar/Navbar";

// --- KONTEKST KOSZYKA ---
import { CartProvider } from "./context/CartContext";

// --- WIDŻET AKTYWNEGO ZAMÓWIENIA (PŁYWAJĄCY PANEL) ---
import CurrentOrderWidget from "./components/CurrentOrderWidget/CurrentOrderWidget";

// --- STRONY ---
import HomePage from "./pages/HomePage";       
import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import AppPage from "./pages/AppPage";
import CuisinesPage from "./pages/CuisinesPage";
import ContactPage from "./pages/ContactPage";
import RestaurantsPage from './pages/RestaurantsPage';
import OrdersPage from "./pages/OrdersPage"; // <--- NOWA STRONA HISTORII

// --- PANELE ---
import OwnerDashboard from "./pages/OwnerDashboard";
import AdminDashboard from "./pages/AdminDashboard"; 
import AdminUsers from "./pages/AdminUsers";
import AdminApplications from "./pages/AdminApplications";
import AdminRestaurants from "./pages/AdminRestaurants";

import Profile from "./pages/Profile";


// --- OCHRONIARZ (GUARD) ---
const AdminGuard = ({ children }) => {
  const userRole = localStorage.getItem("user_role");
  const normalizedRole = userRole ? userRole.trim().toLowerCase() : "";

  if (normalizedRole === "admin") {
    return children;
  } else {
    return <Navigate to="/" replace />;
  }
};

export default function App() {
  return (
    <BrowserRouter>
      {/* 1. WRAPPER KOSZYKA - stan koszyka dostępny w całej apce */}
      <CartProvider>
        
        {/* 'relative' jest potrzebne, żeby CurrentOrderWidget mógł się pozycjonować względem okna */}
        <div className="App min-h-screen bg-white dark:bg-gray-900 relative">
          
          {/* Navbar widoczny zawsze na górze */}
          <Navbar />

          {/* 2. WIDŻET AKTYWNEGO ZAMÓWIENIA - Pływa nad resztą (fixed) */}
          <CurrentOrderWidget />
          
          <Routes>
            {/* --- Ścieżki Publiczne / Dla Klienta --- */}
            
            {/* Strona główna przekierowuje na Restauracje (lub wyświetla HomePage, zależnie od woli) */}
            <Route path="/" element={<RestaurantsPage />} />
            <Route path="/restaurants" element={<RestaurantsPage />} />
            
            <Route path="/profile" element={<Profile />} />

            {/* Nowa strona historii zamówień */}
            <Route path="/orders" element={<OrdersPage />} />

            <Route path="/cuisines" element={<CuisinesPage />} />
            <Route path="/contact" element={<ContactPage />} />

            {/* Logowanie i Rejestracja */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            
            {/* --- Panel Właściciela --- */}
            <Route path="/dashboard" element={<OwnerDashboard/>} />
            
            {/* --- PANEL ADMINISTRATORA (Zabezpieczony) --- */}
            <Route 
              path="/admin" 
              element={
                <AdminGuard>
                  <AdminDashboard />
                </AdminGuard>
              } 
            />

            <Route 
              path="/admin/users" 
              element={
                <AdminGuard>
                  <AdminUsers />
                </AdminGuard>
              } 
            />

            <Route 
              path="/admin/applications" 
              element={
                <AdminGuard>
                  <AdminApplications />
                </AdminGuard>
              } 
            />

            <Route 
              path="/admin/restaurants" 
              element={
                <AdminGuard>
                  <AdminRestaurants />
                </AdminGuard>
              } 
            />
            
            {/* Inne / Testowe */}
            <Route path="/app" element={<AppPage />} />

            {/* Obsługa 404 - przekierowanie na główną */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </CartProvider>
    </BrowserRouter>
  );
}