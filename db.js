// db.js
const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = process.env.uri;  // Ensure this is set in your .env file

if (!uri) {
  console.error("MongoDB URI is not defined in environment variables");
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let dbInstance;

async function connectToDatabase() {
  if (!dbInstance) {
    try {
      await client.connect();
      const dbName = process.env.DB_NAME || "myforumapp";
      dbInstance = client.db(dbName);
      console.log(`Connected to MongoDB Atlas!`);
    } catch (err) {
      console.error("Failed to connect to MongoDB", err);
      throw err;
    }
  }
  return dbInstance;
}

module.exports = { connectToDatabase, client };