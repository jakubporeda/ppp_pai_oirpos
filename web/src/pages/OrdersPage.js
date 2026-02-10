import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import OrderDocument from "../components/OrderDocument/OrderDocument.jsx";

// --- MOCK DATA (Przykładowa historia zamówień) ---
const MOCK_HISTORY = [
    {
        id: "ORD-1024",
        date: "2023-10-27 14:30",
        restaurant: "Pizzeria U Luigiego",
        restaurantAddress: "Akademicka 18, Gliwice",
        deliveryAddress: "Dom (ul. Słoneczna 5, Gliwice)",
        total: 45.00,
        status: "completed",
        payment: "BLIK",
        document: "Paragon",
        items: [
            { name: "Pizza Margherita", qty: 1, price: 30 },
            { name: "Cola Zero", qty: 2, price: 7.50 }
        ]
    },
    {
        id: "ORD-1023",
        date: "2023-10-26 19:15",
        restaurant: "Sushi Master",
        restaurantAddress: "Rynek 12, Katowice",
        deliveryAddress: "Praca (ul. Korfantego 1, Katowice)",
        total: 120.00,
        status: "completed",
        payment: "Karta",
        document: "Faktura VAT",
        items: [
            { name: "Zestaw Premium", qty: 1, price: 120 }
        ]
    }
];

// Konfiguracja wyglądu statusów
const STATUS_CONFIG = {
    pending: { label: "Oczekujące", color: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300", icon: "⏳" },
    confirmed: { label: "Potwierdzone", color: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300", icon: "✅" },
    preparing: { label: "W przygotowaniu", color: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300", icon: "👨‍🍳" },
    delivering: { label: "W dostawie", color: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300", icon: "🚚" },
    delivered: { label: "Dostarczono", color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300", icon: "✅" },
    cancelled: { label: "Anulowano", color: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300", icon: "❌" },
    completed: { label: "Zakończono", color: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300", icon: "✅" }
};

const STATUS_MAPPING = {
    confirmed: "Potwierdzone",
    preparing: "W przygotowaniu",
    delivering: "W dostawie",
    delivered: "Dostarczono",
    cancelled: "Anulowano",
    completed: "Zakończono"
};

const OrdersPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showDocument, setShowDocument] = useState(false);
    const [documentOrder, setDocumentOrder] = useState(null);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [reviewOrder, setReviewOrder] = useState(null);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");

    const navigate = useNavigate();
    const token = localStorage.getItem("access_token");

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch("http://127.0.0.1:8000/orders/my-orders", {
                headers: { "Authorization": `Bearer ${token}` }
            });

            if (!response.ok) {
                throw new Error(`Błąd ${response.status}: ${await response.text()}`);
            }

            const data = await response.json();
            console.log("Pobrane zamówienia:", data);
            setOrders(data);
        } catch (err) {
            console.error("Błąd pobierania zamówień:", err);
            setError(err.message);

            // Fallback na mock data
            if (err.message.includes("404") || err.message.includes("500")) {
                console.log("Używam danych przykładowych");
                setOrders(MOCK_HISTORY);
                setError(null);
            }
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        if (!token) {
            navigate("/login");
            return;
        }
        fetchOrders();
    }, [token, navigate, fetchOrders]);

    const getStatusConfig = (status) => {
        const mappedStatus = STATUS_MAPPING[status] || status;
        const config = STATUS_CONFIG[status] || STATUS_CONFIG.completed;
        return { ...config, label: mappedStatus };
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Brak daty";
        const date = new Date(dateString);
        return date.toLocaleDateString('pl-PL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const handleReOrder = async (order) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/orders/reorder", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ order_id: order.id })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "Nie udało się ponowić zamówienia");
            }

            const data = await res.json();
            alert(`Zamówienie ponowione! Nowy ID: ${data.new_order_id}`);
            fetchOrders();
        } catch (err) {
            console.error("Błąd ponownego zamówienia:", err);
            alert("Błąd ponownego zamówienia: " + (err.message || JSON.stringify(err)));
        }
    };

    const handleShowDocument = (order) => {
        setDocumentOrder(order);
        setShowDocument(true);
    };

    const handleConfirmDelivery = async (orderId) => {
        if (!window.confirm("Czy na pewno odebrałeś to zamówienie?")) return;

        try {
            const res = await fetch(
                `http://127.0.0.1:8000/orders/${orderId}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ new_status: "delivered" }),
                }
            );

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.detail || "Nie udało się potwierdzić odbioru");
            }

            const updatedOrder = await res.json();

            setOrders(prev =>
                prev.map(o =>
                    o.id === updatedOrder.id ? { ...o, status: updatedOrder.status } : o
                )
            );

        } catch (err) {
            alert("Błąd: " + err.message);
        }
    };

    const openReviewModal = (order) => {
        setReviewOrder(order);
        setShowReviewModal(true); 
        setRating(0);
        setComment("");
    };

    const closeReviewModal = () => {
        setShowReviewModal(false);
        setReviewOrder(null);
        setRating(0);
        setComment("");
    };

    const submitReview = async () => {
        if (rating < 1) {
            alert("Wybierz ocenę (1–5 gwiazdek)");
            return;
        }

        try {
            const res = await fetch(
                `http://127.0.0.1:8000/orders/${reviewOrder.id}/review`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },
                    body: JSON.stringify({ rating, comment })
                }
            );

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || "Błąd dodawania opinii");
            }

            setOrders(prev =>
                prev.map(o =>
                    o.id === reviewOrder.id ? { ...o, reviewed: true } : o
                )
            );

            setReviewOrder(null);

        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 pt-20">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-4xl mb-4">⏳</div>
                    <p className="text-gray-600 dark:text-gray-400">Ładowanie zamówień...</p>
                </div>
            </div>
        );
    }

    if (error && orders.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8 pt-20">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="text-4xl mb-4">❌</div>
                    <p className="text-red-600 dark:text-red-400 mb-4">Błąd: {error}</p>
                    <button 
                        onClick={fetchOrders}
                        className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                    >
                        Spróbuj ponownie
                    </button>
                </div>
            </div>
        );
    }

    const displayOrders = orders.length > 0 ? orders : MOCK_HISTORY;

    // --- PODZIAŁ NA OBECNE I HISTORYCZNE ---
    const currentOrders = displayOrders.filter(o => !['delivered', 'completed'].includes(o.status));
    const pastOrders = displayOrders.filter(o => ['delivered', 'completed'].includes(o.status));

    const renderOrderCard = (order) => {
        const status = getStatusConfig(order.status || 'completed');
        const orderDate = order.created_at || order.date;
        const restaurantName = order.restaurant_name || order.restaurant;
        const deliveryAddress = order.delivery_address || order.deliveryAddress;
        const total = order.total_amount || order.total;
        const paymentMethod = order.payment_method || order.payment;
        const documentType = order.document_type || order.document;

        return (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden hover:shadow-md transition">
                
                <div className="p-5 flex flex-col md:flex-row justify-between md:items-center gap-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-4">
                        <div className="bg-purple-100 dark:bg-purple-900/30 p-3 rounded-full text-2xl">🏁</div>
                        <div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-white">{restaurantName}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                📅 {formatDate(orderDate)} | <span className="ml-2 font-mono">#{order.id}</span>
                            </p>
                        </div>
                    </div>
                    
                    <div className={`px-4 py-2 rounded-full border text-sm font-bold flex items-center gap-2 w-fit ${status.color}`}>
                        <span>{status.icon}</span> {status.label}
                    </div>
                </div>

                <div className="p-5 flex flex-col md:flex-row gap-6 items-start md:items-center text-sm">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 mb-1 font-bold text-xs uppercase">
                            Dostarczono do:
                        </div>
                        <div className="font-medium text-gray-800 dark:text-gray-200 flex items-center gap-2">
                            📍 {deliveryAddress}
                        </div>
                    </div>
                    
                    <div className="flex gap-4">
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold">Płatność</div>
                            <div className="text-gray-800 dark:text-gray-300 font-medium">
                                {paymentMethod === 'blik' ? '📱 BLIK' : '💳 Karta'}
                            </div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-gray-500 uppercase font-bold">Dokument</div>
                            <div className="text-gray-800 dark:text-gray-300 font-medium">
                                {documentType === 'invoice' ? 'Faktura VAT' : 'Paragon'}
                            </div>
                        </div>
                        <div className="text-right pl-4 border-l dark:border-gray-700">
                            <div className="text-xs text-gray-500 uppercase font-bold">Kwota</div>
                            <div className="text-purple-600 font-bold text-lg">{total.toFixed(2)} zł</div>
                        </div>
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-900/50 p-4 flex justify-end items-center gap-3">
                    {order.status === "delivered" && !order.reviewed && (
                        <button onClick={() => openReviewModal(order)}>⭐ Oceń restaurację</button>
                    )}

                    {order.status === "delivery" && (
                        <button
                            onClick={() => handleConfirmDelivery(order.id)}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition"
                        >
                            ✅ Odebrałem zamówienie
                        </button>
                    )}
                    
                    {['delivered', 'completed'].includes(order.status) && (
                        <button 
                            onClick={() => handleReOrder(order)}
                            className="text-sm font-bold text-gray-600 hover:text-purple-600 dark:text-gray-300 dark:hover:text-purple-400 transition underline decoration-dotted"
                        >
                            Zamów ponownie ↻
                        </button>
                    )}

                    <button
                        onClick={() => handleShowDocument(order)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow-sm transition transform hover:scale-105 flex items-center gap-2"
                    >
                        📄 Pokaż dokument
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-8 pt-20">
            <div className="max-w-4xl mx-auto space-y-12">

                {/* --- OBECNE ZAMÓWIENIA --- */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        🛒 Obecne zamówienia
                    </h1>
                    {currentOrders.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Brak aktywnych zamówień</p>
                    ) : (
                        <div className="space-y-4">
                            {currentOrders.map(renderOrderCard)}
                        </div>
                    )}
                </div>

                {/* --- HISTORIA ZAMÓWIEŃ --- */}
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center gap-3">
                        📜 Historia zamówień
                    </h1>
                    {pastOrders.length === 0 ? (
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Brak zakończonych zamówień</p>
                    ) : (
                        <div className="space-y-4">
                            {pastOrders.map(renderOrderCard)}
                        </div>
                    )}
                </div>

            </div>

            {/* ORDER DOCUMENT MODAL */}
            {showDocument && documentOrder && (
                <OrderDocument
                    order={documentOrder}
                    onClose={() => {
                        setShowDocument(false);
                        setDocumentOrder(null);
                    }}
                />
            )}

            {/* REVIEW MODAL */}
            {reviewOrder && showReviewModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
                        <h2 className="text-xl font-bold mb-4">
                            ⭐ Oceń {reviewOrder.restaurant_name || reviewOrder.restaurant}
                        </h2>

                        <div className="flex gap-2 text-3xl mb-4">
                            {[1,2,3,4,5].map(star => (
                                <button key={star} onClick={() => setRating(star)}>
                                    {star <= rating ? "⭐" : "☆"}
                                </button>
                            ))}
                        </div>

                        <textarea
                            className="w-full border rounded-lg p-2 mb-4 dark:bg-gray-700"
                            placeholder="Opcjonalny komentarz…"
                            value={comment}
                            onChange={e => setComment(e.target.value)}
                        />

                        <div className="flex justify-end gap-3">
                            <button onClick={closeReviewModal} className="px-4 py-2">
                                Anuluj
                            </button>
                            <button
                                onClick={submitReview}
                                className="bg-purple-600 text-white px-4 py-2 rounded-lg"
                            >
                                Wyślij opinię
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default OrdersPage;
