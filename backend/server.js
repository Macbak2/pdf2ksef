require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const convertRouter = require('./src/routes/convert');
const adminRouter = require('./src/routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/convert', convertRouter);
app.use('/api/admin', adminRouter);
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
 console.log(`Backend running on http://localhost:${PORT}`);
 console.log(`Admin panel: http://localhost:${PORT}/admin.html`);
});
