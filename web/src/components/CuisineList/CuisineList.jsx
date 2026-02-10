import React, { useState, useEffect } from "react";
import MenuModal from '../MenuModal/MenuModal';

const CuisineList = () => {
  const [cuisines, setCuisines] = useState([]);
  const [restaurants, setRestaurants] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Nowe stany dla MenuModal
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuProducts, setMenuProducts] = useState([]);
  const [menuRestaurant, setMenuRestaurant] = useState(null);

  useEffect(() => {
    const fetchCuisines = async () => {
      try {
        const res = await fetch("http://127.0.0.1:8000/restaurants/cuisines");
        const data = await res.json();
        setCuisines(data);
      } catch (err) {
        console.error("Błąd pobierania kuchni:", err);
      }
    };

    fetchCuisines();
  }, []);

  const fetchRestaurants = async (cuisine) => {
    setLoading(true);
    try {
      const url = cuisine
        ? `http://127.0.0.1:8000/restaurants?cuisine=${encodeURIComponent(cuisine)}`
        : "http://127.0.0.1:8000/restaurants";
      const res = await fetch(url);
      const data = await res.json();
      setRestaurants(data);
    } catch (err) {
      console.error("Błąd pobierania restauracji:", err);
      setRestaurants([]);
    }
    setLoading(false);
  };

  // --- NOWA FUNKCJA: Otwieranie menu z pobieraniem produktów ---
  const handleOpenMenu = async (restaurant) => {
    setMenuRestaurant(restaurant);
    setMenuProducts([]); 
    setIsMenuOpen(true); 

    try {
      const res = await fetch(`http://127.0.0.1:8000/restaurants/${restaurant.id}/products`);
      if (res.ok) {
        const products = await res.json();
        setMenuProducts(products);
      }
    } catch (err) {
      console.error("Błąd menu:", err);
    }
  };

  const handleCuisineClick = (cuisine) => {
    const newCuisine = selectedCuisine === cuisine ? null : cuisine;
    setSelectedCuisine(newCuisine);
    setIsMenuOpen(false); // Zamknij menu przy zmianie kuchni
    fetchRestaurants(newCuisine);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto min-h-screen bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <h1 className="text-3xl font-bold text-center text-purple-700 mb-8">
        Wybierz Kuchnię
      </h1>

      {/* MODAL MENU (globalny) */}
      <MenuModal 
        isOpen={isMenuOpen} 
        onClose={() => setIsMenuOpen(false)}
        restaurant={menuRestaurant}
        products={menuProducts}
      />

      {/* LISTA KUCHNI */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {cuisines.map((cuisine) => (
          <button
            key={cuisine}
            onClick={() => handleCuisineClick(cuisine)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition
              ${selectedCuisine === cuisine
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-100"
              }`}
          >
            {cuisine}
          </button>
        ))}
      </div>

      {/* RESTAURACJE */}
      {loading ? (
        <p className="text-center">Ładowanie...</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {restaurants.map((restaurant) => (
            <div key={restaurant.id} className="bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700">
              <div className="p-5">
                <h3 className="font-bold text-lg text-gray-800 dark:text-white">{restaurant.name}</h3>

                <div className="flex flex-wrap gap-2 mt-2 mb-4">
                  {restaurant.cuisines.split(",").map((c, idx) => (
                    <span key={idx} className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                      {c.trim()}
                    </span>
                  ))}
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                  <span className="font-semibold">📍</span> {restaurant.street} {restaurant.number}, {restaurant.city}
                </p>
                
                <div className="flex justify-between items-center mt-4">
                  <span className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs font-bold px-2 py-1 rounded-lg">
                    {restaurant.rating} ⭐
                  </span>
                  
                  {/* PRZYCISK DO OTWIERANIA MENU - TAK SAMO JAK W RestaurantsList */}
                  <button 
                    onClick={() => handleOpenMenu(restaurant)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition"
                  >
                    Zobacz Menu
                  </button>
                </div>
              </div>
            </div>
          ))}

          {restaurants.length === 0 && selectedCuisine && (
            <p className="col-span-full text-center text-gray-500 dark:text-gray-400">
              Brak restauracji dla kuchni: {selectedCuisine}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CuisineList;