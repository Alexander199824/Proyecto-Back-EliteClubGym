// Archivo: src/models/QRCode.js
// CORREGIDO: Modelo para códigos QR únicos vinculados a productos y gamificación

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const QRCode = sequelize.define('QRCode', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del código QR'
  },
  code: {
    type: DataTypes.STRING(255),
    allowNull: false,
    // CORREGIDO: Removido unique: true de aquí
    comment: 'Código QR único generado'
  },
  code_type: {
    type: DataTypes.ENUM('product', 'reminder', 'prize', 'checkin', 'special'),
    allowNull: false,
    comment: 'Tipo de código QR: product=Producto, reminder=Recordatorio, prize=Premio directo, checkin=Check-in, special=Especial'
  },
  // Relaciones
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del producto si es un QR de producto'
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la orden si proviene de una compra'
  },
  order_item_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'order_items',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del ítem de orden específico'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID del cliente propietario (se asigna al entregar el producto)'
  },
  // Estados del código
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el código está activo para escaneado'
  },
  is_used: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el código ya fue utilizado'
  },
  used_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha y hora cuando se utilizó el código'
  },
  used_by_client_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'ID del cliente que utilizó el código (puede ser diferente al propietario)'
  },
  // Configuración de premio
  prize_category: {
    type: DataTypes.ENUM('basic', 'premium', 'exclusive', 'special'),
    allowNull: false,
    defaultValue: 'basic',
    comment: 'Categoría de premio que otorga este QR'
  },
  fixed_prize_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'prizes',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de un premio fijo (si no usa ruleta)'
  },
  // Fechas de validez
  valid_from: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha desde cuando es válido el código'
  },
  valid_until: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha hasta cuando es válido (null = sin expiración)'
  },
  // Configuración de uso
  max_uses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    validate: {
      min: 1
    },
    comment: 'Número máximo de veces que puede ser usado'
  },
  current_uses: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número actual de usos'
  },
  // Información adicional
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción del código QR'
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Instrucciones para el usuario sobre cómo usar el código'
  },
  // Configuración de ubicación (para check-in)
  location_restricted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el código solo puede usarse en ubicaciones específicas'
  },
  allowed_locations: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Array de ubicaciones donde puede usarse el código'
  },
  // Configuración de horario
  time_restricted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el código tiene restricciones de horario'
  },
  allowed_hours_start: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de inicio permitida para usar el código'
  },
  allowed_hours_end: {
    type: DataTypes.TIME,
    allowNull: true,
    comment: 'Hora de fin permitida para usar el código'
  },
  // Metadatos
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información adicional del código en formato JSON'
  },
  // Configuración de ruleta personalizada
  custom_roulette_config: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuración personalizada de ruleta para este código'
  },
  // Control de fraude
  ip_restrictions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Restricciones de IP para prevenir fraude'
  },
  device_fingerprint: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Huella digital del dispositivo para control de fraude'
  },
  // Estadísticas
  scan_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de veces que ha sido escaneado (incluyendo intentos fallidos)'
  },
  last_scan_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del último escaneo'
  },
  // Información de creación
  created_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que creó el código (si fue manual)'
  },
  batch_id: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'ID del lote si fue generado en masa'
  }
}, {
  tableName: 'qr_codes',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    // CORREGIDO: Movido unique constraint a indexes
    {
      unique: true,
      fields: ['code']
    },
    {
      fields: ['code_type']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['order_id']
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_used']
    },
    {
      fields: ['used_date']
    },
    {
      fields: ['valid_from', 'valid_until']
    },
    {
      fields: ['prize_category']
    },
    {
      fields: ['batch_id']
    },
    {
      // Índice compuesto para códigos activos y válidos
      fields: ['is_active', 'is_used', 'valid_until']
    }
  ],
  comment: 'Tabla de códigos QR únicos para gamificación y productos'
});

// Hook para generar código único automáticamente
QRCode.beforeCreate(async (qrCode) => {
  if (!qrCode.code) {
    qrCode.code = await QRCode.generateUniqueCode();
  }
  
  // Configurar fecha de validez por defecto según el tipo
  if (!qrCode.valid_until) {
    const validUntil = new Date();
    switch (qrCode.code_type) {
      case 'product':
        validUntil.setFullYear(validUntil.getFullYear() + 1); // 1 año
        break;
      case 'reminder':
        validUntil.setMonth(validUntil.getMonth() + 6); // 6 meses
        break;
      case 'prize':
        validUntil.setMonth(validUntil.getMonth() + 3); // 3 meses
        break;
      case 'checkin':
        // Sin expiración para códigos de check-in
        qrCode.valid_until = null;
        break;
      default:
        validUntil.setMonth(validUntil.getMonth() + 12); // 12 meses por defecto
    }
    
    if (qrCode.valid_until !== null) {
      qrCode.valid_until = validUntil;
    }
  }
});

// Método de clase para generar código único
QRCode.generateUniqueCode = async function() {
  let code;
  let attempts = 0;
  const maxAttempts = 10;
  
  do {
    // Generar código con timestamp + random para garantizar unicidad
    const timestamp = Date.now().toString(36);
    const randomPart = crypto.randomBytes(8).toString('hex').toUpperCase();
    code = `QR-${timestamp}-${randomPart}`;
    
    const existing = await this.findOne({ where: { code } });
    if (!existing) break;
    
    attempts++;
  } while (attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    throw new Error('No se pudo generar un código QR único');
  }
  
  return code;
};

// Método de instancia para verificar validez
QRCode.prototype.isValid = function() {
  const now = new Date();
  
  if (!this.is_active) return { valid: false, reason: 'Código desactivado' };
  if (this.current_uses >= this.max_uses) return { valid: false, reason: 'Código agotado' };
  if (this.valid_from > now) return { valid: false, reason: 'Código aún no válido' };
  if (this.valid_until && this.valid_until < now) return { valid: false, reason: 'Código expirado' };
  
  return { valid: true };
};

// Método de instancia para verificar restricciones de tiempo
QRCode.prototype.isValidTime = function(time = new Date()) {
  if (!this.time_restricted) return true;
  
  const currentTime = time instanceof Date ? 
    time.toTimeString().slice(0, 8) : time;
  
  if (this.allowed_hours_start && this.allowed_hours_end) {
    const start = this.allowed_hours_start;
    const end = this.allowed_hours_end;
    
    // Si cruza medianoche
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    } else {
      return currentTime >= start && currentTime <= end;
    }
  }
  
  return true;
};

// Método de instancia para verificar restricciones de ubicación
QRCode.prototype.isValidLocation = function(userLocation) {
  if (!this.location_restricted || !this.allowed_locations) return true;
  
  // Implementar lógica de verificación de ubicación
  // Por simplicidad, verificamos si la ubicación está en la lista permitida
  return this.allowed_locations.some(location => {
    if (location.coordinates && userLocation.coordinates) {
      // Calcular distancia entre coordenadas
      const distance = this.calculateDistance(
        location.coordinates.lat, 
        location.coordinates.lng,
        userLocation.coordinates.lat, 
        userLocation.coordinates.lng
      );
      return distance <= (location.radius || 100); // Radio por defecto 100 metros
    }
    return false;
  });
};

// Método para calcular distancia entre coordenadas
QRCode.prototype.calculateDistance = function(lat1, lon1, lat2, lon2) {
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

// Método de instancia para usar el código
QRCode.prototype.use = async function(clientId, metadata = {}) {
  const validation = this.isValid();
  if (!validation.valid) {
    throw new Error(validation.reason);
  }
  
  if (!this.isValidTime()) {
    throw new Error('Código no válido en este horario');
  }
  
  // Incrementar contadores
  this.current_uses += 1;
  this.scan_count += 1;
  this.last_scan_date = new Date();
  
  // Si alcanza el máximo de usos, marcarlo como usado
  if (this.current_uses >= this.max_uses) {
    this.is_used = true;
    this.used_date = new Date();
    this.used_by_client_id = clientId;
  }
  
  await this.save();
  
  // Registrar el uso en el historial si se requiere
  // Aquí se podría crear un registro en una tabla de historial de usos
  
  return {
    success: true,
    uses_remaining: this.max_uses - this.current_uses,
    prize_category: this.prize_category,
    metadata: this.metadata
  };
};

// Método de instancia para desactivar
QRCode.prototype.deactivate = async function(reason = null) {
  this.is_active = false;
  this.metadata = { 
    ...this.metadata, 
    deactivation_reason: reason,
    deactivated_at: new Date()
  };
  await this.save();
};

// Método de clase para buscar códigos por producto
QRCode.findByProduct = function(productId, includeUsed = false) {
  const whereClause = { 
    product_id: productId,
    is_active: true
  };
  
  if (!includeUsed) {
    whereClause.is_used = false;
  }
  
  return this.findAll({
    where: whereClause,
    order: [['created_at', 'DESC']]
  });
};

// Método de clase para buscar códigos que expiran pronto
QRCode.findExpiringCodes = function(daysAhead = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);
  
  return this.findAll({
    where: {
      is_active: true,
      is_used: false,
      valid_until: {
        [sequelize.Sequelize.Op.lte]: futureDate,
        [sequelize.Sequelize.Op.gte]: new Date()
      }
    },
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        required: false
      },
      {
        model: sequelize.models.Client,
        as: 'client',
        required: false
      }
    ]
  });
};

// Método de clase para generar códigos en lote
QRCode.generateBatch = async function(count, config = {}) {
  const batchId = `BATCH-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const codes = [];
  
  for (let i = 0; i < count; i++) {
    const codeData = {
      batch_id: batchId,
      code_type: config.code_type || 'special',
      prize_category: config.prize_category || 'basic',
      max_uses: config.max_uses || 1,
      ...config
    };
    
    const qrCode = await this.create(codeData);
    codes.push(qrCode);
  }
  
  return { batch_id: batchId, codes };
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
QRCode.associate = function(models) {
  // Un código QR puede estar vinculado a un producto
  if (models.Product) {
    QRCode.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
      onDelete: 'SET NULL'
    });
  }
  
  // Un código QR puede estar vinculado a una orden
  if (models.Order) {
    QRCode.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order',
      onDelete: 'SET NULL'
    });
  }
  
  // Un código QR puede estar vinculado a un ítem de orden
  if (models.OrderItem) {
    QRCode.belongsTo(models.OrderItem, {
      foreignKey: 'order_item_id',
      as: 'orderItem',
      onDelete: 'SET NULL'
    });
  }
  
  // Un código QR puede pertenecer a un cliente
  if (models.Client) {
    QRCode.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'SET NULL'
    });
  }
  
  // Un código QR fue usado por un cliente
  if (models.Client) {
    QRCode.belongsTo(models.Client, {
      foreignKey: 'used_by_client_id',
      as: 'usedByClient',
      onDelete: 'SET NULL'
    });
  }
  
  // Un código QR puede tener un premio fijo
  if (models.Prize) {
    QRCode.belongsTo(models.Prize, {
      foreignKey: 'fixed_prize_id',
      as: 'fixedPrize',
      onDelete: 'SET NULL'
    });
  }
  
  // Un código QR fue creado por un usuario
  if (models.User) {
    QRCode.belongsTo(models.User, {
      foreignKey: 'created_by_user_id',
      as: 'createdBy'
    });
  }
  
  // Un código QR puede generar muchos premios ganados
  if (models.PrizeWinning) {
    QRCode.hasMany(models.PrizeWinning, {
      foreignKey: 'qr_code_id',
      as: 'prizeWinnings'
    });
  }
};

module.exports = QRCode;