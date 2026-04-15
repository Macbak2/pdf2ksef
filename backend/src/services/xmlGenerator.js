const { create } = require('xmlbuilder2');

function cleanNip(nip) {
 if (!nip) return '';
 return String(nip).replace(/[\s\-]/g, '');
}

function cleanIban(iban) {
 if (!iban) return '';
 return String(iban).replace(/[\s]/g, '').toUpperCase();
}

function formatAmount(val, decimals = 2) {
 if (val === null || val === undefined) return '0.00';
 return parseFloat(val).toFixed(decimals);
}

function formatDate(dateStr) {
 if (!dateStr) return '';
 return String(dateStr).substring(0, 10);
}

function mapVatRate(rate) {
 const map = {
  '23': '23', '22': '22', '8': '8', '7': '7', '5': '5', '4': '4', '3': '3',
  '0': '0 KR', '0 KR': '0 KR', '0 WDT': '0 WDT', '0 EX': '0 EX',
  'zw': 'zw', 'oo': 'oo', 'np': 'np I', 'np I': 'np I', 'np II': 'np II'
 };
 return map[String(rate)] || '23';
}

function generateXml(data) {
 const { seller, buyer, invoice, items, totals, annotations, payment, exchangeRate, correction } = data;

 const now = new Date();
 const dataWytworzenia = now.toISOString().replace(/\.\d{3}Z$/, 'Z');

 const doc = create({ version: '1.0', encoding: 'UTF-8' });

 const faktura = doc.ele('Faktura', {
  'xmlns': 'http://crd.gov.pl/wzor/2025/06/25/13775/',
  'xmlns:xsi': 'http://www.w3.org/2001/XMLSchema-instance',
  'xsi:schemaLocation': 'http://crd.gov.pl/wzor/2025/06/25/13775/ https://crd.gov.pl/wzor/2025/06/25/13775/schemat.xsd'
 });

 // NAGLOWEK
 const naglowek = faktura.ele('Naglowek');
 naglowek.ele('KodFormularza', { kodSystemowy: 'FA (3)', wersjaSchemy: '1-0E' }).txt('FA');
 naglowek.ele('WariantFormularza').txt('3');
 naglowek.ele('DataWytworzeniaFa').txt(dataWytworzenia);
 naglowek.ele('SystemInfo').txt('pdf2ksef v1.0');

 // PODMIOT1 (Sprzedawca)
 const podmiot1 = faktura.ele('Podmiot1');
 podmiot1.ele('PrefiksPodatnika').txt(seller.country || 'PL');
 const daneId1 = podmiot1.ele('DaneIdentyfikacyjne');
 daneId1.ele('NIP').txt(cleanNip(seller.nip));
 daneId1.ele('Nazwa').txt(seller.name || '');
 const adres1 = podmiot1.ele('Adres');
 adres1.ele('KodKraju').txt(seller.country || 'PL');
 const adresL1Seller = [seller.address, [seller.postalCode, seller.city].filter(Boolean).join(' ')].filter(Boolean).join('\n');
 adres1.ele('AdresL1').txt(adresL1Seller || '');

 // PODMIOT2 (Nabywca)
 const podmiot2 = faktura.ele('Podmiot2');
 const daneId2 = podmiot2.ele('DaneIdentyfikacyjne');

 const buyerType = buyer.type || (buyer.nip ? 'nip' : buyer.kodUE ? 'vat_ue' : buyer.brakID ? 'consumer' : 'nip');

 if (buyerType === 'nip' && buyer.nip) {
  daneId2.ele('NIP').txt(cleanNip(buyer.nip));
 } else if (buyerType === 'vat_ue' && buyer.kodUE) {
  daneId2.ele('KodUE').txt(buyer.kodUE);
  daneId2.ele('NrVatUE').txt(buyer.nrVatUE || '');
 } else if (buyerType === 'foreign' && buyer.kodKraju) {
  daneId2.ele('KodKraju').txt(buyer.kodKraju);
  if (buyer.nrID) {
   daneId2.ele('NrID').txt(buyer.nrID);
  } else {
   daneId2.ele('BrakID').txt('1');
  }
 } else if (buyerType === 'consumer' || buyer.brakID) {
  daneId2.ele('BrakID').txt('1');
 } else if (buyer.nip) {
  daneId2.ele('NIP').txt(cleanNip(buyer.nip));
 }

 daneId2.ele('Nazwa').txt(buyer.name || '');

 const adres2 = podmiot2.ele('Adres');
 adres2.ele('KodKraju').txt(buyer.country || 'PL');
 const adresL1Buyer = [buyer.address, [buyer.postalCode, buyer.city].filter(Boolean).join(' ')].filter(Boolean).join(' ');
 adres2.ele('AdresL1').txt(adresL1Buyer || '');

 podmiot2.ele('JST').txt('2');
 podmiot2.ele('GV').txt('2');

 // FA
 const fa = faktura.ele('Fa');
 fa.ele('KodWaluty').txt(invoice.currency || 'PLN');
 fa.ele('P_1').txt(formatDate(invoice.issueDate));
 if (invoice.issueLocation) {
  fa.ele('P_1M').txt(invoice.issueLocation);
 }
 fa.ele('P_2').txt(invoice.number || '');
 if (invoice.saleDate) {
  fa.ele('P_6').txt(formatDate(invoice.saleDate));
 }

 // VAT totals
 const t = totals || {};
 const isForeignCurrency = (invoice.currency || 'PLN') !== 'PLN';
 const exRate = isForeignCurrency && exchangeRate && exchangeRate.rate
  ? parseFloat(exchangeRate.rate) : null;

 function addVatFields(netField, vatField, netVal, vatVal) {
  if (!netVal || parseFloat(netVal) === 0) return;
  fa.ele(netField).txt(formatAmount(netVal));
  fa.ele(vatField).txt(formatAmount(vatVal));
  if (exRate) {
   fa.ele(vatField + 'W').txt(formatAmount(parseFloat(vatVal) * exRate));
  }
 }

 addVatFields('P_13_1', 'P_14_1', t.rate_23?.net, t.rate_23?.vat);
 addVatFields('P_13_2', 'P_14_2', t.rate_8?.net, t.rate_8?.vat);
 addVatFields('P_13_3', 'P_14_3', t.rate_5?.net, t.rate_5?.vat);
 if (t.rate_0_KR && parseFloat(t.rate_0_KR.net) !== 0) {
  fa.ele('P_13_6').txt(formatAmount(t.rate_0_KR.net));
 }
 if (t.rate_0_WDT && parseFloat(t.rate_0_WDT.net) !== 0) {
  fa.ele('P_13_6_2').txt(formatAmount(t.rate_0_WDT.net));
 }
 if (t.rate_0_EX && parseFloat(t.rate_0_EX.net) !== 0) {
  fa.ele('P_13_6_3').txt(formatAmount(t.rate_0_EX.net));
 }
 if (t.rate_zw && parseFloat(t.rate_zw.net) !== 0) {
  fa.ele('P_13_10').txt(formatAmount(t.rate_zw.net));
 }
 if (t.rate_oo && parseFloat(t.rate_oo.net) !== 0) {
  fa.ele('P_13_11').txt(formatAmount(t.rate_oo.net));
 }
 if (t.rate_np_I && parseFloat(t.rate_np_I.net) !== 0) {
  fa.ele('P_13_4').txt(formatAmount(t.rate_np_I.net));
 }
 if (t.rate_np_II && parseFloat(t.rate_np_II.net) !== 0) {
  fa.ele('P_13_5').txt(formatAmount(t.rate_np_II.net));
 }

 fa.ele('P_15').txt(formatAmount(t.totalGross || 0));

 // KURS WALUTY (przed Adnotacje — wg schematu XSD)
 if (exRate && (invoice.currency || 'PLN') !== 'PLN') {
  fa.ele('KursWalutyZ').txt(formatAmount(exRate, 6));
 }

 // ADNOTACJE
 const adnotacje = fa.ele('Adnotacje');
 const ann = annotations || {};
 adnotacje.ele('P_16').txt(ann.metodaKasowa ? '1' : '2');
 adnotacje.ele('P_17').txt(ann.samofakturowanie ? '1' : '2');
 adnotacje.ele('P_18').txt(ann.odwrotneObciazenie ? '1' : '2');
 adnotacje.ele('P_18A').txt(ann.mechanizmPodzielonejPlatnosci ? '1' : '2');

 if (ann.zwolnienie) {
  adnotacje.ele('Zwolnienie').ele('P_19').txt(ann.zwolnienie);
 } else {
  adnotacje.ele('Zwolnienie').ele('P_19N').txt('1');
 }

 adnotacje.ele('NoweSrodkiTransportu').ele('P_22N').txt('1');
 adnotacje.ele('P_23').txt('2');
 adnotacje.ele('PMarzy').ele('P_PMarzyN').txt('1');

 // RodzajFaktury
 const isKor = correction && correction.isCorrection;
 const rodzajFaktury = invoice.type && invoice.type !== 'VAT' ? invoice.type : (isKor ? 'KOR' : 'VAT');
 fa.ele('RodzajFaktury').txt(rodzajFaktury);

 // FAKTURA KORYGUJACA
 if (isKor) {
  if (correction.reason) {
   fa.ele('PrzyczynaKorekty').txt(correction.reason);
  }
  if (correction.type) {
   fa.ele('TypKorekty').txt(String(correction.type));
  }
  if (correction.correctedInvoiceNumber || correction.correctedInvoiceDate) {
   const daneFaKor = fa.ele('DaneFaKorygowanej');
   if (correction.correctedInvoiceDate) {
    daneFaKor.ele('DataWystFaKorygowanej').txt(formatDate(correction.correctedInvoiceDate));
   }
   if (correction.correctedInvoiceNumber) {
    daneFaKor.ele('NrFaKorygowanej').txt(correction.correctedInvoiceNumber);
   }
   if (correction.correctedInvoiceKSeFNumber) {
    daneFaKor.ele('NrKSeF').txt('1');
    daneFaKor.ele('NrKSeFFaKorygowanej').txt(correction.correctedInvoiceKSeFNumber);
   }
  }
 }

 // FA WIERSZE
 const itemsList = items || [];
 itemsList.forEach((item, idx) => {
  const wiersz = fa.ele('FaWiersz');
  wiersz.ele('NrWierszaFa').txt(String(item.lp || idx + 1));
  wiersz.ele('P_7').txt(item.name || '');
  if (item.unit) {
   wiersz.ele('P_8A').txt(item.unit);
  }
  wiersz.ele('P_8B').txt(String(parseFloat(item.quantity || 0)));
  wiersz.ele('P_9A').txt(formatAmount(item.unitPriceNet || 0));
  if (item.discount && parseFloat(item.discount) !== 0) {
   wiersz.ele('P_10').txt(formatAmount(item.discount));
  }
  wiersz.ele('P_11').txt(formatAmount(item.netValue || 0));
  wiersz.ele('P_12').txt(mapVatRate(item.vatRate));
 });

 // PLATNOSC — tylko jeśli są dane płatności
 const hasPayment = payment && (payment.dueDate || payment.form || payment.bankAccount);
 if (hasPayment) {
  const platnosc = fa.ele('Platnosc');
  if (payment.dueDate) {
   platnosc.ele('TerminPlatnosci').ele('Termin').txt(formatDate(payment.dueDate));
  }
  if (payment.form) {
   platnosc.ele('FormaPlatnosci').txt(
    payment.form === 'przelew' ? '6' :
     payment.form === 'gotówka' || payment.form === 'gotowka' ? '1' :
      payment.form === 'karta' ? '2' : '6'
   );
  }
  if (payment.bankAccount) {
   platnosc.ele('RachunekBankowy').ele('NrRB').txt(cleanIban(payment.bankAccount));
  }
 }

 return doc.end({ prettyPrint: true });
}

module.exports = { generateXml };
