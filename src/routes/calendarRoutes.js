const { ObjectId } = require('mongodb');
const calendarSchema = require('../schemas/calendarSchema');

async function calendarRoutes(fastify, options) {
  const db = fastify.mongo.db;

  // 🔹 Obtener calendario del usuario autenticado
  fastify.get('/calendar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const calendar = await db.collection('calendar').find({ jugadorId: new ObjectId(request.user.jugadorId) }).toArray();
      return reply.send(calendar);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al obtener el calendario" });
    }
  });

  // 🔹 Registrar un día en el calendario
  fastify.post('/calendar', { 
    preValidation: [fastify.authenticate], 
    schema: calendarSchema 
  }, async (request, reply) => {
    try {
      const { fecha, questCompletada } = request.body;
      const jugadorId = request.user.jugadorId; // Se obtiene del token JWT

      const existingEntry = await db.collection('calendar').findOne({
        jugadorId: new ObjectId(jugadorId),
        'calendario.fecha': new Date(fecha)
      });

      if (existingEntry) {
        return reply.code(400).send({ error: "Ya existe un registro para esta fecha." });
      }

      const calendarEntry = {
        fecha: new Date(fecha),
        questCompletada
      };

      const result = await db.collection('calendar').findOneAndUpdate(
        { jugadorId: new ObjectId(jugadorId) },
        { $push: { calendario: calendarEntry } },
        { upsert: true, returnOriginal: false }
      );

      reply.code(201).send({ message: "Registro de calendario actualizado", id: result.value?._id });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: "Error al registrar en el calendario", details: error.message });
    }
  });

  // 🔹 Obtener el calendario de un jugador
  fastify.get('/calendar/:jugadorId', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { jugadorId } = request.params;
      const calendarEntry = await db.collection('calendar').findOne({ jugadorId: new ObjectId(jugadorId) });

      if (!calendarEntry) {
        return reply.code(404).send({ error: "Calendario no encontrado para este jugador" });
      }

      reply.send(calendarEntry);
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: "Error al obtener el calendario", details: error.message });
    }
  });

  // 🔹 Verificar si la quest diaria está completada
  fastify.post('/quests/:id/check', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;

      const quest = await db.collection('quests').findOne({ _id: new ObjectId(id) });
      if (!quest) {
        return reply.code(404).send({ error: "Quest no encontrada" });
      }

      const questCompletada = quest.ejercicios.every(exercise => exercise.cumplido === true);

      const calendarEntry = {
        fecha: new Date(),
        questCompletada
      };

      await db.collection('calendar').findOneAndUpdate(
        { jugadorId: new ObjectId(quest.jugadorId) },
        { $push: { calendario: calendarEntry } },
        { upsert: true }
      );

      reply.send({ message: "Estado de la quest actualizado correctamente", questCompletada });
    } catch (error) {
      request.log.error(error);
      reply.code(500).send({ error: "Error al verificar quest", details: error.message });
    }
  });

  // 🔹 Eliminar una entrada del calendario
  fastify.delete('/calendar/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await db.collection('calendar').deleteOne({ _id: new ObjectId(id) });

      if (result.deletedCount === 0) {
        return reply.status(404).send({ error: "Entrada no encontrada" });
      }

      return reply.send({ message: "Entrada eliminada con éxito" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al eliminar la entrada" });
    }
  });
}

module.exports = calendarRoutes;
