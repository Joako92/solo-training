const { ObjectId } = require('mongodb');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { userSchema, loginSchema, updateUserSchema } = require('../schemas/userSchema');
const transporter = require('../config/mailConfig');

async function userRoutes(fastify, options) {
  const db = fastify.mongo.db;

   // 🔹 Obtener todos los usuarios
   fastify.get('/users', async (request, reply) => {
    try {
      const users = await db.collection('users').find().toArray();
      return reply.send(users);
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al obtener usuarios" });
    }
  });

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
      const { nombre, email } = request.body;
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

  // 🔹 Cambiar contraseña de usuario
  fastify.put('/users/change-password', { preValidation: [fastify.authenticate] }, async (request, reply) => {
    try {
      const { currentPassword, newPassword } = request.body;
      const userId = request.user.userId;

      // Validar que el usuario existe
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      // Verificar que la contraseña actual es correcta
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return reply.status(400).send({ error: "Contraseña actual incorrecta" });
      }

      // Encriptar la nueva contraseña
      const userToUpdate = new User(user.nombre, user.email, newPassword, user.jugadorId);
      await userToUpdate.hashPassword();

      // Actualizar la contraseña en la base de datos
      await db.collection('users').updateOne({ _id: new ObjectId(userId) }, { $set: { password: userToUpdate.password } });

      reply.send({ message: "Contraseña cambiada correctamente" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al cambiar la contraseña", details: error.message });
    }
  });

  // 🔹 Solicitar restablecimiento de contraseña
  fastify.post('/users/reset-password-request', async (request, reply) => {
    try {
      const { email } = request.body;
      const user = await db.collection('users').findOne({ email });

      if (!user) {
        return reply.status(400).send({ error: "Usuario no encontrado" });
      }

      // Generar un token único para restablecimiento de contraseña
      const resetToken = fastify.jwt.sign({ userId: user._id }, { expiresIn: '1h' });

      // Enviar correo con el enlace de restablecimiento
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Restablecer Contraseña',
        text: `Para restablecer su contraseña, haga clic en el siguiente enlace: http://localhost:3000/users/reset-password/${resetToken}`,
      };

      await transporter.sendMail(mailOptions);
      reply.send({ message: "Correo de restablecimiento enviado" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al solicitar el restablecimiento de contraseña" });
    }
  });

  // 🔹 Restablecer contraseña
  fastify.post('/users/reset-password/:token', async (request, reply) => {
    try {
      const { token } = request.params;
      const { newPassword } = request.body;

      // Verificar y decodificar el token
      const decoded = fastify.jwt.verify(token);

      // Validar que el usuario existe
      const user = await db.collection('users').findOne({ _id: new ObjectId(decoded.userId) });
      if (!user) {
        return reply.status(400).send({ error: "Usuario no encontrado" });
      }

      // Encriptar la nueva contraseña
      const userToUpdate = new User(user.nombre, user.email, newPassword, user.jugadorId);
      await userToUpdate.hashPassword();

      // Actualizar la contraseña en la base de datos
      await db.collection('users').updateOne({ _id: new ObjectId(decoded.userId) }, { $set: { password: userToUpdate.password } });

      reply.send({ message: "Contraseña restablecida correctamente" });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ error: "Error al restablecer la contraseña", details: error.message });
    }
  });
}

module.exports = userRoutes;
