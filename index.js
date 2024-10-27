import express from 'express';
import cors from 'cors';
import { setupWebSocket } from './sockets/websocket.js';
import mascotaRoutes from './routes/mascotaRoutes.js';
import { connectDB } from './config/db.js';

const app = express();
const PORT = process.env.PORT || 4500;

app.use(cors());
app.use(express.json());
//
// Usa las rutas de mascota
app.use('/api/mascota', mascotaRoutes);

connectDB()
  .then(() => {
    // Iniciar el servidor HTTP
    const server = app.listen(PORT, () => {
      console.log(`Server corriendo en http://localhost:${PORT}`);
    });

    // Configuración del WebSocket, pasando el servidor
    setupWebSocket(server);
  })
  .catch(err => {
    console.error('Error al conectar a la base de datos:', err);
  });
