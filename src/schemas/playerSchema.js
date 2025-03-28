const playerSchema = {
  body: {
    type: 'object',
    required: ['nombre'],
    properties: {
      nombre: { type: 'string' },
      nivel: { type: 'integer', minimum: 1 },
      rango: { type: 'string' },
      titulo: { type: 'string' },
      racha: { type: 'integer', minimum: 0 },
      estadisticas: {
        type: 'object',
        required: ['fuerza', 'agilidad', 'resistencia', 'inteligencia', 'puntosParaRepartir'],
        properties: {
          fuerza: { type: 'integer', minimum: 0 },
          agilidad: { type: 'integer', minimum: 0 },
          resistencia: { type: 'integer', minimum: 0 },
          inteligencia: { type: 'integer', minimum: 0 },
          puntosParaRepartir: { type: 'integer', minimum: 0 }
        }
      },
      questDiaria: { type: 'string' },
      questSecundaria: { type: 'string' },
      calendar : { type: 'string' }
    }
  }
};

const updatePlayerSchema = {
  body: {
    type: 'object',
    properties: {
      nombre: { type: 'string' },
      nivel: { type: 'integer', minimum: 1 },
      rango: { type: 'string' },
      titulo: { type: 'string' },
      racha: { type: 'integer', minimum: 0 },
      estadisticas: {
        type: 'object',
        properties: {
          fuerza: { type: 'integer', minimum: 0 },
          agilidad: { type: 'integer', minimum: 0 },
          resistencia: { type: 'integer', minimum: 0 },
          inteligencia: { type: 'integer', minimum: 0 },
          puntosParaRepartir: { type: 'integer', minimum: 0 }
        }
      },
      questDiaria: { type: 'string' },
      questSecundaria: { type: 'string' },
      calendar : { type: 'string' }
    }
  }
};

module.exports = { playerSchema, updatePlayerSchema };
