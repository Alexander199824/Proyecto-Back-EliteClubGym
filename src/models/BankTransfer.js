// Archivo: src/models/BankTransfer.js
//  creo el modelo para transferencias bancarias con verificación manual

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const BankTransfer = sequelize.define('BankTransfer', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la transferencia bancaria'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente que realizó la transferencia'
  },
  payment_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'payments',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del pago relacionado con esta transferencia'
  },
  // Información de la transferencia
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0.01,
        msg: 'El monto debe ser mayor a 0'
      }
    },
    comment: 'Monto de la transferencia'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'GTQ',
    validate: {
      isIn: {
        args: [['GTQ', 'USD']],
        msg: 'La moneda debe ser GTQ o USD'
      }
    },
    comment: 'Moneda de la transferencia'
  },
  reference_number: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Número de referencia de la transferencia bancaria'
  },
  transaction_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Debe ser una fecha válida'
      },
      isNotFuture(value) {
        if (value > new Date().toISOString().split('T')[0]) {
          throw new Error('La fecha de transacción no puede ser futura');
        }
      }
    },
    comment: 'Fecha de la transferencia bancaria'
  },
  transaction_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de la transferencia bancaria'
  },
  // Información del banco emisor (cliente)
  sender_bank_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del banco emisor es requerido'
      }
    },
    comment: 'Nombre del banco desde el cual se realizó la transferencia'
  },
  sender_account_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Número de cuenta del emisor (últimos 4 dígitos por seguridad)'
  },
  sender_account_holder: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre del titular de la cuenta emisora'
  },
  // Información del banco receptor (gimnasio)
  receiver_bank_name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del banco receptor es requerido'
      }
    },
    comment: 'Nombre del banco receptor (del gimnasio)'
  },
  receiver_account_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El número de cuenta receptor es requerido'
      }
    },
    comment: 'Número de cuenta receptora del gimnasio'
  },
  // Comprobante fotográfico
  receipt_image_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'images',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la imagen del comprobante almacenada en la tabla images'
  },
  receipt_upload_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora cuando se subió el comprobante'
  },
  // Estado de verificación
  verification_status: {
    type: DataTypes.ENUM('pending', 'under_review', 'verified', 'rejected', 'requires_clarification'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado de verificación de la transferencia'
  },
  submitted_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha cuando el cliente envió la información'
  },
  reviewed_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se revisó la transferencia'
  },
  verified_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se verificó la transferencia'
  },
  verified_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que verificó la transferencia'
  },
  rejection_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razón del rechazo si la verificación fue negativa'
  },
  verification_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas del proceso de verificación'
  },
  // Información adicional
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción o concepto de la transferencia'
  },
  client_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales del cliente sobre la transferencia'
  },
  // Seguimiento automático
  auto_verification_attempts: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de intentos de verificación automática realizados'
  },
  requires_manual_review: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si requiere revisión manual obligatoria'
  },
  // Información de comunicación con el cliente
  client_notified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se notificó al cliente sobre el estado'
  },
  notification_sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se envió la notificación al cliente'
  },
  // Control de duplicados
  duplicate_check_hash: {
    type: DataTypes.STRING(64),
    allowNull: true,
    comment: 'Hash para detectar transferencias duplicadas'
  }
}, {
  tableName: 'bank_transfers',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['payment_id']
    },
    {
      fields: ['verification_status']
    },
    {
      fields: ['transaction_date']
    },
    {
      fields: ['submitted_date']
    },
    {
      fields: ['verified_by_user_id']
    },
    {
      fields: ['reference_number']
    },
    {
      fields: ['sender_bank_name']
    },
    {
      fields: ['receiver_bank_name']
    },
    {
      fields: ['requires_manual_review']
    },
    {
      fields: ['duplicate_check_hash']
    },
    {
      // Índice compuesto para verificación de duplicados
      fields: ['client_id', 'amount', 'transaction_date', 'reference_number']
    }
  ],
  comment: 'Tabla de transferencias bancarias con verificación manual'
});

// Hook para generar hash de verificación de duplicados
BankTransfer.beforeCreate(async (transfer) => {
  // Generar hash para detección de duplicados
  const crypto = require('crypto');
  const hashString = `${transfer.client_id}-${transfer.amount}-${transfer.transaction_date}-${transfer.reference_number}`;
  transfer.duplicate_check_hash = crypto.createHash('sha256').update(hashString).digest('hex');
});

// Hook para actualizar fechas según el estado
BankTransfer.beforeUpdate(async (transfer) => {
  const now = new Date();
  
  if (transfer.changed('verification_status')) {
    switch (transfer.verification_status) {
      case 'under_review':
        if (!transfer.reviewed_date) {
          transfer.reviewed_date = now;
        }
        break;
      case 'verified':
        if (!transfer.verified_date) {
          transfer.verified_date = now;
        }
        break;
    }
  }
});

// Método de instancia para verificar la transferencia
BankTransfer.prototype.verify = async function(verifiedByUserId, notes = null) {
  if (this.verification_status === 'verified') {
    throw new Error('La transferencia ya está verificada');
  }
  
  this.verification_status = 'verified';
  this.verified_date = new Date();
  this.verified_by_user_id = verifiedByUserId;
  this.verification_notes = notes;
  
  // Marcar el pago relacionado como completado si existe
  if (this.payment_id) {
    const payment = await sequelize.models.Payment.findByPk(this.payment_id);
    if (payment && payment.status === 'pending') {
      await payment.markAsCompleted(verifiedByUserId, 'Transferencia bancaria verificada');
    }
  }
  
  await this.save();
};

// Método de instancia para rechazar la transferencia
BankTransfer.prototype.reject = async function(rejectedByUserId, reason) {
  if (this.verification_status === 'verified') {
    throw new Error('No se puede rechazar una transferencia ya verificada');
  }
  
  this.verification_status = 'rejected';
  this.verified_by_user_id = rejectedByUserId;
  this.rejection_reason = reason;
  this.reviewed_date = new Date();
  
  // Marcar el pago relacionado como fallido si existe
  if (this.payment_id) {
    const payment = await sequelize.models.Payment.findByPk(this.payment_id);
    if (payment) {
      payment.status = 'failed';
      payment.processing_notes = `Transferencia rechazada: ${reason}`;
      await payment.save();
    }
  }
  
  await this.save();
};

// Método de instancia para solicitar clarificación
BankTransfer.prototype.requestClarification = async function(reviewedByUserId, notes) {
  this.verification_status = 'requires_clarification';
  this.verified_by_user_id = reviewedByUserId;
  this.verification_notes = notes;
  this.reviewed_date = new Date();
  
  await this.save();
};

// Método de instancia para marcar como en revisión
BankTransfer.prototype.startReview = async function(reviewedByUserId) {
  this.verification_status = 'under_review';
  this.verified_by_user_id = reviewedByUserId;
  this.reviewed_date = new Date();
  
  await this.save();
};

// Método de instancia para verificar si puede ser modificada
BankTransfer.prototype.canBeModified = function() {
  return ['pending', 'requires_clarification'].includes(this.verification_status);
};

// Método de instancia para obtener días pendientes de verificación
BankTransfer.prototype.getDaysPending = function() {
  const submissionDate = new Date(this.submitted_date);
  const now = new Date();
  const diffTime = now - submissionDate;
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
};

// Método de clase para buscar transferencias pendientes de verificación
BankTransfer.findPendingVerification = function() {
  return this.findAll({
    where: {
      verification_status: ['pending', 'under_review']
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.Image,
        as: 'receiptImage'
      }
    ],
    order: [['submitted_date', 'ASC']]
  });
};

// Método de clase para detectar posibles duplicados
BankTransfer.findPossibleDuplicates = async function(clientId, amount, transactionDate, referenceNumber) {
  const crypto = require('crypto');
  const hashString = `${clientId}-${amount}-${transactionDate}-${referenceNumber}`;
  const hash = crypto.createHash('sha256').update(hashString).digest('hex');
  
  return await this.findAll({
    where: {
      duplicate_check_hash: hash,
      verification_status: {
        [sequelize.Sequelize.Op.ne]: 'rejected'
      }
    }
  });
};

// Método de clase para reportes de verificación
BankTransfer.getVerificationReport = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      submitted_date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'verification_status',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
      [sequelize.fn('AVG', 
        sequelize.literal('EXTRACT(EPOCH FROM (verified_date - submitted_date))/86400')
      ), 'avg_verification_days']
    ],
    group: ['verification_status'],
    raw: true
  });
};

// Definir asociaciones
BankTransfer.associate = function(models) {
  // Una transferencia pertenece a un cliente
  BankTransfer.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client',
    onDelete: 'CASCADE'
  });
  
  // Una transferencia puede estar relacionada con un pago
  BankTransfer.belongsTo(models.Payment, {
    foreignKey: 'payment_id',
    as: 'payment',
    onDelete: 'SET NULL'
  });
  
  // Una transferencia tiene una imagen de comprobante
  BankTransfer.belongsTo(models.Image, {
    foreignKey: 'receipt_image_id',
    as: 'receiptImage',
    onDelete: 'SET NULL'
  });
  
  // Una transferencia fue verificada por un usuario
  BankTransfer.belongsTo(models.User, {
    foreignKey: 'verified_by_user_id',
    as: 'verifiedBy'
  });
  
  // Una transferencia puede tener pagos relacionados
  BankTransfer.hasMany(models.Payment, {
    foreignKey: 'bank_transfer_id',
    as: 'relatedPayments'
  });
};

module.exports = BankTransfer;