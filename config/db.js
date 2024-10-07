import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI;
let db;

export const connectDB = async () => {
  try {
    const client = new MongoClient(uri);
    await client.connect();
    db = client.db('Intercarreras');  // Base de datos 'Intercarreras'
    console.log('Conectado a la base de datos MongoDB');
    return db;
  } catch (error) {
    console.error('Error conectando a la base de datos:', error);
    process.exit(1);
  }
};

export const getDB = () => db;
