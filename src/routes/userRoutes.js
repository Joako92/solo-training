const { ObjectId } = require('mongodb');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { userSchema, loginSchema, updateUserSchema } = require('../schemas/userSchema');

async function userRoutes(fastify, options) {
  const db = fastify.mongo.db;

  // 🔹 Registrar usuario
  fastify.post('/users/register', { schema: userSchema }, async (request, reply) => {
    try {
      const { nombre, email, password, jugadorId } = request.body;

      // Verificar si el usuario ya existe
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return reply.status(400).send({ error: "El email ya está registrado" });
      }

      let jugadorObjectId = null;
      if (jugadorId) {
        if (!ObjectId.isValid(jugadorId)) {
          return reply.status(400).send({ error: "ID de jugador inválido" });
        }
        jugadorObjectId = new ObjectId(jugadorId);

        // Verificar si el jugador existe
        const existingPlayer = await db.collection('players').findOne({ _id: jugadorObjectId });
        if (!existingPlayer) {
          return reply.status(400).send({ error: "El jugador no existe" });
        }
      } else {
        // Crear nuevo jugador automáticamente si no se proporciona uno
        const newPlayer = {
          nombre,
          nivel: 1,
          rango: "E",
          titulo: "Novato",
          racha: 0,
          estadisticas: {
            fuerza: 0,
            agilidad: 0,
            resistencia: 0,
            inteligencia: 0,
            puntosParaRepartir: 0,
          },
          creado: new Date(),
        };
        const playerResult = await db.collection('players').insertOne(newPlayer);
        jugadorObjectId = playerResult.insertedId;
      }

      // Crear nuevo usuario con el jugador asociado
      const user = new User(nombre, email, password, jugadorObjectId);
      await user.hashPassword();
      const result = await db.collection('users').insertOne(user);

      // Generar token JWT con jugadorId incluido
      const token = fastify.jwt.sign({ userId: result.insertedId, jugadorId: jugadorObjectId });

      return reply.status(201).send({ 
        message: "Usuario registrado con éxito", 
        userId: result.insertedId, 
        jugadorId: jugadorObjectId,
        token
      });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al registrar usuario" });
    }
  });

  // 🔹 Login de usuario
  fastify.post('/users/login', { schema: loginSchema }, async (request, reply) => {
    try {
      const { email, password } = request.body;
      const user = await db.collection('users').findOne({ email });

      if (!user) return reply.status(400).send({ error: "Usuario no encontrado" });

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) return reply.status(400).send({ error: "Contraseña incorrecta" });

      // Generar token JWT con jugadorId incluido
      const token = fastify.jwt.sign({ userId: user._id, jugadorId: user.jugadorId });

      return reply.send({ message: "Login exitoso", token });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al iniciar sesión" });
    }
  });

  // 🔹 Actualizar perfil de usuario
  fastify.put('/users/profile', { preValidation: [fastify.authenticate], schema: updateUserSchema }, async (request, reply) => {
    try {
      const { nombre, email } = request.body; // Puedes añadir más campos si lo deseas
      const userId = request.user.userId;

      // Validar que el usuario existe
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      // Actualizar solo los campos que se envían en la solicitud
      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (email) {
        // Verificar si el email ya está registrado por otro usuario
        const existingUser = await db.collection('users').findOne({ email });
        if (existingUser && existingUser._id.toString() !== userId) {
          return reply.status(400).send({ error: "El email ya está registrado" });
        }
        updateData.email = email;
      }

      await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: updateData });

      reply.send({ message: "Perfil actualizado correctamente" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al actualizar el perfil", details: error.message });
    }
  }); 
}

module.exports = userRoutes;
