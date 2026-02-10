import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminApplications = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("access_token");

  // Zakładki: 'new' (nowe wnioski) | 'history' (historia)
  const [activeTab, setActiveTab] = useState("new");

  const [applications, setApplications] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [combinedRequests, setCombinedRequests] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- STANY MODALA ODRZUCENIA ---
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingType, setRejectingType] = useState(""); // "restaurant" lub "owner"

  // 1. Pobieranie nowych wniosków restauracji
  const fetchNewApplications = async () => {
    try {
      const response = await fetch('http://127.0.0.1:8000/restaurants/applications', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Błąd pobierania wniosków restauracji");
      const data = await response.json();
      return data.map(app => ({
        ...app,
        type: "restaurant",
        displayId: `R#${app.id}`
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // 2. Pobieranie wniosków restauratora
  const fetchOwnerRequests = async () => {
    try {
      const response = await fetch(
        "http://127.0.0.1:8000/users/owner-requests",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error("Błąd pobierania wniosków restauratora");
      const data = await response.json();
      return data.map(user => ({
        ...user,
        type: "owner",
        displayId: `U#${user.id}`
      }));
    } catch (err) {
      console.error(err);
      return [];
    }
  };

  // 3. Pobieranie i łączenie wszystkich nowych wniosków
  const fetchAllNewRequests = async () => {
    setLoading(true);
    try {
      const [restaurantApps, ownerApps] = await Promise.all([
        fetchNewApplications(),
        fetchOwnerRequests()
      ]);
      
      // Łączymy i sortujemy po ID malejąco (najnowsze pierwsze)
      const allRequests = [...restaurantApps, ...ownerApps]
        .sort((a, b) => b.id - a.id);
      
      setCombinedRequests(allRequests);
      setApplications(restaurantApps.filter(app => app.type === "restaurant"));
      setOwnerRequests(ownerApps.filter(app => app.type === "owner"));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 4. Pobieranie historii restauracji
  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/restaurants/applications/history', {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (!response.ok) throw new Error("Błąd pobierania historii");
      const data = await response.json();
      setHistory(data.map(app => ({
        ...app,
        type: "restaurant",
        displayId: `R#${app.id}`
      })));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "new") {
      fetchAllNewRequests();
    } else {
      fetchHistory();
    }
  }, [activeTab]);

  // --- AKCJE DLA RESTAURACJI ---
  const handleApproveRestaurant = async (restaurantId) => {
    if (!window.confirm(`Zatwierdzić wniosek restauracji #${restaurantId}?`)) return;
    await sendRestaurantStatusUpdate(restaurantId, "approved", null);
  };

  const openRejectRestaurantModal = (restaurantId) => {
    setRejectingId(restaurantId);
    setRejectingType("restaurant");
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const sendRestaurantStatusUpdate = async (id, status, reason) => {
    try {
      const response = await fetch(`http://127.0.0.1:8000/restaurants/${id}/status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          status: status,
          rejection_reason: reason 
        })
      });

      if (response.ok) {
        // Usuwamy z listy combinedRequests
        setCombinedRequests(prev => prev.filter(req => 
          !(req.type === "restaurant" && req.id === id)
        ));
        // Usuwamy też z osobnej listy applications
        setApplications(prev => prev.filter(app => app.id !== id));
        alert(`Pomyślnie zmieniono status wniosku restauracji #${id} na: ${status === 'approved' ? 'ZATWIERDZONY' : 'ODRZUCONY'}`);
      } else {
        alert("Błąd API.");
      }
    } catch (err) {
      console.error(err);
      alert("Błąd połączenia.");
    }
  };

  // --- AKCJE DLA RESTAURATORA ---
  const decideOwner = async (userId, approve) => {
    try {
      const response = await fetch(
        `http://127.0.0.1:8000/users/${userId}/owner-decision?approve=${approve}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error("Błąd decyzji");

      // Usuwamy z listy combinedRequests
      setCombinedRequests(prev => prev.filter(req => 
        !(req.type === "owner" && req.id === userId)
      ));
      // Usuwamy też z osobnej listy ownerRequests
      setOwnerRequests(prev => prev.filter(user => user.id !== userId));
      
      alert(
        approve
          ? "Użytkownik został restauratorem"
          : "Wniosek został odrzucony"
      );
    } catch (err) {
      console.error(err);
      alert("Błąd API");
    }
  };

  const openRejectOwnerModal = (userId) => {
    setRejectingId(userId);
    setRejectingType("owner");
    setRejectionReason("");
    setIsRejectModalOpen(true);
  };

  const submitRejection = async () => {
    if (!rejectionReason.trim()) {
      alert("Podaj powód odrzucenia!");
      return;
    }
    
    if (rejectingType === "restaurant") {
      await sendRestaurantStatusUpdate(rejectingId, "rejected", rejectionReason);
    } else if (rejectingType === "owner") {
      await decideOwner(rejectingId, false);
    }
    
    setIsRejectModalOpen(false);
  };

  // --- FUNKCJE POMOCNICZE ---
  const getTypeBadge = (type) => {
    switch(type) {
      case "restaurant":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-900/30 text-blue-200 border border-blue-800">Restauracja</span>;
      case "owner":
        return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-900/30 text-purple-200 border border-purple-800">Restaurator</span>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 relative">
      <div className="max-w-7xl mx-auto">
        
        {/* NAGŁÓWEK */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-white">Centrum Wniosków</h1>
          <button onClick={() => navigate('/admin')} className="bg-gray-800 hover:bg-gray-700 text-white px-5 py-2 rounded-lg border border-gray-600 transition">
            &larr; Wróć do Panelu
          </button>
        </div>

        {/* ZAKŁADKI - TYLKO 2 TERAZ */}
        <div className="flex space-x-4 mb-8 border-b border-gray-700">
          <button 
            onClick={() => setActiveTab("new")}
            className={`pb-3 px-4 text-lg font-medium transition-colors relative ${
              activeTab === "new" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400 hover:text-white"
            }`}
          >
            Nowe wnioski
            {combinedRequests.length > 0 && (
              <span className="ml-2 bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {combinedRequests.length}
              </span>
            )}
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={`pb-3 px-4 text-lg font-medium transition-colors relative ${
              activeTab === "history" ? "text-purple-400 border-b-2 border-purple-400" : "text-gray-400 hover:text-white"
            }`}
          >
            Historia Decyzji
          </button>
        </div>

        {/* --- TABELA: NOWE WNIOSKI (POŁĄCZONE) --- */}
        {activeTab === "new" && (
          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
            {loading ? (
              <div className="p-10 text-center text-gray-400">
                Ładowanie wniosków...
              </div>
            ) : combinedRequests.length === 0 ? (
              <div className="p-10 text-center text-gray-400 flex flex-col items-center">
                <span className="text-5xl mb-4">✅</span>
                <h3 className="text-xl font-bold text-white">Brak nowych wniosków</h3>
                <p>Wszystko na bieżąco!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase w-20">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Typ</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Dane</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Wnioskodawca</th>
                      <th className="px-6 py-4 text-right text-xs font-bold text-gray-400 uppercase">Decyzja</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {combinedRequests.map((req) => (
                      <tr key={`${req.type}-${req.id}`} className="hover:bg-gray-700/50 transition">
                        {/* ID */}
                        <td className="px-6 py-4 text-gray-400 font-mono">
                          {req.displayId}
                        </td>
                        
                        {/* TYP WNIOSKU */}
                        <td className="px-6 py-4">
                          {getTypeBadge(req.type)}
                        </td>
                        
                        {/* DANE W ZALEŻNOŚCI OD TYPU */}
                        <td className="px-6 py-4">
                          {req.type === "restaurant" ? (
                            <>
                              <div className="font-bold text-white text-lg">{req.name}</div>
                              <div className="text-sm text-gray-400">{req.city}, {req.street} {req.number}</div>
                              <div className="text-xs text-gray-500 mt-1">Kuchnia: {req.cuisines}</div>
                            </>
                          ) : (
                            <>
                              <div className="font-bold text-white text-lg">{req.first_name} {req.last_name}</div>
                              <div className="text-sm text-gray-400">{req.email}</div>
                              <div className="text-xs text-gray-500 mt-1">Wniosek o zostanie restauratorem</div>
                            </>
                          )}
                        </td>
                        
                        {/* WNIOSKODAWCA */}
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {req.type === "restaurant" ? (
                            req.owner ? (
                              <div>
                                <div className="text-white">{req.owner.first_name} {req.owner.last_name}</div>
                                <div className="text-xs text-gray-500">{req.owner.email}</div>
                              </div>
                            ) : <span className="text-red-500">Brak danych</span>
                          ) : (
                            <div>
                              <div className="text-white">{req.first_name} {req.last_name}</div>
                              <div className="text-xs text-gray-500">{req.email}</div>
                            </div>
                          )}
                        </td>
                        
                        {/* PRZYCISKI AKCJI */}
                        <td className="px-6 py-4 text-right flex justify-end gap-3">
                          {req.type === "restaurant" ? (
                            <>
                              <button 
                                onClick={() => openRejectRestaurantModal(req.id)} 
                                className="px-3 py-1 bg-red-900/20 text-red-400 border border-red-800 rounded hover:bg-red-900/50 font-bold"
                              >
                                Odrzuć
                              </button>
                              <button 
                                onClick={() => handleApproveRestaurant(req.id)} 
                                className="px-3 py-1 bg-green-900/20 text-green-400 border border-green-800 rounded hover:bg-green-900/50 font-bold"
                              >
                                Zatwierdź
                              </button>
                            </>
                          ) : (
                            <>
                              <button 
                                onClick={() => openRejectOwnerModal(req.id)} 
                                className="px-3 py-1 bg-red-900/20 text-red-400 border border-red-800 rounded hover:bg-red-900/50 font-bold"
                              >
                                Odrzuć
                              </button>
                              <button 
                                onClick={() => decideOwner(req.id, true)} 
                                className="px-3 py-1 bg-green-900/20 text-green-400 border border-green-800 rounded hover:bg-green-900/50 font-bold"
                              >
                                Zatwierdź
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- TABELA: HISTORIA --- */}
        {activeTab === "history" && (
          <div className="bg-gray-800 rounded-xl shadow-xl overflow-hidden border border-gray-700">
            {history.length === 0 && !loading ? (
              <div className="p-10 text-center text-gray-400">Pusta historia.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-700">
                  <thead className="bg-gray-900/50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase w-20">ID</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Typ</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Lokal</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Wnioskodawca</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Status</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-400 uppercase">Uwagi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {history.map((app) => (
                      <tr key={app.id} className="hover:bg-gray-700/50 transition">
                        <td className="px-6 py-4 text-gray-400 font-mono">#{app.id}</td>
                        <td className="px-6 py-4">
                          {getTypeBadge(app.type)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-bold text-white">{app.name}</div>
                          <div className="text-xs text-gray-400">{app.city}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-300">
                          {app.owner?.email}
                        </td>
                        <td className="px-6 py-4">
                          {app.status === 'approved' ? (
                            <span className="px-2 py-1 text-xs font-bold rounded bg-green-900/50 text-green-300 border border-green-700">ZATWIERDZONY</span>
                          ) : (
                            <span className="px-2 py-1 text-xs font-bold rounded bg-red-900/50 text-red-300 border border-red-700">ODRZUCONY</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400 italic">
                          {app.status === 'rejected' ? (
                            <span className="text-red-300">"{app.rejection_reason || "Brak powodu"}"</span>
                          ) : (
                            <span className="text-green-800">OK</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* --- MODAL ODRZUCENIA (UNIWERSALNY) --- */}
        {isRejectModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80 backdrop-blur-sm p-4">
            <div className="bg-gray-800 rounded-xl shadow-2xl border border-gray-600 w-full max-w-md p-6">
              <h3 className="text-xl font-bold text-white mb-4">
                Powód odrzucenia wniosku #{rejectingId}
              </h3>
              <p className="text-gray-400 text-sm mb-4">
                {rejectingType === "restaurant" 
                  ? "Wpisz powód, dla którego odrzucasz ten wniosek restauracji. Właściciel zobaczy tę wiadomość w swoim panelu."
                  : "Wpisz powód, dla którego odrzucasz wniosek o zostanie restauratorem. Użytkownik zostanie poinformowany."
                }
              </p>
              <textarea 
                className="w-full p-3 bg-gray-900 border border-gray-600 rounded text-white focus:border-red-500 outline-none h-32 resize-none"
                placeholder={
                  rejectingType === "restaurant"
                    ? "Np. Błędny adres, brak menu, nieodpowiednia nazwa..."
                    : "Np. Brak doświadczenia, niekompletne dane..."
                }
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
              ></textarea>
              <div className="flex justify-end gap-3 mt-4">
                <button 
                  onClick={() => setIsRejectModalOpen(false)} 
                  className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                >
                  Anuluj
                </button>
                <button 
                  onClick={submitRejection} 
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 font-bold"
                >
                  Zatwierdź Odrzucenie
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminApplications;