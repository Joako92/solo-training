require('dotenv').config();
const fastify = require('fastify')({ logger: true });

fastify.register(require('@fastify/mongodb'), {
  forceClose: true,
  url: process.env.MONGO_URI
});

// Registrar JWT
fastify.register(require('@fastify/jwt'), { secret: process.env.JWT_SECRET });

// Middleware para autenticar usuarios
fastify.decorate("authenticate", async (request, reply) => {
  try {
    await request.jwtVerify();
  } catch (err) {
    reply.status(401).send({ error: "No autorizado" });
  }
});

// Registrar rutas de jugadores
fastify.register(require('./routes/playerRoutes'));
fastify.register(require('./routes/questRoutes'));
fastify.register(require('./routes/calendarRoutes'));
fastify.register(require('./routes/userRoutes'));

const start = async () => {
  try {
    await fastify.listen({ port: 3000 });
    console.log('Servidor corriendo en http://localhost:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
