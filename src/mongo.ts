import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

// TODO: consider using MongoConfig type from congig.ts
interface DbConnectionParams {
  uri: string;
  dbName: string;
}

export async function connectToDb({
  uri,
  dbName,
}: DbConnectionParams): Promise<{ client: MongoClient; db: Db }> {
  try {
    if (client && db) {
      return { client, db };
    }

    console.log(`Connecting to MongoDB at: ${uri}`);
    
    client = new MongoClient(uri);
    await client.connect();

    db = client.db(dbName);

    console.log(`Successfully connected to database: ${dbName}`);
    return { client, db };
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
    console.log('MongoDB connection closed.');
  }
}
