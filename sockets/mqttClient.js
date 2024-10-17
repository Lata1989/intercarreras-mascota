import mqtt from 'mqtt';
import dotenv from 'dotenv';
const topicAcciones =
  process.env.MQTT_TOPIC_ACCIONES || 'sensor/mascota/accion';
const topicSensores = process.env.MQTT_TOPIC_SENSORES || 'sensor';
dotenv.config();

// Conexión al broker MQTT
const mqttClient = mqtt.connect(`mqtt://${process.env.MQTT_BROKER}`);

mqttClient.on('connect', () => {
  console.log('Conectado al broker MQTT');

  // Sub al tópico de los sensores TSH
  mqttClient.subscribe(topicSensores, err => {
    if (err) {
      console.error('Error al suscribirse al tópico de los sensores:', err);
    } else {
      console.log(`Escuchando tópico '${topicSensores}' de los sensores...`);
    }
  });
});

mqttClient.on('error', err => {
  console.error('Error en la conexión MQTT:', err);
});

// Para enviar una acción por MQTT a los TSH (topic 'sensor/mascota/accion')
export const publicarEnMQTT = mensaje => {
  return new Promise((resolve, reject) => {
    mqttClient.publish(topicAcciones, JSON.stringify(mensaje), err => {
      if (err) {
        console.error('Error publicando Acción en MQTT:', err);
        reject(err);
      } else {
        console.log(
          `Acción '${mensaje}' enviada a '${topicAcciones}' por MQTT`
        );
        resolve();
      }
    });
  });
};

export default mqttClient;
