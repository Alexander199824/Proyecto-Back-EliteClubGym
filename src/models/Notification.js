// Archivo: src/models/Notification.js
// creo el modelo para gestionar todas las notificaciones del sistema

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la notificación'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente destinatario'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El título es requerido'
      },
      len: {
        args: [1, 200],
        msg: 'El título debe tener entre 1 y 200 caracteres'
      }
    },
    comment: 'Título de la notificación'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El mensaje es requerido'
      }
    },
    comment: 'Contenido del mensaje'
  },
  type: {
    type: DataTypes.ENUM(
      'membership', 'payment', 'order', 'prize', 'points', 
      'checkin', 'promotional', 'motivational', 'system', 
      'birthday', 'reminder', 'alert'
    ),
    allowNull: false,
    comment: 'Tipo de notificación para categorización y filtrado'
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Prioridad de la notificación'
  },
  // Estados de la notificación
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'delivered', 'read', 'failed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado actual de la notificación'
  },
  // Canales de envío
  channels: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: ['push'],
    validate: {
      isValidChannels(value) {
        const validChannels = ['email', 'whatsapp', 'push', 'sms'];
        if (!Array.isArray(value)) {
          throw new Error('Los canales deben ser un array');
        }
        if (value.some(channel => !validChannels.includes(channel))) {
          throw new Error('Canal de notificación inválido');
        }
      }
    },
    comment: 'Canales por los que enviar la notificación [email, whatsapp, push, sms]'
  },
  // Estado por canal
  email_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se envió por email'
  },
  email_sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de envío por email'
  },
  email_delivered: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se entregó por email'
  },
  whatsapp_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se envió por WhatsApp'
  },
  whatsapp_sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de envío por WhatsApp'
  },
  whatsapp_delivered: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se entregó por WhatsApp'
  },
  push_sent: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se envió push notification'
  },
  push_sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de envío de push notification'
  },
  push_delivered: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se entregó push notification'
  },
  // Información de referencia
  related_type: {
    type: DataTypes.ENUM(
      'order', 'payment', 'membership', 'prize_winning', 
      'checkin', 'points_transaction', 'qr_code', 'other'
    ),
    allowNull: true,
    comment: 'Tipo de entidad relacionada'
  },
  related_id: {
    type: DataTypes.UUID,
    allowNull: true,
    comment: 'ID de la entidad relacionada'
  },
  // Programación de envío
  scheduled_for: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha programada para envío (null = enviar inmediatamente)'
  },
  sent_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se envió la notificación'
  },
  delivered_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se entregó la notificación'
  },
  read_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando el cliente leyó la notificación'
  },
  // Configuración de expiración
  expires_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha de expiración de la notificación'
  },
  // Información de creación
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que creó la notificación (si fue manual)'
  },
  is_automated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si la notificación fue generada automáticamente'
  },
  // Template y personalización
  template_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del template usado para generar la notificación'
  },
  template_variables: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Variables usadas en el template'
  },
  // Configuración de reintento
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de intentos de envío realizados'
  },
  max_retries: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    comment: 'Número máximo de reintentos permitidos'
  },
  last_retry_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del último intento de envío'
  },
  // Información de errores
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Mensaje de error si el envío falló'
  },
  error_details: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Detalles técnicos del error'
  },
  // Configuración específica
  action_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de acción para notificaciones interactivas'
  },
  action_text: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Texto del botón de acción'
  },
  image_url: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'URL de imagen para la notificación'
  },
  // Configuración de sonido y vibración
  sound: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Sonido personalizado para push notifications'
  },
  vibration_pattern: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Patrón de vibración para notificaciones móviles'
  },
  // Metadatos
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos adicionales de la notificación'
  },
  // Configuración de agrupación
  group_key: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Clave para agrupar notificaciones similares'
  },
  collapse_key: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Clave para colapsar notificaciones similares'
  }
}, {
  tableName: 'notifications',
  timestamps: true,
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['type']
    },
    {
      fields: ['priority']
    },
    {
      fields: ['status']
    },
    {
      fields: ['scheduled_for']
    },
    {
      fields: ['sent_date']
    },
    {
      fields: ['read_date']
    },
    {
      fields: ['expires_at']
    },
    {
      fields: ['created_by_user_id']
    },
    {
      fields: ['is_automated']
    },
    {
      fields: ['related_type', 'related_id']
    },
    {
      fields: ['group_key']
    },
    {
      fields: ['template_id']
    },
    {
      // Índice compuesto para notificaciones pendientes
      fields: ['status', 'scheduled_for', 'expires_at']
    },
    {
      // Índice para notificaciones por cliente y estado
      fields: ['client_id', 'status', 'type']
    }
  ],
  comment: 'Tabla de notificaciones multi-canal del sistema'
});

// Hook para configurar canales según preferencias del cliente
Notification.beforeCreate(async (notification) => {
  // Si no se especificaron canales, obtener preferencias del cliente
  if (!notification.channels || notification.channels.length === 0) {
    const ClientPreferences = sequelize.models.ClientPreferences;
    const preferences = await ClientPreferences.findOne({
      where: { client_id: notification.client_id }
    });
    
    if (preferences) {
      const channels = [];
      if (preferences.email_notifications) channels.push('email');
      if (preferences.whatsapp_notifications) channels.push('whatsapp');
      if (preferences.push_notifications) channels.push('push');
      
      notification.channels = channels.length > 0 ? channels : ['push'];
    }
  }
  
  // Verificar preferencias específicas por tipo
  await notification.checkTypePreferences();
  
  // Configurar programación si no se especificó
  if (!notification.scheduled_for) {
    notification.scheduled_for = new Date();
  }
});

// Método de instancia para verificar preferencias por tipo
Notification.prototype.checkTypePreferences = async function() {
  const ClientPreferences = sequelize.models.ClientPreferences;
  const preferences = await ClientPreferences.findOne({
    where: { client_id: this.client_id }
  });
  
  if (!preferences) return;
  
  // Verificar si el tipo de notificación está habilitado
  const typePreferences = {
    'membership': preferences.membership_alerts,
    'payment': preferences.payment_reminders,
    'promotional': preferences.promotional_messages,
    'motivational': preferences.motivational_messages,
    'order': preferences.order_updates,
    'prize': preferences.prize_notifications,
    'checkin': preferences.workout_reminders,
    'birthday': preferences.birthday_wishes
  };
  
  // Si el tipo está deshabilitado, cancelar la notificación
  if (typePreferences[this.type] === false) {
    this.status = 'cancelled';
  }
  
  // Verificar horarios de silencio
  if (preferences.isQuietHours()) {
    // Programar para después del período de silencio
    const quietEnd = new Date();
    const [hours, minutes] = preferences.quiet_hours_end.split(':');
    quietEnd.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    
    if (quietEnd < new Date()) {
      quietEnd.setDate(quietEnd.getDate() + 1);
    }
    
    this.scheduled_for = quietEnd;
  }
};

// Método de instancia para verificar si está expirada
Notification.prototype.isExpired = function() {
  if (!this.expires_at) return false;
  return new Date() > this.expires_at;
};

// Método de instancia para verificar si puede ser enviada
Notification.prototype.canBeSent = function() {
  if (this.status !== 'pending') return { canSend: false, reason: `Estado actual: ${this.status}` };
  if (this.isExpired()) return { canSend: false, reason: 'Notificación expirada' };
  if (this.scheduled_for && this.scheduled_for > new Date()) return { canSend: false, reason: 'Aún no programada' };
  if (this.retry_count >= this.max_retries) return { canSend: false, reason: 'Máximo de reintentos alcanzado' };
  
  return { canSend: true };
};

// Método de instancia para marcar como enviada por canal
Notification.prototype.markSentByChannel = async function(channel) {
  const channelFields = {
    'email': { sent: 'email_sent', date: 'email_sent_date' },
    'whatsapp': { sent: 'whatsapp_sent', date: 'whatsapp_sent_date' },
    'push': { sent: 'push_sent', date: 'push_sent_date' }
  };
  
  if (channelFields[channel]) {
    this[channelFields[channel].sent] = true;
    this[channelFields[channel].date] = new Date();
    
    // Si es el primer canal enviado, marcar como sent
    if (this.status === 'pending') {
      this.status = 'sent';
      this.sent_date = new Date();
    }
    
    await this.save();
  }
};

// Método de instancia para marcar como entregada por canal
Notification.prototype.markDeliveredByChannel = async function(channel) {
  const channelFields = {
    'email': 'email_delivered',
    'whatsapp': 'whatsapp_delivered',
    'push': 'push_delivered'
  };
  
  if (channelFields[channel]) {
    this[channelFields[channel]] = true;
    
    // Si todos los canales configurados fueron entregados, marcar como delivered
    const allDelivered = this.channels.every(ch => {
      return this[channelFields[ch]] === true;
    });
    
    if (allDelivered && this.status === 'sent') {
      this.status = 'delivered';
      this.delivered_date = new Date();
    }
    
    await this.save();
  }
};

// Método de instancia para marcar como leída
Notification.prototype.markAsRead = async function() {
  if (this.status !== 'read') {
    this.status = 'read';
    this.read_date = new Date();
    await this.save();
  }
};

// Método de instancia para reintentar envío
Notification.prototype.retry = async function(errorMessage = null) {
  if (this.retry_count >= this.max_retries) {
    throw new Error('Máximo de reintentos alcanzado');
  }
  
  this.retry_count += 1;
  this.last_retry_date = new Date();
  this.status = 'pending';
  
  if (errorMessage) {
    this.error_message = errorMessage;
  }
  
  await this.save();
};

// Método de instancia para marcar como fallida
Notification.prototype.markAsFailed = async function(errorMessage, errorDetails = null) {
  this.status = 'failed';
  this.error_message = errorMessage;
  this.error_details = errorDetails;
  await this.save();
};

// Método de clase para obtener notificaciones pendientes de envío
Notification.findPendingToSend = function() {
  const now = new Date();
  
  return this.findAll({
    where: {
      status: 'pending',
      [sequelize.Sequelize.Op.or]: [
        { scheduled_for: null },
        { scheduled_for: { [sequelize.Sequelize.Op.lte]: now } }
      ],
      [sequelize.Sequelize.Op.or]: [
        { expires_at: null },
        { expires_at: { [sequelize.Sequelize.Op.gt]: now } }
      ],
      retry_count: {
        [sequelize.Sequelize.Op.lt]: sequelize.col('max_retries')
      }
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client',
        include: [{
          model: sequelize.models.ClientPreferences,
          as: 'preferences'
        }]
      }
    ],
    order: [['priority', 'DESC'], ['scheduled_for', 'ASC']]
  });
};

// Método de clase para obtener notificaciones no leídas de un cliente
Notification.findUnreadByClient = function(clientId) {
  return this.findAll({
    where: {
      client_id: clientId,
      status: ['sent', 'delivered'],
      read_date: null
    },
    order: [['created_at', 'DESC']]
  });
};

// Método de clase para limpiar notificaciones expiradas
Notification.cleanupExpired = async function() {
  const now = new Date();
  
  return await this.destroy({
    where: {
      expires_at: {
        [sequelize.Sequelize.Op.lt]: now
      }
    }
  });
};

// Método de clase para estadísticas de notificaciones
Notification.getDeliveryStats = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      created_at: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      }
    },
    attributes: [
      'type',
      'priority',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_sent'],
      [sequelize.fn('SUM', sequelize.cast(sequelize.col('email_delivered'), 'integer')), 'email_delivered'],
      [sequelize.fn('SUM', sequelize.cast(sequelize.col('whatsapp_delivered'), 'integer')), 'whatsapp_delivered'],
      [sequelize.fn('SUM', sequelize.cast(sequelize.col('push_delivered'), 'integer')), 'push_delivered'],
      [sequelize.fn('SUM', sequelize.case().when(sequelize.col('status'), 'read').then(1).else(0).end), 'total_read']
    ],
    group: ['type', 'priority'],
    raw: true
  });
};

// Método de clase para crear notificación con template
Notification.createFromTemplate = async function(templateId, clientId, variables = {}, options = {}) {
  // Aquí se podría implementar un sistema de templates
  // Por ahora, implementación básica
  
  const notification = await this.create({
    client_id: clientId,
    template_id: templateId,
    template_variables: variables,
    title: options.title || 'Notificación',
    message: options.message || 'Mensaje de notificación',
    type: options.type || 'system',
    priority: options.priority || 'medium',
    channels: options.channels,
    scheduled_for: options.scheduled_for,
    expires_at: options.expires_at,
    action_url: options.action_url,
    action_text: options.action_text,
    ...options
  });
  
  return notification;
};

// Definir asociaciones
Notification.associate = function(models) {
  // Una notificación pertenece a un cliente
  Notification.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client',
    onDelete: 'CASCADE'
  });
  
  // Una notificación puede ser creada por un usuario
  Notification.belongsTo(models.User, {
    foreignKey: 'created_by_user_id',
    as: 'createdBy'
  });
};

module.exports = Notification;