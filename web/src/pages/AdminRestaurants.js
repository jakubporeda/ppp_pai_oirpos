import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Kategorie do listy rozwijanej w edycji
const RESTAURANT_CATEGORIES = [
  "Italian", "Japanese", "American", "Chinese", "Mexican",
  "Indian", "French", "Mediterranean", "Thai", "Fast Food", "Vegetarian", "Polish", "Burger", "Pizza", "Sushi"
];

const AdminRestaurants = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filtry
  const [searchTerm, setSearchTerm] = useState("");
  const [cuisineFilter, setCuisineFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");

  // Modal Edycji
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRest, setCurrentRest] = useState(null);
  const [formData, setFormData] = useState({
      name: "",
      cuisines: "",
      city: "",
      street: "",
      number: "",
      rating: 5.0
  });

  // 1. POBIERANIE WSZYSTKICH RESTAURACJI
  const fetchRestaurants = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/restaurants/all', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Błąd pobierania");
      const data = await response.json();
      setRestaurants(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRestaurants();
  }, []);

  // --- OBSŁUGA MODALA EDYCJI ---
  const openEditModal = (restaurant) => {
    setCurrentRest(restaurant);
    setFormData({
        name: restaurant.name,
        cuisines: restaurant.cuisines,
        city: restaurant.city,
        street: restaurant.street,
        number: restaurant.number,
        rating: restaurant.rating
    });
    setIsModalOpen(true);
  };

  const saveChanges = async () => {
    if (!currentRest) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/restaurants/${currentRest.id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const updated = await response.json();
            setRestaurants(restaurants.map(r => r.id === currentRest.id ? updated : r));
            setIsModalOpen(false);
            setCurrentRest(null);
            alert("Zapisano zmiany!");
        } else {
            alert("Błąd zapisu.");
        }
    } catch (e) {
        console.error(e);
        alert("Błąd połączenia.");
    }
  };

  // --- USUWANIE ---
  const handleDelete = async (id) => {
    if(!window.confirm("Czy na pewno chcesz usunąć tę restaurację? Ta operacja jest nieodwracalna.")) return;

    try {
        const response = await fetch(`http://127.0.0.1:8000/restaurants/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            setRestaurants(restaurants.filter(r => r.id !== id));
        } else {
            alert("Błąd usuwania.");
        }
    } catch (e) {
        alert("Błąd połączenia.");
    }
  };

  // --- FILTROWANIE (Zmienione) ---
  const filteredRestaurants = restaurants.filter(r => {
    // 1. Warunek: Nie pokazuj odrzuconych
    if (r.status === 'rejected') return false;

    // 2. Reszta filtrów
    const term = searchTerm.toLowerCase();
    const matchesSearch = r.name.toLowerCase().includes(term);
    const matchesCuisine = cuisineFilter === "all" || r.cuisines.includes(cuisineFilter);
    const matchesCity = cityFilter === "" || r.city.toLowerCase().includes(cityFilter.toLowerCase());

    return matchesSearch && matchesCuisine && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Zarządzanie Restauracjami</h1>
            <div className="flex gap-4">
                <button 
                    onClick={fetchRestaurants}
                    className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full transition"
                    title="Odśwież"
                >
                    🔄
                </button>
                <button onClick={() => navigate('/admin')} className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg border border-gray-600 transition">
                    &larr; Panel
                </button>
            </div>
        </div>

        {/* FILTRY */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
                type="text" placeholder="Szukaj nazwy..." 
                className="p-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-purple-500 outline-none"
                value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
            />
            <select 
                className="p-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-purple-500 outline-none"
                value={cuisineFilter} onChange={(e) => setCuisineFilter(e.target.value)}
            >
                <option value="all">Wszystkie kuchnie</option>
                {RESTAURANT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                ))}
            </select>
            <input 
                type="text" placeholder="Filtruj po mieście..." 
                className="p-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-purple-500 outline-none"
                value={cityFilter} onChange={(e) => setCityFilter(e.target.value)}
            />
        </div>

        {/* TABELA */}
        <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-900/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Nazwa</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Kuchnia</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Adres</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Miasto</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Akcje</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-700">
                        {loading ? (
                            <tr><td colSpan="6" className="text-center py-10">Ładowanie...</td></tr>
                        ) : filteredRestaurants.length === 0 ? (
                            <tr><td colSpan="6" className="text-center py-10 text-gray-500">Brak restauracji spełniających kryteria.</td></tr>
                        ) : filteredRestaurants.map((rest) => (
                            <tr key={rest.id} className="hover:bg-gray-700/50 transition">
                                <td className="px-6 py-4 font-bold text-white">{rest.name}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">
                                    <span className="px-2 py-1 bg-purple-900/30 text-purple-200 border border-purple-800 rounded text-xs">
                                        {rest.cuisines}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-300">ul. {rest.street} {rest.number}</td>
                                <td className="px-6 py-4 text-sm text-gray-300">{rest.city}</td>
                                <td className="px-6 py-4 text-sm">
                                    {rest.status === 'approved' ? <span className="text-green-400 font-bold">Aktywna</span> : 
                                     rest.status === 'pending' ? <span className="text-yellow-400 font-bold">Oczekuje</span> : 
                                     <span className="text-red-400">Odrzucona</span>}
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button onClick={() => openEditModal(rest)} className="text-purple-400 hover:text-purple-300 mr-4 font-bold">Edytuj</button>
                                    <button onClick={() => handleDelete(rest.id)} className="text-red-500 hover:text-red-400 font-bold">Usuń</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>

        {/* MODAL EDYCJI */}
        {isModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
                <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 w-full max-w-lg p-6">
                    <h2 className="text-2xl font-bold text-white mb-6">Edytuj Restaurację</h2>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="text-gray-400 text-sm">Nazwa</label>
                            <input 
                                type="text" className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                                value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="text-gray-400 text-sm">Kuchnia</label>
                            <select 
                                className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                                value={formData.cuisines} onChange={e => setFormData({...formData, cuisines: e.target.value})}
                            >
                                {RESTAURANT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm">Miasto</label>
                                <input 
                                    type="text" className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                                    value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Ulica</label>
                                <input 
                                    type="text" className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                                    value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-gray-400 text-sm">Numer</label>
                                <input 
                                    type="text" className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                                    value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="text-gray-400 text-sm">Ocena (Rating)</label>
                                <input 
                                    type="number" step="0.1" className="w-full p-2 bg-gray-900 border border-gray-600 rounded text-white"
                                    value={formData.rating} onChange={e => setFormData({...formData, rating: parseFloat(e.target.value)})}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-8">
                        <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600">Anuluj</button>
                        <button onClick={saveChanges} className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 font-bold shadow-lg">Zapisz Zmiany</button>
                    </div>
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default AdminRestaurants;