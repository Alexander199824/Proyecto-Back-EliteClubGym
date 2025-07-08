// Archivo: src/models/Payment.js
// creo el modelo para registrar todos los pagos del sistema

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Payment = sequelize.define('Payment', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del pago'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente que realizó el pago'
  },
  membership_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'client_memberships',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la membresía si el pago es por membresía'
  },
  membership_type_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'membership_types',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del tipo de membresía pagada'
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la orden si el pago es por productos'
  },
  payment_type: {
    type: DataTypes.ENUM('membership', 'product', 'service', 'penalty', 'other'),
    allowNull: false,
    comment: 'Tipo de pago: membership=Membresía, product=Productos, service=Servicios, penalty=Multa, other=Otro'
  },
  payment_method: {
    type: DataTypes.ENUM('stripe', 'bank_transfer', 'cash', 'other'),
    allowNull: false,
    comment: 'Método de pago utilizado'
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0,
        msg: 'El monto no puede ser negativo'
      }
    },
    comment: 'Monto del pago'
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
    comment: 'Moneda del pago'
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed', 'cancelled', 'refunded'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado del pago'
  },
  // Información específica de Stripe
  stripe_payment_intent_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'ID del Payment Intent de Stripe'
  },
  stripe_charge_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    unique: true,
    comment: 'ID del Charge de Stripe'
  },
  stripe_customer_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'ID del cliente en Stripe'
  },
  // Información de transferencia bancaria
  bank_transfer_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'bank_transfers',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la transferencia bancaria si aplica'
  },
  // Información del pago
  payment_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha y hora del pago'
  },
  due_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de vencimiento del pago'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del pago'
  },
  reference_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    unique: true,
    comment: 'Número de referencia único del pago'
  },
  // Información de procesamiento
  processed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que procesó el pago (para pagos manuales)'
  },
  processing_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas del procesamiento del pago'
  },
  // Información de reembolso
  refund_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Monto reembolsado si aplica'
  },
  refund_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razón del reembolso'
  },
  refund_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del reembolso'
  },
  refunded_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que procesó el reembolso'
  },
  // Información adicional
  receipt_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se envió el recibo al cliente'
  },
  receipt_sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se envió el recibo'
  },
  invoice_number: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    comment: 'Número de factura/recibo generado'
  },
  // Metadatos
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información adicional del pago en formato JSON'
  },
  // Información de reconciliación
  reconciled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el pago fue reconciliado contablemente'
  },
  reconciled_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de reconciliación contable'
  },
  reconciled_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que reconcilió el pago'
  }
}, {
  tableName: 'payments',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['membership_id']
    },
    {
      fields: ['order_id']
    },
    {
      fields: ['payment_type']
    },
    {
      fields: ['payment_method']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_date']
    },
    {
      fields: ['due_date']
    },
    {
      unique: true,
      fields: ['reference_number'],
      where: {
        reference_number: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['stripe_payment_intent_id'],
      where: {
        stripe_payment_intent_id: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      unique: true,
      fields: ['invoice_number'],
      where: {
        invoice_number: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['reconciled']
    },
    {
      // Índice compuesto para reportes financieros
      fields: ['payment_date', 'status', 'payment_method']
    }
  ],
  comment: 'Tabla de pagos realizados por clientes'
});

// Hook para generar número de referencia automáticamente
Payment.beforeCreate(async (payment) => {
  if (!payment.reference_number) {
    const timestamp = Date.now().toString();
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    payment.reference_number = `PAY-${timestamp}-${randomSuffix}`;
  }
  
  // Generar número de factura automáticamente
  if (!payment.invoice_number) {
    const date = new Date();
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString().slice(-4);
    payment.invoice_number = `INV-${year}${month}${day}-${random}`;
  }
});

// Método de instancia para marcar como completado
Payment.prototype.markAsCompleted = async function(processedByUserId = null, notes = null) {
  this.status = 'completed';
  this.processing_notes = notes;
  this.processed_by_user_id = processedByUserId;
  
  // Actualizar la membresía o orden relacionada
  if (this.membership_id) {
    const membership = await sequelize.models.ClientMembership.findByPk(this.membership_id);
    if (membership) {
      membership.amount_paid += parseFloat(this.amount);
      if (membership.amount_paid >= membership.amount_due) {
        membership.payment_status = 'paid';
        membership.status = 'active';
      }
      await membership.save();
    }
  }
  
  if (this.order_id) {
    const order = await sequelize.models.Order.findByPk(this.order_id);
    if (order) {
      order.payment_status = 'paid';
      if (order.status === 'pending_payment') {
        order.status = 'confirmed';
      }
      await order.save();
    }
  }
  
  await this.save();
};

// Método de instancia para procesar reembolso
Payment.prototype.processRefund = async function(refundAmount, reason, refundedByUserId) {
  if (this.status !== 'completed') {
    throw new Error('Solo se pueden reembolsar pagos completados');
  }
  
  if (refundAmount > (parseFloat(this.amount) - parseFloat(this.refund_amount))) {
    throw new Error('El monto del reembolso excede el monto disponible');
  }
  
  this.refund_amount = parseFloat(this.refund_amount) + parseFloat(refundAmount);
  this.refund_reason = reason;
  this.refund_date = new Date();
  this.refunded_by_user_id = refundedByUserId;
  
  // Si se reembolsa el monto completo, marcar como reembolsado
  if (parseFloat(this.refund_amount) >= parseFloat(this.amount)) {
    this.status = 'refunded';
  }
  
  await this.save();
};

// Método de instancia para verificar si está vencido
Payment.prototype.isOverdue = function() {
  if (!this.due_date || this.status === 'completed') return false;
  const today = new Date().toISOString().split('T')[0];
  return this.due_date < today;
};

// Método de instancia para obtener monto disponible para reembolso
Payment.prototype.getRefundableAmount = function() {
  return parseFloat(this.amount) - parseFloat(this.refund_amount);
};

// Método de clase para obtener pagos pendientes
Payment.findPending = function() {
  return this.findAll({
    where: {
      status: 'pending'
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      }
    ],
    order: [['due_date', 'ASC']]
  });
};

// Método de clase para reportes financieros por período
Payment.getFinancialReport = async function(startDate, endDate, paymentMethod = null) {
  const whereClause = {
    payment_date: {
      [sequelize.Sequelize.Op.between]: [startDate, endDate]
    },
    status: 'completed'
  };
  
  if (paymentMethod) {
    whereClause.payment_method = paymentMethod;
  }
  
  const payments = await this.findAll({
    where: whereClause,
    attributes: [
      'payment_method',
      'payment_type',
      [sequelize.fn('SUM', sequelize.col('amount')), 'total_amount'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_count']
    ],
    group: ['payment_method', 'payment_type'],
    raw: true
  });
  
  return payments;
};

// Definir asociaciones
Payment.associate = function(models) {
  // Un pago pertenece a un cliente
  Payment.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client',
    onDelete: 'CASCADE'
  });
  
  // Un pago puede estar relacionado con una membresía
  Payment.belongsTo(models.ClientMembership, {
    foreignKey: 'membership_id',
    as: 'membership',
    onDelete: 'SET NULL'
  });
  
  // Un pago puede estar relacionado con un tipo de membresía
  Payment.belongsTo(models.MembershipType, {
    foreignKey: 'membership_type_id',
    as: 'membershipType',
    onDelete: 'SET NULL'
  });
  
  // Un pago puede estar relacionado con una orden
  Payment.belongsTo(models.Order, {
    foreignKey: 'order_id',
    as: 'order',
    onDelete: 'SET NULL'
  });
  
  // Un pago puede tener una transferencia bancaria asociada
  Payment.belongsTo(models.BankTransfer, {
    foreignKey: 'bank_transfer_id',
    as: 'bankTransfer',
    onDelete: 'SET NULL'
  });
  
  // Un pago fue procesado por un usuario
  Payment.belongsTo(models.User, {
    foreignKey: 'processed_by_user_id',
    as: 'processedBy'
  });
  
  // Un pago fue reembolsado por un usuario
  Payment.belongsTo(models.User, {
    foreignKey: 'refunded_by_user_id',
    as: 'refundedBy'
  });
  
  // Un pago fue reconciliado por un usuario
  Payment.belongsTo(models.User, {
    foreignKey: 'reconciled_by_user_id',
    as: 'reconciledBy'
  });
};

module.exports = Payment;