// Archivo: src/models/User.js
// Yo como desarrollador creo el modelo para administradores y personal del gimnasio

const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { sequelize } = require('../config/database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del usuario administrativo'
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: 'Debe ser un email válido'
      }
    },
    comment: 'Email único para autenticación'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    validate: {
      len: {
        args: [6, 255],
        msg: 'La contraseña debe tener al menos 6 caracteres'
      }
    },
    comment: 'Contraseña encriptada con bcrypt'
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
    comment: 'Nombre del usuario'
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
    comment: 'Apellido del usuario'
  },
  role: {
    type: DataTypes.ENUM('admin', 'manager', 'staff'),
    allowNull: false,
    defaultValue: 'staff',
    comment: 'Rol del usuario: admin=Administrador, manager=Gerente, staff=Personal'
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
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Estado activo del usuario'
  },
  last_login: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora del último login'
  },
  login_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de intentos de login fallidos consecutivos'
  },
  locked_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha hasta la cual la cuenta está bloqueada por intentos fallidos'
  },
  two_factor_enabled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el usuario tiene habilitada la autenticación de dos factores'
  },
  profile_image_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'images',
      key: 'id'
    },
    comment: 'ID de la imagen de perfil almacenada en la tabla images'
  }
}, {
  tableName: 'users',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      unique: true,
      fields: ['email']
    },
    {
      fields: ['role']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['last_login']
    }
  ],
  comment: 'Tabla de usuarios administrativos del sistema'
});

// Hook para encriptar contraseña antes de crear usuario
User.beforeCreate(async (user) => {
  if (user.password) {
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

// Hook para encriptar contraseña antes de actualizar usuario
User.beforeUpdate(async (user) => {
  if (user.changed('password')) {
    const saltRounds = 12;
    user.password = await bcrypt.hash(user.password, saltRounds);
  }
});

// Método de instancia para verificar contraseña
User.prototype.validatePassword = async function(password) {
  return await bcrypt.compare(password, this.password);
};

// Método de instancia para obtener nombre completo
User.prototype.getFullName = function() {
  return `${this.first_name} ${this.last_name}`;
};

// Método de instancia para verificar si la cuenta está bloqueada
User.prototype.isLocked = function() {
  return this.locked_until && this.locked_until > new Date();
};

// Método de instancia para incrementar intentos de login
User.prototype.incrementLoginAttempts = async function() {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutos en millisegundos
  
  this.login_attempts += 1;
  
  // Si alcanza el máximo de intentos, bloquear la cuenta
  if (this.login_attempts >= maxAttempts) {
    this.locked_until = new Date(Date.now() + lockTime);
  }
  
  await this.save();
};

// Método de instancia para resetear intentos de login
User.prototype.resetLoginAttempts = async function() {
  this.login_attempts = 0;
  this.locked_until = null;
  this.last_login = new Date();
  await this.save();
};

// Método de clase para buscar usuario activo por email
User.findActiveByEmail = function(email) {
  return this.findOne({
    where: {
      email: email,
      is_active: true
    }
  });
};

// Definir asociaciones - CORREGIDAS
User.associate = function(models) {
  // Un usuario puede tener una imagen de perfil
  User.belongsTo(models.Image, {
    foreignKey: 'profile_image_id',
    as: 'profileImage',
    onDelete: 'SET NULL'
  });
  
  // Un usuario puede crear muchas notificaciones
  User.hasMany(models.Notification, {
    foreignKey: 'created_by_user_id',
    as: 'createdNotifications'
  });
  
  // Un usuario puede procesar muchas transferencias bancarias
  User.hasMany(models.BankTransfer, {
    foreignKey: 'verified_by_user_id',
    as: 'verifiedBankTransfers'
  });
  
  // Un usuario puede crear muchas membresías
  User.hasMany(models.ClientMembership, {
    foreignKey: 'created_by_user_id',
    as: 'createdMemberships'
  });
  
  // Un usuario puede procesar muchos pagos
  User.hasMany(models.Payment, {
    foreignKey: 'processed_by_user_id',
    as: 'processedPayments'
  });
  
  // Un usuario puede procesar reembolsos
  User.hasMany(models.Payment, {
    foreignKey: 'refunded_by_user_id',
    as: 'refundedPayments'
  });
  
  // Un usuario puede reconciliar pagos
  User.hasMany(models.Payment, {
    foreignKey: 'reconciled_by_user_id',
    as: 'reconciledPayments'
  });
  
  // Un usuario puede procesar transacciones de puntos
  User.hasMany(models.PointsTransaction, {
    foreignKey: 'processed_by_user_id',
    as: 'processedPointsTransactions'
  });
  
  // Un usuario puede procesar premios ganados
  User.hasMany(models.PrizeWinning, {
    foreignKey: 'processed_by_user_id',
    as: 'processedPrizeWinnings'
  });
  
  // Un usuario puede verificar premios ganados
  User.hasMany(models.PrizeWinning, {
    foreignKey: 'verified_by_user_id',
    as: 'verifiedPrizeWinnings'
  });
  
  // Un usuario puede cancelar premios ganados
  User.hasMany(models.PrizeWinning, {
    foreignKey: 'cancelled_by_user_id',
    as: 'cancelledPrizeWinnings'
  });
  
  // Un usuario puede crear premios
  User.hasMany(models.Prize, {
    foreignKey: 'created_by_user_id',
    as: 'createdPrizes'
  });
  
  // Un usuario puede crear códigos QR
  User.hasMany(models.QRCode, {
    foreignKey: 'created_by_user_id',
    as: 'createdQRCodes'
  });
  
  // Un usuario puede crear ruletas
  User.hasMany(models.Roulette, {
    foreignKey: 'created_by_user_id',
    as: 'createdRoulettes'
  });
  
  // Un usuario puede procesar órdenes
  User.hasMany(models.Order, {
    foreignKey: 'processed_by_user_id',
    as: 'processedOrders'
  });
  
  // Un usuario puede validar check-ins
  User.hasMany(models.ClientCheckin, {
    foreignKey: 'validated_by_user_id',
    as: 'validatedCheckins'
  });
};

module.exports = User;