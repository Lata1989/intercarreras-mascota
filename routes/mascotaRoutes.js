import { Router } from 'express';
import { getDB } from '../config/db.js';
import { mascotaDefault } from '../models/mascota.js';

const router = Router();

// Obtener el estado actual de la mascota o inicializarlo
router.get('/', async (req, res) => {
  const db = getDB();
  let mascota = await db.collection('mascota').findOne({});

  if (!mascota) {
    mascota = { ...mascotaDefault };    // Si no hay una mascota guardada, inicializamos con el estado por defecto
    await db.collection('mascota').insertOne(mascota);
  }

  res.json(mascota);
});

export default router;
