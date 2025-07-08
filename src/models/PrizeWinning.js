// Archivo: src/models/PrizeWinning.js
// CORREGIDO: Modelo para registrar premios ganados por los clientes

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PrizeWinning = sequelize.define('PrizeWinning', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del premio ganado'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente que ganó el premio'
  },
  prize_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'prizes',
      key: 'id'
    },
    onDelete: 'RESTRICT',
    comment: 'ID del premio ganado'
  },
  roulette_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'roulettes',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la ruleta donde se ganó el premio'
  },
  qr_code_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'qr_codes',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del código QR que activó el premio'
  },
  // Información del premio al momento de ganarlo
  prize_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nombre del premio al momento de ganarlo (para histórico)'
  },
  prize_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción del premio al momento de ganarlo'
  },
  prize_type: {
    type: DataTypes.ENUM(
      'membership_days', 'discount_percentage', 'discount_amount', 
      'free_product', 'points', 'cash', 'service', 'other'
    ),
    allowNull: false,
    comment: 'Tipo de premio ganado'
  },
  prize_value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    comment: 'Valor del premio ganado'
  },
  prize_currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    comment: 'Unidad del valor del premio'
  },
  // Estado del premio ganado
  status: {
    type: DataTypes.ENUM('pending', 'applied', 'redeemed', 'expired', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado del premio: pending=Pendiente, applied=Aplicado automáticamente, redeemed=Canjeado, expired=Expirado, cancelled=Cancelado'
  },
  // Fechas importantes
  won_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha y hora cuando se ganó el premio'
  },
  applied_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se aplicó automáticamente el premio'
  },
  redeemed_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se canjeó manualmente el premio'
  },
  expires_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración del premio'
  },
  // Información de aplicación/canje
  auto_applied: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se aplicó automáticamente'
  },
  manual_redemption_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si requiere canje manual'
  },
  redemption_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    // CORREGIDO: Removido unique: true de aquí
    comment: 'Código único para canjear el premio manualmente'
  },
  // Información de aplicación específica
  applied_to_membership_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'client_memberships',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la membresía donde se aplicó (para días gratis)'
  },
  applied_to_order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la orden donde se aplicó (para descuentos)'
  },
  discount_applied_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Monto real de descuento aplicado'
  },
  // Información de procesamiento
  processed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que procesó el premio (si fue manual)'
  },
  processing_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas del procesamiento del premio'
  },
  // Información del dispositivo/ubicación donde se ganó
  device_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información del dispositivo donde se ganó el premio'
  },
  location_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información de ubicación donde se ganó el premio'
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true,
    comment: 'Dirección IP desde donde se ganó el premio'
  },
  // Configuración de notificaciones
  notification_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se envió notificación al cliente'
  },
  notification_sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se envió la notificación'
  },
  // Información de validación/verificación
  requires_verification: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si requiere verificación manual antes de aplicar'
  },
  verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si fue verificado manualmente'
  },
  verified_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que verificó el premio'
  },
  verified_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de verificación del premio'
  },
  // Metadatos adicionales
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos adicionales del premio ganado'
  },
  // Información de cancelación
  cancelled_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razón de cancelación del premio'
  },
  cancelled_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que canceló el premio'
  },
  cancelled_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de cancelación del premio'
  }
}, {
  tableName: 'prize_winnings',
  timestamps: true,
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['prize_id']
    },
    {
      fields: ['roulette_id']
    },
    {
      fields: ['qr_code_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['won_date']
    },
    {
      fields: ['expires_date']
    },
    {
      fields: ['auto_applied']
    },
    {
      fields: ['manual_redemption_required']
    },
    // CORREGIDO: Movido unique constraint a indexes
    {
      unique: true,
      fields: ['redemption_code'],
      where: {
        redemption_code: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['requires_verification', 'verified']
    },
    {
      // Índice compuesto para premios pendientes por cliente
      fields: ['client_id', 'status', 'expires_date']
    }
  ],
  comment: 'Tabla de premios ganados por los clientes'
});

// Hook para generar código de canje y calcular expiración
PrizeWinning.beforeCreate(async (prizeWinning) => {
  // Generar código de canje si se requiere canje manual
  if (prizeWinning.manual_redemption_required && !prizeWinning.redemption_code) {
    prizeWinning.redemption_code = await PrizeWinning.generateRedemptionCode();
  }
  
  // Calcular fecha de expiración basándose en el premio
  if (!prizeWinning.expires_date && sequelize.models.Prize) {
    const prize = await sequelize.models.Prize.findByPk(prizeWinning.prize_id);
    
    if (prize && prize.expiration_days) {
      const expirationDate = new Date();
      expirationDate.setDate(expirationDate.getDate() + prize.expiration_days);
      prizeWinning.expires_date = expirationDate;
    }
  }
});

// Hook para actualizar fechas según cambios de estado
PrizeWinning.beforeUpdate(async (prizeWinning) => {
  const now = new Date();
  
  if (prizeWinning.changed('status')) {
    switch (prizeWinning.status) {
      case 'applied':
        if (!prizeWinning.applied_date) {
          prizeWinning.applied_date = now;
        }
        break;
      case 'redeemed':
        if (!prizeWinning.redeemed_date) {
          prizeWinning.redeemed_date = now;
        }
        break;
      case 'cancelled':
        if (!prizeWinning.cancelled_date) {
          prizeWinning.cancelled_date = now;
        }
        break;
    }
  }
  
  if (prizeWinning.changed('verified') && prizeWinning.verified && !prizeWinning.verified_date) {
    prizeWinning.verified_date = now;
  }
});

// Hook para actualizar estadísticas del premio después de crear
PrizeWinning.afterCreate(async (prizeWinning) => {
  if (sequelize.models.Prize) {
    const prize = await sequelize.models.Prize.findByPk(prizeWinning.prize_id);
    if (prize) {
      await prize.incrementAwarded();
    }
  }
  
  // Actualizar estadísticas de la ruleta si aplica
  if (prizeWinning.roulette_id && sequelize.models.Roulette) {
    const roulette = await sequelize.models.Roulette.findByPk(prizeWinning.roulette_id);
    if (roulette) {
      await roulette.recordSpin(prizeWinning.id);
    }
  }
});

// Método de clase para generar código de canje único
PrizeWinning.generateRedemptionCode = async function() {
  let code;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    // Generar código alfanumérico de 8 caracteres
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin O, 0, I, 1 para evitar confusión
    code = '';
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    const existing = await this.findOne({ where: { redemption_code: code } });
    if (!existing) break;
    
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('No se pudo generar un código de canje único');
  }
  
  return code;
};

// Método de instancia para verificar si está expirado
PrizeWinning.prototype.isExpired = function() {
  if (!this.expires_date) return false;
  return new Date() > this.expires_date;
};

// Método de instancia para verificar si puede ser aplicado
PrizeWinning.prototype.canBeApplied = function() {
  if (this.status !== 'pending') return { canApply: false, reason: `Premio ya ${this.status}` };
  if (this.isExpired()) return { canApply: false, reason: 'Premio expirado' };
  if (this.requires_verification && !this.verified) return { canApply: false, reason: 'Requiere verificación' };
  
  return { canApply: true };
};

// Método de instancia para aplicar premio automáticamente
PrizeWinning.prototype.apply = async function(processedByUserId = null) {
  const validation = this.canBeApplied();
  if (!validation.canApply) {
    throw new Error(validation.reason);
  }
  
  if (sequelize.models.Prize) {
    const prize = await sequelize.models.Prize.findByPk(this.prize_id);
    
    if (!prize) {
      throw new Error('Premio no encontrado');
    }
    
    // Aplicar el premio según su tipo
    const result = await prize.applyToClient(this.client_id);
    
    if (result.applied) {
      this.status = 'applied';
      this.auto_applied = true;
      this.applied_date = new Date();
      this.processed_by_user_id = processedByUserId;
      
      await this.save();
      
      // Actualizar estadísticas del premio
      await prize.incrementRedeemed();
      
      // Enviar notificación si no se ha enviado
      if (!this.notification_sent) {
        await this.sendNotification();
      }
    }
    
    return result;
  }
  
  throw new Error('No se pudo aplicar el premio');
};

// Método de instancia para canjear manualmente
PrizeWinning.prototype.redeem = async function(processedByUserId, notes = null) {
  if (this.status !== 'pending') {
    throw new Error(`No se puede canjear un premio ${this.status}`);
  }
  
  if (this.isExpired()) {
    throw new Error('El premio ha expirado');
  }
  
  this.status = 'redeemed';
  this.redeemed_date = new Date();
  this.processed_by_user_id = processedByUserId;
  this.processing_notes = notes;
  
  await this.save();
  
  // Actualizar estadísticas del premio
  if (sequelize.models.Prize) {
    const prize = await sequelize.models.Prize.findByPk(this.prize_id);
    if (prize) {
      await prize.incrementRedeemed();
    }
  }
  
  // Enviar notificación de canje
  await this.sendNotification('redeemed');
};

// Método de instancia para verificar premio
PrizeWinning.prototype.verify = async function(verifiedByUserId) {
  this.verified = true;
  this.verified_by_user_id = verifiedByUserId;
  this.verified_date = new Date();
  
  await this.save();
  
  // Si el premio se aplica automáticamente después de verificar, hacerlo
  if (sequelize.models.Prize) {
    const prize = await sequelize.models.Prize.findByPk(this.prize_id);
    
    if (prize && prize.auto_apply) {
      await this.apply(verifiedByUserId);
    }
  }
};

// Método de instancia para cancelar premio
PrizeWinning.prototype.cancel = async function(cancelledByUserId, reason) {
  if (['applied', 'redeemed'].includes(this.status)) {
    throw new Error('No se puede cancelar un premio ya aplicado o canjeado');
  }
  
  this.status = 'cancelled';
  this.cancelled_date = new Date();
  this.cancelled_by_user_id = cancelledByUserId;
  this.cancelled_reason = reason;
  
  await this.save();
  
  // Enviar notificación de cancelación
  await this.sendNotification('cancelled');
};

// Método de instancia para enviar notificación
PrizeWinning.prototype.sendNotification = async function(type = 'won') {
  if (!sequelize.models.Notification) return;
  
  const messages = {
    'won': `¡Felicidades! Has ganado: ${this.prize_name}`,
    'applied': `Tu premio "${this.prize_name}" ha sido aplicado automáticamente`,
    'redeemed': `Tu premio "${this.prize_name}" ha sido canjeado exitosamente`,
    'cancelled': `Tu premio "${this.prize_name}" ha sido cancelado`,
    'expired': `Tu premio "${this.prize_name}" ha expirado`
  };
  
  await sequelize.models.Notification.create({
    client_id: this.client_id,
    title: 'Premio Ganado',
    message: messages[type] || messages['won'],
    type: 'prize',
    related_id: this.id,
    priority: 'high'
  });
  
  this.notification_sent = true;
  this.notification_sent_date = new Date();
  await this.save();
};

// Método de instancia para obtener días hasta expiración
PrizeWinning.prototype.getDaysUntilExpiration = function() {
  if (!this.expires_date) return null;
  
  const now = new Date();
  const expiration = new Date(this.expires_date);
  const diffTime = expiration - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return Math.max(0, diffDays);
};

// Método de clase para buscar premios pendientes de un cliente
PrizeWinning.findPendingByClient = function(clientId) {
  return this.findAll({
    where: {
      client_id: clientId,
      status: 'pending',
      [sequelize.Sequelize.Op.or]: [
        { expires_date: null },
        { expires_date: { [sequelize.Sequelize.Op.gt]: new Date() } }
      ]
    },
    include: [
      {
        model: sequelize.models.Prize,
        as: 'prize',
        required: false
      }
    ],
    order: [['won_date', 'DESC']]
  });
};

// Método de clase para buscar premios que expiran pronto
PrizeWinning.findExpiringPrizes = function(daysAhead = 3) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.findAll({
    where: {
      status: 'pending',
      expires_date: {
        [sequelize.Sequelize.Op.between]: [new Date(), futureDate]
      }
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client',
        required: false
      },
      {
        model: sequelize.models.Prize,
        as: 'prize',
        required: false
      }
    ]
  });
};

// Método de clase para buscar por código de canje
PrizeWinning.findByRedemptionCode = function(code) {
  return this.findOne({
    where: {
      redemption_code: code,
      status: 'pending'
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client',
        required: false
      },
      {
        model: sequelize.models.Prize,
        as: 'prize',
        required: false
      }
    ]
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
PrizeWinning.associate = function(models) {
  // Un premio ganado pertenece a un cliente
  if (models.Client) {
    PrizeWinning.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'CASCADE'
    });
  }
  
  // Un premio ganado corresponde a un premio
  if (models.Prize) {
    PrizeWinning.belongsTo(models.Prize, {
      foreignKey: 'prize_id',
      as: 'prize',
      onDelete: 'RESTRICT'
    });
  }
  
  // Un premio ganado puede venir de una ruleta
  if (models.Roulette) {
    PrizeWinning.belongsTo(models.Roulette, {
      foreignKey: 'roulette_id',
      as: 'roulette',
      onDelete: 'SET NULL'
    });
  }
  
  // Un premio ganado puede venir de un código QR
  if (models.QRCode) {
    PrizeWinning.belongsTo(models.QRCode, {
      foreignKey: 'qr_code_id',
      as: 'qrCode',
      onDelete: 'SET NULL'
    });
  }
  
  // Un premio ganado puede aplicarse a una membresía
  if (models.ClientMembership) {
    PrizeWinning.belongsTo(models.ClientMembership, {
      foreignKey: 'applied_to_membership_id',
      as: 'appliedToMembership',
      onDelete: 'SET NULL'
    });
  }
  
  // Un premio ganado puede aplicarse a una orden
  if (models.Order) {
    PrizeWinning.belongsTo(models.Order, {
      foreignKey: 'applied_to_order_id',
      as: 'appliedToOrder',
      onDelete: 'SET NULL'
    });
  }
  
  // Un premio ganado fue procesado por un usuario
  if (models.User) {
    PrizeWinning.belongsTo(models.User, {
      foreignKey: 'processed_by_user_id',
      as: 'processedBy'
    });
  }
  
  // Un premio ganado fue verificado por un usuario
  if (models.User) {
    PrizeWinning.belongsTo(models.User, {
      foreignKey: 'verified_by_user_id',
      as: 'verifiedBy'
    });
  }
  
  // Un premio ganado fue cancelado por un usuario
  if (models.User) {
    PrizeWinning.belongsTo(models.User, {
      foreignKey: 'cancelled_by_user_id',
      as: 'cancelledBy'
    });
  }
};

module.exports = PrizeWinning;