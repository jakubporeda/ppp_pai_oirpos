import React, { useState, useEffect } from 'react';
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Upewnij się, że masz tu SWÓJ DŁUGI token
const MAPBOX_TOKEN = "pk.eyJ1Ijoicm9yaWsiLCJhIjoiY21qN3JvaDh5MDV4cDNncXpkM3RlNmVzZCJ9.HemoDNLmVXXnG2OTEb3H7g";

const MapComponent = ({ restaurants = [], selectedRestaurant, onSelect, onShowMenu }) => {
    const [popupInfo, setPopupInfo] = useState(null);

    // Stan widoku mapy
    const [viewState, setViewState] = useState({
        longitude: 18.6714,
        latitude: 50.2945,
        zoom: 14 
    });

    // EFEKT: Gdy zmieni się selectedRestaurant, aktualizujemy viewState (kamera leci)
    useEffect(() => {
        if (selectedRestaurant && selectedRestaurant.latitude && selectedRestaurant.longitude) {
            setViewState(prev => ({
                ...prev,
                longitude: selectedRestaurant.longitude,
                latitude: selectedRestaurant.latitude,
                zoom: 15,
                transitionDuration: 1000 // Czas lotu w ms
            }));
            setPopupInfo(selectedRestaurant);
        }
    }, [selectedRestaurant]);

    return (
        <div style={{ width: '100%', height: '100%', borderRadius: '12px', overflow: 'hidden' }}>
            <Map
                {...viewState}
                onMove={evt => setViewState(evt.viewState)}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={MAPBOX_TOKEN}
            >
                <NavigationControl position="top-right" />

                {/* Markery */}
                {restaurants.map((rest) => {
                    if (!rest.latitude || !rest.longitude) return null;

                    return (
                        <Marker
                            key={rest.id}
                            longitude={rest.longitude}
                            latitude={rest.latitude}
                            anchor="bottom"
                            onClick={e => {
                                e.originalEvent.stopPropagation();
                                setPopupInfo(rest);
                            }}
                        >
                            <svg
                                height={50}
                                viewBox="0 0 24 24"
                                style={{
                                    cursor: 'pointer',
                                    fill: selectedRestaurant?.id === rest.id ? '#d946ef' : '#9333ea',
                                    stroke: 'white',
                                    strokeWidth: '2px',
                                    filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.4))',
                                    transition: 'transform 0.3s',
                                    transform: selectedRestaurant?.id === rest.id ? 'scale(1.3)' : 'scale(1)'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
                                onMouseLeave={(e) => {
                                    if(selectedRestaurant?.id !== rest.id) e.currentTarget.style.transform = 'scale(1)'
                                }}
                            >
                                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                            </svg>
                        </Marker>
                    );
                })}

                {/* Popup */}
                {popupInfo && (
                    <Popup
                        longitude={popupInfo.longitude}
                        latitude={popupInfo.latitude}
                        anchor="top"
                        onClose={() => setPopupInfo(null)}
                        closeOnClick={false}
                        offset={25}
                    >
                        <div className="p-2 text-center min-w-[160px]">
                            <h3 className="font-bold text-lg text-gray-800 mb-1">
                                {popupInfo.name}
                            </h3>
                            <p className="text-xs text-gray-500 mb-2 uppercase font-semibold">
                                {popupInfo.cuisines}
                            </p>
                            <p className="text-xs text-gray-400 mb-3">
                                {popupInfo.street} {popupInfo.number}, {popupInfo.city}
                            </p>
                            
                            {/* --- ZAKTUALIZOWANY PRZYCISK --- */}
                            <button 
                                onClick={() => onShowMenu(popupInfo)} // <--- TU ZMIANA
                                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold py-2 px-4 rounded-full transition-colors w-full shadow-md"
                            >
                                Zobacz Menu 🍽️
                            </button>
                        </div>
                    </Popup>
                )}
            </Map>
        </div>
    );
};

export default MapComponent;