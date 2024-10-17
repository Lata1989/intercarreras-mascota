import { WebSocketServer } from 'ws';
import { getDB } from '../config/db.js';
import { mascota as mascotaDefault } from '../models/mascota.js';
import { publicarEnMQTT } from './mqttClient.js';
import mqttClient from './mqttClient.js';
import dotenv from 'dotenv';

dotenv.config();

let mascotaState = { ...mascotaDefault };

// aplica la logica de cada 'tick' y verifica el estado de la mascota
const aplicarLogicaTick = () => {
  mascotaState.hambre = Math.max(0, mascotaState.hambre - 1);
  mascotaState.felicidad = Math.max(0, mascotaState.felicidad - 1);
  mascotaState.limpio = Math.max(0, mascotaState.limpio - 1);
  mascotaState.diversion = Math.max(0, mascotaState.diversion - 1);

  if (mascotaState.dormido) {
    mascotaState.suenio = Math.min(3000, mascotaState.suenio + 50);
  } else {
    mascotaState.suenio = Math.max(0, mascotaState.suenio - 1);
  }

  // Verificar si la mascota muere
  if (
    mascotaState.hambre <= 0 ||
    mascotaState.suenio <= 0 ||
    mascotaState.felicidad <= 0 ||
    mascotaState.diversion <= 0 ||
    mascotaState.limpio <= 0
  ) {
    mascotaState.vivo = false;
    if (!mascotaState.fechaMuerte) {
      mascotaState.fechaMuerte = new Date();
    }
  }
};

// Función para configurar el WebSocket
export const setupWebSocket = server => {
  const wss = new WebSocketServer({ noServer: true });

  wss.on('connection', ws => {
    console.log('Cliente conectado al WebSocket');

    ws.send(JSON.stringify(mascotaState)); // Envia el estado init

    // Escucha mensajes del WS
    ws.on('message', async message => {
      const data = JSON.parse(message);
      if (!data.accion) {
        ws.send(JSON.stringify({ error: 'No se proporcionó ninguna acción.' }));
        return;
      }

      // Envia la accion recibida al broker MQTT
      await publicarEnMQTT(data.accion);

      // Interacción con la mascota
      switch (data.accion) {
        case 'alimentar':
          mascotaState.hambre = Math.min(3000, mascotaState.hambre + 1000);
          break;
        case 'carinio':
          mascotaState.felicidad = Math.min(
            3000,
            mascotaState.felicidad + 1000
          );
          break;
        case 'dormir':
          mascotaState.dormido = true;
          break;
        case 'jugar':
          mascotaState.diversion = Math.min(
            3000,
            mascotaState.diversion + 1000
          );
          break;
        case 'limpiar':
          mascotaState.limpio = Math.min(3000, mascotaState.limpio + 1000);
          break;
      }

      // Aplicar lógica de tick
      aplicarLogicaTick();

      // Guardar el estado actualizado en la base de datos
      const mascotaCollection = getDB().collection('mascota');
      await mascotaCollection.updateOne(
        {},
        { $set: mascotaState },
        { upsert: true }
      );

      // Guardar el estado actualizado en la base de datos historial
      const mascotaHistorial = getDB().collection('historialmascota');

      // Crear un nuevo documento con el estado actual de la mascota
      const nuevoHistorial = {
        felicidad: mascotaState.felicidad,
        hambre: mascotaState.hambre,
        suenio: mascotaState.suenio,
        calor: mascotaState.calor,
        limpio: mascotaState.limpio,
        diversion: mascotaState.diversion,
        dormido: mascotaState.dormido,
        luz: mascotaState.luz,
        temperatura: mascotaState.temperatura,
        humedad: mascotaState.humedad
      };

      // Insertar el nuevo documento en el historial
      await mascotaHistorial.insertOne(nuevoHistorial);

      // Enviar estado actualizado al cliente
      ws.send(JSON.stringify(mascotaState));
    });

    // Enviar actualizaciones automáticas cuando la temperatura o humedad cambian
    mqttClient.on('message', async (topic, message) => {
      if (topic === 'sensor') {
        try {
          const data = JSON.parse(message.toString());
          if (data.temperatura !== undefined && data.humedad !== undefined) {
            // Actualizar temperatura y humedad en mascotaState
            mascotaState.temperatura = data.temperatura;
            mascotaState.humedad = data.humedad;

            console.log(
              `Temperatura actualizada: ${data.temperatura}, Humedad actualizada: ${data.humedad}`
            );

            // Aplicar lógica de tick cuando se recibe un mensaje del sensor
            aplicarLogicaTick();

            // Guardar el estado actualizado en la base de datos
            const mascotaCollection = getDB().collection('mascota');
            await mascotaCollection.updateOne(
              {},
              { $set: mascotaState },
              { upsert: true }
            );

            // Enviar estado actualizado a todos los clientes WebSocket
            wss.clients.forEach(client => {
              if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(mascotaState));
              }
            });
          }
        } catch (err) {
          console.error('Error procesando mensaje MQTT:', err);
        }
      }
    });
  });

  server.on('upgrade', (request, socket, head) => {
    wss.handleUpgrade(request, socket, head, ws => {
      wss.emit('connection', ws, request);
    });
  });
};
