import WebSocket from 'ws';
import { getDB } from '../config/db.js';
import { mascotaDefault } from '../models/mascota.js';  // Importamos el modelo por defecto

let mascotaState = { ...mascotaDefault };  // Iniciamos con el estado por defecto

export const setupWebSocket = (app, db) => {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (ws) => {
    console.log('Cliente conectado al WebSocket');

    // Enviar el estado inicial de la mascota
    ws.send(JSON.stringify(mascotaState));

    ws.on('message', async (message) => {
      const data = JSON.parse(message);

      if (data.tick) {
        // Aplicar lógica de tick: reducir estadísticas o recuperarlas si está dormido
        mascotaState.hambre = Math.max(0, mascotaState.hambre - 1);
        mascotaState.felicidad = Math.max(0, mascotaState.felicidad - 1);
        mascotaState.limpio = Math.max(0, mascotaState.limpio - 1);
        mascotaState.diversion = Math.max(0, mascotaState.diversion - 1);

        if (mascotaState.dormido) {
          mascotaState.suenio = Math.min(3000, mascotaState.suenio + 50);  // Recuperar sueño
        } else {
          mascotaState.suenio = Math.max(0, mascotaState.suenio - 1);  // Reducir sueño
        }

        // Si la mascota llega a 0 en cualquiera de las estadísticas críticas, puede morir
        if (
          mascotaState.hambre <= 0 || 
          mascotaState.suenio <= 0 || 
          mascotaState.felicidad <= 0 || 
          mascotaState.diversion <= 0 || 
          mascotaState.limpio <= 0
        ) {
          mascotaState.vivo = false;
        }

      } else if (data.action) {
        // Procesar las acciones desde el frontend
        switch (data.action) {
          case 'alimentar':
            mascotaState.hambre = Math.min(3000, mascotaState.hambre + 1000);  // Llenar el hambre
            break;
          case 'carino':
            mascotaState.felicidad = Math.min(3000, mascotaState.felicidad + 1000);  // Aumentar felicidad
            break;
          case 'dormir':
            mascotaState.dormido = true;  // Poner a la mascota a dormir
            break;
          case 'jugar':
            mascotaState.diversion = Math.min(3000, mascotaState.diversion + 1000);  // Aumentar la diversión
            break;
          case 'limpiar':
            mascotaState.limpio = Math.min(3000, mascotaState.limpio + 1000);  // Limpiar a la mascota
            break;
          default:
            console.log(`Acción desconocida: ${data.action}`);
        }
      }

      // Guardar el estado actualizado en la base de datos
      const mascotaCollection = getDB().collection('mascota');
      await mascotaCollection.updateOne({}, { $set: mascotaState }, { upsert: true });

      // Enviar estado actualizado
      ws.send(JSON.stringify(mascotaState));
    });
  });

  // Integrar el WebSocket con el servidor HTTP de Express
  app.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  });
};
