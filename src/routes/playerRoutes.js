const { ObjectId } = require('mongodb');
const { playerSchema, updatePlayerSchema } = require('../schemas/playerSchema');

async function playerRoutes(fastify, options) {
  const db = fastify.mongo.db;

  // Ruta para insertar un nuevo jugador
  fastify.post('/players', { schema: playerSchema }, async (request, reply) => {
    try {
      const db = fastify.mongo.db;
      const newPlayer = request.body;
  
      const result = await db.collection('players').insertOne(newPlayer);
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

module.exports = playerRoutes;
