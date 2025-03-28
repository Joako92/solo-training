const calendarSchema = {
    body: {
      type: 'object',
      required: [ 'calendar' ],
      properties: {
        calendar: { 
          type: 'object',
          required: [ 'fecha', 'questCompletada' ],
          properties: {
            fecha: { type: 'string', format: 'date-time' }, // Fecha en formato ISO
            questCompletada: { type: 'boolean' }
          }
        },
        
      }
    }
  };
  
  module.exports = calendarSchema;
  