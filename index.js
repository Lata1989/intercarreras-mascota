import express from 'express';
import cors from 'cors';
import { connectDB } from './config/db.js';
import mascotaRoutes from './routes/mascotaRoutes.js';
import { setupWebSocket } from './sockets/websocket.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/mascota', mascotaRoutes);

// Conexión a la base de datos y luego abrir el servidor
connectDB().then((db) => {
  setupWebSocket(app, db); // WebSocket

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
  });
}).catch((error) => {
  console.error('No se pudo iniciar el servidor:', error);
});
