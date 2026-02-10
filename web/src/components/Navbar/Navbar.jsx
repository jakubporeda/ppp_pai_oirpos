import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext'; 
import CheckoutModal from '../CheckoutModal/CheckoutModal';

const Navbar = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const [user, setUser] = useState(null);

  // Pobieramy licznik z koszyka
  const { cartCount } = useCart();
  
  // Stan do otwierania/zamykania Modala z zamówieniem
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("user_role");
    navigate("/login");
  };

  // Pobieranie danych użytkownika
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) return;
      try {
        const response = await fetch("http://127.0.0.1:8000/users/me", {
          headers: { "Authorization": `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setUser(data);
          // Aktualizujemy rolę w localStorage dla pewności
          if (data.role) localStorage.setItem("user_role", data.role);
        } else {
          handleLogout(); 
        }
      } catch (error) {
        console.error("Błąd pobierania danych usera", error);
      }
    };

    fetchUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <>
      <nav className="bg-purple-800 text-white shadow-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* --- LEWA STRONA: LOGO + GŁÓWNE LINKI --- */}
            <div className="flex items-center">
              <Link to="/" className="flex-shrink-0 font-bold text-2xl tracking-wider hover:text-purple-200 transition">
                FoodAPP 🍔
              </Link>
              <div className="hidden md:block">
                <div className="ml-10 flex items-baseline space-x-4">
                  <Link to="/restaurants" className="hover:bg-purple-700 px-3 py-2 rounded-md text-sm font-medium transition">
                    Restauracje
                  </Link>
                  <Link to="/cuisines" className="hover:bg-purple-700 px-3 py-2 rounded-md text-sm font-medium transition">
                    Kuchnie
                  </Link>
                  
                  {/* Linki tylko dla Admina */}
                  {user && user.role === 'admin' && (
                    <Link to="/admin" className="bg-red-600 hover:bg-red-700 px-3 py-2 rounded-md text-sm font-medium transition shadow">
                      Administracja
                    </Link>
                  )}
                  
                  {/* Linki tylko dla Właściciela */}
                  {user && user.role === 'właściciel' && (
                     <Link to="/dashboard" className="bg-green-600 hover:bg-green-700 px-3 py-2 rounded-md text-sm font-medium transition shadow">
                     Panel Właściciela
                   </Link>
                  )}
                </div>
              </div>
            </div>

            {/* --- PRAWA STRONA: KOSZYK + PROFIL --- */}
            <div className="hidden md:block">
              <div className="ml-4 flex items-center md:ml-6">
                {user ? (
                  <div className="flex items-center gap-6"> 
                    
                    {/* PRZYCISK KOSZYKA - WIDOCZNY TYLKO DLA ZWYKŁEGO USERA */}
                    {user.role === 'user' && (
                        <button 
                          onClick={() => setIsCheckoutOpen(true)}
                          className="flex items-center gap-2 bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded-full transition shadow-sm border border-purple-600 group"
                        >
                          <div className="relative">
                              <span className="text-xl group-hover:scale-110 transition-transform block">🛒</span>
                              {cartCount > 0 && (
                                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold rounded-full h-4 w-4 flex items-center justify-center border border-purple-800 animate-bounce">
                                      {cartCount}
                                  </span>
                              )}
                          </div>
                          <span className="font-bold text-sm tracking-wide">Twój koszyk</span>
                        </button>
                    )}

                    {/* PROFIL UŻYTKOWNIKA */}
                    <div className="flex items-center gap-3 border-l border-purple-600 pl-6">
                      <div className="flex flex-col text-right mr-1">
                        <span className="text-sm font-bold uppercase tracking-wide text-purple-100">
                          {user.first_name || "Witaj"} {user.last_name}
                        </span>
                        
                        <Link
                          to="/profile"
                          className="text-xs text-purple-200 hover:text-white font-bold transition"
                        >
                          👤 Profil
                        </Link>

                        
                        {/* LINK DO HISTORII - WIDOCZNY TYLKO DLA ZWYKŁEGO USERA */}
                        {user.role === 'user' && (
                            <Link 
                                to="/orders" 
                                className="text-xs text-yellow-300 hover:text-white font-bold mb-1 transition block"
                            >
                                📦 Moje Zamówienia
                            </Link>
                        )}

                        <button 
                            onClick={handleLogout} 
                            className="text-xs text-purple-300 hover:text-white text-right font-medium transition"
                        >
                            Wyloguj
                        </button>
                      </div>
                      
                      {/* Awatar z inicjałami */}
                      <div className="h-10 w-10 rounded-full bg-white text-purple-800 flex items-center justify-center font-bold text-lg border-2 border-purple-300 shadow-sm">
                        {user.first_name ? user.first_name[0].toUpperCase() : "U"}
                        {user.last_name ? user.last_name[0].toUpperCase() : ""}
                      </div>
                    </div>
                  </div>
                ) : (
                  // Dla niezalogowanych
                  <div className="flex gap-2">
                      <Link to="/login" className="bg-purple-700 hover:bg-purple-600 px-4 py-2 rounded text-sm font-bold transition">
                          Zaloguj
                      </Link>
                      <Link to="/register" className="bg-white text-purple-800 hover:bg-gray-100 px-4 py-2 rounded text-sm font-bold transition">
                          Rejestracja
                      </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MODAL KOSZYKA */}
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
    </>
  );
};

export default Navbar;