// db/mongo.js
require('dotenv').config(); // this must come before anything else
const uri = "mongodb+srv://tayelroy:7oxcOW7N2ZzzDCG7@cluster1.xu03glt.mongodb.net/donorApp?retryWrites=true&w=majority&appName=Cluster1";

const { MongoClient } = require('mongodb');

if (!uri) {
  throw new Error("❌ MONGO_URI is undefined. Check your .env file.");
}

const client = new MongoClient(uri);
let db;

async function connectDB() {
  if (!db) {
    await client.connect();
    db = client.db("donorApp"); // Use your db name
    console.log("✅ Connected to MongoDB");
  }
  return db;
}

module.exports = connectDB;
