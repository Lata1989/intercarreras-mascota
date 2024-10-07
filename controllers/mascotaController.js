import { getDB } from '../config/db.js';
import { mascotaDefault } from '../models/mascota.js';

export const crearNuevaMascota = async (req, res) => {
    const db = getDB();
    
    const nuevaMascota = { 
        ...mascotaDefault, 
        nombre: req.body.nombre || 'Mascota sin nombre',  // Permitir que el usuario envíe un nombre
        fechaNac: new Date()  // Fecha de nacimiento al momento de creación
    };

    const result = await db.collection('mascota').insertOne(nuevaMascota);
    res.json({ message: 'Nueva mascota creada', mascota: nuevaMascota, id: result.insertedId });
};
