const Anthropic = require('@anthropic-ai/sdk');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { trackFallback, getConfig } = require('./usageTracker');

const anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const geminiClient = process.env.GEMINI_API_KEY
 ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
 : null;

const SYSTEM_PROMPT = `Jesteś ekspertem od polskich faktur VAT i systemu KSeF (Krajowy System e-Faktur).
Twoim zadaniem jest wyodrębnić dane z tekstu faktury PDF i zwrócić je jako poprawny JSON.
Zwróć TYLKO czysty JSON bez markdown, komentarzy ani dodatkowego tekstu.`;

const USER_PROMPT_TEMPLATE = (pdfText) => `Przeanalizuj poniższy tekst faktury i wyodrębnij dane do struktury JSON.

TEKST FAKTURY:
${pdfText}

Zwróć dane w dokładnie tej strukturze JSON:
{
  "seller": {
    "nip": "NIP sprzedawcy (same cyfry, bez kresek)",
    "name": "Nazwa firmy sprzedawcy",
    "address": "Ulica i numer",
    "postalCode": "Kod pocztowy",
    "city": "Miasto",
    "country": "PL"
  },
  "buyer": {
    "type": "nip | vat_ue | foreign | consumer",
    "nip": "NIP nabywcy jeśli polski (same cyfry) lub null",
    "kodUE": "Kod kraju UE np. DE, FR jeśli nabywca unijny lub null",
    "nrVatUE": "Numer VAT UE bez prefiksu kraju lub null",
    "kodKraju": "Kod kraju ISO jeśli spoza UE lub null",
    "nrID": "Numer identyfikacyjny zagranicznego nabywcy lub null",
    "brakID": "true jeśli konsument bez NIP, false w pozostałych przypadkach",
    "name": "Nazwa firmy lub imię i nazwisko nabywcy",
    "address": "Ulica i numer",
    "postalCode": "Kod pocztowy",
    "city": "Miasto",
    "country": "PL lub kod kraju"
  },
  "invoice": {
    "number": "Numer faktury",
    "issueDate": "Data wystawienia YYYY-MM-DD",
    "saleDate": "Data sprzedaży YYYY-MM-DD (jeśli inna niż data wystawienia, inaczej null)",
    "currency": "PLN lub kod waluty",
    "type": "VAT",
    "issueLocation": "Miejscowość wystawienia"
  },
  "items": [
    {
      "lp": 1,
      "name": "Nazwa towaru/usługi — przepisz DOKŁADNIE tak jak na fakturze, znak po znaku",
      "pkwiu": "Kod PKWiU lub null",
      "quantity": "ilość jako liczba",
      "unit": "szt, usł, kg, m itp.",
      "unitPriceNet": "cena jednostkowa netto jako liczba",
      "discount": "rabat % jako liczba lub 0",
      "netValue": "wartość netto jako liczba",
      "vatRate": "jedna z wartości: 23, 22, 8, 7, 5, 0 KR, 0 WDT, 0 EX, zw, oo, np I, np II",
      "vatAmount": "kwota VAT jako liczba",
      "grossValue": "wartość brutto jako liczba"
    }
  ],
  "totals": {
    "rate_23": { "net": 0, "vat": 0 },
    "rate_8": { "net": 0, "vat": 0 },
    "rate_5": { "net": 0, "vat": 0 },
    "rate_0_KR": { "net": 0, "vat": 0 },
    "rate_0_WDT": { "net": 0, "vat": 0 },
    "rate_0_EX": { "net": 0, "vat": 0 },
    "rate_zw": { "net": 0, "vat": 0 },
    "rate_oo": { "net": 0, "vat": 0 },
    "rate_np_I": { "net": 0, "vat": 0 },
    "rate_np_II": { "net": 0, "vat": 0 },
    "totalNet": 0,
    "totalVat": 0,
    "totalGross": 0
  },
  "annotations": {
    "metodaKasowa": false,
    "samofakturowanie": false,
    "odwrotneObciazenie": false,
    "mechanizmPodzielonejPlatnosci": false,
    "zwolnienie": null,
    "podstawaZwolnienia": null,
    "noweŚrodkiTransportu": false
  },
  "payment": {
    "form": "przelew | gotówka | karta | kompensata",
    "dueDate": "Termin płatności YYYY-MM-DD lub null",
    "bankAccount": "Numer rachunku bankowego (IBAN) lub null",
    "swift": "Kod SWIFT/BIC lub null"
  },
  "exchangeRate": {
    "currency": "Waluta kursu np. EUR lub null",
    "rate": "Kurs jako liczba lub null",
    "date": "Data kursu YYYY-MM-DD lub null",
    "table": "Numer tabeli NBP lub null"
  },
  "correction": {
    "isCorrection": "true jeśli to faktura korygująca, false w pozostałych przypadkach",
    "reason": "Przyczyna korekty lub null",
    "type": "1 (korekta danych) | 2 (zmniejszenie wartości) | 3 (zwiększenie lub mieszana zmiana wartości) lub null",
    "correctedInvoiceNumber": "Numer korygowanej faktury lub null",
    "correctedInvoiceDate": "Data wystawienia korygowanej faktury YYYY-MM-DD lub null",
    "correctedInvoiceKSeFNumber": "Numer KSeF korygowanej faktury lub null"
  }
}

Ważne zasady:
- Dla stawki VAT użyj: "23", "22", "8", "7", "5", "0 KR", "0 WDT", "0 EX", "zw", "oo", "np I", "np II"
- Jeśli sprzedaż jest krajowa z VAT 0%, użyj "0 KR"
- Jeśli WDT (dostawa wewnątrzwspólnotowa), użyj "0 WDT"
- Jeśli eksport, użyj "0 EX"
- Stawka "nieop." lub "not applicable" lub "nieopodatkowane" to "np I"; "np II" tylko dla art. 100 ust.1 pkt 4 — użyj np I jeśli masz wątpliwości
- W sekcji totals: dla stawki "np I" użyj pola rate_np_I, dla "np II" użyj rate_np_II
- ADNOTACJA odwrotneObciazenie (P_18=true): ustaw TRUE gdy na fakturze widnieje adnotacja "odwrotne obciążenie" lub "reverse charge" — dotyczy to zarówno krajowego odwrotnego obciążenia (art. 17 ustawy o VAT) jak i usług B2B dla zagranicznych kontrahentów (art. 28b, stawka np I), gdzie nabywca jest zobowiązany do rozliczenia podatku. Zgodnie z art. 106e ust. 1 pkt 18 ustawy o VAT, każda faktura z adnotacją "odwrotne obciążenie" wymaga P_18=true w KSeF.
- Wartości liczbowe jako liczby (nie stringi), zaokrąglone do 2 miejsc po przecinku
- Daty w formacie YYYY-MM-DD
- NIP bez kresek i spacji
- WALUTA KWOT: Wszystkie wartości w polach totals (net, vat) oraz w pozycjach faktury (netValue, vatAmount, grossValue, unitPriceNet) podaj w walucie faktury (pole invoice.currency). Jeśli faktura jest w EUR, wszystkie kwoty mają być w EUR — NIE przeliczaj na PLN.
- KODOWANIE ZNAKÓW: Tekst PDF może zawierać artefakty błędnego kodowania. Popraw wszystkie błędnie zakodowane polskie znaki — np. "PrzemyÅl" popraw na "Przemyśl", "Å‚" na "ł", "Å›" na "ś", "Ä™" na "ę", "Ä…" na "ą", "Å¼" na "ż", "Åº" na "ź", "Ä" na "ć", "Åˆ" na "ń", "Å"" na "ó". Popraw też błędnie zdekodowane myślniki: znak "â" lub "â€"" lub "â€™" między słowami zastąp zwykłym myślnikiem "-".
- SPACJE: Jeśli tekst PDF wygląda na scalony bez spacji, zrekonstruuj spacje logicznie rozpoznając granice słów. Wskazówki: przejście małe→duże litery sugeruje nowe słowo (np. "exportUE" → "export UE"), kolejne wielkie litery po sobie to skrót lub akronim ("MBE" zostaje), cyfry oddzielone od liter to osobne elementy ("strefa6" → "strefa 6"). Przykład: "MBEexportUEstrefa6-expressaver" → "MBE export UE strefa 6-express aver". Myślnik bez spacji (wyraz1-wyraz2) zostaw bez zmian jeśli tak jest w oryginale.`;

function parseJson(text) {
 const cleaned = text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
 try {
  return JSON.parse(cleaned);
 } catch (e) {
  throw new Error('AI zwróciło nieprawidłowy JSON: ' + e.message);
 }
}

async function parseWithGemini(pdfText) {
 const model = geminiClient.getGenerativeModel({ model: 'gemini-2.5-flash' });
 const prompt = SYSTEM_PROMPT + '\n\n' + USER_PROMPT_TEMPLATE(pdfText);
 const result = await model.generateContent(prompt);
 return parseJson(result.response.text());
}

async function parseWithClaude(pdfText) {
 const message = await anthropicClient.messages.create({
  model: 'claude-opus-4-6',
  max_tokens: 4096,
  messages: [{ role: 'user', content: USER_PROMPT_TEMPLATE(pdfText) }],
  system: SYSTEM_PROMPT
 });
 return parseJson(message.content[0].text);
}

// Zwraca { data, provider }
async function parseInvoiceWithAI(pdfText) {
 const config = getConfig();
 const forceProvider = config.forceProvider || 'auto';

 if (forceProvider === 'claude') {
  const data = await parseWithClaude(pdfText);
  return { data, provider: 'claude' };
 }

 if (forceProvider === 'gemini' && geminiClient) {
  const data = await parseWithGemini(pdfText);
  return { data, provider: 'gemini' };
 }

 // auto: Gemini first, Claude as fallback
 if (geminiClient) {
  try {
   const data = await parseWithGemini(pdfText);
   return { data, provider: 'gemini' };
  } catch (err) {
   try { trackFallback(err.message); } catch {}
   console.warn('[AI] Gemini failed, falling back to Claude:', err.message);
  }
 }

 const data = await parseWithClaude(pdfText);
 return { data, provider: 'claude' };
}

module.exports = { parseInvoiceWithAI };
