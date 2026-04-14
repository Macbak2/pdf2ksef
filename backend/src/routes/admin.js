const express = require('express');
const { getStats, setConfig } = require('../services/usageTracker');

const router = express.Router();

function checkAdminKey(req, res, next) {
 const key = req.query.key || req.headers['x-admin-key'];
 if (!process.env.ADMIN_KEY || key !== process.env.ADMIN_KEY) {
  return res.status(401).json({ error: 'Unauthorized — podaj klucz admina' });
 }
 next();
}

// GET /api/admin/stats?key=SECRET
router.get('/stats', checkAdminKey, (req, res) => {
 const stats = getStats();
 const currentMonth = (() => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
 })();

 const thisMonth = stats.usage[currentMonth] || { gemini: 0, claude: 0 };
 const totalAll = Object.values(stats.usage).reduce((acc, m) => {
  acc.gemini += m.gemini || 0;
  acc.claude += m.claude || 0;
  return acc;
 }, { gemini: 0, claude: 0 });

 res.json({
  currentProvider: stats.config?.forceProvider || 'auto',
  thisMonth: { month: currentMonth, ...thisMonth },
  totalAll,
  allMonths: stats.usage,
  history: stats.history || [],
  lastFallback: stats.lastFallback,
  lastFallbackReason: stats.lastFallbackReason
 });
});

// POST /api/admin/config?key=SECRET
// Body: { "forceProvider": "auto" | "gemini" | "claude" }
router.post('/config', checkAdminKey, (req, res) => {
 const { forceProvider } = req.body;
 if (!['auto', 'gemini', 'claude'].includes(forceProvider)) {
  return res.status(400).json({ error: 'Nieprawidłowa wartość. Użyj: auto, gemini, claude' });
 }
 const config = setConfig({ forceProvider });
 res.json({ success: true, config });
});

module.exports = router;
