import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { useLocation } from 'react-router-dom'; // Import do sprawdzania, na jakiej jesteś stronie

const STATUS_STEPS = [
    { key: 'confirmed', label: 'Przyjęto', icon: '📝' },
    { key: 'preparing', label: 'W kuchni', icon: '🔥' },
    { key: 'delivery', label: 'W drodze', icon: '🛵' },
    { key: 'arrived', label: 'Na miejscu', icon: '🏠' }
];

const CurrentOrderWidget = () => {
    const { activeOrder, clearActiveOrder } = useCart(); // Zakładam, że możesz dodać clearActiveOrder w Context, lub po prostu użyć setActiveOrder(null) jeśli udostępnisz setter
    const [isExpanded, setIsExpanded] = useState(true);
    const location = useLocation();

    // 1. ZABEZPIECZENIE: Jeśli nie ma zamówienia -> nic nie renderuj
    if (!activeOrder) return null;

    // 2. LOGIKA UKRYWANIA:
    // Ukryj, jeśli status to 'completed' (zakończone) lub 'cancelled' (anulowane)
    if (activeOrder.status === 'completed' || activeOrder.status === 'cancelled') {
        return null;
    }

    // 3. LOGIKA DLA PANELU WŁAŚCICIELA/ADMINA:
    // Jeśli użytkownik jest na dashboardzie lub w adminie, ukryj widget, żeby nie przeszkadzał
    if (location.pathname.startsWith('/dashboard') || location.pathname.startsWith('/admin')) {
        return null;
    }

    // Ustalanie obecnego etapu
    // Jeśli status jest inny niż w liście (np. pending), domyślnie pokazujemy pierwszy krok
    const currentStatus = activeOrder.status || 'confirmed';
    const currentIndex = STATUS_STEPS.findIndex(s => s.key === currentStatus);
    const safeIndex = currentIndex === -1 ? 0 : currentIndex;

    // Formatowanie listy produktów (skrócone)
    const itemsSummary = activeOrder.items 
        ? activeOrder.items.map(i => i.name).join(", ") 
        : "Szczegóły w zamówieniu";

    return (
        <div className={`fixed right-4 top-24 z-40 transition-all duration-300 ${isExpanded ? 'w-80' : 'w-16'}`}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-purple-500 overflow-hidden">
                
                {/* NAGŁÓWEK */}
                <div 
                    className="bg-purple-600 text-white p-3 cursor-pointer flex justify-between items-center hover:bg-purple-700 transition"
                >
                    <div onClick={() => setIsExpanded(!isExpanded)} className="flex-1 flex items-center gap-2">
                         {isExpanded ? (
                            <span className="font-bold flex items-center gap-2">
                                <span className="animate-pulse text-green-300">●</span> Twoje zamówienie
                            </span>
                        ) : (
                            <div className="text-center w-full text-xl">🛵</div>
                        )}
                    </div>

                    {/* Przycisk Zwiń / Rozwiń */}
                    {isExpanded && (
                        <div className="flex gap-3">
                             <button 
                                onClick={() => setIsExpanded(false)} 
                                className="text-xs bg-purple-800 hover:bg-purple-900 px-2 py-1 rounded transition"
                             >
                                Zwiń
                             </button>
                        </div>
                    )}
                </div>

                {/* TREŚĆ */}
                {isExpanded && (
                    <div className="p-4 animate-in fade-in slide-in-from-top-2">
                        <div className="mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                            <h4 className="font-bold text-gray-800 dark:text-white truncate">{activeOrder.restaurant}</h4>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{itemsSummary}</p>
                        </div>

                        <div className="relative border-l-2 border-gray-200 dark:border-gray-600 ml-2 space-y-4 py-2">
                            {STATUS_STEPS.map((step, idx) => {
                                const isCompleted = idx <= safeIndex;
                                const isCurrent = idx === safeIndex;
                                return (
                                    <div key={step.key} className="relative pl-6">
                                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full border-2 transition-all ${isCompleted ? 'bg-green-500 border-green-500' : 'bg-gray-200 border-gray-300 dark:bg-gray-700 dark:border-gray-600'} ${isCurrent ? 'scale-125 ring-2 ring-green-200 animate-pulse' : ''}`}></div>
                                        <div className={`text-sm ${isCompleted ? 'text-gray-800 dark:text-white font-bold' : 'text-gray-400'}`}>
                                            {step.icon} {step.label}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                        
                        <div className="mt-4 pt-3 border-t dark:border-gray-700 text-center">
                            <p className="text-xs text-gray-500 uppercase font-bold">Szacowany czas</p>
                            <p className="text-xl font-bold text-purple-600">
                                {activeOrder.deliveryTime === 'ASAP' ? '30-45 min' : activeOrder.deliveryTime}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CurrentOrderWidget;