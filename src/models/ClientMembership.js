// Archivo: src/models/ClientMembership.js
// creo el modelo para las membresías asignadas a clientes

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ClientMembership = sequelize.define('ClientMembership', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la membresía del cliente'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente propietario de la membresía'
  },
  membership_type_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'membership_types',
      key: 'id'
    },
    onDelete: 'RESTRICT',
    comment: 'ID del tipo de membresía'
  },
  start_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    validate: {
      isDate: {
        msg: 'Debe ser una fecha válida'
      }
    },
    comment: 'Fecha de inicio de la membresía'
  },
  end_date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
    validate: {
      isDate: {
        msg: 'Debe ser una fecha válida'
      },
      isAfterStartDate(value) {
        if (value <= this.start_date) {
          throw new Error('La fecha de fin debe ser posterior a la fecha de inicio');
        }
      }
    },
    comment: 'Fecha de vencimiento de la membresía'
  },
  status: {
    type: DataTypes.ENUM('active', 'expired', 'suspended', 'frozen', 'cancelled'),
    allowNull: false,
    defaultValue: 'active',
    comment: 'Estado actual de la membresía'
  },
  payment_status: {
    type: DataTypes.ENUM('paid', 'pending', 'overdue', 'partial'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado del pago de la membresía'
  },
  amount_paid: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: 0,
        msg: 'El monto pagado no puede ser negativo'
      }
    },
    comment: 'Monto total pagado por esta membresía'
  },
  amount_due: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0,
        msg: 'El monto adeudado no puede ser negativo'
      }
    },
    comment: 'Monto total que debe pagar por esta membresía'
  },
  discount_applied: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: 0,
        msg: 'El descuento no puede ser negativo'
      }
    },
    comment: 'Monto de descuento aplicado'
  },
  discount_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Razón del descuento aplicado (estudiante, promoción, etc.)'
  },
  // Configuración de congelamiento
  is_frozen: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la membresía está actualmente congelada'
  },
  frozen_since: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha desde cuando está congelada la membresía'
  },
  frozen_days_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Días de congelamiento ya utilizados'
  },
  freeze_reason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Razón del congelamiento de la membresía'
  },
  // Configuración de auto-renovación
  auto_renewal: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si esta membresía se renueva automáticamente'
  },
  next_billing_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha del próximo cobro para renovación automática'
  },
  // Alertas enviadas
  alerts_sent: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Array de alertas ya enviadas para evitar duplicados'
  },
  // Beneficios utilizados
  guest_passes_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Número de pases para invitados ya utilizados'
  },
  personal_trainer_sessions_used: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Sesiones de entrenador personal ya utilizadas'
  },
  // Información adicional
  notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas adicionales sobre esta membresía'
  },
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que creó esta membresía'
  },
  // Días de gracia
  grace_period_end: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de fin del período de gracia'
  },
  // Historial de cambios
  status_history: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Historial de cambios de estado con timestamps'
  }
}, {
  tableName: 'client_memberships',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['client_id']
    },
    {
      fields: ['membership_type_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['start_date']
    },
    {
      fields: ['end_date']
    },
    {
      fields: ['auto_renewal']
    },
    {
      fields: ['next_billing_date']
    },
    {
      fields: ['is_frozen']
    },
    {
      // Índice compuesto para buscar membresías activas de un cliente
      fields: ['client_id', 'status']
    }
  ],
  comment: 'Tabla de membresías asignadas a clientes'
});

// Hook para calcular la fecha de fin automáticamente
ClientMembership.beforeCreate(async (membership) => {
  if (!membership.end_date && membership.membership_type_id) {
    try {
      const MembershipType = sequelize.models.MembershipType;
      const membershipType = await MembershipType.findByPk(membership.membership_type_id);
      
      if (membershipType) {
        const startDate = new Date(membership.start_date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + membershipType.duration_days);
        membership.end_date = endDate.toISOString().split('T')[0];
        
        // Establecer el monto adeudado si no está definido
        if (!membership.amount_due) {
          membership.amount_due = membershipType.price;
        }
      }
    } catch (error) {
      console.error('Error calculando fecha de fin:', error);
    }
  }
  
  // Inicializar historial de estado
  membership.status_history = [{
    status: membership.status,
    timestamp: new Date(),
    reason: 'Membresía creada'
  }];
});

// Hook para actualizar historial de estado cuando cambia
ClientMembership.beforeUpdate(async (membership) => {
  if (membership.changed('status')) {
    const history = membership.status_history || [];
    history.push({
      status: membership.status,
      previous_status: membership._previousDataValues.status,
      timestamp: new Date(),
      reason: 'Estado actualizado'
    });
    membership.status_history = history;
  }
});

// Método de instancia para verificar si está activa
ClientMembership.prototype.isActive = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.status === 'active' && 
         this.start_date <= today && 
         this.end_date >= today &&
         !this.is_frozen;
};

// Método de instancia para verificar si está vencida
ClientMembership.prototype.isExpired = function() {
  const today = new Date().toISOString().split('T')[0];
  return this.end_date < today;
};

// Método de instancia para calcular días restantes
ClientMembership.prototype.getDaysRemaining = function() {
  const today = new Date();
  const endDate = new Date(this.end_date);
  const diffTime = endDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
};

// Método de instancia para congelar membresía
ClientMembership.prototype.freeze = async function(reason) {
  if (this.is_frozen) {
    throw new Error('La membresía ya está congelada');
  }
  
  const MembershipType = sequelize.models.MembershipType;
  const membershipType = await MembershipType.findByPk(this.membership_type_id);
  
  if (!membershipType || membershipType.max_freeze_days === 0) {
    throw new Error('Esta membresía no permite congelamiento');
  }
  
  if (this.frozen_days_used >= membershipType.max_freeze_days) {
    throw new Error('Ya se utilizaron todos los días de congelamiento disponibles');
  }
  
  this.is_frozen = true;
  this.frozen_since = new Date();
  this.freeze_reason = reason;
  this.status = 'frozen';
  
  await this.save();
};

// Método de instancia para descongelar membresía
ClientMembership.prototype.unfreeze = async function() {
  if (!this.is_frozen) {
    throw new Error('La membresía no está congelada');
  }
  
  // Calcular días congelados
  const frozenDays = Math.floor((new Date() - new Date(this.frozen_since)) / (1000 * 60 * 60 * 24));
  this.frozen_days_used += frozenDays;
  
  // Extender la fecha de fin por los días congelados
  const endDate = new Date(this.end_date);
  endDate.setDate(endDate.getDate() + frozenDays);
  this.end_date = endDate.toISOString().split('T')[0];
  
  this.is_frozen = false;
  this.frozen_since = null;
  this.status = 'active';
  
  await this.save();
};

// Método de instancia para renovar membresía
ClientMembership.prototype.renew = async function() {
  const MembershipType = sequelize.models.MembershipType;
  const membershipType = await MembershipType.findByPk(this.membership_type_id);
  
  if (!membershipType) {
    throw new Error('Tipo de membresía no encontrado');
  }
  
  // Crear nueva membresía que inicia cuando termina la actual
  const newStartDate = new Date(this.end_date);
  newStartDate.setDate(newStartDate.getDate() + 1);
  
  const newEndDate = new Date(newStartDate);
  newEndDate.setDate(newEndDate.getDate() + membershipType.duration_days);
  
  const newMembership = await ClientMembership.create({
    client_id: this.client_id,
    membership_type_id: this.membership_type_id,
    start_date: newStartDate.toISOString().split('T')[0],
    end_date: newEndDate.toISOString().split('T')[0],
    amount_due: membershipType.price,
    auto_renewal: this.auto_renewal
  });
  
  return newMembership;
};

// Método de clase para encontrar membresías que vencen pronto
ClientMembership.findExpiringMemberships = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.findAll({
    where: {
      status: 'active',
      end_date: {
        [sequelize.Sequelize.Op.lte]: futureDate.toISOString().split('T')[0]
      }
    },
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.MembershipType,
        as: 'membershipType'
      }
    ]
  });
};

// Definir asociaciones - CORREGIDAS
ClientMembership.associate = function(models) {
  // Una membresía pertenece a un cliente
  if (models.Client) {
    ClientMembership.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'CASCADE'
    });
  }
  
  // Una membresía pertenece a un tipo de membresía
  if (models.MembershipType) {
    ClientMembership.belongsTo(models.MembershipType, {
      foreignKey: 'membership_type_id',
      as: 'membershipType',
      onDelete: 'RESTRICT'
    });
  }
  
  // Una membresía fue creada por un usuario
  if (models.User) {
    ClientMembership.belongsTo(models.User, {
      foreignKey: 'created_by_user_id',
      as: 'createdBy'
    });
  }
  
  // Una membresía puede tener muchos pagos
  if (models.Payment) {
    ClientMembership.hasMany(models.Payment, {
      foreignKey: 'membership_id',
      as: 'payments'
    });
  }
};

module.exports = ClientMembership;