export default function LanguageSelector() {
  return (
    <div className="flex flex-col items-center gap-4">
      <h2 className="text-xl font-semibold">Wybór języka</h2>

      <div className="flex gap-4">
        <button className="border p-2 hover:bg-gray-200 rounded">
          <img src="/images/home/POL.png" alt="polski" className="w-10 h-6 object-cover" />
        </button>

        <button className="border p-2 hover:bg-gray-200 rounded">
          <img src="/images/home/GB.png" alt="english" className="w-10 h-6 object-cover" />
        </button>
      </div>

      <p className="text-sm text-gray-600 max-w-[150px] text-center">
      </p>
    </div>
  );
}
