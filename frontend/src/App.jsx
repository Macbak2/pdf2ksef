import React, { useState } from 'react';
import axios from 'axios';
import DropZone from './components/DropZone';
import InvoicePreview from './components/InvoicePreview';
import XmlViewer from './components/XmlViewer';

export default function App() {
 const [stage, setStage] = useState('upload'); // upload | loading | preview
 const [invoiceData, setInvoiceData] = useState(null);
 const [xml, setXml] = useState('');
 const [error, setError] = useState('');
 const [activeTab, setActiveTab] = useState('data');

 async function handleFileDrop(file) {
  setError('');
  setStage('loading');

  const formData = new FormData();
  formData.append('pdf', file);

  try {
   const response = await axios.post('/api/convert', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
   });
   setInvoiceData(response.data.invoiceData);
   setXml(response.data.xml);
   setStage('preview');
   setActiveTab('data');
  } catch (err) {
   const msg = err.response?.data?.error || err.message || 'Błąd przetwarzania pliku';
   setError(msg);
   setStage('upload');
  }
 }

 async function handleDataChange(updatedData) {
  setInvoiceData(updatedData);
  try {
   const response = await axios.post('/api/convert/generate-xml', { invoiceData: updatedData });
   setXml(response.data.xml);
  } catch (err) {
   console.error('XML regeneration error:', err);
  }
 }

 function handleReset() {
  setStage('upload');
  setInvoiceData(null);
  setXml('');
  setError('');
 }

 return (
  <div className="app">
   <header className="app-header">
    <div className="header-inner">
     <div className="logo">
      <span className="logo-icon">📄</span>
      <span className="logo-text">pdf2ksef</span>
     </div>
     <p className="tagline">Konwerter faktur PDF do formatu KSeF FA(3)</p>
    </div>
   </header>

   <main className="app-main">
    {stage === 'upload' && (
     <div className="upload-section">
      <DropZone onFileDrop={handleFileDrop} />
      {error && (
       <div className="error-box">
        <strong>Błąd:</strong> {error}
       </div>
      )}
      <div className="info-box">
       <h3>Jak to działa?</h3>
       <ol>
        <li>Przeciągnij fakturę PDF lub kliknij, aby wybrać plik</li>
        <li>AI odczyta i wyodrębni dane z faktury</li>
        <li>Sprawdź i edytuj dane w podglądzie</li>
        <li>Pobierz gotowy plik XML zgodny z KSeF FA(3)</li>
       </ol>
       <p className="note">Wymaga pliku PDF z warstwą tekstową (nie skan). Klucz API Anthropic wymagany po stronie backendu.</p>
      </div>
     </div>
    )}

    {stage === 'loading' && (
     <div className="loading-section">
      <div className="spinner"></div>
      <p>Analizuję fakturę przy pomocy AI...</p>
      <p className="loading-sub">Może to potrwać kilka sekund</p>
     </div>
    )}

    {stage === 'preview' && (
     <div className="preview-section">
      <div className="preview-toolbar">
       <div className="tabs">
        <button
         className={`tab ${activeTab === 'data' ? 'active' : ''}`}
         onClick={() => setActiveTab('data')}
        >
         Dane faktury
        </button>
        <button
         className={`tab ${activeTab === 'xml' ? 'active' : ''}`}
         onClick={() => setActiveTab('xml')}
        >
         XML KSeF
        </button>
       </div>
       <button className="btn-secondary" onClick={handleReset}>
        ← Nowa faktura
       </button>
      </div>

      {activeTab === 'data' && (
       <InvoicePreview
        data={invoiceData}
        onChange={handleDataChange}
        onShowXml={() => setActiveTab('xml')}
       />
      )}
      {activeTab === 'xml' && (
       <XmlViewer xml={xml} invoiceNumber={invoiceData?.invoice?.number} />
      )}
     </div>
    )}
   </main>

   <footer className="app-footer">
    <p>pdf2ksef &copy; 2026 — Maciej Bąk | KSeF FA(3)</p>
   </footer>
  </div>
 );
}
