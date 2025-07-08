
// Archivo: src/models/Roulette.js
//  creo el modelo para configurar las ruletas de premios personalizables

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Roulette = sequelize.define('Roulette', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la ruleta'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre de la ruleta es requerido'
      },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    },
    comment: 'Nombre identificativo de la ruleta'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de la ruleta y sus premios'
  },
  category: {
    type: DataTypes.ENUM('basic', 'premium', 'exclusive', 'special', 'seasonal'),
    allowNull: false,
    defaultValue: 'basic',
    comment: 'Categoría de la ruleta que determina qué códigos QR la pueden activar'
  },
  // Configuración visual
  theme_color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#1E3A8A',
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'El color debe ser un hexadecimal válido (#RRGGBB)'
      }
    },
    comment: 'Color principal de la ruleta'
  },
  background_color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#F8FAFC',
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'El color de fondo debe ser un hexadecimal válido'
      }
    },
    comment: 'Color de fondo de la ruleta'
  },
  text_color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#1F2937',
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'El color de texto debe ser un hexadecimal válido'
      }
    },
    comment: 'Color del texto en la ruleta'
  },
  border_color: {
    type: DataTypes.STRING(7),
    allowNull: false,
    defaultValue: '#D1D5DB',
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'El color del borde debe ser un hexadecimal válido'
      }
    },
    comment: 'Color del borde de la ruleta'
  },
  // Configuración de sectores
  sectors_config: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    validate: {
      isValidSectors(value) {
        if (!Array.isArray(value)) {
          throw new Error('La configuración de sectores debe ser un array');
        }
        
        const totalProbability = value.reduce((sum, sector) => sum + (sector.probability || 0), 0);
        if (Math.abs(totalProbability - 100) > 0.01) {
          throw new Error('La suma de probabilidades debe ser 100%');
        }
        
        value.forEach((sector, index) => {
          if (!sector.prize_id || !sector.probability || !sector.color) {
            throw new Error(`Sector ${index + 1} debe tener prize_id, probability y color`);
          }
        });
      }
    },
    comment: 'Configuración de sectores de la ruleta en formato JSON'
  },
  // Configuración de animación
  animation_duration: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3000,
    validate: {
      min: {
        args: 1000,
        msg: 'La duración mínima de animación es 1000ms'
      },
      max: {
        args: 10000,
        msg: 'La duración máxima de animación es 10000ms'
      }
    },
    comment: 'Duración de la animación de giro en milisegundos'
  },
  spin_acceleration: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.5,
    validate: {
      min: {
        args: 0.5,
        msg: 'La aceleración mínima es 0.5'
      },
      max: {
        args: 3.0,
        msg: 'La aceleración máxima es 3.0'
      }
    },
    comment: 'Factor de aceleración del giro'
  },
  // Configuración de sonido
  enable_sound: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Habilitar efectos de sonido'
  },
  sound_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración de sonidos en formato JSON'
  },
  // Configuración de efectos visuales
  enable_confetti: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Habilitar efecto de confetti al ganar'
  },
  confetti_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración del efecto confetti'
  },
  enable_particles: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Habilitar efectos de partículas'
  },
  particles_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración de efectos de partículas'
  },
  // Estados y configuración
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si la ruleta está activa'
  },
  is_default: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si es la ruleta por defecto para su categoría'
  },
  // Restricciones de uso
  max_spins_per_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Máximo número de giros por día por cliente (null = ilimitado)'
  },
  max_spins_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Máximo número de giros por semana por cliente (null = ilimitado)'
  },
  cooldown_minutes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Tiempo de espera en minutos entre giros del mismo cliente'
  },
  // Configuración de validez
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha desde cuando es válida la ruleta'
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha hasta cuando es válida (null = sin expiración)'
  },
  // Horarios de disponibilidad
  available_hours_start: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de inicio de disponibilidad (null = 24 horas)'
  },
  available_hours_end: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de fin de disponibilidad (null = 24 horas)'
  },
  available_days: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [0, 1, 2, 3, 4, 5, 6], // Todos los días por defecto
    comment: 'Días de la semana disponibles (0=Domingo, 6=Sábado)'
  },
  // Estadísticas
  total_spins: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de giros realizados en esta ruleta'
  },
  total_prizes_awarded: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de premios otorgados'
  },
  // Información de creación
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que creó la ruleta'
  },
  // Configuración avanzada
  requires_verification: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si los premios requieren verificación manual'
  },
  auto_award_prizes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Otorgar premios automáticamente o requiere confirmación'
  },
  // Template personalizado
  custom_template: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'HTML/CSS personalizado para la ruleta'
  },
  // Metadatos
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos adicionales en formato JSON'
  }
}, {
  tableName: 'roulettes',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_default']
    },
    {
      fields: ['valid_from', 'valid_until']
    },
    {
      fields: ['created_by_user_id']
    },
    {
      fields: ['total_spins']
    },
    {
      // Índice único para una sola ruleta por defecto por categoría
      unique: true,
      fields: ['category', 'is_default'],
      where: {
        is_default: true
      }
    }
  ],
  comment: 'Tabla de configuraciones de ruletas personalizables'
});

// Hook para validar que solo haya una ruleta por defecto por categoría
Roulette.beforeSave(async (roulette) => {
  if (roulette.is_default) {
    // Desactivar otras ruletas por defecto en la misma categoría
    await Roulette.update(
      { is_default: false },
      { 
        where: { 
          category: roulette.category,
          id: { [sequelize.Sequelize.Op.ne]: roulette.id }
        }
      }
    );
  }
  
  // Validar configuración de sectores si está presente
  if (roulette.sectors_config && roulette.sectors_config.length > 0) {
    await roulette.validateSectorsConfiguration();
  }
});

// Método de instancia para validar configuración de sectores
Roulette.prototype.validateSectorsConfiguration = async function() {
  if (!this.sectors_config || !Array.isArray(this.sectors_config)) {
    throw new Error('La configuración de sectores debe ser un array válido');
  }
  
  // Verificar que todos los premios existen
  const Prize = sequelize.models.Prize;
  if (Prize) {
    for (const sector of this.sectors_config) {
      const prize = await Prize.findByPk(sector.prize_id);
      if (!prize) {
        throw new Error(`Premio ${sector.prize_id} no encontrado para sector`);
      }
    }
  }
};

// Método de instancia para verificar disponibilidad
Roulette.prototype.isAvailable = function(dateTime = new Date()) {
  const now = dateTime instanceof Date ? dateTime : new Date(dateTime);
  
  // Verificar si está activa
  if (!this.is_active) return { available: false, reason: 'Ruleta desactivada' };
  
  // Verificar fechas de validez
  if (this.valid_from > now) return { available: false, reason: 'Ruleta aún no válida' };
  if (this.valid_until && this.valid_until < now) return { available: false, reason: 'Ruleta expirada' };
  
  // Verificar día de la semana
  const dayOfWeek = now.getDay();
  if (!this.available_days.includes(dayOfWeek)) {
    return { available: false, reason: 'Ruleta no disponible hoy' };
  }
  
  // Verificar horarios
  if (this.available_hours_start && this.available_hours_end) {
    const currentTime = now.toTimeString().slice(0, 8);
    const start = this.available_hours_start;
    const end = this.available_hours_end;
    
    let inTimeRange;
    if (start > end) { // Cruza medianoche
      inTimeRange = currentTime >= start || currentTime <= end;
    } else {
      inTimeRange = currentTime >= start && currentTime <= end;
    }
    
    if (!inTimeRange) {
      return { available: false, reason: 'Ruleta no disponible en este horario' };
    }
  }
  
  return { available: true };
};

// Método de instancia para verificar si un cliente puede girar
Roulette.prototype.canClientSpin = async function(clientId) {
  const now = new Date();
  
  // Verificar disponibilidad general
  const availability = this.isAvailable(now);
  if (!availability.available) return availability;
  
  // Verificar límites diarios
  if (this.max_spins_per_day) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const PrizeWinning = sequelize.models.PrizeWinning;
    const todaySpins = await PrizeWinning.count({
      where: {
        client_id: clientId,
        roulette_id: this.id,
        created_at: {
          [sequelize.Sequelize.Op.gte]: todayStart
        }
      }
    });
    
    if (todaySpins >= this.max_spins_per_day) {
      return { available: false, reason: 'Límite diario de giros alcanzado' };
    }
  }
  
  // Verificar límites semanales
  if (this.max_spins_per_week) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const PrizeWinning = sequelize.models.PrizeWinning;
    const weekSpins = await PrizeWinning.count({
      where: {
        client_id: clientId,
        roulette_id: this.id,
        created_at: {
          [sequelize.Sequelize.Op.gte]: weekStart
        }
      }
    });
    
    if (weekSpins >= this.max_spins_per_week) {
      return { available: false, reason: 'Límite semanal de giros alcanzado' };
    }
  }
  
  // Verificar cooldown
  if (this.cooldown_minutes > 0) {
    const cooldownStart = new Date(now);
    cooldownStart.setMinutes(cooldownStart.getMinutes() - this.cooldown_minutes);
    
    const PrizeWinning = sequelize.models.PrizeWinning;
    const recentSpin = await PrizeWinning.findOne({
      where: {
        client_id: clientId,
        roulette_id: this.id,
        created_at: {
          [sequelize.Sequelize.Op.gte]: cooldownStart
        }
      },
      order: [['created_at', 'DESC']]
    });
    
    if (recentSpin) {
      const remainingMinutes = Math.ceil((recentSpin.created_at.getTime() + (this.cooldown_minutes * 60000) - now.getTime()) / 60000);
      return { available: false, reason: `Debes esperar ${remainingMinutes} minutos` };
    }
  }
  
  return { available: true };
};

// Método de instancia para seleccionar premio basado en probabilidades
Roulette.prototype.selectPrize = function() {
  if (!this.sectors_config || this.sectors_config.length === 0) {
    throw new Error('No hay sectores configurados en la ruleta');
  }
  
  // Generar número aleatorio
  const random = Math.random() * 100;
  let cumulative = 0;
  
  for (const sector of this.sectors_config) {
    cumulative += sector.probability;
    if (random <= cumulative) {
      return {
        prize_id: sector.prize_id,
        sector_index: this.sectors_config.indexOf(sector),
        sector_config: sector
      };
    }
  }
  
  // Fallback al último sector si hay problemas de redondeo
  const lastSector = this.sectors_config[this.sectors_config.length - 1];
  return {
    prize_id: lastSector.prize_id,
    sector_index: this.sectors_config.length - 1,
    sector_config: lastSector
  };
};

// Método de instancia para registrar giro
Roulette.prototype.recordSpin = async function(prizeWinningId) {
  this.total_spins += 1;
  this.total_prizes_awarded += 1;
  await this.save();
};

// Método de clase para obtener ruleta por defecto de una categoría
Roulette.getDefaultForCategory = function(category) {
  return this.findOne({
    where: {
      category: category,
      is_default: true,
      is_active: true
    }
  });
};

// Método de clase para obtener ruletas disponibles
Roulette.getAvailable = function(category = null) {
  const whereClause = {
    is_active: true,
    valid_from: {
      [sequelize.Sequelize.Op.lte]: new Date()
    },
    [sequelize.Sequelize.Op.or]: [
      { valid_until: null },
      { valid_until: { [sequelize.Sequelize.Op.gte]: new Date() } }
    ]
  };
  
  if (category) {
    whereClause.category = category;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['is_default', 'DESC'], ['name', 'ASC']]
  });
};

// Definir asociaciones
Roulette.associate = function(models) {
  // Una ruleta fue creada por un usuario
  Roulette.belongsTo(models.User, {
    foreignKey: 'created_by_user_id',
    as: 'createdBy'
  });
  
  // Una ruleta puede generar muchos premios ganados
  Roulette.hasMany(models.PrizeWinning, {
    foreignKey: 'roulette_id',
    as: 'prizeWinnings'
  });
};

module.exports = Roulette;