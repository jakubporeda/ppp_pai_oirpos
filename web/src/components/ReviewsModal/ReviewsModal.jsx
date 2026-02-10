import React from "react";


const ReviewsModal = ({ isOpen, onClose, restaurant, reviews = [] }) => {
  if (!isOpen || !restaurant) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Kliknięcie poza modalem */}
      <div className="absolute inset-0" onClick={onClose}></div>

      <div className="relative bg-white dark:bg-gray-800 w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[85vh] z-10">
        {/* HEADER MODALU */}
        <div className="p-6 bg-purple-600 text-white flex justify-between items-center rounded-t-2xl">
          <h2 className="text-2xl sm:text-3xl font-bold">Recenzje - {restaurant.name}</h2>
          <button onClick={onClose} className="text-2xl sm:text-3xl font-bold">✕</button>
        </div>

        {/* NAGŁÓWEK KOLUMN */}
        <div className="grid grid-cols-12 gap-4 border-b-2 border-gray-300 dark:border-gray-600 p-4">
          <div className="col-span-2 text-base sm:text-lg font-extrabold text-gray-700 dark:text-gray-200 text-center drop-shadow-sm">
            Ocena
          </div>
          <div className="col-span-6 text-base sm:text-lg font-extrabold text-gray-700 dark:text-gray-200 pl-4 drop-shadow-sm">
            Komentarz
          </div>
          <div className="col-span-4 text-base sm:text-lg font-extrabold text-gray-700 dark:text-gray-200 pl-4 drop-shadow-sm">
            Zamówione
          </div>
        </div>

        {/* TREŚĆ RECENZJI */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50 dark:bg-gray-900 space-y-3">
          {reviews.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center mt-4">
              Brak recenzji dla tej restauracji.
            </p>
          ) : (
            reviews.map(r => (
              <div key={r.id} className="grid grid-cols-12 gap-4 border-b border-gray-200 dark:border-gray-700 py-3">
                {/* Ocena */}
                <div className="col-span-2 text-center text-yellow-500 font-bold text-lg flex items-center justify-center">
                  {r.rating ? `⭐ ${r.rating}` : "Brak oceny"}
                </div>

                {/* Komentarz */}
                <div className="col-span-6 pl-4 text-gray-700 dark:text-gray-200 text-base sm:text-lg">
                  {r.comment ? `"${r.comment}"` : <span className="italic text-gray-400">Brak komentarza</span>}
                </div>

                {/* Zamówione */}
                <div className="col-span-4 pl-4 text-gray-600 dark:text-gray-300 text-base sm:text-lg">
                  {r.items && r.items.length > 0 ? (
                    <span>
                      {r.items.map((item, idx) => (
                        <span key={idx}>
                          {item.quantity} <span className="font-semibold text-gray-800 dark:text-gray-100">{item.name}</span>
                          {idx < r.items.length - 1 ? ", " : ""}
                        </span>
                      ))}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">Brak zamówionych produktów</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default ReviewsModal;
