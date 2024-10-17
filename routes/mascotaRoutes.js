import { Router } from 'express';
import { getDB } from '../config/db.js';
import { mascota as mascotaDefault } from '../models/mascota.js';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const db = getDB();
    let mascota = await db.collection('mascota').findOne({});

    if (!mascota) {
      mascota = { ...mascotaDefault };
      await db.collection('mascota').insertOne(mascota);
    }

    res.json(mascota);
  } catch (error) {
    console.error('Error fetching mascota:', error);
    res.status(500).json({ error: 'Error fetching mascota' });
  }
});

export default router;
