const calendarSchema = {
    body: {
      type: 'object',
      required: ['jugadorId', 'calendar' ],
      properties: {
        jugadorId: { type: 'string' }, // ID del jugador asociado
        calendar: { 
          type: 'object',
          required: [ 'fecha', 'questCompletada' ],
          properties: {
            fecha: { type: 'string', format: 'date-time' }, // Fecha en formato ISO
            questCompletada: { type: 'boolean' } // Indica si la quest fue completada
          }
        },
        
      }
    }
  };
  
  module.exports = calendarSchema;
  