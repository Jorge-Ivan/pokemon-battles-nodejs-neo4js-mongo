import { MongoClient, Db, Collection, ServerApiVersion } from 'mongodb';

let client: MongoClient;
let database: Db;
let collection: Collection<any>;

async function connect() {
  try {
    const uri = process.env.MONGO_URI || '';

    client = new MongoClient(uri, {
        serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
        }
      });
    await client.connect();
    database = client.db('pokemons_battles');
    collection = database.collection('battles');
    console.log("Connected to MongoDB successfully!");
  } catch (error) {
    console.error("Error connecting to MongoDB:", error);
  }
}

function getClient(): MongoClient {
  if (!client) {
    throw new Error('MongoDB client is not initialized');
  }
  return client;
}

function getDatabase(): Db {
  if (!database) {
    throw new Error('MongoDB database is not initialized');
  }
  return database;
}

function getCollection(): Collection<any> {
  if (!collection) {
    throw new Error('MongoDB collection is not initialized');
  }
  return collection;
}

async function close() {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed");
  }
}

const ConnectionMongo = {
    connect,
    getClient,
    getDatabase,
    getCollection,
    close
};
  
export default ConnectionMongo;
