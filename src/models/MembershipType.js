// Archivo: src/models/MembershipType.js
//creo el modelo para los tipos de membresías configurables

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const MembershipType = sequelize.define('MembershipType', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del tipo de membresía'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'El nombre de la membresía es requerido'
      },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    },
    comment: 'Nombre del tipo de membresía (ej: Mensual, Trimestral, Anual)'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada de lo que incluye la membresía'
  },
  duration_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 1,
        msg: 'La duración debe ser de al menos 1 día'
      },
      max: {
        args: 3650, // 10 años máximo
        msg: 'La duración no puede exceder 10 años'
      }
    },
    comment: 'Duración de la membresía en días'
  },
  price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0,
        msg: 'El precio no puede ser negativo'
      }
    },
    comment: 'Precio de la membresía en Quetzales'
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
    comment: 'Moneda del precio (GTQ por defecto)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si este tipo de membresía está disponible para venta'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si esta membresía debe destacarse en la interfaz'
  },
  max_freeze_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Días máximos que se puede congelar esta membresía'
  },
  grace_period_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    validate: {
      min: 0
    },
    comment: 'Días de gracia después del vencimiento antes de suspender'
  },
  auto_renewal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si esta membresía se renueva automáticamente'
  },
  // Configuración de alertas de vencimiento
  alert_days_before: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [7, 3, 1],
    validate: {
      isValidAlertDays(value) {
        if (!Array.isArray(value)) {
          throw new Error('alert_days_before debe ser un array');
        }
        if (value.some(day => !Number.isInteger(day) || day < 0)) {
          throw new Error('Los días de alerta deben ser números enteros positivos');
        }
      }
    },
    comment: 'Array de días antes del vencimiento para enviar alertas [7, 3, 1]'
  },
  // Beneficios incluidos
  includes_personal_trainer: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Incluye sesiones con entrenador personal'
  },
  includes_nutrition_plan: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Incluye plan nutricional'
  },
  includes_group_classes: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Incluye acceso a clases grupales'
  },
  includes_guest_passes: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Número de pases para invitados incluidos'
  },
  // Configuración de descuentos
  student_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Porcentaje de descuento para estudiantes'
  },
  senior_discount_percent: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Porcentaje de descuento para adultos mayores'
  },
  // Límites de uso
  daily_visit_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Límite de visitas diarias (null = ilimitado)'
  },
  monthly_guest_limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Límite de invitados por mes (null = ilimitado)'
  },
  // Configuración de acceso
  access_hours_start: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de inicio de acceso (null = 24 horas)'
  },
  access_hours_end: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de fin de acceso (null = 24 horas)'
  },
  weekend_access: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite acceso los fines de semana'
  },
  holiday_access: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite acceso en días feriados'
  },
  // Metadatos adicionales
  color_code: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'El código de color debe ser un hexadecimal válido (#RRGGBB)'
      }
    },
    comment: 'Color hexadecimal para mostrar en la interfaz'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de visualización (menor número aparece primero)'
  },
  terms_and_conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Términos y condiciones específicos de esta membresía'
  }
}, {
  tableName: 'membership_types',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      unique: true,
      fields: ['name']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['price']
    },
    {
      fields: ['duration_days']
    },
    {
      fields: ['sort_order']
    }
  ],
  comment: 'Tabla de tipos de membresías configurables'
});

// Método de instancia para calcular precio con descuento
MembershipType.prototype.calculatePrice = function(discountType = null) {
  let finalPrice = parseFloat(this.price);
  
  switch(discountType) {
    case 'student':
      finalPrice -= (finalPrice * parseFloat(this.student_discount_percent) / 100);
      break;
    case 'senior':
      finalPrice -= (finalPrice * parseFloat(this.senior_discount_percent) / 100);
      break;
  }
  
  return parseFloat(finalPrice.toFixed(2));
};

// Método de instancia para verificar si está en horario de acceso
MembershipType.prototype.isAccessTime = function(time = new Date()) {
  if (!this.access_hours_start || !this.access_hours_end) {
    return true; // Acceso 24 horas
  }
  
  const currentTime = time instanceof Date ? 
    time.toTimeString().slice(0, 8) : time;
  
  const start = this.access_hours_start;
  const end = this.access_hours_end;
  
  // Si el horario cruza medianoche
  if (start > end) {
    return currentTime >= start || currentTime <= end;
  } else {
    return currentTime >= start && currentTime <= end;
  }
};

// Método de instancia para obtener duración legible
MembershipType.prototype.getDurationText = function() {
  const days = this.duration_days;
  
  if (days === 1) return '1 día';
  if (days === 7) return '1 semana';
  if (days === 30) return '1 mes';
  if (days === 90) return '3 meses';
  if (days === 180) return '6 meses';
  if (days === 365) return '1 año';
  
  if (days < 30) return `${days} días`;
  if (days < 365) {
    const months = Math.round(days / 30);
    return `${months} ${months === 1 ? 'mes' : 'meses'}`;
  } else {
    const years = Math.round(days / 365);
    return `${years} ${years === 1 ? 'año' : 'años'}`;
  }
};

// Método de clase para obtener membresías activas ordenadas
MembershipType.findActiveOrdered = function() {
  return this.findAll({
    where: {
      is_active: true
    },
    order: [
      ['sort_order', 'ASC'],
      ['price', 'ASC']
    ]
  });
};

// Método de clase para obtener membresías destacadas
MembershipType.findFeatured = function() {
  return this.findAll({
    where: {
      is_active: true,
      is_featured: true
    },
    order: [['sort_order', 'ASC']]
  });
};

// Definir asociaciones
MembershipType.associate = function(models) {
  // Un tipo de membresía puede tener muchas asignaciones a clientes
  MembershipType.hasMany(models.ClientMembership, {
    foreignKey: 'membership_type_id',
    as: 'clientMemberships'
  });
  
  // Un tipo de membresía puede tener muchos pagos relacionados
  MembershipType.hasMany(models.Payment, {
    foreignKey: 'membership_type_id',
    as: 'payments'
  });
};

module.exports = MembershipType;