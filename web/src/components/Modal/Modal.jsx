// web/src/components/Modal/Modal.jsx
import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    // Overlay (tło)
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      {/* Okno Modala */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-gray-700 overflow-hidden animate-fadeIn">
        
        {/* Nagłówek */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">{title}</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition text-2xl leading-none px-2"
          >
            &times;
          </button>
        </div>
        
        {/* Treść (Formularz) */}
        <div className="p-6">
          {children}
        </div>

      </div>
    </div>
  );
};

export default Modal;