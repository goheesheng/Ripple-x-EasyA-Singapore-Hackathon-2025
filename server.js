// server.js (CommonJS version)
require('dotenv').config();
const uri = "mongodb+srv://tayelroy:7oxcOW7N2ZzzDCG7@cluster1.xu03glt.mongodb.net/donorApp?retryWrites=true&w=majority&appName=Cluster1";
const express = require('express');
const cors = require('cors');
const connectDB = require('./Frontend/db/mongo');

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/store-user', async (req, res) => {
  const db = await connectDB();
  const { wallet, verified } = req.body;

  await db.collection("users").insertOne({
    wallet,
    verified,
    timestamp: new Date()
  });

  res.json({ success: true });
});

app.listen(5000, () => console.log("✅ Server running on http://localhost:5000"));
