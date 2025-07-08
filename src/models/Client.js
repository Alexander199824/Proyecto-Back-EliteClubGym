// Archivo: src/models/Client.js
// Modelo CORREGIDO - Movido unique a indexes y protegido asociaciones

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const Client = sequelize.define('Client', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del cliente'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    // CORREGIDO: Removido unique: true de aquí
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      }
    },
    comment: 'Email único del cliente'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: true, // Puede ser null si usa solo OAuth
    comment: 'Contraseña encriptada (opcional si usa OAuth)'
  },
  google_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    // CORREGIDO: Removido unique: true de aquí
    comment: 'ID único de Google OAuth'
  },
  first_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre es requerido'
      },
      len: {
        args: [2, 50],
        msg: 'El nombre debe tener entre 2 y 50 caracteres'
      }
    },
    comment: 'Nombre del cliente'
  },
  last_name: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El apellido es requerido'
      },
      len: {
        args: [2, 50],
        msg: 'El apellido debe tener entre 2 y 50 caracteres'
      }
    },
    comment: 'Apellido del cliente'
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\+]?[\d\s\-\(\)]+$/,
        msg: 'Número de teléfono inválido'
      }
    },
    comment: 'Número de teléfono de contacto'
  },
  date_of_birth: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    validate: {
      isDate: {
        msg: 'Debe ser una fecha válida'
      },
      isBefore: {
        args: new Date().toISOString().split('T')[0],
        msg: 'La fecha de nacimiento debe ser anterior a hoy'
      }
    },
    comment: 'Fecha de nacimiento del cliente'
  },
  gender: {
    type: DataTypes.ENUM('male', 'female', 'other', 'prefer_not_to_say'),
    allowNull: true,
    comment: 'Género del cliente'
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Dirección completa del cliente'
  },
  emergency_contact_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre del contacto de emergencia'
  },
  emergency_contact_phone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    validate: {
      is: {
        args: /^[\+]?[\d\s\-\(\)]+$/,
        msg: 'Número de teléfono de emergencia inválido'
      }
    },
    comment: 'Teléfono del contacto de emergencia'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Estado activo del cliente'
  },
  registration_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha de registro en el sistema'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora del último login'
  },
  email_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el email ha sido verificado'
  },
  profile_image_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'images',
      key: 'id'
    },
    comment: 'ID de la imagen de perfil almacenada en la tabla images'
  },
  total_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de puntos acumulados por check-ins (solo para visualización)'
  },
  consecutive_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Días consecutivos de asistencia actual'
  },
  max_consecutive_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Máximo de días consecutivos alcanzado'
  },
  last_checkin_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha del último check-in registrado'
  },
  preferred_workout_time: {
    type: DataTypes.ENUM('morning', 'afternoon', 'evening', 'night'),
    allowNull: true,
    comment: 'Horario preferido para entrenar'
  },
  fitness_goals: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Objetivos de fitness del cliente'
  },
  medical_conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Condiciones médicas relevantes (confidencial)'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales del personal sobre el cliente'
  }
}, {
  tableName: 'clients',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    // CORREGIDO: Movido unique constraints a indexes
    {
      unique: true,
      fields: ['email']
    },
    {
      unique: true,
      fields: ['google_id'],
      where: {
        google_id: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['registration_date']
    },
    {
      fields: ['last_login']
    },
    {
      fields: ['total_points']
    },
    {
      fields: ['last_checkin_date']
    }
  ],
  comment: 'Tabla de clientes/miembros del gimnasio'
});

// Hook para encriptar contraseña antes de crear cliente
Client.beforeCreate(async (client) => {
  if (client.password) {
    const saltRounds = 12;
    client.password = await bcrypt.hash(client.password, saltRounds);
  }
});

// Hook para encriptar contraseña antes de actualizar cliente
Client.beforeUpdate(async (client) => {
  if (client.changed('password') && client.password) {
    const saltRounds = 12;
    client.password = await bcrypt.hash(client.password, saltRounds);
  }
});

// Método de instancia para verificar contraseña
Client.prototype.validatePassword = async function(password) {
  if (!this.password) return false;
  return await bcrypt.compare(password, this.password);
};

// Método de instancia para obtener nombre completo
Client.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

// Método de instancia para calcular edad
Client.prototype.getAge = function() {
  if (!this.date_of_birth) return null;
  const today = new Date();
  const birthDate = new Date(this.date_of_birth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
};

// Método de instancia para actualizar días consecutivos
Client.prototype.updateConsecutiveDays = async function(checkinDate) {
  const today = new Date(checkinDate);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const lastCheckin = this.last_checkin_date ? new Date(this.last_checkin_date) : null;
  
  if (!lastCheckin) {
    // Primer check-in
    this.consecutive_days = 1;
  } else if (lastCheckin.toDateString() === yesterday.toDateString()) {
    // Check-in consecutivo
    this.consecutive_days += 1;
  } else if (lastCheckin.toDateString() !== today.toDateString()) {
    // Se rompió la racha
    this.consecutive_days = 1;
  }
  // Si es el mismo día, no cambiar consecutive_days
  
  // Actualizar máximo si es necesario
  if (this.consecutive_days > this.max_consecutive_days) {
    this.max_consecutive_days = this.consecutive_days;
  }
  
  this.last_checkin_date = today.toISOString().split('T')[0];
  await this.save();
};

// Método de instancia para añadir puntos
Client.prototype.addPoints = async function(points, reason = 'Check-in') {
  this.total_points += points;
  await this.save();
  
  // Crear registro en PointsTransaction
  if (sequelize.models.PointsTransaction) {
    await sequelize.models.PointsTransaction.create({
      client_id: this.id,
      points_earned: points,
      transaction_type: 'earned',
      reason: reason,
      balance_after: this.total_points
    });
  }
  
  return this.total_points;
};

// Método de clase para buscar cliente activo por email
Client.findActiveByEmail = function(email) {
  return this.findOne({
    where: {
      email: email,
      is_active: true
    }
  });
};

// Método de clase para buscar cliente por Google ID
Client.findByGoogleId = function(googleId) {
  return this.findOne({
    where: {
      google_id: googleId,
      is_active: true
    }
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
Client.associate = function(models) {
  // Un cliente tiene una imagen de perfil
  if (models.Image) {
    Client.belongsTo(models.Image, {
      foreignKey: 'profile_image_id',
      as: 'profileImage',
      onDelete: 'SET NULL'
    });
  }
  
  // Un cliente tiene muchas membresías
  if (models.ClientMembership) {
    Client.hasMany(models.ClientMembership, {
      foreignKey: 'client_id',
      as: 'memberships'
    });
  }
  
  // Un cliente tiene muchos pagos
  if (models.Payment) {
    Client.hasMany(models.Payment, {
      foreignKey: 'client_id',
      as: 'payments'
    });
  }
  
  // Un cliente tiene muchas órdenes
  if (models.Order) {
    Client.hasMany(models.Order, {
      foreignKey: 'client_id',
      as: 'orders'
    });
  }
  
  // Un cliente tiene muchos check-ins
  if (models.ClientCheckin) {
    Client.hasMany(models.ClientCheckin, {
      foreignKey: 'client_id',
      as: 'checkins'
    });
  }
  
  // Un cliente tiene muchas transacciones de puntos
  if (models.PointsTransaction) {
    Client.hasMany(models.PointsTransaction, {
      foreignKey: 'client_id',
      as: 'pointsTransactions'
    });
  }
  
  // Un cliente tiene muchos premios ganados
  if (models.PrizeWinning) {
    Client.hasMany(models.PrizeWinning, {
      foreignKey: 'client_id',
      as: 'prizeWinnings'
    });
  }
  
  // Un cliente tiene muchas notificaciones
  if (models.Notification) {
    Client.hasMany(models.Notification, {
      foreignKey: 'client_id',
      as: 'notifications'
    });
  }
  
  // Un cliente tiene preferencias
  if (models.ClientPreferences) {
    Client.hasOne(models.ClientPreferences, {
      foreignKey: 'client_id',
      as: 'preferences'
    });
  }
};

module.exports = Client;