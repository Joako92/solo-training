const calendarSchema = {
    body: {
      type: 'object',
      required: ['jugadorId', 'fecha', 'questCompletada'],
      properties: {
        jugadorId: { type: 'string' }, // ID del jugador asociado
        fecha: { type: 'string', format: 'date-time' }, // Fecha en formato ISO
        questCompletada: { type: 'boolean' } // Indica si la quest fue completada
      }
    }
  };
  
  module.exports = calendarSchema;
  