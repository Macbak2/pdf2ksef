const express = require('express');
const multer = require('multer');
const { extractPdfText } = require('../services/pdfExtractor');
const { parseInvoiceWithAI } = require('../services/invoiceParser');
const { generateXml } = require('../services/xmlGenerator');
const { trackUsage, trackHistory } = require('../services/usageTracker');

const router = express.Router();

const upload = multer({
 storage: multer.memoryStorage(),
 limits: { fileSize: 10 * 1024 * 1024 },
 fileFilter: (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
   cb(null, true);
  } else {
   cb(Object.assign(new Error('Dozwolone są tylko pliki PDF'), { code: 'LIMIT_FILE_TYPE' }));
  }
 }
});

router.post('/', upload.single('pdf'), async (req, res) => {
 try {
  if (!req.file) {
   return res.status(400).json({ error: 'Nie przesłano pliku PDF' });
  }

  const pdfText = await extractPdfText(req.file.buffer);

  if (!pdfText || pdfText.trim().length < 20) {
   return res.status(422).json({
    error: 'Nie można odczytać tekstu z PDF. Plik może być zeskanowany (graficzny) - wymagany jest PDF z warstwą tekstową.'
   });
  }

  const { data: invoiceData, provider } = await parseInvoiceWithAI(pdfText);
  const xml = generateXml(invoiceData);

  try {
   trackUsage(provider);
   trackHistory(provider, invoiceData.invoice?.number, invoiceData.invoice?.issueDate);
  } catch {}

  res.json({ invoiceData, xml });
 } catch (err) {
  console.error('Convert error:', err);
  res.status(500).json({ error: err.message || 'Błąd przetwarzania faktury' });
 }
});

router.post('/generate-xml', async (req, res) => {
 try {
  const { invoiceData } = req.body;
  if (!invoiceData) {
   return res.status(400).json({ error: 'Brak danych faktury' });
  }

  const xml = generateXml(invoiceData);
  res.json({ xml });
 } catch (err) {
  console.error('Generate XML error:', err);
  res.status(500).json({ error: err.message || 'Błąd generowania XML' });
 }
});

module.exports = router;
