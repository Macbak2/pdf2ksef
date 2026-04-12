import React, { useState } from 'react';

function Field({ label, value, onChange, type = 'text', wide = false }) {
 return (
  <div className="field" style={wide ? { gridColumn: '1 / -1' } : {}}>
   <label>{label}</label>
   <input
    type={type}
    value={value || ''}
    onChange={(e) => onChange(e.target.value)}
   />
  </div>
 );
}

function SelectField({ label, value, onChange, options }) {
 return (
  <div className="field">
   <label>{label}</label>
   <select value={value || ''} onChange={(e) => onChange(e.target.value)}>
    {options.map((opt) => (
     <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
   </select>
  </div>
 );
}

const VAT_RATES = [
 { value: '23', label: '23%' },
 { value: '8', label: '8%' },
 { value: '5', label: '5%' },
 { value: '0 KR', label: '0% KR (krajowa)' },
 { value: '0 WDT', label: '0% WDT' },
 { value: '0 EX', label: '0% EX (eksport)' },
 { value: 'zw', label: 'zw (zwolniona)' },
 { value: 'oo', label: 'oo (odwrotne obciążenie)' },
 { value: 'np I', label: 'np I (poza terytorium)' },
 { value: 'np II', label: 'np II (art. 100)' },
];

export default function InvoicePreview({ data, onChange, onShowXml }) {
 const [localData, setLocalData] = useState(data);

 function update(path, value) {
  const parts = path.split('.');
  const newData = JSON.parse(JSON.stringify(localData));
  let obj = newData;
  for (let i = 0; i < parts.length - 1; i++) {
   obj = obj[parts[i]];
  }
  obj[parts[parts.length - 1]] = value;
  setLocalData(newData);
  onChange(newData);
 }

 function updateItem(idx, field, value) {
  const newData = JSON.parse(JSON.stringify(localData));
  newData.items[idx][field] = value;
  setLocalData(newData);
  onChange(newData);
 }

 const d = localData;
 if (!d) return null;

 return (
  <div className="invoice-preview">
   {/* Sprzedawca */}
   <div className="section-card">
    <h2>Sprzedawca (Podmiot1)</h2>
    <div className="section-content">
     <div className="fields-grid">
      <Field label="NIP" value={d.seller?.nip} onChange={(v) => update('seller.nip', v)} />
      <Field label="Nazwa" value={d.seller?.name} onChange={(v) => update('seller.name', v)} wide />
      <Field label="Adres" value={d.seller?.address} onChange={(v) => update('seller.address', v)} />
      <Field label="Kod pocztowy" value={d.seller?.postalCode} onChange={(v) => update('seller.postalCode', v)} />
      <Field label="Miasto" value={d.seller?.city} onChange={(v) => update('seller.city', v)} />
      <Field label="Kraj" value={d.seller?.country} onChange={(v) => update('seller.country', v)} />
     </div>
    </div>
   </div>

   {/* Nabywca */}
   <div className="section-card">
    <h2>Nabywca (Podmiot2)</h2>
    <div className="section-content">
     <div className="fields-grid">
      <SelectField
       label="Typ identyfikacji"
       value={d.buyer?.type}
       onChange={(v) => update('buyer.type', v)}
       options={[
        { value: 'nip', label: 'NIP (polska firma)' },
        { value: 'vat_ue', label: 'VAT UE (firma z UE)' },
        { value: 'foreign', label: 'Zagraniczna (spoza UE)' },
        { value: 'consumer', label: 'Konsument (bez NIP)' },
       ]}
      />
      {d.buyer?.type === 'nip' && (
       <Field label="NIP" value={d.buyer?.nip} onChange={(v) => update('buyer.nip', v)} />
      )}
      {d.buyer?.type === 'vat_ue' && (
       <>
        <Field label="Kod kraju UE" value={d.buyer?.kodUE} onChange={(v) => update('buyer.kodUE', v)} />
        <Field label="Nr VAT UE" value={d.buyer?.nrVatUE} onChange={(v) => update('buyer.nrVatUE', v)} />
       </>
      )}
      {d.buyer?.type === 'foreign' && (
       <>
        <Field label="Kod kraju" value={d.buyer?.kodKraju} onChange={(v) => update('buyer.kodKraju', v)} />
        <Field label="Nr identyfikacyjny" value={d.buyer?.nrID} onChange={(v) => update('buyer.nrID', v)} />
       </>
      )}
      <Field label="Nazwa" value={d.buyer?.name} onChange={(v) => update('buyer.name', v)} wide />
      <Field label="Adres" value={d.buyer?.address} onChange={(v) => update('buyer.address', v)} />
      <Field label="Kod pocztowy" value={d.buyer?.postalCode} onChange={(v) => update('buyer.postalCode', v)} />
      <Field label="Miasto" value={d.buyer?.city} onChange={(v) => update('buyer.city', v)} />
      <Field label="Kraj" value={d.buyer?.country} onChange={(v) => update('buyer.country', v)} />
     </div>
    </div>
   </div>

   {/* Dane faktury */}
   <div className="section-card">
    <h2>Dane faktury</h2>
    <div className="section-content">
     <div className="fields-grid">
      <SelectField
       label="Rodzaj faktury"
       value={d.invoice?.type || 'VAT'}
       onChange={(v) => update('invoice.type', v)}
       options={[
        { value: 'VAT', label: 'VAT (standardowa)' },
        { value: 'KOR', label: 'KOR (korygująca)' },
        { value: 'ZAL', label: 'ZAL (zaliczkowa)' },
        { value: 'ROZ', label: 'ROZ (rozliczająca)' },
        { value: 'UPR', label: 'UPR (uproszczona)' },
       ]}
      />
      <Field label="Numer faktury" value={d.invoice?.number} onChange={(v) => update('invoice.number', v)} />
      <Field label="Data wystawienia" value={d.invoice?.issueDate} onChange={(v) => update('invoice.issueDate', v)} type="date" />
      <Field label="Data sprzedaży" value={d.invoice?.saleDate} onChange={(v) => update('invoice.saleDate', v)} type="date" />
      <Field label="Waluta" value={d.invoice?.currency} onChange={(v) => update('invoice.currency', v)} />
      <Field label="Miejsce wystawienia" value={d.invoice?.issueLocation} onChange={(v) => update('invoice.issueLocation', v)} />
     </div>
    </div>
   </div>

   {/* Dane korekty */}
   {(d.correction?.isCorrection || d.invoice?.type === 'KOR') && (
    <div className="section-card" style={{ borderLeft: '4px solid #f59e0b' }}>
     <h2>Dane faktury korygowanej</h2>
     <div className="section-content">
      <div className="fields-grid">
       <Field label="Nr korygowanej faktury" value={d.correction?.correctedInvoiceNumber} onChange={(v) => update('correction.correctedInvoiceNumber', v)} />
       <Field label="Data wystawienia korygowanej" value={d.correction?.correctedInvoiceDate} onChange={(v) => update('correction.correctedInvoiceDate', v)} type="date" />
       <SelectField
        label="Typ korekty"
        value={String(d.correction?.type || '1')}
        onChange={(v) => update('correction.type', v)}
        options={[
         { value: '1', label: '1 – korekta danych (bez zmiany kwot)' },
         { value: '2', label: '2 – zmniejszenie wartości' },
         { value: '3', label: '3 – zwiększenie lub mieszana zmiana' },
        ]}
       />
       <Field label="Przyczyna korekty" value={d.correction?.reason} onChange={(v) => update('correction.reason', v)} wide />
       <Field label="Nr KSeF korygowanej (opcjonalnie)" value={d.correction?.correctedInvoiceKSeFNumber} onChange={(v) => update('correction.correctedInvoiceKSeFNumber', v)} wide />
      </div>
     </div>
    </div>
   )}

   {/* Pozycje */}
   <div className="section-card">
    <h2>Pozycje faktury</h2>
    <div className="section-content">
     <div className="items-table-wrapper">
      <table className="items-table">
       <thead>
        <tr>
         <th>Lp</th>
         <th>Nazwa</th>
         <th>Ilość</th>
         <th>J.m.</th>
         <th>Cena netto</th>
         <th>Wartość netto</th>
         <th>Stawka VAT</th>
         <th>Kwota VAT</th>
         <th>Brutto</th>
        </tr>
       </thead>
       <tbody>
        {(d.items || []).map((item, idx) => (
         <tr key={idx}>
          <td>{item.lp || idx + 1}</td>
          <td>
           <input className="name-input" value={item.name || ''} onChange={(e) => updateItem(idx, 'name', e.target.value)} />
          </td>
          <td>
           <input className="num-input" type="number" value={item.quantity || ''} onChange={(e) => updateItem(idx, 'quantity', e.target.value)} />
          </td>
          <td>
           <input style={{ width: '55px' }} value={item.unit || ''} onChange={(e) => updateItem(idx, 'unit', e.target.value)} />
          </td>
          <td>
           <input className="num-input" type="number" value={item.unitPriceNet || ''} onChange={(e) => updateItem(idx, 'unitPriceNet', e.target.value)} />
          </td>
          <td>
           <input className="num-input" type="number" value={item.netValue || ''} onChange={(e) => updateItem(idx, 'netValue', e.target.value)} />
          </td>
          <td>
           <select value={item.vatRate || '23'} onChange={(e) => updateItem(idx, 'vatRate', e.target.value)}>
            {VAT_RATES.map((r) => (
             <option key={r.value} value={r.value}>{r.label}</option>
            ))}
           </select>
          </td>
          <td>
           <input className="num-input" type="number" value={item.vatAmount || ''} onChange={(e) => updateItem(idx, 'vatAmount', e.target.value)} />
          </td>
          <td>
           <input className="num-input" type="number" value={item.grossValue || ''} onChange={(e) => updateItem(idx, 'grossValue', e.target.value)} />
          </td>
         </tr>
        ))}
       </tbody>
      </table>
     </div>
    </div>
   </div>

   {/* Adnotacje */}
   <div className="section-card">
    <h2>Adnotacje</h2>
    <div className="section-content">
     <div className="fields-grid">
      {[
       { key: 'annotations.metodaKasowa', label: 'Metoda kasowa (P_16)' },
       { key: 'annotations.samofakturowanie', label: 'Samofakturowanie (P_17)' },
       { key: 'annotations.odwrotneObciazenie', label: 'Odwrotne obciążenie (P_18)' },
       { key: 'annotations.mechanizmPodzielonejPlatnosci', label: 'MPP - split payment (P_18A)' },
      ].map(({ key, label }) => (
       <div className="field" key={key}>
        <label>{label}</label>
        <select
         value={key.split('.').reduce((o, k) => o?.[k], d) ? 'true' : 'false'}
         onChange={(e) => update(key, e.target.value === 'true')}
        >
         <option value="false">Nie (2)</option>
         <option value="true">Tak (1)</option>
        </select>
       </div>
      ))}
     </div>
    </div>
   </div>

   {/* Płatność */}
   <div className="section-card">
    <h2>Płatność</h2>
    <div className="section-content">
     <div className="fields-grid">
      <SelectField
       label="Forma płatności"
       value={d.payment?.form}
       onChange={(v) => update('payment.form', v)}
       options={[
        { value: 'przelew', label: 'Przelew bankowy' },
        { value: 'gotówka', label: 'Gotówka' },
        { value: 'karta', label: 'Karta płatnicza' },
        { value: 'kompensata', label: 'Kompensata' },
       ]}
      />
      <Field label="Termin płatności" value={d.payment?.dueDate} onChange={(v) => update('payment.dueDate', v)} type="date" />
      <Field label="Nr rachunku bankowego (IBAN)" value={d.payment?.bankAccount} onChange={(v) => update('payment.bankAccount', v)} wide />
      <Field label="SWIFT/BIC" value={d.payment?.swift} onChange={(v) => update('payment.swift', v)} />
     </div>
    </div>
   </div>

   <div className="preview-actions">
    <button className="btn-primary" onClick={onShowXml}>
     Zobacz XML KSeF →
    </button>
   </div>
  </div>
 );
}
