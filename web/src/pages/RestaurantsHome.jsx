import React from 'react';

import RestaurantsList from '../components/RestaurantsList/RestaurantsList';

const Home = () => {
    return(
        <div className="min-h-screen bg-white dark:bg-gray-900">
            {/* Tutaj możemy dodać np. jakiś Hero Banner w przyszłości */}
            <RestaurantsList/>
        </div>
    );
}

export default Home;