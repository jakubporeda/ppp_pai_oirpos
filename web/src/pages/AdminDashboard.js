import React from 'react';
import { useNavigate } from 'react-router-dom';

const AdminDashboard = () => {
  const navigate = useNavigate();

  const adminOptions = [
    { 
      title: "Centrum zgłoszeń", 
      description: "Przeglądaj zgłoszenia, skargi i prośby o pomoc od użytkowników.", 
      path: "/admin/tickets",
      colorClass: "border-blue-500 text-blue-600",
      bgHover: "hover:bg-blue-50 dark:hover:bg-blue-900/20"
    },
    { 
      title: "Zarządzanie użytkownikami", 
      description: "Edytuj role, blokuj konta, filtruj użytkowników wg miast.", 
      path: "/admin/users",
      colorClass: "border-green-500 text-green-600",
      bgHover: "hover:bg-green-50 dark:hover:bg-green-900/20"
    },
    { 
      title: "Zarządzanie restauracjami", 
      description: "Usuwaj restauracje, edytuj dane adresowe i wizytówki lokali.", 
      path: "/admin/restaurants",
      colorClass: "border-orange-500 text-orange-600",
      bgHover: "hover:bg-orange-50 dark:hover:bg-orange-900/20"
    },
    { 
      title: "Wnioski", 
      description: "Weryfikuj nowe zgłoszenia restauracji i akceptuj je w systemie.", 
      path: "/admin/applications",
      colorClass: "border-red-500 text-red-600",
      bgHover: "hover:bg-red-50 dark:hover:bg-red-900/20"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-10 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Nagłówek sekcji */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Panel Administracyjny
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Zarządzaj systemem FoodAPP, użytkownikami i zgłoszeniami.
          </p>
        </div>

        {/* Grid z kafelkami */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
          {adminOptions.map((option, index) => (
            <div 
              key={index} 
              onClick={() => navigate(option.path)}
              className={`
                bg-white dark:bg-gray-800 
                rounded-xl shadow-md hover:shadow-xl 
                p-6 cursor-pointer transition-all duration-300 transform hover:-translate-y-1
                border-l-4 ${option.colorClass} ${option.bgHover}
              `}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-xl font-bold ${option.colorClass.split(' ')[1]}`}>
                  {option.title}
                </h3>
                {/* Opcjonalnie: Tu można dodać ikonę w przyszłości */}
              </div>
              
              <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
                {option.description}
              </p>
              
              <div className="mt-4 flex justify-end">
                <span className="text-sm font-semibold opacity-60 dark:text-gray-400">
                  Przejdź &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;