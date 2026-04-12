export default function XmlViewer({ xml, onBack }) {
 function downloadXml() {
  const blob = new Blob([xml], { type: 'application/xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'faktura_ksef.xml';
  a.click();
  URL.revokeObjectURL(url);
 }

 return (
  <div className="xml-viewer">
   <div className="xml-actions">
    <button className="btn-secondary" onClick={onBack}>← Wróć do edycji</button>
    <button className="btn-primary" onClick={downloadXml}>Pobierz XML</button>
   </div>
   <pre className="xml-content">{xml}</pre>
  </div>
 );
}
