const questSchema = {
  body: {
    type: 'object',
    required: ['titulo', 'descripcion', 'ejercicios', 'jugadorId', 'fecha'],
    properties: {
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      ejercicios: {
        type: 'array',
        items: {
          type: 'object',
          required: ['nombreDelEjercicio', 'cantidad', 'cumplido'],
          properties: {
            nombreDelEjercicio: { type: 'string' },
            cantidad: { type: 'integer', minimum: 0 },
            cumplido: { type: 'boolean' }
          }
        }
      },
      jugadorId: { type: 'string' },
      fecha: { type: 'string', format: 'date-time' }
    }
  }
};

const updateQuestSchema = {
  body: {
    type: 'object',
    properties: {
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      ejercicios: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            nombreDelEjercicio: { type: 'string' },
            cantidad: { type: 'integer', minimum: 0 },
            cumplido: { type: 'boolean' }
          }
        }
      },
      jugadorId: { type: 'string' },
      fecha: { type: 'string', format: 'date-time' }
    }
  }
  };
  
  module.exports = { questSchema, updateQuestSchema };
  