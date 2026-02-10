// src/pages/HomePage.js
import LanguageSelector from "../components/LanguageSelector";
import ImageGrid from "../components/ImageGrid";
import LoginButton from "../components/LoginButton";
import RegisterButton from "../components/RegisterButton";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 dark:text-white transition">
      {/* Górny pasek */}
      <div className="h-16 bg-purple-600 dark:bg-purple-800" />

      {/* Główna sekcja */}
      <main className="flex flex-1 px-16">
        {/* LEWA kolumna – języki (wycentrowana w pionie i poziomie) */}
        <div className="w-1/4 flex items-center justify-center">
          <LanguageSelector />
        </div>

        {/* ŚRODKOWA kolumna – zdjęcia + przyciski */}
        <div className="w-2/4 flex flex-col items-center justify-center gap-8">
          <ImageGrid />

          <div className="flex flex-col gap-4 w-64">
            <LoginButton />
            <RegisterButton />
          </div>
        </div>

        {/* PRAWA kolumna – tytuł */}
        <div className="w-1/4 flex items-center justify-center">
          <h1 className="text-5xl font-bold">FoodAPP</h1>
        </div>
      </main>

      {/* Dolny pasek */}
      <div className="h-16 bg-purple-600 dark:bg-purple-800" />
    </div>
  );
}
