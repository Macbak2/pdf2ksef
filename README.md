# pdf2ksef

Konwerter faktur PDF do formatu XML zgodnego z KSeF (Krajowy System e-Faktur) FA(3).

## Co robi

1. Przeciągnij fakturę PDF na stronę
2. AI (Claude) automatycznie wyodrębnia dane z faktury
3. Sprawdź i edytuj dane w czytelnym formularzu
4. Pobierz gotowy plik XML zgodny ze schematem FA(3) do przesłania do KSeF

## Wymagania

- Node.js 18+
- Klucz API Anthropic (Claude) — https://console.anthropic.com/

## Instalacja

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Wpisz swój klucz ANTHROPIC_API_KEY w pliku .env
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Otwórz http://localhost:5173

## Struktura projektu

```
pdf2ksef/
├── backend/
│   ├── server.js
│   ├── .env.example
│   ├── package.json
│   └── src/
│       ├── routes/
│       │   └── convert.js
│       └── services/
│           ├── pdfExtractor.js   # Ekstrakcja tekstu z PDF
│           ├── invoiceParser.js  # Analiza AI (Claude)
│           └── xmlGenerator.js  # Generowanie XML FA(3)
├── frontend/
│   ├── index.html
│   ├── vite.config.js
│   ├── package.json
│   └── src/
│       ├── App.jsx
│       ├── App.css
│       ├── main.jsx
│       └── components/
│           ├── DropZone.jsx
│           ├── InvoicePreview.jsx
│           └── XmlViewer.jsx
└── .gitignore
```

## Konfiguracja backendu (.env)

```
ANTHROPIC_API_KEY=sk-ant-...
PORT=3001
FRONTEND_URL=http://localhost:5173
```

## Ograniczenia

- Wymaga PDF z warstwą tekstową (nie działa na skanach bez OCR)
- Skomplikowane układy PDF mogą wymagać ręcznej korekty danych
- Wygenerowany XML należy zweryfikować przed wysłaniem do KSeF

## Technologie

- **Frontend**: React 18, Vite, react-dropzone, axios
- **Backend**: Node.js, Express, multer, pdf-parse, xmlbuilder2
- **AI**: Anthropic Claude (claude-opus-4-6)
- **Standard**: KSeF FA(3), schema 1-0E

---

Autor: Maciej Bąk
