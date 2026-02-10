import React from "react";

const OrderDocument = ({ order, onClose, clearCart }) => {
  if (!order) return null;

  const handlePrint = () => {
    // Tworzymy nowe okno/wartości do druku
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      // Jeśli okno się nie otworzy (blokada popup), używamy standardowego druku
      window.print();
      return;
    }

    // Przygotowujemy HTML do druku
    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Dokument zamówienia #${order.id}</title>
          <style>
            @media print {
              @page {
                size: A4;
                margin: 20mm 15mm;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #000;
              }
              .no-print {
                display: none !important;
              }
              .print-only {
                display: block !important;
              }
              .document-container {
                max-width: 210mm;
                margin: 0 auto;
                padding: 0;
              }
              table {
                width: 100%;
                border-collapse: collapse;
                page-break-inside: avoid;
              }
              th, td {
                padding: 8px;
                border: 1px solid #ddd;
              }
              .summary {
                page-break-inside: avoid;
              }
            }
            
            body {
              margin: 0;
              padding: 20px;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #fff;
            }
            
            .header {
              text-align: center;
              margin-bottom: 30px;
              border-bottom: 3px solid #7c3aed;
              padding-bottom: 20px;
            }
            
            .company-info {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 20px;
              margin-bottom: 30px;
            }
            
            .info-box {
              border: 1px solid #ddd;
              padding: 15px;
              border-radius: 8px;
            }
            
            .total-box {
              background: #f5f3ff;
              padding: 20px;
              border-radius: 10px;
              margin-top: 30px;
              text-align: right;
            }
          </style>
        </head>
        <body>
          <div class="document-container">
            <!-- Nagłówek -->
            <div class="header">
              <h1 style="color: #7c3aed; font-size: 28px; margin-bottom: 10px;">
                ${order.document_type === 'invoice' ? 'FAKTURA VAT' : 'PARAGON ZAMÓWIENIA'}
              </h1>
              <div style="display: flex; justify-content: space-between; margin-top: 20px;">
                <div style="text-align: left;">
                  <strong>Numer:</strong> <span style="font-family: monospace;">#${order.id}</span>
                </div>
                <div style="text-align: right;">
                  <strong>Data:</strong> ${new Date(order.created_at || order.date).toLocaleString('pl-PL')}
                </div>
              </div>
            </div>
            
            <!-- Dane firmy/restauracji -->
            <div class="company-info">
              <div class="info-box">
                <h3 style="color: #4b5563; margin-bottom: 10px;">SPRZEDAWCA</h3>
                <p style="font-weight: bold; font-size: 18px; margin: 0;">${order.restaurant_name || order.restaurant}</p>
                <p style="color: #6b7280; margin: 5px 0;">${order.restaurant_address || order.restaurantAddress}</p>
                <p style="margin-top: 10px;"><strong>NIP:</strong> 123-456-78-90</p>
              </div>
              
              <div class="info-box">
                <h3 style="color: #4b5563; margin-bottom: 10px;">KLIENT</h3>
                <p style="font-weight: bold;">Adres dostawy:</p>
                <p style="margin: 5px 0;">${order.delivery_address || order.deliveryAddress}</p>
                ${order.nip ? `<p style="margin-top: 10px;"><strong>NIP klienta:</strong> ${order.nip}</p>` : ''}
              </div>
            </div>
            
            <!-- Tabela produktów -->
            <h3 style="color: #4b5563; margin: 30px 0 15px 0;">POZYCJE ZAMÓWIENIA</h3>
            <table>
              <thead>
                <tr style="background-color: #f3f4f6;">
                  <th style="text-align: left; padding: 10px;">LP.</th>
                  <th style="text-align: left; padding: 10px;">PRODUKT</th>
                  <th style="text-align: center; padding: 10px;">ILOŚĆ</th>
                  <th style="text-align: right; padding: 10px;">CENA JEDN.</th>
                  <th style="text-align: right; padding: 10px;">RAZEM</th>
                </tr>
              </thead>
              <tbody>
                ${(order.items || []).map((item, idx) => `
                  <tr>
                    <td style="padding: 10px;">${idx + 1}.</td>
                    <td style="padding: 10px; font-weight: 500;">${item.name || item.product_name}</td>
                    <td style="text-align: center; padding: 10px;">
                      <span style="background-color: #f5f3ff; padding: 2px 8px; border-radius: 12px; font-weight: bold;">
                        ${item.quantity || item.qty}x
                      </span>
                    </td>
                    <td style="text-align: right; padding: 10px;">${item.price.toFixed(2)} zł</td>
                    <td style="text-align: right; padding: 10px; font-weight: bold;">
                      ${((item.price || 0) * (item.quantity || item.qty || 1)).toFixed(2)} zł
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <!-- Podsumowanie -->
            <div class="total-box summary">
              <p style="margin: 0 0 5px 0; color: #6b7280;">Łączna kwota</p>
              <h2 style="margin: 0; color: #7c3aed; font-size: 32px;">
                ${(order.total_amount || order.total || 0).toFixed(2)} zł
              </h2>
              <p style="margin: 10px 0 0 0; font-size: 14px; color: #6b7280;">
                ${(order.items || []).length} pozycji w zamówieniu
              </p>
            </div>
            
            <!-- Informacje dodatkowe -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px dashed #ddd;">
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                  <p style="margin: 0 0 5px 0; color: #6b7280;"><strong>Metoda płatności:</strong></p>
                  <p style="margin: 0; font-weight: bold;">
                    ${(order.payment_method || order.payment) === 'blik' ? 'BLIK' : 'KARTA PŁATNICZA'}
                  </p>
                </div>
                <div>
                  <p style="margin: 0 0 5px 0; color: #6b7280;"><strong>Status:</strong></p>
                  <p style="margin: 0; font-weight: bold;">
                    ${order.status === 'completed' ? 'ZREALIZOWANO' : 
                      order.status === 'confirmed' ? 'POTWIERDZONO' : 
                      order.status === 'preparing' ? 'W PRZYGOTOWANIU' :
                      order.status === 'delivering' ? 'W DOSTAWIE' : order.status}
                  </p>
                </div>
              </div>
              
              <div style="text-align: center; margin-top: 40px; color: #9ca3af; font-size: 14px;">
                <p>Dokument wygenerowany automatycznie przez system zamówień</p>
                <p><strong>Dziękujemy za złożenie zamówienia!</strong></p>
                <p style="margin-top: 20px;">Data wydruku: ${new Date().toLocaleString('pl-PL')}</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    
    // Czekamy aż zawartość się załaduje i drukujemy
    printWindow.onload = function() {
      printWindow.focus();
      printWindow.print();
      printWindow.onafterprint = function() {
        printWindow.close();
      };
    };
  };

  const handleCloseAndClear = () => {
    if (clearCart) clearCart();
    if (onClose) onClose();
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'preparing': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
      case 'delivering': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Brak daty";
    const date = new Date(dateString);
    return date.toLocaleDateString('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex justify-center items-start z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 w-full max-w-[210mm] min-h-auto my-8 p-6 md:p-8 relative shadow-2xl rounded-xl border border-gray-100 dark:border-gray-700 print:shadow-none print:border-0 print:rounded-none print:my-0 print:mx-auto">

        {/* PRZYCISKI (sticky na górze) */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 py-4 mb-6 border-b border-gray-200 dark:border-gray-700 print:hidden z-10 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              {order.document_type === 'invoice' ? '📄 Faktura VAT' : '🧾 Paragon'}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Zamówienie #{order.id}</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handlePrint}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-bold shadow transition flex items-center gap-2 text-sm whitespace-nowrap"
            >
              🖨️ Drukuj / PDF
            </button>
            <button
              onClick={handleCloseAndClear}
              className="bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 px-4 py-2 rounded-lg font-bold transition flex items-center gap-2 text-sm whitespace-nowrap"
            >
              ✕ Zamknij
            </button>
          </div>
        </div>

        {/* NAGŁÓWEK */}
        <div className="text-center mb-8 print:mb-6">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 text-white py-5 rounded-xl mb-6 print:bg-none print:text-black print:py-3 print:rounded-none print:border-b-2 print:border-gray-800">
            <h1 className="text-2xl md:text-3xl font-bold mb-2 print:text-2xl">
              {order.document_type === 'invoice' ? 'FAKTURA VAT' : 'PARAGON ZAMÓWIENIA'}
            </h1>
            <p className="text-purple-200 print:text-gray-600 print:text-sm">
              Dokument potwierdzający zamówienie
            </p>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl mb-6 print:bg-white print:p-3 print:rounded-none print:border-b print:border-gray-300">
            <div className="text-center md:text-left">
              <p className="font-bold text-lg text-purple-600 dark:text-purple-400 print:text-black print:text-base">
                Numer: <span className="font-mono">#{order.id}</span>
              </p>
            </div>
            <div className="text-center md:text-right">
              <p className="text-gray-600 dark:text-gray-400 print:text-gray-700">
                <span className="font-bold">Data:</span> {formatDate(order.created_at)}
              </p>
            </div>
          </div>
        </div>

        {/* DANE FIRMY/RESTAURACJI - KOMPAKTOWA WERSJA */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 print:gap-3 print:mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 print:bg-white print:border print:p-3 print:rounded-none">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm print:text-gray-800">SPRZEDAWCA</h3>
            <p className="font-bold text-gray-900 dark:text-white text-lg print:text-black print:text-base">{order.restaurant_name}</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm print:text-gray-700">{order.restaurant_address}</p>
            <p className="mt-2 text-sm print:text-gray-700"><strong>NIP:</strong> 123-456-78-90</p>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 print:bg-white print:border print:p-3 print:rounded-none">
            <h3 className="font-bold text-gray-700 dark:text-gray-300 mb-2 text-sm print:text-gray-800">KLIENT</h3>
            <p className="font-bold text-gray-900 dark:text-white text-lg print:text-black print:text-base">Adres dostawy:</p>
            <p className="text-gray-600 dark:text-gray-400 print:text-gray-700">{order.delivery_address}</p>
            {order.nip && (
              <div className="mt-2">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-bold print:text-black">
                  NIP: <span className="font-mono">{order.nip}</span>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TABELA PRODUKTÓW - KOMPAKTOWA */}
        <div className="mb-8 print:mb-6">
          <h3 className="font-bold text-lg mb-4 text-gray-700 dark:text-gray-300 print:text-gray-800">POZYCJE ZAMÓWIENIA</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse print:border print:border-gray-400">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-700 print:bg-gray-200">
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300 text-sm print:text-gray-800 print:p-2 print:border print:border-gray-400">LP.</th>
                  <th className="text-left p-3 text-gray-700 dark:text-gray-300 text-sm print:text-gray-800 print:p-2 print:border print:border-gray-400">PRODUKT</th>
                  <th className="text-center p-3 text-gray-700 dark:text-gray-300 text-sm print:text-gray-800 print:p-2 print:border print:border-gray-400">ILOŚĆ</th>
                  <th className="text-right p-3 text-gray-700 dark:text-gray-300 text-sm print:text-gray-800 print:p-2 print:border print:border-gray-400">CENA</th>
                  <th className="text-right p-3 text-gray-700 dark:text-gray-300 text-sm print:text-gray-800 print:p-2 print:border print:border-gray-400">RAZEM</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, idx) => (
                  <tr 
                    key={idx} 
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30 print:hover:bg-white"
                  >
                    <td className="p-3 text-gray-600 dark:text-gray-400 print:text-black print:p-2 print:border print:border-gray-300">{idx + 1}.</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white print:text-black print:p-2 print:border print:border-gray-300">{item.name}</td>
                    <td className="text-center p-3 print:p-2 print:border print:border-gray-300">
                      <span className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded text-sm font-bold print:bg-gray-100 print:text-black print:border print:border-gray-300">
                        {item.quantity}x
                      </span>
                    </td>
                    <td className="text-right p-3 text-gray-700 dark:text-gray-300 print:text-black print:p-2 print:border print:border-gray-300">{item.price.toFixed(2)} zł</td>
                    <td className="text-right p-3 font-bold text-gray-900 dark:text-white print:text-black print:p-2 print:border print:border-gray-300">
                      {(item.price * item.quantity).toFixed(2)} zł
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* PODSUMOWANIE FINANSOWE - BEZ VAT */}
        <div className="mb-8 print:mb-6">
          <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/10 dark:to-purple-800/10 p-6 rounded-xl border border-purple-200 dark:border-purple-800 print:bg-white print:border print:border-gray-400 print:p-4 print:rounded-none">
            <div className="flex flex-col md:flex-row justify-between items-center print:block">
              <div className="mb-4 md:mb-0 print:mb-2">
                <h3 className="font-bold text-lg text-purple-700 dark:text-purple-300 print:text-black">PODSUMOWANIE</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 print:text-gray-700">
                  {order.items.length} pozycji w zamówieniu
                </p>
              </div>
              <div className="text-center md:text-right print:text-right">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1 print:text-gray-700">Łączna kwota</p>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400 print:text-black print:text-2xl">
                  {order.total_amount.toFixed(2)} zł
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* METODA PŁATNOŚCI I STATUS - KOMPAKTOWE */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4 print:grid-cols-2 print:gap-3 print:mb-6">
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 print:bg-white print:border print:border-gray-400 print:p-3 print:rounded-none">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm print:text-gray-800">METODA PŁATNOŚCI</h4>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${order.payment_method === 'blik' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'} print:bg-gray-200 print:text-black`}>
                {order.payment_method === 'blik' ? '📱' : '💳'}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white print:text-black">
                  {order.payment_method === 'blik' ? 'BLIK' : 'KARTA PŁATNICZA'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-700">Płatność zakończona</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl border border-gray-200 dark:border-gray-600 print:bg-white print:border print:border-gray-400 print:p-3 print:rounded-none">
            <h4 className="font-bold text-gray-700 dark:text-gray-300 mb-3 text-sm print:text-gray-800">STATUS</h4>
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${getStatusColor(order.status)} print:bg-gray-200 print:text-black`}>
                {order.status === 'completed' ? '✅' : 
                 order.status === 'preparing' ? '👨‍🍳' :
                 order.status === 'delivering' ? '🚚' : '⏳'}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white print:text-black">
                  {order.status === 'completed' ? 'ZREALIZOWANO' : 
                   order.status === 'confirmed' ? 'POTWIERDZONO' : 
                   order.status === 'preparing' ? 'W PRZYGOTOWANIU' :
                   order.status === 'delivering' ? 'W DOSTAWIE' : order.status}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-700">
                  Zamówienie {order.status === 'completed' ? 'zakończone' : 'w trakcie'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* STOPKA */}
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700 print:pt-4 print:mt-6">
          <div className="text-center print:text-left">
            <p className="text-gray-500 dark:text-gray-400 text-sm mb-2 print:text-gray-700">
              Dokument wygenerowany automatycznie przez system zamówień
            </p>
            <p className="text-gray-600 dark:text-gray-300 font-bold print:text-black">
              Dziękujemy za złożenie zamówienia! 🎉
            </p>
          </div>
          
          {/* INFORMACJA O DRUKU */}
          <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center print:hidden">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Aby wydrukować ten dokument, kliknij przycisk "Drukuj" u góry
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Data wygenerowania: {new Date().toLocaleString('pl-PL')}
            </p>
          </div>
        </div>

        {/* WERSJA DO DRUKU - dodatkowe informacje (tylko przy drukowaniu) */}
        <div className="hidden print:block mt-8 pt-6 border-t border-gray-300">
          <p className="text-xs text-gray-500 text-center">
            Dokument potwierdzający zamówienie #{order.id}<br />
            Data wydruku: {new Date().toLocaleString('pl-PL')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default OrderDocument;