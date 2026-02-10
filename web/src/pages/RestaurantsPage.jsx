import React, { useState, useEffect } from 'react';
import RestaurantsList from '../components/RestaurantsList/RestaurantsList';
import MapComponent from '../components/Map/Map';
import Modal from '../components/Modal/Modal';
import MenuModal from '../components/MenuModal/MenuModal'; // ← DODAJ IMPORT

const RestaurantsPage = () => {
    const token = localStorage.getItem("access_token");

    // DANE
    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [user, setUser] = useState(null);
    const [addresses, setAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [restaurant, setRestaurant] = useState(null);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null)

    // MODAL ADRESU
    const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: "", city: "", street: "", number: "" });

    // DODAJEMY STAN DLA MENU MODAL
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuProducts, setMenuProducts] = useState([]);
    const [menuRestaurant, setMenuRestaurant] = useState(null);

    useEffect(() => {
        fetchRestaurants();
        fetchUserData();
        fetchAdditionalAddresses();
    }, []);

    useEffect(() => {
    if (!selectedRestaurant) return;

    const fetchRestaurantReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(
                `http://127.0.0.1:8000/restaurants/${selectedRestaurant.id}/reviews`
            );
            if (!res.ok) throw new Error("Nie udało się pobrać opinii");
            const data = await res.json();
            setReviews(data); // zapisujemy opinie w stanie
        } catch (err) {
            setError(err.message);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    };

    fetchRestaurantReviews();
}, [selectedRestaurant]);


    // --- FUNKCJE FETCH ---
    const fetchRestaurants = async () => {
        try {
            const res = await fetch("http://127.0.0.1:8000/restaurants");
            if (res.ok) setRestaurants(await res.json());
        } catch (e) {
            console.error("Błąd pobierania restauracji:", e);
        }
    };

    const fetchUserData = async () => {
        if (!token) return;
        try {
            const res = await fetch("http://127.0.0.1:8000/users/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setUser(data);
                setSelectedAddress({
                    type: "main",
                    full: `${data.street}, ${data.city}`,
                    ...data
                });
            }
        } catch (e) {
            console.error("Błąd pobierania danych użytkownika:", e);
        }
    };

    const fetchAdditionalAddresses = async () => {
        if (!token) return;
        try {
            const res = await fetch("http://127.0.0.1:8000/users/addresses", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            if (res.ok) setAddresses(await res.json());
        } catch (e) {
            console.error("Błąd pobierania adresów:", e);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://127.0.0.1:8000/users/addresses", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(newAddress)
            });
            if (res.ok) {
                const newAddr = await res.json();
                setAddresses([...addresses, newAddr]);
                setIsAddressModalOpen(false);
                setNewAddress({ name: "", city: "", street: "", number: "" });
            }
        } catch (e) {
            alert("Błąd dodawania adresu");
        }
    };

    // --- NOWA FUNKCJA DO OTWIERANIA MENU ---
    const handleOpenMenu = async (restaurant) => {
        setMenuRestaurant(restaurant);
        setIsMenuOpen(true);
        setMenuProducts([]);
        setSelectedRestaurant(restaurant);


        try {
            const res = await fetch(`http://127.0.0.1:8000/restaurants/${restaurant.id}/products`);
            if (res.ok) {
                const products = await res.json();
                setMenuProducts(products);
            }
        } catch (err) {
            console.error("Błąd pobierania menu:", err);
        }
    };

    return (
        <div className="h-[calc(100vh-64px)] bg-gray-50 dark:bg-gray-900 overflow-hidden flex flex-col">
            
            {/* MENU MODAL (dodajemy na początku) */}
            <MenuModal 
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                restaurant={menuRestaurant}
                products={menuProducts}
                reviews={reviews} 
            />

            {/* GŁÓWNY UKŁAD */}
            <div className="h-full w-full max-w-7xl mx-auto p-4 grid grid-cols-1 lg:grid-cols-3 gap-4">
                
                {/* 1. LEWA KOLUMNA: LISTA */}
                <div className="lg:col-span-1 h-full overflow-hidden rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm bg-white dark:bg-gray-800">
                    <RestaurantsList 
                        restaurants={restaurants} 
                        onSelectRestaurant={setSelectedRestaurant} 
                        selectedId={selectedRestaurant?.id}
                        onShowMenu={handleOpenMenu} // ← PRZEKAZUJEMY FUNKCJĘ
                    />
                </div>

                {/* 2. PRAWA KOLUMNA: ADRESY + MAPA */}
                <div className="lg:col-span-2 flex flex-col gap-4 h-full overflow-hidden">
                    
                    {/* PANEL ADRESOWY */}
                    <div className="shrink-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border border-gray-200 dark:border-gray-700">
                        <div className="flex justify-between items-center mb-2">
                            <div>
                                <h2 className="text-xs text-gray-500 uppercase font-bold tracking-wider">Adres dostawy:</h2>
                                <div className="text-lg font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                    <span>📍</span> 
                                    {selectedAddress ? selectedAddress.full : "Zaloguj się, aby wybrać"}
                                </div>
                            </div>
                            {user && (
                                <button 
                                    onClick={() => setIsAddressModalOpen(true)} 
                                    className="bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm font-bold hover:bg-purple-700 transition shadow"
                                >
                                    + Dodaj
                                </button>
                            )}
                        </div>
                        
                        {/* Kafelki adresów */}
                        {user && (
                            <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
                                <div 
                                    onClick={() => setSelectedAddress({ 
                                        type: 'main', 
                                        full: `${user.street}, ${user.city}`, 
                                        ...user 
                                    })} 
                                    className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                                        selectedAddress?.type === 'main' 
                                            ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' 
                                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                    }`}
                                >
                                    🏠 Dom
                                </div>
                                {addresses.map(a => (
                                    <div 
                                        key={a.id} 
                                        onClick={() => setSelectedAddress({ 
                                            ...a, 
                                            full: `${a.street} ${a.number}, ${a.city}` 
                                        })} 
                                        className={`cursor-pointer px-3 py-1.5 rounded-lg text-sm font-medium border transition ${
                                            selectedAddress?.id === a.id 
                                                ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-500 text-purple-700 dark:text-purple-300' 
                                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                                        }`}
                                    >
                                        🏢 {a.name}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* MAPA */}
                    <div className="flex-1 min-h-0 bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden relative border border-gray-200 dark:border-gray-700">
                        <MapComponent 
                            restaurants={restaurants} 
                            selectedRestaurant={selectedRestaurant}
                            onSelect={setSelectedRestaurant} // to już masz
                            onShowMenu={handleOpenMenu} // ← DODAJEMY FUNKCJĘ
                        />
                    </div>
                </div>
            </div>

            {/* MODAL ADRESU */}
            <Modal 
                isOpen={isAddressModalOpen} 
                onClose={() => setIsAddressModalOpen(false)} 
                title="Nowy Adres"
            >
                <form onSubmit={handleAddAddress} className="space-y-3">
                    <input 
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" 
                        placeholder="Nazwa (np. Praca)" 
                        value={newAddress.name} 
                        onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} 
                        required 
                    />
                    <input 
                        className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" 
                        placeholder="Miasto" 
                        value={newAddress.city} 
                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} 
                        required 
                    />
                    <div className="flex gap-2">
                        <input 
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" 
                            placeholder="Ulica" 
                            value={newAddress.street} 
                            onChange={e => setNewAddress({ ...newAddress, street: e.target.value })} 
                            required 
                        />
                        <input 
                            className="w-full p-2 border rounded dark:bg-gray-700 dark:text-white" 
                            placeholder="Nr" 
                            value={newAddress.number} 
                            onChange={e => setNewAddress({ ...newAddress, number: e.target.value })} 
                            required 
                        />
                    </div>
                    <button className="w-full bg-purple-600 hover:bg-purple-700 text-white p-2 rounded-lg font-bold mt-2">
                        Zapisz
                    </button>
                </form>
            </Modal>
        </div>
    );
};

export default RestaurantsPage;