class Player {
    constructor(nombre, nivel = 1, rango = "E", questDiaria = null, questSecundaria = null) {
      this.nombre = nombre;
      this.nivel = nivel;
      this.rango = rango;
      this.racha = 0;
      this.estadisticas = {
        fuerza: 0,
        agilidad: 0,
        resistencia: 0,
        inteligencia: 0,
        puntosParaRepartir: 0,
      };
      this.questDiaria = questDiaria;
      this.questSecundaria = questSecundaria;
      this.creado = new Date();
    }
  
    // Método para actualizar el progreso de la quest diaria
    actualizarProgresoQuestDiaria(completado) {
      this.questDiaria.progreso = completado;
      if (completado) {
        this.racha += 1; 
      } else {
        this.racha += 0;
      }
    }
  }
  
  module.exports = Player;
  