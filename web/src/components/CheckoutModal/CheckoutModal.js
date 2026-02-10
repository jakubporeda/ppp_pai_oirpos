import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

// --- IMPORTY ZDJĘĆ ---
// Upewnij się, że pliki są w folderze src/assets/images/
import blikImg from '../../assets/blik.png';
import cardImg from '../../assets/karta.png';

import OrderDocument from "../OrderDocument/OrderDocument";

const CheckoutModal = ({ isOpen, onClose }) => {
    const { cartItems, cartRestaurant, cartTotal, removeFromCart, clearCart } = useCart();
    const token = localStorage.getItem("access_token");

    // --- STANY PROCESU ---
    const [step, setStep] = useState(1);
    const [allAddresses, setAllAddresses] = useState([]);

    // --- DANE FORMULARZA ---
    const [remarks, setRemarks] = useState("");
    const [deliveryType, setDeliveryType] = useState("ASAP");
    const [selectedTime, setSelectedTime] = useState("");

    // Adres
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [newAddress, setNewAddress] = useState({ city: "", street: "", number: "" });

    // --- PŁATNOŚĆ ---
    const [paymentMethod, setPaymentMethod] = useState("blik");
    const [blikCode, setBlikCode] = useState("");
    const [cardData, setCardData] = useState({ number: "", date: "", cvc: "" });

    // --- DOKUMENT ZAKUPU ---
    const [documentType, setDocumentType] = useState("receipt"); // 'receipt' lub 'invoice'
    const [nip, setNip] = useState("");

    const [orderData, setOrderData] = useState(null);
    const [showDocument, setShowDocument] = useState(false);


    // --- FORMATOWANIE KARTY (spacja co 4 cyfry) ---
    const handleCardNumberChange = (e) => {
        let value = e.target.value.replace(/\D/g, ''); // Tylko cyfry
        value = value.substring(0, 16); // Limit 16
        const formatted = value.match(/.{1,4}/g)?.join(' ') || value;
        setCardData({ ...cardData, number: formatted });
    };

    // --- FORMATOWANIE DATY (MM/YY) ---
    const handleCardDateChange = (e) => {
        let value = e.target.value.replace(/\D/g, '');
        value = value.substring(0, 4); // Limit 4 (MMYY)
        if (value.length >= 2) {
            value = value.substring(0, 2) + '/' + value.substring(2, 4);
        }
        setCardData({ ...cardData, date: value });
    };

    const sendOrderToBackend = async () => {
        try {
            const token = localStorage.getItem("access_token");

            // Przygotuj dane zamówienia zgodnie z naszym schematem
            const orderData = {
                restaurant_id: cartRestaurant.id,
                total_amount: cartTotal,
                payment_method: paymentMethod,
                delivery_address: selectedAddressId === 'new'
                    ? `${newAddress.street} ${newAddress.number}, ${newAddress.city}`
                    : (() => {
                        const addr = allAddresses.find(a => a.id === selectedAddressId);
                        return addr ? `${addr.street} ${addr.number}, ${addr.city}` : '';
                    })(),
                delivery_time_type: deliveryType,  // "ASAP" lub "SCHEDULED"
                document_type: documentType,  // "receipt" lub "invoice"
                nip: documentType === 'invoice' ? nip : null,
                remarks: remarks,
                items: cartItems.map(item => ({
                    product_id: item.id,
                    quantity: item.quantity,
                    price: item.price,
                    name: item.name
                }))
            };

            console.log("Wysyłanie zamówienia:", orderData);

            const response = await fetch("http://127.0.0.1:8000/orders/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(orderData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Błąd odpowiedzi:", errorText);
                throw new Error(`Błąd ${response.status}: ${errorText}`);
            }

            const order = await response.json();
            setOrderData(order);
            setShowDocument(true);
            console.log("Zamówienie utworzone:", order);
            return order;

        } catch (error) {
            console.error("Błąd wysyłania zamówienia:", error);
            throw error;
        }
    };
    // --- POBIERANIE DANYCH ---
    useEffect(() => {
        if (isOpen && token) {
            fetchAllData();
        }
        // eslint-disable-next-line
    }, [isOpen, token]);

    const fetchAllData = async () => {
        try {
            // 1. Adres domowy z profilu
            const userRes = await fetch("http://127.0.0.1:8000/users/me", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            let mainAddress = null;
            if (userRes.ok) {
                const userData = await userRes.json();
                mainAddress = {
                    id: 'main_home',
                    name: '🏠 Adres Domowy',
                    city: userData.city,
                    street: userData.street,
                    number: ''
                };
            }

            // 2. Dodatkowe adresy
            const addrRes = await fetch("http://127.0.0.1:8000/users/addresses", {
                headers: { "Authorization": `Bearer ${token}` }
            });
            let extraAddresses = [];
            if (addrRes.ok) {
                extraAddresses = await addrRes.json();
            }

            const combined = [];
            if (mainAddress) combined.push(mainAddress);
            combined.push(...extraAddresses);

            setAllAddresses(combined);
            if (combined.length > 0) setSelectedAddressId(combined[0].id);

        } catch (e) { console.error("Błąd pobierania danych", e); }
    };

    const generateTimeSlots = () => {
        const slots = [];
        const now = new Date();
        let startHour = now.getHours() + 1;
        if (startHour < 10) startHour = 10;

        for (let h = startHour; h <= 22; h++) {
            slots.push(`${h}:00`);
            slots.push(`${h}:30`);
        }
        return slots;
    };
    const timeSlots = generateTimeSlots();

    if (!isOpen) return null;

    // --- FINALIZACJA ---
    const handlePlaceOrder = async () => {
        try {
            const order = await sendOrderToBackend();

            // Dodaj alert tylko dla informacji
            alert(`🎉 Zamówienie przyjęte!\nNumer: #${order.id}`);

            // Ustaw dane i pokaż dokument
            setOrderData(order);
            setShowDocument(true);

            // NIE zamykaj modalnego okna od razu!
            // onClose(); // ← ZAKOMENTUJ TĘ LINIĘ

            // NIE czyść też koszyka, aż użytkownik zamknie dokument
            // clearCart(); // ← ZAKOMENTUJ

            // Reset tylko formularza


            setStep(1);
            setBlikCode("");
            setCardData({ number: "", date: "", cvc: "" });
            setNip("");
            //onClose();
        }
        catch (e) {
            alert("❌ Nie udało się złożyć zamówienia");

        }
    };

    // ================= WIDOKI KROKÓW =================

    // --- KROK 1: KOSZYK ---
    const renderStep1 = () => (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b pb-3">1. Co zamawiamy?</h3>

            <div className="space-y-3">
                {cartItems.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-gray-50 dark:bg-gray-700 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-600">
                        <div className="flex items-center gap-4">
                            <div className="bg-purple-100 text-purple-700 font-bold w-10 h-10 flex items-center justify-center rounded-full">
                                {item.quantity}x
                            </div>
                            <div>
                                <div className="font-bold text-lg text-gray-800 dark:text-white">{item.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{item.price} zł / szt.</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            <span className="font-bold text-gray-700 dark:text-gray-300">
                                {(item.price * item.quantity).toFixed(2)} zł
                            </span>
                            <button
                                onClick={() => removeFromCart(item.id)}
                                className="text-red-500 hover:bg-red-50 p-2 rounded-full transition"
                                title="Usuń"
                            >
                                🗑️
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex justify-between items-center text-2xl font-bold text-gray-800 dark:text-white pt-4 border-t dark:border-gray-700">
                <span>Razem:</span>
                <span className="text-purple-600">{cartTotal.toFixed(2)} zł</span>
            </div>

            <div>
                <label className="block text-sm font-bold text-gray-600 dark:text-gray-400 mb-2">Dodatkowe uwagi dla kuchni</label>
                <textarea
                    className="w-full p-4 border rounded-xl bg-white dark:bg-gray-700 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none resize-none shadow-sm"
                    rows="2"
                    placeholder="np. 'Bez cebuli', 'Kod do domofonu 123'..."
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                />
            </div>
        </div>
    );

    // --- KROK 2: DOSTAWA I PŁATNOŚĆ ---
    const renderStep2 = () => (
        <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b pb-3">2. Gdzie i jak?</h3>

            {/* ADRESY */}
            <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Adres dostawy</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {allAddresses.map(addr => (
                        <label key={addr.id} className={`relative flex items-start gap-3 p-4 border-2 rounded-xl cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700 ${selectedAddressId === addr.id ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-600'}`}>
                            <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === addr.id}
                                onChange={() => setSelectedAddressId(addr.id)}
                                className="mt-1 accent-purple-600 w-4 h-4 shrink-0"
                            />
                            <div>
                                <div className="font-bold text-gray-800 dark:text-white">{addr.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-300">{addr.street} {addr.number}, {addr.city}</div>
                            </div>
                        </label>
                    ))}

                    {/* INNY ADRES - FORMULARZ */}
                    <label className={`relative flex flex-col gap-2 p-4 border-2 rounded-xl cursor-pointer transition ${selectedAddressId === 'new' ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-100 dark:border-gray-600'}`}>
                        <div className="flex items-center gap-3">
                            <input
                                type="radio"
                                name="address"
                                checked={selectedAddressId === 'new'}
                                onChange={() => setSelectedAddressId('new')}
                                className="accent-purple-600 w-4 h-4 shrink-0"
                            />
                            <span className="font-bold text-gray-800 dark:text-white">Inny adres (jednorazowy)</span>
                        </div>

                        {selectedAddressId === 'new' && (
                            <div className="mt-3 animate-in fade-in space-y-3 cursor-default" onClick={(e) => e.preventDefault()}>
                                <div className="grid grid-cols-2 gap-3">
                                    <input
                                        placeholder="Miasto"
                                        className="p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white w-full focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={newAddress.city}
                                        onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                    />
                                    <input
                                        placeholder="Ulica"
                                        className="p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white w-full focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={newAddress.street}
                                        onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <input
                                        placeholder="Nr domu / lokalu"
                                        className="p-2 border rounded-lg text-sm dark:bg-gray-700 dark:text-white w-1/2 focus:ring-2 focus:ring-purple-500 outline-none"
                                        value={newAddress.number}
                                        onChange={e => setNewAddress({ ...newAddress, number: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </label>
                </div>
            </div>

            {/* DOKUMENT ZAKUPU */}
            <div className="bg-gray-50 dark:bg-gray-700/30 p-4 rounded-xl border border-gray-100 dark:border-gray-600">
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Dokument zakupu</label>
                <div className="flex gap-4">
                    <label className={`flex-1 p-3 border-2 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition ${documentType === 'receipt' ? 'border-purple-500 bg-white text-purple-700 font-bold shadow-sm' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100'}`}>
                        <input type="radio" name="doc" className="hidden" checked={documentType === 'receipt'} onChange={() => setDocumentType('receipt')} />
                        🧾 Paragon
                    </label>
                    <label className={`flex-1 p-3 border-2 rounded-xl cursor-pointer flex items-center justify-center gap-2 transition ${documentType === 'invoice' ? 'border-purple-500 bg-white text-purple-700 font-bold shadow-sm' : 'border-gray-200 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100'}`}>
                        <input type="radio" name="doc" className="hidden" checked={documentType === 'invoice'} onChange={() => setDocumentType('invoice')} />
                        📄 Faktura VAT
                    </label>
                </div>
                {/* Pole NIP dla Faktury */}
                {documentType === 'invoice' && (
                    <div className="mt-3 animate-in fade-in slide-in-from-top-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1 ml-1">NUMER NIP</label>
                        <input
                            type="text"
                            placeholder="Wpisz NIP (np. 123-456-78-90)"
                            value={nip}
                            onChange={(e) => setNip(e.target.value)}
                            className="w-full p-2 border rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                        />
                    </div>
                )}
            </div>

            {/* CZAS I PŁATNOŚĆ */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">

                {/* CZAS */}
                <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Czas dostawy</label>
                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => setDeliveryType("ASAP")}
                            className={`p-3 rounded-xl text-left border-2 font-bold transition flex items-center gap-2 ${deliveryType === 'ASAP' ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 dark:border-gray-600 dark:text-white'}`}
                        >
                            <span className="text-xl">⚡</span> Jak najszybciej
                        </button>

                        <div className="relative">
                            <select
                                onChange={(e) => {
                                    setDeliveryType("SCHEDULED");
                                    setSelectedTime(e.target.value);
                                }}
                                className={`w-full p-3 rounded-xl border-2 font-bold appearance-none bg-white dark:bg-gray-700 dark:text-white cursor-pointer ${deliveryType === 'SCHEDULED' ? 'border-purple-500 text-purple-700' : 'border-gray-200 dark:border-gray-600'}`}
                                value={selectedTime}
                            >
                                <option value="" disabled>📅 Wybierz godzinę...</option>
                                {timeSlots.map(time => <option key={time} value={time}>{time}</option>)}
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">▼</div>
                        </div>
                    </div>
                </div>

                {/* PŁATNOŚĆ */}
                <div>
                    <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-3 uppercase tracking-wider">Metoda płatności</label>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={() => setPaymentMethod("blik")}
                            className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition h-24 ${paymentMethod === 'blik' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'}`}
                        >
                            <img src={blikImg} alt="BLIK" className="h-8 object-contain" />
                            <span className={`text-xs font-bold ${paymentMethod === 'blik' ? 'text-purple-700' : 'text-gray-500'}`}>Kod BLIK</span>
                        </button>

                        <button
                            onClick={() => setPaymentMethod("card")}
                            className={`p-2 rounded-xl border-2 flex flex-col items-center justify-center gap-2 transition h-24 ${paymentMethod === 'card' ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:bg-gray-50 dark:border-gray-600 dark:hover:bg-gray-700'}`}
                        >
                            <img src={cardImg} alt="Karta" className="h-8 object-contain" />
                            <span className={`text-xs font-bold ${paymentMethod === 'card' ? 'text-purple-700' : 'text-gray-500'}`}>Karta</span>
                        </button>
                    </div>

                    {/* DANE PŁATNOŚCI (Z FORMATOWANIEM) */}
                    <div className="animate-in fade-in slide-in-from-top-2">
                        {paymentMethod === 'blik' && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 text-center">
                                <label className="block text-xs font-bold text-gray-500 mb-2">WPISZ KOD BLIK</label>
                                <input
                                    type="text"
                                    maxLength="6"
                                    placeholder="000 000"
                                    value={blikCode}
                                    onChange={(e) => setBlikCode(e.target.value.replace(/\D/g, ''))}
                                    className="w-full text-center text-2xl font-bold tracking-[0.5em] p-2 border-2 border-purple-300 rounded-lg outline-none focus:border-purple-600 dark:bg-gray-800 dark:text-white"
                                />
                            </div>
                        )}

                        {paymentMethod === 'card' && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600 space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">NUMER KARTY</label>
                                    <input
                                        type="text"
                                        placeholder="0000 0000 0000 0000"
                                        maxLength="19"
                                        value={cardData.number}
                                        onChange={handleCardNumberChange}
                                        className="w-full p-2 border rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">DATA (MM/YY)</label>
                                        <input
                                            type="text"
                                            placeholder="MM/YY"
                                            maxLength="5"
                                            value={cardData.date}
                                            onChange={handleCardDateChange}
                                            className="w-full p-2 border rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">CVC</label>
                                        <input
                                            type="text"
                                            placeholder="123"
                                            maxLength="3"
                                            value={cardData.cvc}
                                            onChange={(e) => setCardData({ ...cardData, cvc: e.target.value.replace(/\D/g, '') })}
                                            className="w-full p-2 border rounded-lg text-sm dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-purple-500 outline-none font-mono"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // --- KROK 3: PODSUMOWANIE ---
    const renderStep3 = () => {
        let finalAddressString = "";
        if (selectedAddressId === 'new') {
            finalAddressString = `${newAddress.street} ${newAddress.number}, ${newAddress.city}`;
        } else {
            const addr = allAddresses.find(a => a.id === selectedAddressId);
            finalAddressString = addr ? `${addr.street} ${addr.number}, ${addr.city}` : "Adres Domowy";
        }

        const paymentDisplay = paymentMethod === 'blik'
            ? `BLIK (Kod: ${blikCode ? blikCode.slice(0, 3) + '***' : 'Brak'})`
            : `Karta (**** ${cardData.number ? cardData.number.slice(-4) : '****'})`;

        return (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white border-b pb-3 border-gray-200 dark:border-gray-700">
                    3. Podsumowanie zamówienia
                </h3>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden">

                    {/* Restauracja */}
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div className="bg-purple-100 dark:bg-purple-900/50 p-3 rounded-full text-2xl">🏢</div>
                        <div>
                            <div className="text-xs text-purple-600 dark:text-purple-300 uppercase font-bold tracking-wider mb-1">Restauracja</div>
                            <div className="font-bold text-lg text-gray-900 dark:text-white">{cartRestaurant?.name}</div>
                        </div>
                    </div>

                    {/* Adres */}
                    <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                        <div className="bg-blue-100 dark:bg-blue-900/50 p-3 rounded-full text-2xl">📍</div>
                        <div>
                            <div className="text-xs text-blue-600 dark:text-blue-300 uppercase font-bold tracking-wider mb-1">Adres dostawy</div>
                            <div className="font-bold text-lg text-gray-900 dark:text-white">{finalAddressString}</div>
                        </div>
                    </div>

                    {/* Grid: Czas/Dokument i Płatność */}
                    <div className="grid grid-cols-2">
                        <div className="p-5 border-r border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">
                                Czas / Dokument
                            </div>
                            <div className="font-bold text-gray-900 dark:text-white text-sm">
                                {deliveryType === "ASAP" ? "⚡ ASAP" : `🕒 ${selectedTime}`}
                                <br />
                                <span className={documentType === 'invoice' ? "text-purple-600 font-bold block mt-1" : "block mt-1"}>
                                    {documentType === 'receipt' ? '🧾 Paragon' : `📄 Faktura VAT ${nip ? '(' + nip + ')' : ''}`}
                                </span>
                            </div>
                        </div>
                        <div className="p-5 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                            <div className="text-xs text-gray-500 dark:text-gray-400 uppercase font-bold tracking-wider mb-1">Płatność</div>
                            <div className="font-bold text-gray-900 dark:text-white text-lg">{paymentDisplay}</div>
                        </div>
                    </div>
                </div>

                {/* UWAGI */}
                {remarks ? (
                    <div className="bg-gray-100 dark:bg-gray-700 p-5 rounded-xl border-l-4 border-purple-500 shadow-sm">
                        <span className="block text-xs font-bold text-gray-500 dark:text-gray-300 uppercase mb-2">Twoje uwagi:</span>
                        <p className="text-gray-800 dark:text-white italic text-lg font-medium">"{remarks}"</p>
                    </div>
                ) : (
                    <div className="text-center text-gray-400 text-sm italic py-2">Brak dodatkowych uwag.</div>
                )}

                {/* CENA */}
                <div className="flex justify-between items-center bg-gradient-to-r from-purple-600 to-purple-800 text-white p-6 rounded-2xl shadow-lg mt-4 transform hover:scale-[1.01] transition">
                    <span className="text-purple-200 font-bold uppercase tracking-widest text-sm">Do zapłaty</span>
                    <span className="text-4xl font-extrabold">{cartTotal.toFixed(2)} zł</span>
                </div>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4 overflow-y-auto">
            <div className="absolute inset-0" onClick={onClose}></div>

            <div className="relative bg-white dark:bg-gray-800 w-full max-w-4xl rounded-3xl shadow-2xl flex flex-col my-auto max-h-[95vh]">

                {/* Header */}
                <div className="px-8 py-6 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 rounded-t-3xl sticky top-0 z-10">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">Finalizacja zamówienia</h2>
                        <div className="flex gap-2 mt-2">
                            <div className={`h-1 w-8 rounded-full transition-colors ${step >= 1 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                            <div className={`h-1 w-8 rounded-full transition-colors ${step >= 2 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                            <div className={`h-1 w-8 rounded-full transition-colors ${step >= 3 ? 'bg-purple-600' : 'bg-gray-200'}`}></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 p-2 rounded-full transition">✕</button>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto custom-scrollbar flex-1">
                    {cartItems.length === 0 ? (
                        <div className="text-center py-20">
                            <div className="text-6xl mb-4">🛒</div>
                            <h3 className="text-xl font-bold text-gray-500">Twój koszyk jest pusty</h3>
                        </div>
                    ) : (
                        <>
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </>
                    )}
                </div>

                {/* Footer Buttons */}
                {cartItems.length > 0 && (
                    <div className="p-6 border-t dark:border-gray-700 bg-gray-50 dark:bg-gray-900 rounded-b-3xl flex justify-between items-center gap-4 sticky bottom-0 z-10">
                        {step > 1 ? (
                            <button
                                onClick={() => setStep(step - 1)}
                                className="px-6 py-3 rounded-xl font-bold text-gray-600 hover:bg-gray-200 dark:text-gray-300 dark:hover:bg-gray-700 transition"
                            >
                                ← Wróć
                            </button>
                        ) : (
                            <button
                                onClick={onClose}
                                className="px-6 py-3 rounded-xl font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                                Anuluj
                            </button>
                        )}

                        {step < 3 ? (
                            <button
                                onClick={() => setStep(step + 1)}
                                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold shadow-lg transition transform hover:scale-105"
                            >
                                Dalej →
                            </button>
                        ) : (
                            <button
                                onClick={handlePlaceOrder}
                                className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg transition transform hover:scale-105 flex items-center gap-2"
                            >
                                ✅ Potwierdzam i Płacę
                            </button>
                        )}
                    </div>
                )}
            </div>
            {showDocument && (
                <OrderDocument
                    order={orderData}
                    onClose={() => {
                        setShowDocument(false);
                        onClose(); // Zamknij główny modal CheckoutModal
                    }}
                    clearCart={clearCart} // Przekaż funkcję czyszczenia koszyka
                />
            )}

        </div>
    );
};

export default CheckoutModal;