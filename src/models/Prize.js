// Archivo: src/models/Prize.js
// CORREGIDO: Modelo para el catálogo de premios configurables

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Prize = sequelize.define('Prize', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del premio'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del premio es requerido'
      },
      len: {
        args: [2, 200],
        msg: 'El nombre debe tener entre 2 y 200 caracteres'
      }
    },
    comment: 'Nombre del premio'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del premio'
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Descripción corta para mostrar en la ruleta'
  },
  type: {
    type: DataTypes.ENUM(
      'membership_days', 'discount_percentage', 'discount_amount', 
      'free_product', 'points', 'cash', 'service', 'other'
    ),
    allowNull: false,
    comment: 'Tipo de premio: membership_days=Días gratis, discount_percentage=Descuento %, discount_amount=Descuento fijo, free_product=Producto gratis, points=Puntos, cash=Efectivo, service=Servicio, other=Otro'
  },
  category: {
    type: DataTypes.ENUM('basic', 'premium', 'exclusive', 'special'),
    allowNull: false,
    defaultValue: 'basic',
    comment: 'Categoría del premio que determina su valor'
  },
  // Configuración del valor del premio
  value: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: 0,
        msg: 'El valor no puede ser negativo'
      }
    },
    comment: 'Valor numérico del premio (días, porcentaje, monto, etc.)'
  },
  currency: {
    type: DataTypes.STRING(3),
    allowNull: false,
    defaultValue: 'GTQ',
    validate: {
      isIn: {
        args: [['GTQ', 'USD', 'POINTS', 'DAYS', 'PERCENT']],
        msg: 'Moneda debe ser GTQ, USD, POINTS, DAYS o PERCENT'
      }
    },
    comment: 'Unidad del valor (GTQ, USD, POINTS, DAYS, PERCENT)'
  },
  // Configuración específica para productos gratuitos
  free_product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del producto gratuito si el tipo es free_product'
  },
  product_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    },
    comment: 'Cantidad del producto gratuito'
  },
  // Estados del premio
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el premio está activo'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el premio debe destacarse'
  },
  // Configuración de disponibilidad
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Cantidad disponible del premio (null = ilimitado)'
  },
  awarded_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Cantidad de veces que se ha otorgado este premio'
  },
  redeemed_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Cantidad de veces que se ha canjeado este premio'
  },
  // Configuración de validez
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha desde cuando es válido el premio'
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha hasta cuando es válido (null = sin expiración)'
  },
  // Configuración de canje
  requires_manual_approval: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si requiere aprobación manual para canjear'
  },
  auto_apply: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Aplicar automáticamente sin requerir canje manual'
  },
  expiration_days: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Días para expirar después de ser ganado (null = no expira)'
  },
  // Configuración de uso
  max_per_client: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Máximo que puede ganar un cliente (null = ilimitado)'
  },
  max_per_day: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Máximo que se puede otorgar por día (null = ilimitado)'
  },
  max_per_week: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 1
    },
    comment: 'Máximo que se puede otorgar por semana (null = ilimitado)'
  },
  // Configuración visual
  color_code: {
    type: DataTypes.STRING(7),
    allowNull: true,
    validate: {
      is: {
        args: /^#[0-9A-Fa-f]{6}$/,
        msg: 'El código de color debe ser un hexadecimal válido (#RRGGBB)'
      }
    },
    comment: 'Color para mostrar en la ruleta'
  },
  icon_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nombre del ícono para mostrar'
  },
  image_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'images',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la imagen del premio'
  },
  // Configuración de términos y condiciones
  terms_and_conditions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Términos y condiciones específicos del premio'
  },
  usage_instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Instrucciones de uso del premio'
  },
  // Configuración de restricciones
  minimum_membership_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Días mínimos de membresía requeridos para este premio'
  },
  excluded_membership_types: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array de IDs de tipos de membresía excluidos'
  },
  minimum_age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Edad mínima requerida para este premio'
  },
  // Probabilidad en ruletas
  base_probability: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: false,
    defaultValue: 10.00,
    validate: {
      min: {
        args: 0.01,
        msg: 'La probabilidad mínima es 0.01%'
      },
      max: {
        args: 100.00,
        msg: 'La probabilidad máxima es 100%'
      }
    },
    comment: 'Probabilidad base del premio en las ruletas (%)'
  },
  // Configuración de notificaciones
  send_notification: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Enviar notificación al cliente cuando gane este premio'
  },
  notification_template: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Template personalizado para la notificación'
  },
  // Metadatos
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos adicionales del premio'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de visualización'
  },
  // Información de creación
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que creó el premio'
  }
}, {
  tableName: 'prizes',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      fields: ['name']
    },
    {
      fields: ['type']
    },
    {
      fields: ['category']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['valid_from', 'valid_until']
    },
    {
      fields: ['free_product_id']
    },
    {
      fields: ['awarded_count']
    },
    {
      fields: ['base_probability']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['created_by_user_id']
    }
  ],
  comment: 'Tabla de premios configurables para gamificación'
});

// Método de instancia para verificar disponibilidad
Prize.prototype.isAvailable = function() {
  const now = new Date();
  
  if (!this.is_active) return { available: false, reason: 'Premio desactivado' };
  if (this.valid_from > now) return { available: false, reason: 'Premio aún no válido' };
  if (this.valid_until && this.valid_until < now) return { available: false, reason: 'Premio expirado' };
  
  // Verificar stock
  if (this.stock_quantity !== null && this.awarded_count >= this.stock_quantity) {
    return { available: false, reason: 'Premio agotado' };
  }
  
  return { available: true };
};

// CORREGIDO: Método de instancia para verificar límites diarios/semanales
Prize.prototype.checkLimits = async function() {
  const now = new Date();
  
  // Verificar límite diario
  if (this.max_per_day && sequelize.models.PrizeWinning) {
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const todayCount = await sequelize.models.PrizeWinning.count({
      where: {
        prize_id: this.id,
        created_at: {
          [sequelize.Sequelize.Op.gte]: todayStart
        }
      }
    });
    
    if (todayCount >= this.max_per_day) {
      return { available: false, reason: 'Límite diario alcanzado' };
    }
  }
  
  // Verificar límite semanal
  if (this.max_per_week && sequelize.models.PrizeWinning) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    weekStart.setHours(0, 0, 0, 0);
    
    const weekCount = await sequelize.models.PrizeWinning.count({
      where: {
        prize_id: this.id,
        created_at: {
          [sequelize.Sequelize.Op.gte]: weekStart
        }
      }
    });
    
    if (weekCount >= this.max_per_week) {
      return { available: false, reason: 'Límite semanal alcanzado' };
    }
  }
  
  return { available: true };
};

// CORREGIDO: Método de instancia para verificar elegibilidad del cliente
Prize.prototype.checkClientEligibility = async function(clientId) {
  if (!sequelize.models.Client) {
    return { eligible: false, reason: 'Modelo Cliente no disponible' };
  }

  // CORREGIDO: Construir includes dinámicamente
  const includeOptions = [];
  
  if (sequelize.models.ClientMembership) {
    includeOptions.push({
      model: sequelize.models.ClientMembership,
      as: 'memberships',
      where: { status: 'active' },
      required: false
    });
  }

  const client = await sequelize.models.Client.findByPk(clientId, {
    include: includeOptions
  });
  
  if (!client) {
    return { eligible: false, reason: 'Cliente no encontrado' };
  }
  
  // Verificar edad mínima
  if (this.minimum_age && client.getAge() < this.minimum_age) {
    return { eligible: false, reason: `Edad mínima requerida: ${this.minimum_age} años` };
  }
  
  // Verificar días mínimos de membresía
  if (this.minimum_membership_days > 0) {
    const membershipDays = Math.floor((new Date() - new Date(client.registration_date)) / (1000 * 60 * 60 * 24));
    if (membershipDays < this.minimum_membership_days) {
      return { eligible: false, reason: `Requiere ${this.minimum_membership_days} días de membresía` };
    }
  }
  
  // Verificar tipos de membresía excluidos
  if (this.excluded_membership_types && client.memberships && client.memberships.length > 0) {
    const currentMembershipTypeId = client.memberships[0].membership_type_id;
    if (this.excluded_membership_types.includes(currentMembershipTypeId)) {
      return { eligible: false, reason: 'Tipo de membresía no elegible para este premio' };
    }
  }
  
  // Verificar límite por cliente
  if (this.max_per_client && sequelize.models.PrizeWinning) {
    const clientCount = await sequelize.models.PrizeWinning.count({
      where: {
        client_id: clientId,
        prize_id: this.id
      }
    });
    
    if (clientCount >= this.max_per_client) {
      return { eligible: false, reason: 'Límite por cliente alcanzado' };
    }
  }
  
  return { eligible: true };
};

// CORREGIDO: Método de instancia para aplicar premio automáticamente
Prize.prototype.applyToClient = async function(clientId) {
  if (!this.auto_apply) {
    return { applied: false, reason: 'Premio requiere canje manual' };
  }
  
  if (!sequelize.models.Client) {
    return { applied: false, reason: 'Modelo Cliente no disponible' };
  }

  const client = await sequelize.models.Client.findByPk(clientId);
  
  if (!client) {
    throw new Error('Cliente no encontrado');
  }
  
  switch (this.type) {
    case 'membership_days':
      await this.applyMembershipDays(client);
      break;
      
    case 'points':
      await client.addPoints(this.value, `Premio: ${this.name}`);
      break;
      
    case 'discount_percentage':
    case 'discount_amount':
      // Los descuentos se aplican en el momento de compra
      // Solo registramos que se ganó
      break;
      
    case 'free_product':
      await this.applyFreeProduct(client);
      break;
      
    default:
      // Para otros tipos, solo registrar que se ganó
      break;
  }
  
  return { applied: true };
};

// CORREGIDO: Método para aplicar días gratis de membresía
Prize.prototype.applyMembershipDays = async function(client) {
  if (!sequelize.models.ClientMembership) return;

  const activeMembership = await sequelize.models.ClientMembership.findOne({
    where: {
      client_id: client.id,
      status: 'active'
    }
  });
  
  if (activeMembership) {
    // Extender la membresía actual
    const currentEndDate = new Date(activeMembership.end_date);
    currentEndDate.setDate(currentEndDate.getDate() + parseInt(this.value));
    activeMembership.end_date = currentEndDate.toISOString().split('T')[0];
    await activeMembership.save();
  }
};

// CORREGIDO: Método para aplicar producto gratuito
Prize.prototype.applyFreeProduct = async function(client) {
  if (!this.free_product_id) return;
  
  // Crear una orden especial para el producto gratuito
  if (sequelize.models.Order && sequelize.models.OrderItem && sequelize.models.Product) {
    const product = await sequelize.models.Product.findByPk(this.free_product_id);
    if (!product) return;
    
    const order = await sequelize.models.Order.create({
      client_id: client.id,
      delivery_mode: 'pickup',
      subtotal: 0,
      total_amount: 0,
      status: 'confirmed',
      payment_status: 'paid'
    });
    
    await sequelize.models.OrderItem.create({
      order_id: order.id,
      product_id: this.free_product_id,
      quantity: this.product_quantity,
      unit_price: 0,
      total_price: 0,
      delivery_mode: 'pickup',
      item_status: 'confirmed'
    });
  }
};

// Método de instancia para incrementar contadores
Prize.prototype.incrementAwarded = async function() {
  this.awarded_count += 1;
  await this.save();
};

// Método de instancia para incrementar canjeados
Prize.prototype.incrementRedeemed = async function() {
  this.redeemed_count += 1;
  await this.save();
};

// Método de clase para obtener premios por categoría
Prize.findByCategory = function(category) {
  return this.findAll({
    where: {
      category: category,
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

// Método de clase para obtener premios disponibles
Prize.findAvailable = function() {
  const now = new Date();
  
  return this.findAll({
    where: {
      is_active: true,
      valid_from: {
        [sequelize.Sequelize.Op.lte]: now
      },
      [sequelize.Sequelize.Op.or]: [
        { valid_until: null },
        { valid_until: { [sequelize.Sequelize.Op.gte]: now } }
      ]
    },
    order: [['category', 'ASC'], ['sort_order', 'ASC']]
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
Prize.associate = function(models) {
  // Un premio puede tener un producto gratuito asociado
  if (models.Product) {
    Prize.belongsTo(models.Product, {
      foreignKey: 'free_product_id',
      as: 'freeProduct',
      onDelete: 'SET NULL'
    });
  }
  
  // Un premio puede tener una imagen
  if (models.Image) {
    Prize.belongsTo(models.Image, {
      foreignKey: 'image_id',
      as: 'image',
      onDelete: 'SET NULL'
    });
  }
  
  // Un premio fue creado por un usuario
  if (models.User) {
    Prize.belongsTo(models.User, {
      foreignKey: 'created_by_user_id',
      as: 'createdBy'
    });
  }
  
  // Un premio puede ser ganado muchas veces
  if (models.PrizeWinning) {
    Prize.hasMany(models.PrizeWinning, {
      foreignKey: 'prize_id',
      as: 'winnings'
    });
  }
  
  // Un premio puede ser usado como premio fijo en códigos QR
  if (models.QRCode) {
    Prize.hasMany(models.QRCode, {
      foreignKey: 'fixed_prize_id',
      as: 'qrCodes'
    });
  }
};

module.exports = Prize;