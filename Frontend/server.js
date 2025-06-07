// server.js
import express from 'express';
import cors from 'cors';
import xummRoutes from './routes/xumm.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use('/', xummRoutes);

// Serve the index.html file from DonorSpark
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'DonorSpark', 'index.html'));
});

app.listen(5050, () => console.log('✅ Xumm login server running on http://localhost:5050'));