const { ObjectId } = require('mongodb');
const calendarSchema = require('../schemas/calendarSchema');

async function calendarRoutes(fastify, options) {
  const db = fastify.mongo.db;

  // 🔹 Obtener todos los calendarios del jugador
  fastify.get('/calendar', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

      const calendar = user.calendar;
      if (!calendar) {
        return reply.code(404).send({ error: "Calendario no encontrado para este jugador" });
      }
      return reply.send(calendar);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al obtener el calendario" });
    }
  });

  // 🔹 Cargar una entrada en el calendario
  fastify.post('/calendar/entry', { preValidation: [fastify.authenticate], schema: calendarSchema }, async (request, reply) => {
    try {
      const userId = request.user.userId;
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });

      if (!user || !user.calendar) {
        return reply.status(400).send({ error: "El usuario no tiene un calendario asociado." });
      }

      const calendarEntry = {
        fecha: new Date(),
        questCompletada: true
      };

      // Agregar la entrada al calendario
      await db.collection('calendar').updateOne(
        { _id: user.calendar },
        { $push: { calendar: calendarEntry } },
        { upsert: true }
      );

      reply.send({ message: "Entrada de calendario agregada correctamente." });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al agregar entrada al calendario", details: error.message });
    }
  });

  // 🔹 Eliminar una entrada del calendario
  fastify.delete('/calendar/entry/:id', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { id } = request.params;
      const result = await db.collection('calendar').updateOne(
        { jugadorId: new ObjectId(request.user.jugadorId) },
        { $pull: { calendar: { _id: new ObjectId(id) } } } 
      );

      if (result.modifiedCount === 0) {
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
