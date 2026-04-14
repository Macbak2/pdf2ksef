const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '../../data/usage.json');
const MAX_HISTORY = 500;

function ensureDataDir() {
 const dir = path.dirname(DATA_FILE);
 if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
 }
}

function load() {
 ensureDataDir();
 if (!fs.existsSync(DATA_FILE)) {
  return { usage: {}, config: { forceProvider: 'auto' }, history: [], lastFallback: null, lastFallbackReason: null };
 }
 try {
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
 } catch {
  return { usage: {}, config: { forceProvider: 'auto' }, history: [], lastFallback: null, lastFallbackReason: null };
 }
}

function save(data) {
 ensureDataDir();
 fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function getMonthKey() {
 const now = new Date();
 return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function trackUsage(provider) {
 const data = load();
 const month = getMonthKey();
 if (!data.usage[month]) {
  data.usage[month] = { gemini: 0, claude: 0 };
 }
 data.usage[month][provider] = (data.usage[month][provider] || 0) + 1;
 save(data);
}

function trackHistory(provider, invoiceNumber, invoiceDate) {
 const data = load();
 if (!data.history) data.history = [];
 data.history.unshift({
  time: new Date().toISOString(),
  provider,
  invoiceNumber: invoiceNumber || '—',
  invoiceDate: invoiceDate || null
 });
 if (data.history.length > MAX_HISTORY) {
  data.history = data.history.slice(0, MAX_HISTORY);
 }
 save(data);
}

function trackFallback(reason) {
 const data = load();
 data.lastFallback = new Date().toISOString();
 data.lastFallbackReason = String(reason).substring(0, 200);
 save(data);
}

function getStats() {
 return load();
}

function getConfig() {
 return load().config || { forceProvider: 'auto' };
}

function setConfig(config) {
 const data = load();
 data.config = { ...(data.config || {}), ...config };
 save(data);
 return data.config;
}

module.exports = { trackUsage, trackHistory, trackFallback, getStats, getConfig, setConfig };
