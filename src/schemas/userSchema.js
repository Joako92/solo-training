const userSchema = {
    body: {
      type: 'object',
      required: ['nombre', 'email', 'password'],
      properties: {
        nombre: { type: 'string', minLength: 3 },
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
      }
    }
  };
  
  const loginSchema = {
    body: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email' },
        password: { type: 'string', minLength: 6 }
      }
    }
  };

  const updateUserSchema = {
    body: {
      type: 'object',
      properties: {
        nombre: { type: 'string', minLength: 3 },
        email: { type: 'string', format: 'email' }
      },
      additionalProperties: false // Prohibir otros campos no especificados
    }
  };
  
  module.exports = { userSchema, loginSchema, updateUserSchema };
  