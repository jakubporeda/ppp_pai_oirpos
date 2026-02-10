import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Filtry
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedRole, setSelectedRole] = useState("user");

  const navigate = useNavigate();

  // 1. POBIERANIE DANYCH (Teraz używane też przez przycisk Odśwież)
  const fetchUsers = async () => {
    setLoading(true); // Włączamy loader na chwilę
    try {
      const response = await fetch('http://127.0.0.1:8000/users/');
      if (!response.ok) throw new Error("Błąd pobierania");
      const data = await response.json();
      setUsers(data);
    } catch (err) {
      setError("Nie udało się pobrać listy użytkowników.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // --- LOGIKA MODALA (Bez zmian) ---
  const openRoleModal = (user) => {
    setCurrentUser(user);
    setSelectedRole(user.role);
    setIsModalOpen(true);
  };

  const saveRoleChange = async () => {
    if (!currentUser) return;
    try {
      const response = await fetch(`http://127.0.0.1:8000/users/${currentUser.id}/role?role=${selectedRole}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' }
      });

      if (response.ok) {
        setUsers(users.map(u => 
            u.id === currentUser.id ? { ...u, role: selectedRole } : u
        ));
        setIsModalOpen(false);
        setCurrentUser(null);
      } else {
        alert("Błąd podczas zmiany roli.");
      }
    } catch (e) {
      alert("Błąd połączenia z serwerem.");
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Czy na pewno chcesz trwale usunąć tego użytkownika?")) {
      try {
        const response = await fetch(`http://127.0.0.1:8000/users/${userId}`, {
          method: 'DELETE'
        });
        if (response.ok) {
          setUsers(users.filter(user => user.id !== userId));
        } else {
          alert("Błąd podczas usuwania.");
        }
      } catch (e) {
        alert("Błąd połączenia.");
      }
    }
  };

  // Filtrowanie (Bez zmian)
  const filteredUsers = users.filter(user => {
    const term = searchTerm.toLowerCase();
    const fullName = (user.first_name + " " + user.last_name).toLowerCase();
    const email = user.email.toLowerCase();
    
    const matchesSearch = fullName.includes(term) || email.includes(term);
    const matchesRole = roleFilter === "all" || user.role === roleFilter;
    const matchesCity = cityFilter === "" || (user.city && user.city.toLowerCase().includes(cityFilter.toLowerCase()));

    return matchesSearch && matchesRole && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* NAGŁÓWEK */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div>
                <h1 className="text-3xl font-bold text-white">Zarządzanie Użytkownikami</h1>
                <p className="text-gray-400">Baza danych: {users.length} użytkowników</p>
            </div>
            
            {/* --- PRZYCISK ODŚWIEŻ --- */}
            <button 
                onClick={fetchUsers}
                title="Odśwież listę"
                className="p-2 bg-gray-800 hover:bg-gray-700 border border-gray-600 rounded-full transition shadow-lg group"
            >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" 
                     className={`w-6 h-6 text-purple-400 group-hover:text-white transition ${loading ? 'animate-spin' : ''}`}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
            </button>
          </div>

          <button onClick={() => navigate('/admin')} className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg border border-gray-600 transition">
            &larr; Wróć do Panelu
          </button>
        </div>

        {/* FILTRY */}
        <div className="bg-gray-800 p-6 rounded-xl shadow-lg border border-gray-700 mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input 
            type="text" placeholder="Szukaj (Imię, Nazwisko, Email)..." 
            className="p-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-purple-500 outline-none"
            value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select 
            className="p-3 rounded-lg bg-gray-900 border border-gray-700 text-white focus:border-purple-500 outline-none"
            value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">Wszystkie role</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="właściciel">Właściciel</option>
          </select>
          <input 
            type="text" placeholder="Miasto..." 
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
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Użytkownik</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Rola</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Miasto</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Akcje</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {loading ? (
                    <tr><td colSpan="5" className="text-center py-10 text-gray-500">Ładowanie danych...</td></tr>
                ) : filteredUsers.length === 0 ? (
                    <tr><td colSpan="5" className="text-center py-10 text-gray-500">Brak wyników.</td></tr>
                ) : (
                    filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4 whitespace-nowrap flex items-center">
                        <div className="h-8 w-8 rounded-full bg-purple-900/50 text-purple-300 flex items-center justify-center font-bold mr-3 border border-purple-700">
                            {user.first_name?.[0]}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-white">{user.first_name} {user.last_name}</div>
                        </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.email}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${
                            user.role === 'admin' ? 'bg-red-900/30 text-red-200 border-red-800' : 
                            user.role === 'właściciel' ? 'bg-purple-900/30 text-purple-200 border-purple-800' : 
                            'bg-green-900/30 text-green-200 border-green-800'
                        }`}>
                            {user.role}
                        </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{user.city || "-"}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button onClick={() => openRoleModal(user)} className="text-purple-400 hover:text-purple-300 mr-4 font-bold">Edytuj</button>
                        <button onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-400 font-bold">Usuń</button>
                        </td>
                    </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* MODAL (Pop-up) - bez zmian w logice */}
        {isModalOpen && currentUser && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-700 w-full max-w-md p-6 transform transition-all scale-100">
              <h2 className="text-2xl font-bold text-white mb-4">Zmiana roli</h2>
              <p className="text-gray-400 mb-6">Użytkownik: <span className="text-purple-400 font-semibold">{currentUser.first_name} {currentUser.last_name}</span></p>
              <div className="mb-6">
                <label className="block text-gray-400 text-sm font-bold mb-2">Nowa rola:</label>
                <select value={selectedRole} onChange={(e) => setSelectedRole(e.target.value)} className="w-full p-3 rounded-lg bg-gray-900 border border-gray-600 text-white outline-none focus:border-purple-500">
                  <option value="user">Użytkownik</option>
                  <option value="właściciel">Właściciel</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 transition">Anuluj</button>
                <button onClick={saveRoleChange} className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 font-bold shadow-lg transition">Zapisz</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminUsers;