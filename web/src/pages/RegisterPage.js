import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

export default function RegisterPage() {
  const navigate = useNavigate();

  // Stan formularza
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    prefix: "+48",
    password: "",
    confirm_password: "",
    role: "user", // WAŻNE: Musi być 'user', żeby system to rozpoznał
    street: "",
    city: "",
    postal_code: "",
    terms_accepted: true,         // Domyślnie zaakceptowane (wymagane)
    marketing_consent: false,
    data_processing_consent: true // Domyślnie zaakceptowane (wymagane)
  });

  const [emailValid, setEmailValid] = useState(null);
  const [phoneValid, setPhoneValid] = useState(null);
  const [passwordError, setPasswordError] = useState(null);
  const [responseMessage, setResponseMessage] = useState(null);

  // REGEX-y
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  // Regex: min 9 znaków, duża litera, cyfra, znak specjalny
  const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{9,}$/;

  function handleChange(e) {
    const { name, value } = e.target;

    // Aktualizujemy stan lokalnie do weryfikacji
    const updatedForm = { ...form, [name]: value };
    setForm(updatedForm);

    // Walidacja w czasie rzeczywistym
    if (name === "email") {
      setEmailValid(emailRegex.test(value));
    }

    if (name === "phone_number") {
      setPhoneValid(value.length >= 9); // Zmienione na >= 9 dla bezpieczeństwa
    }

    if (name === "password" || name === "confirm_password") {
      const pass = updatedForm.password;
      const confirm = updatedForm.confirm_password;

      if (!passwordRegex.test(pass)) {
        setPasswordError("Hasło: min. 9 znaków, 1 duża litera, 1 cyfra, 1 znak specjalny.");
      } else if (confirm && pass !== confirm) {
        setPasswordError("Hasła nie są takie same.");
      } else {
        setPasswordError(null);
      }
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    console.log(">>> Rozpoczynam wysyłanie formularza..."); // DIAGNOSTYKA

    if (!emailValid) {
      setResponseMessage("Niepoprawny adres email.");
      return;
    }

    if (!phoneValid) {
      setResponseMessage("Numer telefonu musi mieć 9 cyfr.");
      return;
    }

    if (passwordError) {
      setResponseMessage(passwordError);
      return;
    }

    const payload = {
      ...form,
      // Backend oczekuje roli "user", a nie "Klient" (chyba że zmieniłeś to w Pythonie)
      role: "user", 
      phone_number: `${form.prefix} ${form.phone_number}`,
    };

    console.log(">>> Wysyłam dane:", payload); // Zobaczysz w konsoli co leci do bazy

    try {
      // POPRAWIONY ADRES URL (bez słowa "register" na końcu)
      const res = await fetch("http://127.0.0.1:8000/users/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      console.log(">>> Status odpowiedzi:", res.status); // Zobaczysz czy to 200, 404 czy 500

      if (!res.ok) {
        const err = await res.json();
        console.error(">>> Błąd z backendu:", err);
        
        if (err.detail) {
           // Czasami detail to string, czasami lista błędów
           if (typeof err.detail === 'string') {
               setResponseMessage(err.detail);
           } else {
               setResponseMessage("Błąd walidacji danych (sprawdź konsolę).");
           }
        } else {
          setResponseMessage("Nie udało się utworzyć konta.");
        }
        return;
      }

      // SUKCES
      console.log(">>> Sukces! Przekierowuję...");
      setResponseMessage(null);
      alert("Konto utworzone pomyślnie!"); // Dodatkowy alert dla pewności
      navigate("/login"); // Przekierowanie do logowania (zamiast restaurants)

    } catch (error) {
      console.error(">>> Błąd sieci:", error);
      setResponseMessage("Błąd połączenia z serwerem. Sprawdź czy backend działa.");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white px-4 py-10">
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 p-8 rounded-xl shadow-lg w-full max-w-lg border border-gray-700"
      >
        <h1 className="text-3xl font-bold mb-6 text-center">Rejestracja</h1>

        <div className="space-y-4">

          <div className="grid grid-cols-2 gap-4">
              <input
                className="p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none w-full"
                type="text"
                name="first_name"
                placeholder="Imię"
                onChange={handleChange}
                required
              />
              <input
                className="p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none w-full"
                type="text"
                name="last_name"
                placeholder="Nazwisko"
                onChange={handleChange}
                required
              />
          </div>

          {/* EMAIL */}
          <div>
            <input
              className={`p-3 rounded bg-gray-700 border w-full outline-none ${
                emailValid === false ? "border-red-500" : "border-gray-600 focus:border-purple-500"
              }`}
              type="email"
              name="email"
              placeholder="Email"
              onChange={handleChange}
              required
            />
          </div>

          {/* TELEFON */}
          <div className="flex gap-2">
            <select
              name="prefix"
              className="p-3 rounded bg-gray-700 border border-gray-600 outline-none"
              onChange={handleChange}
              value={form.prefix}
            >
              <option value="+48">+48</option>
              <option value="+49">+49</option>
              <option value="+44">+44</option>
              <option value="+1">+1</option>
            </select>

            <input
              className="p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none w-full"
              type="text"
              name="phone_number"
              placeholder="Numer telefonu"
              onChange={handleChange}
              required
            />
          </div>

          {/* HASŁO */}
          <div className="relative">
            <input
              className={`p-3 rounded bg-gray-700 border w-full outline-none ${
                passwordError ? "border-red-500" : "border-gray-600 focus:border-purple-500"
              }`}
              type="password"
              name="password"
              placeholder="Hasło"
              onChange={handleChange}
              required
            />
             {/* Tooltip informacyjny */}
             <div className="text-xs text-gray-400 mt-1 ml-1">
                Wymagane: 9 znaków, Duża litera, cyfra, znak specjalny.
             </div>
          </div>

          <input
            className={`p-3 rounded bg-gray-700 border w-full outline-none ${
                passwordError ? "border-red-500" : "border-gray-600 focus:border-purple-500"
            }`}
            type="password"
            name="confirm_password"
            placeholder="Potwierdź hasło"
            onChange={handleChange}
            required
          />

          {passwordError && (
            <p className="text-red-400 text-sm font-bold text-center">{passwordError}</p>
          )}

          {/* ADRES */}
          <input
            className="p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none w-full"
            type="text"
            name="street"
            placeholder="Ulica i numer"
            onChange={handleChange}
            required
          />
          <div className="grid grid-cols-2 gap-4">
            <input
                className="p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none w-full"
                type="text"
                name="city"
                placeholder="Miasto"
                onChange={handleChange}
                required
            />
            <input
                className="p-3 rounded bg-gray-700 border border-gray-600 focus:border-purple-500 outline-none w-full"
                type="text"
                name="postal_code"
                placeholder="Kod pocztowy"
                onChange={handleChange}
                required
            />
          </div>
        </div>

        {/* PRZYCISK SUBMIT */}
        <button
          type="submit"
          className="mt-6 w-full bg-purple-600 hover:bg-purple-700 transition text-white py-3 rounded-lg font-bold shadow-lg"
        >
          Utwórz konto
        </button>

        {/* KOMUNIKATY ZWROTNE */}
        {responseMessage && (
          <div className="mt-4 p-3 bg-gray-700 rounded text-center border border-gray-600">
             <p className="text-red-300 font-semibold">{responseMessage}</p>
          </div>
        )}

        {/* POWRÓT */}
        <div className="mt-4 text-center">
            <Link to="/" className="text-gray-400 hover:text-white text-sm">
                Powrót do strony głównej
            </Link>
        </div>
        <div className="mt-2 text-center">
             <Link to="/login" className="text-purple-400 hover:text-purple-300 text-sm font-semibold">
                 Masz już konto? Zaloguj się
             </Link>
        </div>
      </form>
    </div>
  );
}