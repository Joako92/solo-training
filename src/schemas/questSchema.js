const questSchema = {
  body: {
    type: 'object',
    required: ['titulo', 'descripcion', 'ejercicios'],
    properties: {
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      ejercicios: {
        type: 'array',
        items: {
          type: 'object',
          required: ['nombreDelEjercicio', 'series', 'repeticiones', 'cumplido'],
          properties: {
            nombreDelEjercicio: { type: 'string' },
            series: { type: 'integer', minimum: 0 },
            repeticiones: { type: 'integer', minimum: 0 },
            cumplido: { type: 'boolean' }
          }
        }
      },
      minNivel: { type: 'integer', minimum: 0 },
      minFuerza: { type: 'integer', minimum: 0 },
      minAgilidad: { type: 'integer', minimum: 0 },
      minResistencia: { type: 'integer', minimum: 0 },
      minInteligencia: { type: 'integer', minimum: 0 }
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
            series: { type: 'integer', minimum: 0 },
            repeticiones: { type: 'integer', minimum: 0 },
            cumplido: { type: 'boolean' }
          }
        }
      },
      minNivel: { type: 'integer', minimum: 0 },
      minFuerza: { type: 'integer', minimum: 0 },
      minAgilidad: { type: 'integer', minimum: 0 },
      minResistencia: { type: 'integer', minimum: 0 },
      minInteligencia: { type: 'integer', minimum: 0 }
    }
  }
};

module.exports = { questSchema, updateQuestSchema };

// Validación de requisitos mínimos de estadísticas para activar una quest
function validarRequisitosQuest(jugador, quest) {
  return (
    jugador.estadisticas.fuerza >= (quest.minFuerza || 0) &&
    jugador.estadisticas.agilidad >= (quest.minAgilidad || 0) &&
    jugador.estadisticas.resistencia >= (quest.minResistencia || 0) &&
    jugador.estadisticas.inteligencia >= (quest.minInteligencia || 0)
  );
}

module.exports = { questSchema, updateQuestSchema, validarRequisitosQuest };
