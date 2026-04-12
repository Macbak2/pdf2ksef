require('dotenv').config();
const express = require('express');
const cors = require('cors');
const convertRouter = require('./src/routes/convert');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use(express.json());

app.use('/api/convert', convertRouter);

app.listen(PORT, () => {
 console.log(`Backend running on http://localhost:${PORT}`);
});
