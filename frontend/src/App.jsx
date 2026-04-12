import { useState } from 'react';
import axios from 'axios';
import DropZone from './components/DropZone';
import InvoicePreview from './components/InvoicePreview';
import XmlViewer from './components/XmlViewer';

export default function App() {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState(null);
 const [invoiceData, setInvoiceData] = useState(null);
 const [xml, setXml] = useState(null);
 const [view, setView] = useState('upload'); // 'upload' | 'preview' | 'xml'

 async function handleFileAccepted(file) {
  setLoading(true);
  setError(null);
  try {
   const formData = new FormData();
   formData.append('pdf', file);
   const res = await axios.post('/api/convert', formData);
   setInvoiceData(res.data.invoiceData);
   setXml(res.data.xml);
   setView('preview');
  } catch (err) {
   setError(err.response?.data?.error || 'Błąd połączenia z serwerem');
  } finally {
   setLoading(false);
  }
 }

 async function handleDataChange(newData) {
  setInvoiceData(newData);
  try {
   const res = await axios.post('/api/convert/generate-xml', { invoiceData: newData });
   setXml(res.data.xml);
  } catch {
   // silent — XML refresh is best-effort
  }
 }

 function handleReset() {
  setInvoiceData(null);
  setXml(null);
  setError(null);
  setView('upload');
 }

 return (
  <div className="app">
   <header className="app-header">
    <div className="header-inner">
     <h1>pdf2ksef</h1>
     <span className="header-subtitle">Konwerter faktur PDF do XML KSeF FA(3)</span>
    </div>
    {view !== 'upload' && (
     <button className="btn-reset" onClick={handleReset}>Nowa faktura</button>
    )}
   </header>

   <main className="app-main">
    {view === 'upload' && (
     <>
      <DropZone onFileAccepted={handleFileAccepted} loading={loading} />
      {error && <div className="error-box">{error}</div>}
     </>
    )}
    {view === 'preview' && invoiceData && (
     <InvoicePreview
      data={invoiceData}
      onChange={handleDataChange}
      onShowXml={() => setView('xml')}
     />
    )}
    {view === 'xml' && xml && (
     <XmlViewer xml={xml} onBack={() => setView('preview')} />
    )}
   </main>

   <footer className="app-footer">
    <p>pdf2ksef — Maciej Bąk | Schemat KSeF FA(3) · MF 2025</p>
   </footer>
  </div>
 );
}
