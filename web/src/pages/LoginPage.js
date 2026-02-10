import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:8000/users/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Błąd logowania");
      }

      // --- KLUCZOWE: ZAPISYWANIE SESJI ---
      // Dzięki temu po F5 nadal będziesz zalogowany!
      localStorage.setItem('access_token', data.access_token);
      localStorage.setItem('user_role', data.role);
      localStorage.setItem('user_name', data.first_name);
      localStorage.setItem('user_last_name', data.last_name);

      // Przekierowanie w zależności od roli
      if (data.role === 'admin') {
        navigate('/admin');
      } else if (data.role === 'właściciel' || data.role === 'owner') {
        navigate('/dashboard');
      } else {
        navigate('/restaurants');
      }
      
      // Wymuszamy odświeżenie paska nawigacji (Navbar)
      window.dispatchEvent(new Event("storage")); 

    } catch (err) {
      setError("Nieprawidłowy email lub hasło.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-gray-800 p-8 rounded-lg shadow-2xl border border-gray-700">
        <h2 className="text-center text-3xl font-extrabold text-white mb-8">
          Zaloguj się
        </h2>

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div>
            <input
              name="email"
              type="email"
              required
              className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          <div>
            <input
              name="password"
              type="password"
              required
              className="appearance-none rounded relative block w-full px-3 py-3 border border-gray-600 placeholder-gray-400 text-white bg-gray-700 focus:outline-none focus:ring-purple-500 focus:border-purple-500 sm:text-sm"
              placeholder="Hasło"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 transition duration-150 disabled:opacity-50"
          >
            {loading ? "Logowanie..." : "Zaloguj się"}
          </button>
          
          <div className="text-center mt-4">
              <Link to="/register" className="text-purple-400 hover:text-purple-300 text-sm">
                  Nie masz konta? Zarejestruj się
              </Link>
          </div>
           <div className="text-center mt-2">
              <Link to="/" className="text-gray-500 hover:text-gray-300 text-sm">
                  Powrót na stronę główną
              </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;