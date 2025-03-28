const { ObjectId } = require('mongodb');
const { playerSchema, updatePlayerSchema } = require('../schemas/playerSchema');

async function playerRoutes(fastify, options) {
  const db = fastify.mongo.db;

  // Ruta para insertar un nuevo jugador
  fastify.post('/players', { schema: playerSchema, preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { nombre, respuestas } = request.body;
      const userId = request.user.userId; // Obtener el ID del usuario logueado

      if (!nombre || !respuestas) {
        return reply.code(400).send({ error: "Nombre y respuestas son requeridos" });
      }
      
      const { fuerza, agilidad, resistencia, inteligencia, nivel, rango } = calcularEstadisticas(respuestas);
      
      const newPlayer = {
        nombre,
        nivel,
        rango,
        titulo: "El cazador más débil",
        racha: 0,
        estadisticas: { fuerza, agilidad, resistencia, inteligencia, puntosParaRepartir: 0 },
        questDiaria: null,
        questSecundaria: null,
        calendar: []
      };
      
      const result = await db.collection('players').insertOne(newPlayer);

      // Actualizar el usuario logueado con el nuevo jugadorId
      await db.collection('users').updateOne(
        { _id: new ObjectId(userId) },
        { $set: { jugadorId: result.insertedId } } // Guardar el jugadorId en el usuario
      );

      reply.code(201).send({ message: "Jugador creado", id: result.insertedId });
    } catch (error) {
      console.error("Error al insertar jugador:", error);
      reply.code(500).send({ error: "Error al insertar jugador", details: error.message });
    }
  });

// Ruta para obtener un jugador por su ID
fastify.get('/players/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      const jugador = await db.collection('players').findOne({ _id: new ObjectId(id) });

      if (!jugador) {
        return reply.code(404).send({ error: "Jugador no encontrado" });
      }

      reply.send(jugador);
    } catch (error) {
      console.error("Error al obtener jugador:", error);
      reply.code(500).send({ error: "Error al obtener jugador", details: error.message });
    }
  });

// Ruta para obtener todos los jugadores
fastify.get('/players', async (request, reply) => {
    try {
        const jugadores = await db.collection('players').find().toArray();
        reply.send(jugadores);
    } catch (error) {
        console.error("Error al obtener jugadores:", error);
        reply.code(500).send({ error: "Error al obtener jugadores", details: error.message });
    }
    });

// Ruta para actualizar un jugador por su ID
fastify.put('/players/:id', { schema: updatePlayerSchema }, async (request, reply) => {
  try {
    const { id } = request.params;
    const updateData = request.body;

    // Convertir `id` a ObjectId para buscar en MongoDB
    const result = await db.collection('players').updateOne(
      { _id: new ObjectId(id) }, 
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return reply.code(404).send({ error: "Jugador no encontrado" });
    }

    reply.send({ message: "Jugador actualizado correctamente" });
  } catch (error) {
    console.error("Error al actualizar jugador:", error);
    reply.code(500).send({ error: "Error al actualizar jugador", details: error.message });
  }
});

// Ruta para eliminar un jugador por su ID
fastify.delete('/players/:id', async (request, reply) => {
    try {
      const { id } = request.params;
  
      // Convertir `id` a ObjectId para buscar en MongoDB
      const result = await db.collection('players').deleteOne({ _id: new ObjectId(id) });
  
      if (result.deletedCount === 0) {
        return reply.code(404).send({ error: "Jugador no encontrado" });
      }
  
      reply.send({ message: "Jugador eliminado correctamente" });
    } catch (error) {
      console.error("Error al eliminar jugador:", error);
      reply.code(500).send({ error: "Error al eliminar jugador", details: error.message });
    }
  });  
  
}

function calcularEstadisticas(respuestas) {
  let fuerza = 0, agilidad = 0, resistencia = 0, inteligencia = 0;

  // Evaluar fuerza
  if (respuestas.pushUps > 40) fuerza += 5;
  else if (respuestas.pushUps > 30) fuerza += 4;
  else if (respuestas.pushUps > 20) fuerza += 3;
  else if (respuestas.pushUps > 10) fuerza += 2;
  else fuerza += 1;

  if (respuestas.squats > 40) fuerza += 5;
  else if (respuestas.squats > 30) fuerza += 4;
  else if (respuestas.squats > 20) fuerza += 3;
  else if (respuestas.squats > 10) fuerza += 2;
  else fuerza += 1;

  if (respuestas.crunches > 40) fuerza += 5;
  else if (respuestas.crunches > 30) fuerza += 4;
  else if (respuestas.crunches > 20) fuerza += 3;
  else if (respuestas.crunches > 10) fuerza += 2;
  else fuerza += 1;

  // Evaluar resistencia
  if (respuestas.tiempoCorriendo >= 30) resistencia += 5;
  else if (respuestas.tiempoCorriendo >= 20) resistencia += 4;
  else if (respuestas.tiempoCorriendo >= 10) resistencia += 3;
  else if (respuestas.tiempoCorriendo >= 5) resistencia += 2;
  else resistencia += 1;

  if (!respuestas.fumador) resistencia += 3;

  // Evaluar agilidad
  if (respuestas.deportesAgiles) agilidad += 3;
  if (respuestas.movimientosRapidos) agilidad += 3;

  // Evaluar inteligencia (mentalidad ante el ejercicio)
  if (respuestas.motivacion) inteligencia += 3;
  if (respuestas.fatiga) inteligencia += 3;

  const nivel = Math.floor((fuerza + agilidad + resistencia + inteligencia) / 4);
  let rango = "E";
  if (nivel >= 50) rango = "S";
  else if (nivel >= 40) rango = "A";
  else if (nivel >= 30) rango = "B";
  else if (nivel >= 20) rango = "C";
  else if (nivel >= 10) rango = "D";

  return { fuerza, agilidad, resistencia, inteligencia, nivel, rango };
}


module.exports = playerRoutes;
