const { ObjectId } = require('mongodb');
const User = require('../models/userModel');
const bcrypt = require('bcrypt');
const { userSchema, loginSchema, updateUserSchema } = require('../schemas/userSchema');

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
      const { email, password } = request.body;

      // Verificar si el usuario ya existe
      const existingUser = await db.collection('users').findOne({ email });
      if (existingUser) {
        return reply.status(400).send({ error: "El email ya está registrado" });
      }

      // Crear nuevo usuario
      const user = new User(email, password);
      await user.hashPassword();
      const result = await db.collection('users').insertOne(user);

      // Generar token JWT
      const token = fastify.jwt.sign({ userId: result.insertedId });

      return reply.status(201).send({ 
        message: "Usuario registrado con éxito", 
        userId: result.insertedId,
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
      const { email } = request.body;
      const userId = request.user.userId;

      // Validar que el usuario existe
      const user = await db.collection('users').findOne({ _id: new ObjectId(userId) });
      if (!user) {
        return reply.status(404).send({ error: "Usuario no encontrado" });
      }

      // Actualizar solo los campos que se envían en la solicitud
      const updateData = {};
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
}

module.exports = userRoutes;
