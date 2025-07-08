// Archivo: src/models/ClientPreferences.js
// Modelo CORREGIDO para las preferencias de notificaciones de los clientes

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClientPreferences = sequelize.define('ClientPreferences', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de las preferencias'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    // CORREGIDO: Removido unique: true de aquí
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente al que pertenecen estas preferencias'
  },
  // Preferencias de notificaciones por canal
  email_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir notificaciones por email'
  },
  whatsapp_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Recibir notificaciones por WhatsApp'
  },
  push_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir notificaciones push en la app móvil'
  },
  // Tipos de notificaciones
  membership_alerts: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir alertas de vencimiento de membresía'
  },
  payment_reminders: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir recordatorios de pago'
  },
  promotional_messages: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir mensajes promocionales y ofertas'
  },
  motivational_messages: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir mensajes motivacionales para entrenar'
  },
  order_updates: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir actualizaciones de estado de órdenes'
  },
  prize_notifications: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir notificaciones de premios y códigos QR'
  },
  workout_reminders: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Recibir recordatorios para ir al gimnasio'
  },
  // Horarios preferidos para notificaciones
  preferred_notification_time: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '09:00:00',
    comment: 'Hora preferida para recibir notificaciones generales'
  },
  workout_reminder_time: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '18:00:00',
    comment: 'Hora preferida para recordatorios de entrenamiento'
  },
  // Días de la semana para recordatorios de entrenamiento
  monday_workout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir recordatorios los lunes'
  },
  tuesday_workout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir recordatorios los martes'
  },
  wednesday_workout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir recordatorios los miércoles'
  },
  thursday_workout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir recordatorios los jueves'
  },
  friday_workout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir recordatorios los viernes'
  },
  saturday_workout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Recibir recordatorios los sábados'
  },
  sunday_workout: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Recibir recordatorios los domingos'
  },
  // Configuraciones adicionales
  notification_frequency: {
    type: DataTypes.ENUM('high', 'medium', 'low'),
    allowNull: false,
    defaultValue: 'medium',
    comment: 'Frecuencia general de notificaciones: high=Muchas, medium=Normal, low=Pocas'
  },
  language: {
    type: DataTypes.STRING(5),
    allowNull: false,
    defaultValue: 'es',
    comment: 'Idioma preferido para las notificaciones (es, en)'
  },
  timezone: {
    type: DataTypes.STRING(50),
    allowNull: false,
    defaultValue: 'America/Guatemala',
    comment: 'Zona horaria del cliente para programar notificaciones'
  },
  // Preferencias avanzadas
  quiet_hours_start: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '22:00:00',
    comment: 'Hora de inicio del período de silencio (no enviar notificaciones)'
  },
  quiet_hours_end: {
    type: DataTypes.TIME,
    allowNull: true,
    defaultValue: '07:00:00',
    comment: 'Hora de fin del período de silencio'
  },
  max_daily_notifications: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: 1,
      max: 20
    },
    comment: 'Máximo número de notificaciones por día'
  },
  // Preferencias de contenido
  fitness_tips: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir consejos de fitness y nutrición'
  },
  gym_news: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir noticias y novedades del gimnasio'
  },
  birthday_wishes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Recibir felicitaciones de cumpleaños'
  }
}, {
  tableName: 'client_preferences',
  timestamps: true,
  indexes: [
    // CORREGIDO: Movido unique constraint a indexes
    {
      unique: true,
      fields: ['client_id']
    },
    {
      fields: ['notification_frequency']
    },
    {
      fields: ['preferred_notification_time']
    },
    {
      fields: ['language']
    }
  ],
  comment: 'Tabla de preferencias de notificaciones personalizadas por cliente'
});

// Método de instancia para obtener días de entrenamiento seleccionados
ClientPreferences.prototype.getWorkoutDays = function() {
  const days = [];
  if (this.monday_workout) days.push('monday');
  if (this.tuesday_workout) days.push('tuesday');
  if (this.wednesday_workout) days.push('wednesday');
  if (this.thursday_workout) days.push('thursday');
  if (this.friday_workout) days.push('friday');
  if (this.saturday_workout) days.push('saturday');
  if (this.sunday_workout) days.push('sunday');
  return days;
};

// Método de instancia para verificar si está en horas de silencio
ClientPreferences.prototype.isQuietHours = function(time = new Date()) {
  if (!this.quiet_hours_start || !this.quiet_hours_end) return false;
  
  const currentTime = time instanceof Date ? 
    time.toTimeString().slice(0, 8) : time;
  
  const start = this.quiet_hours_start;
  const end = this.quiet_hours_end;
  
  // Si las horas de silencio cruzan medianoche (ej: 22:00 a 07:00)
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  } else {
    return currentTime >= start && currentTime <= end;
  }
};

// Método de instancia para verificar si puede recibir notificaciones
ClientPreferences.prototype.canReceiveNotification = function(type, channel) {
  // Verificar si el canal está habilitado
  const channelEnabled = {
    'email': this.email_notifications,
    'whatsapp': this.whatsapp_notifications,
    'push': this.push_notifications
  };
  
  if (!channelEnabled[channel]) return false;
  
  // Verificar si el tipo de notificación está habilitado
  const typeEnabled = {
    'membership': this.membership_alerts,
    'payment': this.payment_reminders,
    'promotional': this.promotional_messages,
    'motivational': this.motivational_messages,
    'order': this.order_updates,
    'prize': this.prize_notifications,
    'workout': this.workout_reminders,
    'fitness_tips': this.fitness_tips,
    'gym_news': this.gym_news,
    'birthday': this.birthday_wishes
  };
  
  return typeEnabled[type] !== false; // true por defecto si no está definido
};

// Método de clase para crear preferencias por defecto
ClientPreferences.createDefault = async function(clientId) {
  return await this.create({
    client_id: clientId
    // Todos los demás valores usan los defaults
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
ClientPreferences.associate = function(models) {
  // Las preferencias pertenecen a un cliente
  if (models.Client) {
    ClientPreferences.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'CASCADE'
    });
  }
};

module.exports = ClientPreferences;