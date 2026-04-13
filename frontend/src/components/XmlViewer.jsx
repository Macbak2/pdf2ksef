import React, { useState } from 'react';

export default function XmlViewer({ xml, invoiceNumber }) {
 const [copied, setCopied] = useState(false);

 function handleCopy() {
  navigator.clipboard.writeText(xml).then(() => {
   setCopied(true);
   setTimeout(() => setCopied(false), 2000);
  });
 }

 function handleDownload() {
  const blob = new Blob([xml], { type: 'application/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const filename = invoiceNumber
   ? `FA_${invoiceNumber.replace(/[^a-zA-Z0-9_\-]/g, '_')}.xml`
   : 'faktura_ksef.xml';
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
 }

 return (
  <div className="xml-viewer">
   <div className="xml-toolbar">
    <button className="btn-secondary" onClick={handleCopy}>
     {copied ? '✓ Skopiowano' : 'Kopiuj XML'}
    </button>
    <button className="btn-primary" onClick={handleDownload}>
     ⬇ Pobierz XML
    </button>
   </div>
   <div className="xml-pre-wrapper">
    <pre className="xml-pre">{xml}</pre>
   </div>
  </div>
 );
}
