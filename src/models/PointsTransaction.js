// Archivo: src/models/PointsTransaction.js
// creo el modelo para registrar todas las transacciones de puntos por asistencia

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const PointsTransaction = sequelize.define('PointsTransaction', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la transacción de puntos'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente propietario de los puntos'
  },
  transaction_type: {
    type: DataTypes.ENUM('earned', 'bonus', 'adjustment', 'deduction', 'reset'),
    allowNull: false,
    comment: 'Tipo de transacción: earned=Ganados, bonus=Bonus, adjustment=Ajuste, deduction=Deducción, reset=Reinicio'
  },
  points_earned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Puntos ganados en esta transacción (positivo)'
  },
  points_deducted: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Puntos deducidos en esta transacción (positivo)'
  },
  points_change: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Cambio neto de puntos (positivo o negativo)'
  },
  balance_before: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Balance de puntos antes de la transacción'
  },
  balance_after: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Balance de puntos después de la transacción'
  },
  // Origen de los puntos
  source_type: {
    type: DataTypes.ENUM('checkin', 'manual', 'system', 'bonus', 'correction'),
    allowNull: false,
    comment: 'Fuente de la transacción: checkin=Check-in, manual=Manual por admin, system=Automático, bonus=Bonus especial, correction=Corrección'
  },
  source_reference_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID de referencia del origen (ej: ID del check-in)'
  },
  // Información del check-in relacionado
  checkin_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'client_checkins',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del check-in que generó estos puntos'
  },
  checkin_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha del check-in relacionado'
  },
  // Detalles de cálculo de puntos
  base_points: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Puntos base antes de aplicar multiplicadores'
  },
  consecutive_days_bonus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Bonus por días consecutivos'
  },
  time_bonus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Bonus por horario de entrenamiento'
  },
  special_bonus: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Bonus especial aplicado'
  },
  multiplier_applied: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.00,
    comment: 'Multiplicador aplicado para calcular puntos finales'
  },
  // Información descriptiva
  reason: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Razón o descripción de la transacción'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción adicional de la transacción'
  },
  // Información de procesamiento
  processed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que procesó la transacción (para transacciones manuales)'
  },
  is_manual: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la transacción fue creada manualmente'
  },
  // Información de reversión
  is_reversed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si esta transacción fue reversada'
  },
  reversed_by_transaction_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'points_transactions',
      key: 'id'
    },
    comment: 'ID de la transacción que reversó esta'
  },
  reversal_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razón de la reversión'
  },
  // Metadatos de la transacción
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos adicionales de la transacción'
  },
  // Información de auditoría
  ip_address: {
    type: DataTypes.INET,
    allowNull: true,
    comment: 'Dirección IP desde donde se originó la transacción'
  },
  user_agent: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'User agent del dispositivo/navegador'
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
  }
}, {
  tableName: 'points_transactions',
  timestamps: true,
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['transaction_type']
    },
    {
      fields: ['source_type']
    },
    {
      fields: ['checkin_id']
    },
    {
      fields: ['checkin_date']
    },
    {
      fields: ['processed_by_user_id']
    },
    {
      fields: ['is_manual']
    },
    {
      fields: ['is_reversed']
    },
    {
      fields: ['created_at']
    },
    {
      // Índice compuesto para consultas de balance por cliente
      fields: ['client_id', 'created_at']
    },
    {
      // Índice para transacciones por fecha
      fields: ['checkin_date', 'source_type']
    },
    {
      // Índice para auditoría
      fields: ['processed_by_user_id', 'created_at']
    }
  ],
  comment: 'Tabla de transacciones de puntos por asistencia (solo para tracking)'
});

// Hook para calcular el cambio neto antes de crear
PointsTransaction.beforeCreate(async (transaction) => {
  // Calcular cambio neto
  transaction.points_change = transaction.points_earned - transaction.points_deducted;
  
  // Calcular balance después
  transaction.balance_after = transaction.balance_before + transaction.points_change;
  
  // Asegurar que el balance nunca sea negativo
  if (transaction.balance_after < 0) {
    transaction.balance_after = 0;
    transaction.points_change = -transaction.balance_before;
    transaction.points_deducted = transaction.balance_before;
  }
});

// Método de instancia para verificar si puede ser reversada
PointsTransaction.prototype.canBeReversed = function() {
  if (this.is_reversed) return { canReverse: false, reason: 'Transacción ya reversada' };
  if (this.transaction_type === 'reset') return { canReverse: false, reason: 'No se pueden reversar reiniclos' };
  
  // No permitir reversar transacciones muy antiguas (más de 30 días)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  if (this.created_at < thirtyDaysAgo) {
    return { canReverse: false, reason: 'Transacción muy antigua para reversar' };
  }
  
  return { canReverse: true };
};

// Método de instancia para reversar la transacción
PointsTransaction.prototype.reverse = async function(reversedByUserId, reason) {
  const validation = this.canBeReversed();
  if (!validation.canReverse) {
    throw new Error(validation.reason);
  }
  
  // Obtener balance actual del cliente
  const Client = sequelize.models.Client;
  const client = await Client.findByPk(this.client_id);
  
  if (!client) {
    throw new Error('Cliente no encontrado');
  }
  
  // Crear transacción de reversión
  const reversalTransaction = await PointsTransaction.create({
    client_id: this.client_id,
    transaction_type: 'adjustment',
    source_type: 'correction',
    points_earned: this.points_deducted, // Invertir la transacción original
    points_deducted: this.points_earned,
    balance_before: client.total_points,
    reason: `Reversión: ${reason}`,
    description: `Reversión de transacción ${this.id}`,
    processed_by_user_id: reversedByUserId,
    is_manual: true,
    source_reference_id: this.id
  });
  
  // Marcar esta transacción como reversada
  this.is_reversed = true;
  this.reversed_by_transaction_id = reversalTransaction.id;
  this.reversal_reason = reason;
  await this.save();
  
  // Actualizar balance del cliente
  await client.update({ total_points: reversalTransaction.balance_after });
  
  return reversalTransaction;
};

// Método de instancia para enviar notificación
PointsTransaction.prototype.sendNotification = async function() {
  if (this.notification_sent || this.points_change <= 0) return;
  
  const Notification = sequelize.models.Notification;
  if (!Notification) return;
  
  let message = '';
  
  switch (this.source_type) {
    case 'checkin':
      message = `¡Ganaste ${this.points_change} puntos por tu check-in! `;
      if (this.consecutive_days_bonus > 0) {
        message += `Incluye ${this.consecutive_days_bonus} puntos bonus por días consecutivos. `;
      }
      if (this.time_bonus > 0) {
        message += `Incluye ${this.time_bonus} puntos bonus por horario. `;
      }
      break;
    case 'bonus':
      message = `¡Recibiste ${this.points_change} puntos bonus! ${this.reason}`;
      break;
    case 'manual':
      message = `Se ajustaron tus puntos: ${this.points_change > 0 ? '+' : ''}${this.points_change} puntos. ${this.reason}`;
      break;
    default:
      message = `Puntos actualizados: ${this.points_change > 0 ? '+' : ''}${this.points_change}. ${this.reason}`;
  }
  
  await Notification.create({
    client_id: this.client_id,
    title: 'Puntos Actualizados',
    message: message,
    type: 'points',
    related_id: this.id,
    priority: 'low'
  });
  
  this.notification_sent = true;
  this.notification_sent_date = new Date();
  await this.save();
};

// Método de clase para crear transacción por check-in
PointsTransaction.createFromCheckin = async function(checkinData) {
  const { client_id, checkin_id, points_earned, base_points, consecutive_days_bonus, time_bonus, multiplier_applied, checkin_date } = checkinData;
  
  // Obtener balance actual del cliente
  const Client = sequelize.models.Client;
  const client = await Client.findByPk(client_id);
  
  if (!client) {
    throw new Error('Cliente no encontrado');
  }
  
  const transaction = await this.create({
    client_id,
    checkin_id,
    transaction_type: 'earned',
    source_type: 'checkin',
    points_earned,
    points_deducted: 0,
    balance_before: client.total_points,
    base_points,
    consecutive_days_bonus,
    time_bonus,
    multiplier_applied,
    checkin_date,
    reason: 'Puntos ganados por check-in en el gimnasio',
    source_reference_id: checkin_id
  });
  
  // Enviar notificación
  await transaction.sendNotification();
  
  return transaction;
};

// Método de clase para crear ajuste manual
PointsTransaction.createManualAdjustment = async function(clientId, pointsChange, reason, processedByUserId, description = null) {
  // Obtener balance actual del cliente
  const Client = sequelize.models.Client;
  const client = await Client.findByPk(clientId);
  
  if (!client) {
    throw new Error('Cliente no encontrado');
  }
  
  const transaction = await this.create({
    client_id: clientId,
    transaction_type: 'adjustment',
    source_type: 'manual',
    points_earned: pointsChange > 0 ? pointsChange : 0,
    points_deducted: pointsChange < 0 ? Math.abs(pointsChange) : 0,
    balance_before: client.total_points,
    reason,
    description,
    processed_by_user_id: processedByUserId,
    is_manual: true
  });
  
  // Actualizar balance del cliente
  await client.update({ total_points: transaction.balance_after });
  
  // Enviar notificación
  await transaction.sendNotification();
  
  return transaction;
};

// Método de clase para obtener balance histórico de un cliente
PointsTransaction.getClientBalanceHistory = function(clientId, startDate = null, endDate = null) {
  const whereClause = { client_id: clientId };
  
  if (startDate || endDate) {
    whereClause.created_at = {};
    if (startDate) whereClause.created_at[sequelize.Sequelize.Op.gte] = startDate;
    if (endDate) whereClause.created_at[sequelize.Sequelize.Op.lte] = endDate;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['created_at', 'ASC']],
    include: [
      {
        model: sequelize.models.ClientCheckin,
        as: 'checkin',
        required: false
      },
      {
        model: sequelize.models.User,
        as: 'processedBy',
        required: false,
        attributes: ['id', 'first_name', 'last_name']
      }
    ]
  });
};

// Método de clase para estadísticas de puntos por período
PointsTransaction.getPointsStatsByPeriod = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      },
      is_reversed: false
    },
    attributes: [
      [sequelize.fn('DATE', sequelize.col('created_at')), 'date'],
      'source_type',
      [sequelize.fn('SUM', sequelize.col('points_earned')), 'total_points_earned'],
      [sequelize.fn('SUM', sequelize.col('points_deducted')), 'total_points_deducted'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'transaction_count'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('client_id'))), 'unique_clients']
    ],
    group: [sequelize.fn('DATE', sequelize.col('created_at')), 'source_type'],
    order: [[sequelize.fn('DATE', sequelize.col('created_at')), 'ASC']],
    raw: true
  });
};

// Método de clase para obtener top clientes por puntos ganados
PointsTransaction.getTopClientsByPoints = function(period = 30, limit = 10) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - period);
  
  return this.findAll({
    where: {
      created_at: {
        [sequelize.Sequelize.Op.gte]: startDate
      },
      is_reversed: false
    },
    attributes: [
      'client_id',
      [sequelize.fn('SUM', sequelize.col('points_earned')), 'total_points'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'transaction_count']
    ],
    include: [
      {
        model: sequelize.models.Client,
        as: 'client',
        attributes: ['id', 'first_name', 'last_name', 'email']
      }
    ],
    group: ['client_id', 'client.id'],
    order: [[sequelize.fn('SUM', sequelize.col('points_earned')), 'DESC']],
    limit
  });
};

// Definir asociaciones
PointsTransaction.associate = function(models) {
  // Una transacción de puntos pertenece a un cliente
  PointsTransaction.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client',
    onDelete: 'CASCADE'
  });
  
  // Una transacción puede estar relacionada con un check-in
  PointsTransaction.belongsTo(models.ClientCheckin, {
    foreignKey: 'checkin_id',
    as: 'checkin',
    onDelete: 'SET NULL'
  });
  
  // Una transacción puede ser procesada por un usuario
  PointsTransaction.belongsTo(models.User, {
    foreignKey: 'processed_by_user_id',
    as: 'processedBy'
  });
  
  // Relación auto-referencial para reversiones
  PointsTransaction.belongsTo(PointsTransaction, {
    foreignKey: 'reversed_by_transaction_id',
    as: 'reversedByTransaction'
  });
  
  PointsTransaction.hasOne(PointsTransaction, {
    foreignKey: 'reversed_by_transaction_id',
    as: 'reversalTransaction'
  });
};

module.exports = PointsTransaction;