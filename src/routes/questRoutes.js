const { ObjectId } = require('mongodb');
const { questSchema, updateQuestSchema } = require('../schemas/questSchema');

async function questRoutes(fastify, options) {
  const db = fastify.mongo.db;

  // 🔹 Obtener todas las quests
  fastify.get('/quests/all', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const quests = await db.collection('quests').find().toArray();
      reply.send(quests);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: "Error al obtener quests" });
    }
  });

  // 🔹 Obtener quests del jugador autenticado
  fastify.get('/quests/player', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const quests = await db.collection('quests').find({ jugadorId: new ObjectId(request.user.jugadorId) }).toArray();
      return reply.send(quests);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al obtener quests" });
    }
  });

  // 🔹 Crear una nueva quest
  fastify.post('/quests', { 
    preValidation: [fastify.authenticate], 
    schema: questSchema 
  }, async (request, reply) => {
    try {
      const { titulo, descripcion, ejercicios, minNivel, minFuerza, minAgilidad, minResistencia, minInteligencia } = request.body;
      
      const nuevaQuest = {
        titulo,
        descripcion,
        ejercicios,
        minNivel: minNivel || 0,
        minFuerza: minFuerza || 0,
        minAgilidad: minAgilidad || 0,
        minResistencia: minResistencia || 0,
        minInteligencia: minInteligencia || 0
      };
      
      const result = await db.collection('quests').insertOne(nuevaQuest);
      reply.status(201).send({ message: "Quest creada con éxito", questId: result.insertedId });
    } catch (error) {
      request.log.error(error);
      reply.status(500).send({ error: "Error al crear la quest" });
    }
  });

  // 🔹 Actualizar una quest
  fastify.put('/quests/:id', { 
    preValidation: [fastify.authenticate], 
    schema: updateQuestSchema 
  }, async (request, reply) => {
    try {
      const { id } = request.params;
      const updateData = request.body;
      const jugadorId = request.user.jugadorId;

      const result = await db.collection('quests').updateOne(
        { _id: new ObjectId(id), jugadorId: new ObjectId(jugadorId) }, // Asegurar que la quest pertenece al jugador autenticado
        { $set: updateData }
      );

      if (result.matchedCount === 0) {
        return reply.code(404).send({ error: "Quest no encontrada o no pertenece al usuario" });
      }

      reply.send({ message: "Quest actualizada correctamente" });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: "Error al actualizar quest", details: error.message });
    }
  });

  // 🔹 Actualizar el estado de un ejercicio dentro de una quest
  fastify.put('/quests/:id/ejercicios/:IdEjercicio', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id, IdEjercicio } = request.params;
      const { cumplido } = request.body;
      const jugadorId = request.user.jugadorId;

      if (typeof cumplido !== 'boolean') {
        return reply.code(400).send({ error: "El campo 'cumplido' debe ser un booleano." });
      }

      const result = await db.collection('quests').updateOne(
        { _id: new ObjectId(id), jugadorId: new ObjectId(jugadorId), "ejercicios._id": new ObjectId(IdEjercicio) },
        { $set: { "ejercicios.$.cumplido": cumplido } } // Actualizar el campo de ejercicio específico
      );

      if (result.matchedCount === 0) {
        return reply.code(404).send({ error: "Quest o ejercicio no encontrado" });
      }

      reply.send({ message: "Estado del ejercicio actualizado correctamente" });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: "Error al actualizar estado de ejercicio", details: error.message });
    }
  });

  // 🔹 Eliminar una quest
  fastify.delete('/quests/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;

      const result = await db.collection('quests').deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return reply.code(404).send({ error: "Quest no encontrada" });
      }

      reply.send({ message: "Quest eliminada correctamente" });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: "Error al eliminar quest", details: error.message });
    }
  });
}

module.exports = questRoutes;
