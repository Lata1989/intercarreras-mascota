import WebSocket from 'ws';
import { getDB } from '../config/db.js';
import { mascotaDefault } from '../models/mascota.js';

let mascotaState = { ...mascotaDefault };

export const setupWebSocket = (app) => {
    const wss = new WebSocket.Server({ noServer: true });

    wss.on('connection', (ws) => {
        console.log('Cliente conectado al WebSocket');

        // Enviar el estado inicial de la mascota
        ws.send(JSON.stringify(mascotaState));

        ws.on('message', async (message) => {
            const data = JSON.parse(message);

            // Interaccion con la mascota para subir una estadistica
            switch (data.command) {
                case 'alimentar':
                    mascotaState.hambre = Math.min(3000, mascotaState.hambre + 1000);  // Aumentar hambre
                    break;
                case 'cariño':
                    mascotaState.felicidad = Math.min(3000, mascotaState.felicidad + 1000);  // Aumentar felicidad
                    break;
                case 'dormir':
                    mascotaState.dormido = true;  // Poner en estado dormido
                    break;
                case 'jugar':
                    mascotaState.diversion = Math.min(3000, mascotaState.diversion + 1000);  // Aumentar diversión
                    break;
                case 'limpiar':
                    mascotaState.limpio = Math.min(3000, mascotaState.limpio + 1000);  // Aumentar limpieza
                    break;
            }

            // Aplicar lógica de tick: reducir estadísticas
            mascotaState.hambre = Math.max(0, mascotaState.hambre - 1);
            mascotaState.felicidad = Math.max(0, mascotaState.felicidad - 1);
            mascotaState.limpio = Math.max(0, mascotaState.limpio - 1);
            mascotaState.diversion = Math.max(0, mascotaState.diversion - 1);

            if (mascotaState.dormido) {
                mascotaState.suenio = Math.min(3000, mascotaState.suenio + 50);  // Recuperar sueño
            } else {
                mascotaState.suenio = Math.max(0, mascotaState.suenio - 1);  // Reducir sueño
            }

            // Verificar si la mascota muere
            if (mascotaState.hambre <= 0 || mascotaState.suenio <= 0 || mascotaState.felicidad <= 0 || mascotaState.diversion <= 0 || mascotaState.limpio <= 0) {
                mascotaState.vivo = false;
                if (!mascotaState.fechaMuerte) {
                    mascotaState.fechaMuerte = new Date();  // Registrar fecha de muerte
                }
            }

            // Guardar el estado actualizado en la base de datos
            const mascotaCollection = getDB().collection('mascota');
            await mascotaCollection.updateOne({}, { $set: mascotaState }, { upsert: true });

            // Enviar estado actualizado al cliente
            ws.send(JSON.stringify(mascotaState));
        });
    });

    app.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
            wss.emit('connection', ws, request);
        });
    });
};
