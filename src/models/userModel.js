const bcrypt = require('bcrypt');

class User {
  constructor( email, password, jugadorId) {
    this.email = email;
    this.password = password;
    this.jugadorId = jugadorId;
    this.creado = new Date();
  }

  async hashPassword() {
    this.password = await bcrypt.hash(this.password, 10);
  }
}

module.exports = User;
