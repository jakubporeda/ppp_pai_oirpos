import React, { useState } from 'react';
import MenuModal from '../MenuModal/MenuModal';
import ReviewsModal from "../ReviewsModal/ReviewsModal";

const CATEGORIES = [
    "Wszystkie", "Italian", "Japanese", "American", "Chinese", "Mexican",
    "Indian", "French", "Mediterranean", "Thai", "Fast Food", "Vegetarian", "Polish", "Burger", "Pizza", "Sushi"
];

const RestaurantsList = ({ restaurants, onSelectRestaurant, selectedId, onShowMenu }) => {

    // --- STANY MODALI ---
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [menuProducts, setMenuProducts] = useState([]);
    const [menuRestaurant, setMenuRestaurant] = useState(null);

    const [isReviewsOpen, setIsReviewsOpen] = useState(false);
    const [reviewsRestaurant, setReviewsRestaurant] = useState(null);
    const [restaurantReviews, setRestaurantReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(false);

    // --- STANY FILTRÓW ---
    const [minRating, setMinRating] = useState(0);
    const [selectedCuisine, setSelectedCuisine] = useState("Wszystkie");

    // --- OTWIERANIE MODALA MENU ---
    const handleOpenMenu = async (restaurant) => {
        setMenuRestaurant(restaurant);
        setMenuProducts([]);
        setIsMenuOpen(true);

        if (onShowMenu) onShowMenu(restaurant);

        try {
            const res = await fetch(`http://127.0.0.1:8000/restaurants/${restaurant.id}/products`);
            if (!res.ok) throw new Error("Błąd pobierania menu");
            const products = await res.json();
            setMenuProducts(products);
        } catch (err) {
            console.error(err);
        }
    };

    // --- OTWIERANIE MODALA RECENZJI ---
    const handleOpenReviews = async (restaurant) => {
        setReviewsRestaurant(restaurant);
        setRestaurantReviews([]);
        setIsReviewsOpen(true);
        setLoadingReviews(true);

        try {
            const res = await fetch(`http://127.0.0.1:8000/orders/${restaurant.id}/reviews`);
            if (!res.ok) throw new Error("Błąd pobierania recenzji");
            const reviews = await res.json();
            setRestaurantReviews(reviews);
        } catch (err) {
            console.error(err);
            setRestaurantReviews([]);
        } finally {
            setLoadingReviews(false);
        }
    };

    // --- FILTROWANIE RESTAURACJI ---
    const filteredRestaurants = restaurants.filter(r => {
        if (r.rating < minRating) return false;
        if (selectedCuisine !== "Wszystkie") {
            const cuisinesData = Array.isArray(r.cuisines) ? r.cuisines.join(" ") : r.cuisines || "";
            if (!cuisinesData.toLowerCase().includes(selectedCuisine.toLowerCase())) return false;
        }
        return true;
    });

    return (
        <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">

            {/* MODALE */}
            <MenuModal
                isOpen={isMenuOpen}
                onClose={() => setIsMenuOpen(false)}
                restaurant={menuRestaurant}
                products={menuProducts}
            />

            <ReviewsModal
                isOpen={isReviewsOpen}
                onClose={() => setIsReviewsOpen(false)}
                restaurant={reviewsRestaurant}
                reviews={restaurantReviews}
                loading={loadingReviews}
            />

            {/* FILTRY */}
            <div className="p-4 bg-white dark:bg-gray-800 shadow-sm z-10 shrink-0">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">
                    Odkryj Restauracje ({filteredRestaurants.length})
                </h2>
                
                <div className="flex flex-col gap-3">
                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Rodzaj Kuchni</label>
                        <select
                            value={selectedCuisine}
                            onChange={(e) => setSelectedCuisine(e.target.value)}
                            className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
                        >
                            {CATEGORIES.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-xs font-semibold text-gray-500 uppercase dark:text-gray-400">Minimalna ocena</label>
                        <select
                            value={minRating}
                            onChange={(e) => setMinRating(Number(e.target.value))}
                            className="w-full mt-1 p-2 bg-gray-100 dark:bg-gray-700 border-none rounded-lg text-sm focus:ring-2 focus:ring-purple-500 dark:text-white"
                        >
                            <option value={0}>Wszystkie</option>
                            <option value={3}>3.0+ ⭐</option>
                            <option value={4}>4.0+ ⭐⭐</option>
                            <option value={4.5}>4.5+ ⭐⭐⭐</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* LISTA RESTAURACJI */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {filteredRestaurants.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 mt-10">Brak wyników.</p>
                ) : filteredRestaurants.map((restaurant) => (
                    <div 
                        key={restaurant.id} 
                        onClick={() => onSelectRestaurant && onSelectRestaurant(restaurant)}
                        className={`bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm hover:shadow-md transition cursor-pointer flex flex-col group border ${
                            selectedId === restaurant.id 
                            ? "border-purple-500 ring-1 ring-purple-500 bg-purple-50 dark:bg-gray-800" 
                            : "border-gray-100 dark:border-gray-700"
                        }`}
                    >
                         {/* NAWIERZCHNIA: NAZWA + RATING */}
                        <div className="flex justify-between items-start">
                            <h3 className="text-lg font-bold text-gray-800 dark:text-white break-words">
                            {restaurant.name}
                            </h3>
                            <span className="flex-shrink-0 bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs font-bold px-2 py-1 rounded-lg">
                            {restaurant.rating} ⭐
                            </span>
                        </div>

                        {/* POD NAGŁÓWKIEM: kuchnia + opis + adres */}
                        <div className="mt-2">
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                            {Array.isArray(restaurant.cuisines) ? restaurant.cuisines.join(", ") : restaurant.cuisines}
                            </p>
                            {restaurant.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                                {restaurant.description}
                            </p>
                            )}
                            <p className="text-xs text-gray-400 mt-2 flex items-center gap-1">
                            📍 {restaurant.street} {restaurant.number}, {restaurant.city}
                            </p>
                        </div>

                        <div className="flex gap-2 mt-3">
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleOpenMenu(restaurant); }}
                                className="flex-1 bg-gray-100 hover:bg-purple-600 hover:text-white text-gray-600 py-2 rounded-lg text-sm font-semibold transition"
                            >
                                Zobacz Menu
                            </button>

                            <button
                                onClick={(e) => { e.stopPropagation(); handleOpenReviews(restaurant); }}
                                className="flex-1 bg-yellow-100 hover:bg-yellow-300 text-yellow-800 py-2 rounded-lg text-sm font-semibold transition"
                            >
                                Zobacz Recenzje
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default RestaurantsList;
