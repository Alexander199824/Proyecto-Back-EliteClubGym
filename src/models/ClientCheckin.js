// Archivo: src/models/ClientCheckin.js
// creo el modelo para registrar check-ins manuales de clientes con validación GPS

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClientCheckin = sequelize.define('ClientCheckin', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del check-in'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente que hizo check-in'
  },
  checkin_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha del check-in'
  },
  checkin_time: {
    type: DataTypes.TIME,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Hora del check-in'
  },
  // Información de ubicación GPS
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
    validate: {
      min: -90,
      max: 90
    },
    comment: 'Latitud GPS del check-in'
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
    validate: {
      min: -180,
      max: 180
    },
    comment: 'Longitud GPS del check-in'
  },
  location_accuracy: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    comment: 'Precisión de la ubicación GPS en metros'
  },
  distance_from_gym: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: false,
    comment: 'Distancia calculada desde el gimnasio en metros'
  },
  // Validación de ubicación
  location_valid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la ubicación está dentro del rango permitido'
  },
  location_validation_method: {
    type: DataTypes.ENUM('gps', 'qr_reminder', 'manual_override'),
    allowNull: false,
    defaultValue: 'gps',
    comment: 'Método usado para validar la ubicación'
  },
  // Información del check-in
  checkin_type: {
    type: DataTypes.ENUM('regular', 'qr_reminder', 'manual', 'guest'),
    allowNull: false,
    defaultValue: 'regular',
    comment: 'Tipo de check-in: regular=Normal, qr_reminder=Por QR recordatorio, manual=Manual por staff, guest=Invitado'
  },
  qr_code_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'qr_codes',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del código QR de recordatorio usado (si aplica)'
  },
  // Estados del check-in
  status: {
    type: DataTypes.ENUM('valid', 'invalid', 'suspicious', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'valid',
    comment: 'Estado del check-in después de validaciones'
  },
  // Información de la membresía al momento del check-in
  membership_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'client_memberships',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la membresía activa al momento del check-in'
  },
  membership_valid: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si la membresía estaba activa al momento del check-in'
  },
  // Sistema de puntos
  points_earned: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Puntos ganados por este check-in'
  },
  points_multiplier: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.00,
    comment: 'Multiplicador aplicado para calcular puntos'
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
    comment: 'Bonus por horario de menor afluencia'
  },
  // Información del dispositivo
  device_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información del dispositivo usado para check-in'
  },
  app_version: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: 'Versión de la app usada para check-in'
  },
  platform: {
    type: DataTypes.ENUM('web', 'ios', 'android'),
    allowNull: false,
    defaultValue: 'web',
    comment: 'Plataforma desde donde se hizo el check-in'
  },
  // Detección de fraude
  fraud_risk_score: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Puntuación de riesgo de fraude (0-100)'
  },
  fraud_indicators: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Indicadores de posible fraude detectados'
  },
  // Información de validación manual
  manually_validated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si fue validado manualmente por staff'
  },
  validated_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que validó manualmente el check-in'
  },
  validation_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas de la validación manual'
  },
  // Información de la sesión de entrenamiento
  workout_duration_minutes: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1,
      max: 480 // 8 horas máximo
    },
    comment: 'Duración estimada/reportada del entrenamiento en minutos'
  },
  workout_type: {
    type: DataTypes.ENUM('cardio', 'strength', 'group_class', 'personal_training', 'other'),
    allowNull: true,
    comment: 'Tipo de entrenamiento realizado'
  },
  checkout_time: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de salida del gimnasio (si se registra)'
  },
  // Información del clima/condiciones
  weather_conditions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Condiciones climáticas al momento del check-in'
  },
  // Estadísticas del día
  is_first_checkin_today: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si es el primer check-in del día'
  },
  checkin_count_today: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Número de check-in del día (para detectar múltiples entradas)'
  },
  // Información de red/conectividad
  network_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información de red y conectividad'
  },
  ip_address: {
    type: DataTypes.INET,
    allowNull: true,
    comment: 'Dirección IP del check-in'
  }
}, {
  tableName: 'client_checkins',
  timestamps: true,
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['checkin_date']
    },
    {
      fields: ['checkin_time']
    },
    {
      fields: ['location_valid']
    },
    {
      fields: ['status']
    },
    {
      fields: ['membership_id']
    },
    {
      fields: ['points_earned']
    },
    {
      fields: ['fraud_risk_score']
    },
    {
      fields: ['manually_validated']
    },
    {
      fields: ['platform']
    },
    {
      fields: ['qr_code_id']
    },
    {
      // Índice compuesto para check-ins válidos por cliente y fecha
      fields: ['client_id', 'checkin_date', 'status']
    },
    {
      // Índice para prevenir múltiples check-ins muy cercanos
      fields: ['client_id', 'created_at']
    },
    {
      // Índice para análisis de patrones de asistencia
      fields: ['checkin_date', 'checkin_time', 'location_valid']
    }
  ],
  comment: 'Tabla de check-ins manuales de clientes con validación GPS'
});

// Hook para validar ubicación y calcular puntos antes de crear
ClientCheckin.beforeCreate(async (checkin) => {
  // Validar ubicación GPS
  await checkin.validateLocation();
  
  // Calcular puntos por el check-in
  await checkin.calculatePoints();
  
  // Verificar si es el primer check-in del día
  await checkin.checkFirstCheckinToday();
  
  // Calcular puntuación de riesgo de fraude
  await checkin.calculateFraudRisk();
});

// Hook para actualizar estadísticas del cliente después de crear
ClientCheckin.afterCreate(async (checkin) => {
  if (checkin.status === 'valid' && checkin.location_valid) {
    // Actualizar días consecutivos y estadísticas del cliente
    const Client = sequelize.models.Client;
    const client = await Client.findByPk(checkin.client_id);
    
    if (client) {
      await client.updateConsecutiveDays(checkin.checkin_date);
      
      // Añadir puntos al balance del cliente
      if (checkin.points_earned > 0) {
        await client.addPoints(checkin.points_earned, 'Check-in gimnasio');
      }
    }
  }
});

// Método de instancia para validar ubicación GPS
ClientCheckin.prototype.validateLocation = async function() {
  // Obtener coordenadas del gimnasio desde variables de entorno
  const gymLat = parseFloat(process.env.GYM_LATITUDE || '14.6349');
  const gymLng = parseFloat(process.env.GYM_LONGITUDE || '-90.5069');
  const allowedRadius = parseFloat(process.env.GPS_RADIUS_METERS || '100');
  
  // Calcular distancia desde el gimnasio
  this.distance_from_gym = this.calculateDistance(
    this.latitude, this.longitude,
    gymLat, gymLng
  );
  
  // Validar si está dentro del rango permitido
  this.location_valid = this.distance_from_gym <= allowedRadius;
  
  // Ajustar estado basándose en la validación
  if (!this.location_valid) {
    this.status = this.distance_from_gym > (allowedRadius * 2) ? 'invalid' : 'suspicious';
  }
};

// Método para calcular distancia entre dos puntos GPS (fórmula de Haversine)
ClientCheckin.prototype.calculateDistance = function(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Radio de la Tierra en metros
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distancia en metros
};

// Método de instancia para calcular puntos ganados
ClientCheckin.prototype.calculatePoints = async function() {
  let basePoints = 10; // Puntos base por check-in
  let multiplier = 1.0;
  let timeBonus = 0;
  let consecutiveBonus = 0;
  
  // Obtener información del cliente para días consecutivos
  const Client = sequelize.models.Client;
  const client = await Client.findByPk(this.client_id);
  
  if (client) {
    // Bonus por días consecutivos (máximo 5 días)
    const consecutiveDays = Math.min(client.consecutive_days, 5);
    consecutiveBonus = consecutiveDays * 2;
    this.consecutive_days_bonus = consecutiveBonus;
    
    // Multiplicador por horarios de menor afluencia
    const checkinHour = parseInt(this.checkin_time.split(':')[0]);
    if ((checkinHour >= 6 && checkinHour <= 9) || (checkinHour >= 14 && checkinHour <= 16)) {
      timeBonus = 5; // Bonus por horarios valle
      this.time_bonus = timeBonus;
      multiplier = 1.2;
    }
  }
  
  // Calcular puntos totales
  const totalPoints = Math.floor((basePoints + consecutiveBonus + timeBonus) * multiplier);
  
  this.points_earned = totalPoints;
  this.points_multiplier = multiplier;
};

// Método de instancia para verificar si es el primer check-in del día
ClientCheckin.prototype.checkFirstCheckinToday = async function() {
  const today = this.checkin_date;
  
  const existingCheckins = await ClientCheckin.count({
    where: {
      client_id: this.client_id,
      checkin_date: today,
      status: 'valid'
    }
  });
  
  this.is_first_checkin_today = existingCheckins === 0;
  this.checkin_count_today = existingCheckins + 1;
  
  // Penalizar múltiples check-ins el mismo día
  if (this.checkin_count_today > 1) {
    this.points_earned = Math.floor(this.points_earned * 0.5);
    this.fraud_risk_score += 20;
  }
};

// Método de instancia para calcular riesgo de fraude
ClientCheckin.prototype.calculateFraudRisk = async function() {
  let riskScore = 0;
  let indicators = [];
  
  // Factor 1: Ubicación sospechosa
  if (!this.location_valid) {
    riskScore += 30;
    indicators.push('location_outside_range');
  }
  
  if (this.distance_from_gym > 500) {
    riskScore += 20;
    indicators.push('location_too_far');
  }
  
  // Factor 2: Múltiples check-ins muy seguidos
  const recentCheckins = await ClientCheckin.count({
    where: {
      client_id: this.client_id,
      created_at: {
        [sequelize.Sequelize.Op.gte]: new Date(Date.now() - 30 * 60 * 1000) // Últimos 30 minutos
      }
    }
  });
  
  if (recentCheckins > 1) {
    riskScore += 25;
    indicators.push('multiple_recent_checkins');
  }
  
  // Factor 3: Precisión GPS muy baja
  if (this.location_accuracy && this.location_accuracy > 100) {
    riskScore += 15;
    indicators.push('low_gps_accuracy');
  }
  
  // Factor 4: Patrón inusual de horarios
  const checkinHour = parseInt(this.checkin_time.split(':')[0]);
  if (checkinHour < 5 || checkinHour > 23) {
    riskScore += 10;
    indicators.push('unusual_hours');
  }
  
  this.fraud_risk_score = Math.min(riskScore, 100);
  this.fraud_indicators = indicators;
  
  // Marcar como sospechoso si el riesgo es alto
  if (this.fraud_risk_score >= 50) {
    this.status = 'suspicious';
  }
};

// Método de instancia para validar manualmente
ClientCheckin.prototype.validateManually = async function(validatedByUserId, isValid, notes = null) {
  this.manually_validated = true;
  this.validated_by_user_id = validatedByUserId;
  this.validation_notes = notes;
  this.status = isValid ? 'approved' : 'rejected';
  
  // Si se aprueba un check-in previamente inválido, procesar puntos
  if (isValid && this.points_earned === 0) {
    await this.calculatePoints();
    
    // Actualizar estadísticas del cliente
    const Client = sequelize.models.Client;
    const client = await Client.findByPk(this.client_id);
    if (client && this.points_earned > 0) {
      await client.addPoints(this.points_earned, 'Check-in validado manualmente');
    }
  }
  
  await this.save();
};

// Método de clase para obtener estadísticas de asistencia
ClientCheckin.getAttendanceStats = async function(startDate, endDate) {
  return await this.findAll({
    where: {
      checkin_date: {
        [sequelize.Sequelize.Op.between]: [startDate, endDate]
      },
      status: ['valid', 'approved']
    },
    attributes: [
      'checkin_date',
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_checkins'],
      [sequelize.fn('COUNT', sequelize.fn('DISTINCT', sequelize.col('client_id'))), 'unique_clients'],
      [sequelize.fn('AVG', sequelize.col('points_earned')), 'avg_points']
    ],
    group: ['checkin_date'],
    order: [['checkin_date', 'ASC']],
    raw: true
  });
};

// Método de clase para buscar check-ins sospechosos
ClientCheckin.findSuspicious = function() {
  return this.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        { status: 'suspicious' },
        { fraud_risk_score: { [sequelize.Sequelize.Op.gte]: 40 } },
        { location_valid: false }
      ]
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      }
    ],
    order: [['fraud_risk_score', 'DESC'], ['created_at', 'DESC']]
  });
};

// Método de clase para obtener patrones de asistencia de un cliente
ClientCheckin.getClientAttendancePattern = function(clientId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return this.findAll({
    where: {
      client_id: clientId,
      checkin_date: {
        [sequelize.Sequelize.Op.gte]: startDate
      },
      status: ['valid', 'approved']
    },
    order: [['checkin_date', 'ASC'], ['checkin_time', 'ASC']]
  });
};

// Definir asociaciones
ClientCheckin.associate = function(models) {
  // Un check-in pertenece a un cliente
  ClientCheckin.belongsTo(models.Client, {
    foreignKey: 'client_id',
    as: 'client',
    onDelete: 'CASCADE'
  });
  
  // Un check-in puede estar relacionado con una membresía
  ClientCheckin.belongsTo(models.ClientMembership, {
    foreignKey: 'membership_id',
    as: 'membership',
    onDelete: 'SET NULL'
  });
  
  // Un check-in puede estar relacionado con un código QR de recordatorio
  ClientCheckin.belongsTo(models.QRCode, {
    foreignKey: 'qr_code_id',
    as: 'qrCode',
    onDelete: 'SET NULL'
  });
  
  // Un check-in puede ser validado por un usuario
  ClientCheckin.belongsTo(models.User, {
    foreignKey: 'validated_by_user_id',
    as: 'validatedBy'
  });
};

module.exports = ClientCheckin;