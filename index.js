import express from 'express';
import cors from 'cors';
import { setupWebSocket } from './websockets/websocket.js'; // Asegúrate de que la ruta sea correcta
import mascotaRoutes from './routes/mascotaRoutes.js'; // Importa las rutas

const app = express();
const PORT = process.env.PORT || 4500;

app.use(cors());
app.use(express.json()); // Para poder leer el cuerpo de las solicitudes JSON

// Usar las rutas de mascota
app.use('/api/mascota', mascotaRoutes);

// Configuración del WebSocket
setupWebSocket(app);

// Aquí va tu conexión a la base de datos

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
