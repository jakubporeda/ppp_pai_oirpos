import React, { useState, useEffect } from "react";
import Modal from "../components/Modal/Modal";
import { useNavigate } from "react-router-dom";

// Kategorie kuchni i menu (bez zmian)
const RESTAURANT_CATEGORIES = [
  "Italian", "Japanese", "American", "Chinese", "Mexican",
  "Indian", "French", "Mediterranean", "Thai", "Fast Food", "Vegetarian", "Polish", "Burger", "Pizza", "Sushi"
];

const MENU_CATEGORIES = [
    "Przystawka", "Zupa", "Danie główne", "Dodatek", "Deser", "Napój"
];

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");
  const userRole = localStorage.getItem("user_role");
  
  const normalizedRole = userRole ? userRole.trim().toLowerCase() : "";
  const hasAccess = normalizedRole === "właściciel" || normalizedRole === "owner" || normalizedRole === "admin";

  // --- STANY ---
  const [activeTab, setActiveTab] = useState('restaurants'); // 'restaurants' | 'orders' | 'reviews'

  // DANE
  const [restaurants, setRestaurants] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // SELEKCJA
  const [selectedRestaurant, setSelectedRestaurant] = useState(null); // Do edycji menu
  const [selectedRestaurantForOrders, setSelectedRestaurantForOrders] = useState(null); // Do podglądu zamówień
  
  // Opinie
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);
  const [selectedRestaurantForReviews, setSelectedRestaurantForReviews] = useState(null);


  // Loadingi
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);

  // Modale i Formularze (bez zmian)
  const [isRestModalOpen, setIsRestModalOpen] = useState(false);
  const [isProdModalOpen, setIsProdModalOpen] = useState(false);
  const [restForm, setRestForm] = useState({ 
      name: "", category: RESTAURANT_CATEGORIES[0], city: "", street: "", number: "", rating: 5.0 
  });
  const [editForm, setEditForm] = useState(null);
  const [prodForm, setProdForm] = useState({ 
      name: "", price: "", category: MENU_CATEGORIES[2] 
  });

  // Description
  const [isDescModalOpen, setIsDescModalOpen] = useState(false);
  const [savingDesc, setSavingDesc] = useState(false);
  const [descForm, setDescForm] = useState("");
  const [restaurantForDesc, setRestaurantForDesc] = useState(null);


  // --- ŁADOWANIE DANYCH (Zawsze ładujemy restauracje i zamówienia, żeby widzieć liczniki) ---
  useEffect(() => {
    if (hasAccess) {
        loadRestaurants();
        fetchOrders();
    }
    // eslint-disable-next-line
  }, [hasAccess]);

  // --- ŁADOWANIE RECENZJI PO PRZEŁĄCZENIU ZAKŁADKI ---
  useEffect(() => {
    if (activeTab === 'reviews') loadReviews();
  }, [activeTab]);

  const loadRestaurants = async () => {
    try {
      const res = await fetch(`http://127.0.0.1:8000/restaurants/mine`, {
          headers: { "Authorization": `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Failed to fetch restaurants");
      const data = await res.json();
      setRestaurants(data);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch("http://127.0.0.1:8000/orders/owner", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) { console.error("Błąd pobierania zamówień", error); }
    finally { setLoadingOrders(false); }
  };

  // --- LOGIKA LICZNIKÓW ---
  const getNewOrdersCount = (restaurantId) => {
      // Liczymy zamówienia o statusie 'confirmed' (czyli nowe, nieprzyjęte jeszcze do kuchni)
      return orders.filter(o => o.restaurant_id === restaurantId && o.status === 'confirmed').length;
  };

  // --- ZMIANA STATUSU ZAMÓWIENIA ---
  const handleStatusChange = async (orderId, newStatus) => {
  try {
    // Optymistyczna aktualizacja w UI
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));

    // Wyślij do backendu
    const res = await fetch(`http://127.0.0.1:8000/orders/${orderId}/status`, {
      method: "PATCH",
      headers: { 
        "Content-Type": "application/json", 
        "Authorization": `Bearer ${token}` 
      },
      body: JSON.stringify({ new_status: newStatus }) // <-- zmiana nazwy pola
    });

    if (!res.ok) throw new Error("Nie udało się zaktualizować statusu w backendzie");

  } catch (err) {
    alert(err.message);
    // rollback w przypadku błędu
    fetchOrders();
  }
};


  // --- OBSŁUGA WYBORU RESTAURACJI (MENU) ---
  const handleSelectRestaurant = async (restaurant) => {
    setSelectedRestaurant(restaurant);
    if (restaurant.status === 'rejected') {
        setEditForm({
            name: restaurant.name, category: restaurant.cuisines,
            city: restaurant.city, street: restaurant.street, number: restaurant.number
        });
        setProducts([]);
        return;
    }
    setLoadingProducts(true);
    try {
      const res = await fetch(`http://127.0.0.1:8000/restaurants/${restaurant.id}/products`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      console.error(err);
      setProducts([]);
    } finally {
      setLoadingProducts(false);
    }
  };

  // --- CRUD RESTAURACJI I PRODUKTÓW (Skrócone, bo to już działało) ---
  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    try {
        const payload = { ...restForm, cuisines: restForm.category };
        const res = await fetch("http://127.0.0.1:8000/restaurants/", {
            method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
            body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error("Error");
        const newRest = await res.json();
        setRestaurants([...restaurants, newRest]);
        setIsRestModalOpen(false);
        setRestForm({ name: "", category: RESTAURANT_CATEGORIES[0], city: "", street: "", number: "", rating: 5.0 });
    } catch (err) { alert("Błąd"); }
  };

  const handleUpdateRejected = async (e) => {
      e.preventDefault();
      // ... (Twoja stara logika)
      alert("Funkcja aktualizacji (kod skrócony dla czytelności)");
  };

  const handleRemoveRestaurant = async (e, restaurantId) => {
    e.stopPropagation();
    if (!window.confirm("Usunąć lokal?")) return;
    try {
        await fetch(`http://127.0.0.1:8000/restaurants/${restaurantId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
        setRestaurants(restaurants.filter(r => r.id !== restaurantId));
        if (selectedRestaurant?.id === restaurantId) setSelectedRestaurant(null);
        if (selectedRestaurantForOrders?.id === restaurantId) setSelectedRestaurantForOrders(null);
    } catch (err) { alert("Błąd"); }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!selectedRestaurant) return;
    try {
      const newProduct = { restaurant_id: selectedRestaurant.id, name: prodForm.name, price: Number(prodForm.price), category: prodForm.category };
      const res = await fetch("http://127.0.0.1:8000/restaurants/products", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` }, body: JSON.stringify(newProduct)
      });
      const created = await res.json();
      setProducts([...products, created]);
      setIsProdModalOpen(false);
      setProdForm({ name: "", price: "", category: MENU_CATEGORIES[2] });
    } catch (err) { alert("Błąd"); }
  };
  
  const handleRemoveProduct = async (productId) => {
    if(!window.confirm("Usunąć produkt?")) return;
    try {
      await fetch(`http://127.0.0.1:8000/restaurants/products/${productId}`, { method: "DELETE", headers: { "Authorization": `Bearer ${token}` } });
      setProducts(products.filter(p => p.id !== productId));
    } catch (err) { alert("Błąd"); }
  };

  const getStatusBadge = (status) => {
      switch(status) {
          case 'approved': return <span className="bg-green-100 text-green-800 text-xs font-bold px-2 py-0.5 rounded border border-green-200">Aktywna</span>;
          case 'rejected': return <span className="bg-red-100 text-red-800 text-xs font-bold px-2 py-0.5 rounded border border-red-200">Odrzucona</span>;
          default: return <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-2 py-0.5 rounded border border-yellow-200">Weryfikacja</span>;
      }
  };

  const translateStatus = (status) => {
    const map = { 'confirmed': '📝 Nowe', 'preparing': '🔥 W kuchni', 'delivery': '🛵 W drodze', 'completed': '✅ Zakończone', 'cancelled': '❌ Anulowane' };
    return map[status] || status;
  };

  if (!hasAccess) return <div className="p-10 text-center text-white">Brak dostępu.</div>;

  // Filtrowanie zamówień dla wybranej restauracji
  const filteredOrders = selectedRestaurantForOrders 
      ? orders.filter(o => o.restaurant_id === selectedRestaurantForOrders.id)
      : [];


  // Zaladuj opinie
  const loadReviews = async () => {
    setLoadingReviews(true);
    try {
        const res = await fetch("http://127.0.0.1:8000/orders/reviews/mine", {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!res.ok) throw new Error("Nie udało się pobrać recenzji");
        const data = await res.json();
        setReviews(data);
    } catch (err) {
        console.error(err);
        setReviews([]);
    } finally {
        setLoadingReviews(false);
    }
  };

  const handleSaveDescription = async (e) => {
    e.preventDefault();
    if (!restaurantForDesc) return;

    try {
        const res = await fetch(
        `http://127.0.0.1:8000/restaurants/${restaurantForDesc.id}`,
        {
            method: "PUT",
            headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ description: descForm })
        }
        );

        if (!res.ok) throw new Error("Błąd zapisu opisu");

        const updated = await res.json();

        // aktualizacja restauracji w stanie
        setRestaurants(prev =>
        prev.map(r => r.id === updated.id ? updated : r)
        );

        // jeśli aktualnie wybrana
        if (selectedRestaurant?.id === updated.id) {
        setSelectedRestaurant(updated);
        }

        setIsDescModalOpen(false);
        setDescForm("");
        setRestaurantForDesc(null);
    } catch (err) {
        alert(err.message);
    }
  };

    

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white p-6 pt-24">
      
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-purple-600 dark:text-purple-400">Panel Właściciela</h1>
          
          <div className="bg-white dark:bg-gray-800 p-1 rounded-lg border dark:border-gray-700 flex">
              <button 
                  onClick={() => setActiveTab('restaurants')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'restaurants' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-purple-600'}`}
              >
                  🏪 Restauracje i Menu
              </button>
              <button 
                  onClick={() => setActiveTab('orders')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition flex items-center gap-2 ${activeTab === 'orders' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-purple-600'}`}
              >
                  🛎️ Zamówienia
                  {/* Ogólny licznik nowych zamówień na przycisku */}
                  {orders.filter(o => o.status === 'confirmed').length > 0 && (
                      <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          {orders.filter(o => o.status === 'confirmed').length}
                      </span>
                  )}
              </button>
              <button 
                  onClick={() => setActiveTab('reviews')}
                  className={`px-4 py-2 rounded-md text-sm font-bold transition ${activeTab === 'reviews' ? 'bg-purple-600 text-white shadow' : 'text-gray-500 hover:text-purple-600'}`}
              >
                  ⭐ Recenzje
              </button>
          </div>
      </div>

      <div className="max-w-7xl mx-auto min-h-[500px]">
        
        {/* ================= ZAKŁADKA 1: RESTAURACJE I MENU (Bez zmian wizualnych) ================= */}
        {activeTab === 'restaurants' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    <div className="bg-purple-600 dark:bg-purple-800 p-4 flex justify-between items-center text-white">
                        <h2 className="text-xl font-bold">Twoje Lokale</h2>
                        <button onClick={() => setIsRestModalOpen(true)} className="w-8 h-8 flex items-center justify-center bg-white text-purple-600 rounded-full hover:bg-purple-100 transition text-2xl font-bold pb-1">+</button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {restaurants.length === 0 ? <p className="text-center text-gray-500 mt-4">Brak lokali.</p> : restaurants.map(r => (
                            <div key={r.id} onClick={() => handleSelectRestaurant(r)} className={`p-4 rounded-lg cursor-pointer flex justify-between items-center border ${selectedRestaurant?.id === r.id ? "bg-purple-50 border-purple-500 dark:bg-gray-700" : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`}>
                                <div className="overflow-hidden">
                                    <h3 className="font-bold truncate">{r.name}</h3>
                                    {getStatusBadge(r.status)}
                                </div>
                                {/* AKCJE */}
                                <div className="flex gap-1">
                                    {/* USUŃ */}
                                    <button
                                    onClick={(e) => handleRemoveRestaurant(e, r.id)}
                                    className="text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 p-2 rounded-full transition"
                                    title="Usuń lokal"
                                    >
                                    🗑️
                                    </button>

                                    {/* EDYTUJ OPIS */}
                                    <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setRestaurantForDesc(r);
                                        setDescForm(r.description || "");
                                        setIsDescModalOpen(true);
                                    }}
                                    className="text-blue-500 hover:bg-blue-100 dark:hover:bg-blue-900/30 p-2 rounded-full transition"
                                    title="Edytuj opis"
                                    >
                                    ✏️
                                    </button>
                                </div>
                            </div>
                        ))
                        }
                    </div>
                </div>

                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    {!selectedRestaurant ? (
                        <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2 p-10 text-center">
                            <span className="text-4xl"></span><p>Wybierz lokal, aby zarządzać menu</p>
                        </div>
                    ) : selectedRestaurant.status === 'rejected' ? (
                        <div className="p-8"><p className="text-red-500 font-bold">Wniosek odrzucony. Popraw dane.</p></div>
                    ) : (
                        <>
                            <div className="bg-gray-100 dark:bg-gray-700 p-4 flex justify-between items-center border-b dark:border-gray-600">
                                <h2 className="text-xl font-bold">Menu: {selectedRestaurant.name}</h2>
                                <button onClick={() => setIsProdModalOpen(true)} className="w-8 h-8 flex items-center justify-center bg-purple-600 text-white rounded-full font-bold">+</button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/50">
                                {loadingProducts ? <p>Ładowanie menu...</p> : products.length === 0 ? <p>Puste menu.</p> : (
                                    <ul className="space-y-2">{products.map(p => (
                                        <li key={p.id} className="flex justify-between items-center bg-white dark:bg-gray-700 p-4 rounded shadow-sm">
                                            <span>{p.name} ({p.category})</span>
                                            <div className="flex gap-4"><span className="text-purple-600 font-bold">{p.price} zł</span><button onClick={() => handleRemoveProduct(p.id)} className="text-red-500">✕</button></div>
                                        </li>
                                    ))}</ul>
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* ================= ZAKŁADKA 2: ZAMÓWIENIA (NOWY UKŁAD) ================= */}
        {activeTab === 'orders' && (
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
                
                {/* --- LEWA STRONA: LISTA RESTAURACJI Z LICZNIKAMI --- */}
                <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
                        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">Gdzie sprawdzamy?</h2>
                        <button onClick={fetchOrders} className="text-xs text-purple-600 font-bold hover:underline">Odśwież ↻</button>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto p-2 space-y-2">
                        {restaurants.length === 0 ? (
                            <p className="text-center text-gray-500 mt-4">Brak aktywnych restauracji.</p>
                        ) : (
                            restaurants.map(r => {
                                const newCount = getNewOrdersCount(r.id);
                                return (
                                    <div 
                                        key={r.id} 
                                        onClick={() => setSelectedRestaurantForOrders(r)}
                                        className={`p-4 rounded-lg cursor-pointer flex justify-between items-center border transition-all ${
                                            selectedRestaurantForOrders?.id === r.id 
                                            ? "bg-purple-50 border-purple-500 dark:bg-gray-700 dark:border-purple-500 shadow-md" 
                                            : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
                                        }`}
                                    >
                                        <div className="font-bold truncate text-gray-800 dark:text-white">
                                            {r.name}
                                        </div>
                                        
                                        {/* BADGE Z LICZBĄ NOWYCH ZAMÓWIEŃ */}
                                        {newCount > 0 ? (
                                            <div className="flex items-center justify-center w-6 h-6 bg-red-500 text-white text-xs font-bold rounded-full shadow-sm animate-bounce">
                                                {newCount}
                                            </div>
                                        ) : (
                                            <div className="text-xs text-gray-400">Brak nowych</div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>

                {/* --- PRAWA STRONA: LISTA ZAMÓWIEŃ DLA WYBRANEJ RESTAURACJI --- */}
                <div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
                    {!selectedRestaurantForOrders ? (
                        <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2 p-10 text-center">
                            <span className="text-4xl"></span>
                            <p className="text-lg">Wybierz restaurację z listy po lewej,</p>
                            <p className="text-sm">aby zobaczyć spływające do niej zamówienia.</p>
                        </div>
                    ) : (
                        <>
                            <div className="bg-purple-50 dark:bg-gray-700/50 p-4 border-b dark:border-gray-600 flex justify-between items-center">
                                <h2 className="text-xl font-bold text-gray-800 dark:text-white">
                                    Zamówienia: <span className="text-purple-600">{selectedRestaurantForOrders.name}</span>
                                </h2>
                                <span className="text-sm text-gray-500">
                                    Łącznie: {filteredOrders.length}
                                </span>
                            </div>

                            <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/40">
                                {loadingOrders ? (
                                    <p className="text-center mt-4">Ładowanie...</p>
                                ) : filteredOrders.length === 0 ? (
                                    <div className="text-center py-12 text-gray-400">
                                        <span className="text-5xl block mb-3">✅</span>
                                        <p>Wszystko zrobione! Brak aktywnych zamówień.</p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {filteredOrders.map((order) => (
                                            <div key={order.id} className={`border-l-4 rounded-r-xl p-5 shadow-sm bg-white dark:bg-gray-800 transition ${
                                                order.status === 'confirmed' ? 'border-red-500 ring-2 ring-red-100 dark:ring-red-900/20' : 
                                                order.status === 'preparing' ? 'border-blue-500' :
                                                order.status === 'delivery' ? 'border-yellow-500' : 
                                                'border-green-500'
                                            }`}>
                                                <div className="flex flex-col md:flex-row justify-between gap-6">
                                                    <div className="flex-1">
                                                        <div className="flex flex-wrap items-center gap-3 mb-3">
                                                            <span className="bg-gray-100 dark:bg-gray-700 text-xs font-mono font-bold px-2 py-1 rounded">#{order.id}</span>
                                                            <span className="text-sm text-gray-500">{new Date(order.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                            <span className={`text-sm font-bold px-2 py-0.5 rounded ${order.status === 'confirmed' ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-gray-100 text-gray-600'}`}>
                                                                {translateStatus(order.status)}
                                                            </span>
                                                        </div>
                                                        <div className="mb-3">
                                                            <div className="font-bold text-gray-800 dark:text-white">{order.delivery_address}</div>
                                                            {order.remarks && <div className="text-red-600 text-xs font-bold mt-1">Uwagi: {order.remarks}</div>}
                                                        </div>
                                                        <div className="space-y-1 pl-2 border-l-2 border-gray-100 dark:border-gray-700">
                                                            {order.items.map((item) => (
                                                                <div key={item.id} className="text-sm">
                                                                    <span className="font-bold text-purple-600 mr-2">{item.quantity}x</span>
                                                                    <span className="text-gray-700 dark:text-gray-300">{item.name}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex flex-col justify-between items-end gap-3 min-w-[140px]">
                                                        <div className="text-xl font-bold text-purple-600">{order.total_amount.toFixed(2)} zł</div>
                                                        <div className="w-full space-y-2">
                                                            {order.status === 'confirmed' && (
                                                                <button onClick={() => handleStatusChange(order.id, 'preparing')} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-bold text-sm shadow-md transition transform active:scale-95">
                                                                    🔥 Do kuchni
                                                                </button>
                                                            )}
                                                            {order.status === 'preparing' && (
                                                                <button onClick={() => handleStatusChange(order.id, 'delivery')} className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-bold text-sm shadow-md transition transform active:scale-95">
                                                                    🛵 Wydaj
                                                                </button>
                                                            )}
                                                            {(order.status === 'confirmed' || order.status === 'preparing') && (
                                                                <button className="text-gray-400 hover:text-red-500 text-xs underline w-full text-center">Anuluj</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>
             </div>

            
        )}

          {/* ================= ZAKŁADKA 3: RECENZJE ================= */}
{activeTab === 'reviews' && (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[calc(100vh-200px)]">

    {/* --- LEWA STRONA: LISTA RESTAURACJI --- */}
    <div className="md:col-span-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
      <div className="bg-gray-100 dark:bg-gray-700 p-4 border-b border-gray-200 dark:border-gray-600 flex justify-between items-center">
        <h2 className="text-lg font-bold text-gray-700 dark:text-gray-200">Gdzie sprawdzamy?</h2>
        <button onClick={loadReviews} className="text-xs text-purple-600 font-bold hover:underline">Odśwież ↻</button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {restaurants.length === 0 ? (
          <p className="text-center text-gray-500 mt-4">Brak aktywnych restauracji.</p>
        ) : (
          restaurants.map(r => (
            <div
              key={r.id}
              onClick={() => setSelectedRestaurantForReviews(r)}
              className={`p-4 rounded-lg cursor-pointer flex justify-between items-center border transition-all ${
                selectedRestaurantForReviews?.id === r.id 
                  ? "bg-purple-50 border-purple-500 dark:bg-gray-700 dark:border-purple-500 shadow-md" 
                  : "bg-white border-gray-200 dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <div className="font-bold truncate text-gray-800 dark:text-white">{r.name}</div>
            </div>
          ))
        )}
      </div>
    </div>

    {/* --- PRAWA STRONA: RECENZJE WYBRANEJ RESTAURACJI --- */}
<div className="md:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col overflow-hidden">
  {!selectedRestaurantForReviews ? (
    <div className="flex h-full items-center justify-center text-gray-400 flex-col gap-2 p-10 text-center">
      <p className="text-lg">Wybierz restaurację z listy po lewej,</p>
      <p className="text-sm">aby zobaczyć recenzje.</p>
    </div>
  ) : (
    <>
      {/* Nagłówek */}
      <div className="bg-purple-50 dark:bg-gray-700/50 p-4 border-b dark:border-gray-600 flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800 dark:text-white">
          Recenzje: <span className="text-purple-600">{selectedRestaurantForReviews.name}</span>
        </h2>
        <span className="text-sm text-gray-500">
          Łącznie: {reviews.filter(r => r.restaurant_id === selectedRestaurantForReviews.id).length}
        </span>
      </div>

      {/* Tabela recenzji */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900/40">
        {loadingReviews ? (
          <p className="text-center mt-4">Ładowanie recenzji...</p>
        ) : reviews.filter(r => r.restaurant_id === selectedRestaurantForReviews.id).length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <span className="text-5xl block mb-3">📭</span>
            <p>Brak recenzji dla tej restauracji.</p>
          </div>
        ) : (
          <table className="w-full table-auto border-collapse text-left">
            <thead>
              <tr className="bg-gray-200 dark:bg-gray-700">
                <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Zamówione produkty</th>
                <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Ocena</th>
                <th className="px-4 py-2 border-b border-gray-300 dark:border-gray-600">Komentarz</th>
              </tr>
            </thead>
            <tbody>
              {reviews
                .filter(r => r.restaurant_id === selectedRestaurantForReviews.id)
                .map(r => (
                  <tr key={r.id} className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      {r.items && r.items.length > 0
                        ? r.items.map(i => `${i.name} x${i.quantity}`).join(", ")
                        : "Brak danych"}
                    </td>
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 text-yellow-500 font-bold">
                      {r.rating.toFixed(1)} ⭐
                    </td>
                    <td className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                      {r.comment || "Brak komentarza"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  )}
</div>

  </div>
)}





      </div>

      {/* --- MODALE (BEZ ZMIAN) --- */}
      <Modal isOpen={isRestModalOpen} onClose={() => setIsRestModalOpen(false)} title="Nowa restauracja">
        <form onSubmit={handleAddRestaurant} className="space-y-4">
            <input type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={restForm.name} onChange={e => setRestForm({...restForm, name: e.target.value})} required placeholder="Nazwa" />
            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={restForm.category} onChange={e => setRestForm({...restForm, category: e.target.value})}>
                {RESTAURANT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={restForm.city} onChange={e => setRestForm({...restForm, city: e.target.value})} required placeholder="Miasto" />
            <input type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={restForm.street} onChange={e => setRestForm({...restForm, street: e.target.value})} required placeholder="Ulica" />
            <input type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={restForm.number} onChange={e => setRestForm({...restForm, number: e.target.value})} required placeholder="Nr" />
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded">Wyślij wniosek</button>
        </form>
      </Modal>

      <Modal isOpen={isProdModalOpen} onClose={() => setIsProdModalOpen(false)} title="Dodaj produkt">
        <form onSubmit={handleAddProduct} className="space-y-4">
            <select className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={prodForm.category} onChange={e => setProdForm({...prodForm, category: e.target.value})}>
                {MENU_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
            <input type="text" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={prodForm.name} onChange={e => setProdForm({...prodForm, name: e.target.value})} required placeholder="Nazwa" />
            <input type="number" step="0.01" className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" value={prodForm.price} onChange={e => setProdForm({...prodForm, price: e.target.value})} required placeholder="Cena" />
            <button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded">Dodaj</button>
        </form>
      </Modal>
      
      <Modal isOpen={isDescModalOpen} onClose={() => setIsDescModalOpen(false)} title="Edytuj opis restauracji">
        <form onSubmit={handleSaveDescription} className="space-y-4">
            <textarea
            value={descForm}
            onChange={(e) => setDescForm(e.target.value)}
            rows={5}
            placeholder="Wpisz opis restauracji..."
            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-3">
            <button
                type="button"
                onClick={() => setIsDescModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200"
            >
                Anuluj
            </button>
            <button
                type="submit"
                disabled={savingDesc}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            >
                {savingDesc ? "Zapisywanie..." : "Zapisz"}
            </button>
            </div>
        </form>
      </Modal>


    </div>
  );
};

export default Dashboard;