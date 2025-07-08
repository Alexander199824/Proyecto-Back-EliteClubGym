// Archivo: src/models/OrderItem.js
// CORREGIDO: Modelo para los ítems específicos de cada orden

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const OrderItem = sequelize.define('OrderItem', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del ítem de la orden'
  },
  order_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'orders',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID de la orden a la que pertenece este ítem'
  },
  product_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'RESTRICT',
    comment: 'ID del producto ordenado'
  },
  quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: {
        args: 1,
        msg: 'La cantidad debe ser al menos 1'
      }
    },
    comment: 'Cantidad de productos ordenados'
  },
  unit_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0,
        msg: 'El precio unitario no puede ser negativo'
      }
    },
    comment: 'Precio unitario al momento de la orden'
  },
  total_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0,
        msg: 'El precio total no puede ser negativo'
      }
    },
    comment: 'Precio total del ítem (unit_price * quantity)'
  },
  // Información del producto al momento de la orden
  product_name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: 'Nombre del producto al momento de la orden (para histórico)'
  },
  product_sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'SKU del producto al momento de la orden'
  },
  product_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción del producto al momento de la orden'
  },
  // Estado específico del ítem
  item_status: {
    type: DataTypes.ENUM('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado específico de este ítem'
  },
  // Configuración específica del ítem
  delivery_mode: {
    type: DataTypes.ENUM('pickup', 'delivery', 'reservation', 'backorder'),
    allowNull: false,
    comment: 'Modalidad de entrega para este ítem específico'
  },
  estimated_availability_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha estimada de disponibilidad para este ítem'
  },
  actual_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha real de entrega de este ítem'
  },
  // Información de stock
  reserved_stock: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el stock fue reservado para este ítem'
  },
  stock_reserved_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se reservó el stock'
  },
  stock_allocated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el stock fue asignado definitivamente'
  },
  // Descuentos específicos del ítem
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Descuento aplicado a este ítem específico'
  },
  discount_reason: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Razón del descuento aplicado'
  },
  // Configuración de gamificación
  has_qr_code: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si este ítem tendrá código QR para gamificación'
  },
  qr_code_generated: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si ya se generó el código QR'
  },
  qr_codes_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de códigos QR generados para este ítem'
  },
  // Información de proveedor (para backorder)
  supplier_order_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha cuando se pidió al proveedor'
  },
  supplier_estimated_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha estimada de llegada del proveedor'
  },
  supplier_tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Número de seguimiento del proveedor'
  },
  // Notas específicas del ítem
  item_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas específicas sobre este ítem'
  },
  special_instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Instrucciones especiales para este ítem'
  },
  // Control de calidad
  quality_checked: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si pasó control de calidad'
  },
  quality_check_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del control de calidad'
  },
  quality_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas del control de calidad'
  },
  // Información de devolución
  is_returnable: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el ítem puede ser devuelto'
  },
  return_deadline: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha límite para devolución'
  },
  // Metadatos del ítem
  item_metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos adicionales del ítem en formato JSON'
  }
}, {
  tableName: 'order_items',
  timestamps: true,
  indexes: [
    {
      fields: ['order_id']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['item_status']
    },
    {
      fields: ['delivery_mode']
    },
    {
      fields: ['estimated_availability_date']
    },
    {
      fields: ['reserved_stock']
    },
    {
      fields: ['stock_allocated']
    },
    {
      fields: ['has_qr_code']
    },
    {
      fields: ['qr_code_generated']
    },
    {
      fields: ['quality_checked']
    },
    {
      // Índice compuesto para búsquedas frecuentes
      fields: ['order_id', 'item_status']
    },
    {
      // Índice para items que necesitan QR
      fields: ['has_qr_code', 'qr_code_generated']
    }
  ],
  comment: 'Tabla de ítems específicos de cada orden'
});

// Hook para calcular precio total automáticamente
OrderItem.beforeSave(async (orderItem) => {
  // Calcular precio total
  orderItem.total_price = parseFloat(orderItem.unit_price) * orderItem.quantity - parseFloat(orderItem.discount_amount);
  
  // Asegurar que el precio total no sea negativo
  if (orderItem.total_price < 0) {
    orderItem.total_price = 0;
  }
  
  // Si es una creación nueva, copiar información del producto
  if (orderItem.isNewRecord && orderItem.product_id) {
    try {
      if (sequelize.models.Product) {
        const product = await sequelize.models.Product.findByPk(orderItem.product_id);
        
        if (product) {
          orderItem.product_name = product.name;
          orderItem.product_sku = product.sku;
          orderItem.product_description = product.short_description || product.description;
          orderItem.has_qr_code = product.has_qr_code;
          
          // Determinar si es retornable basado en el tipo de producto
          orderItem.is_returnable = !product.is_digital && product.category !== 'supplements_opened';
          
          // Calcular fecha límite de devolución (30 días)
          if (orderItem.is_returnable) {
            const returnDate = new Date();
            returnDate.setDate(returnDate.getDate() + 30);
            orderItem.return_deadline = returnDate.toISOString().split('T')[0];
          }
        }
      }
    } catch (error) {
      console.error('Error obteniendo información del producto:', error);
    }
  }
});

// Hook para actualizar el total de la orden cuando cambia un ítem
OrderItem.afterSave(async (orderItem) => {
  await orderItem.updateOrderTotals();
});

OrderItem.afterDestroy(async (orderItem) => {
  await orderItem.updateOrderTotals();
});

// Método de instancia para reservar stock
OrderItem.prototype.reserveStock = async function() {
  if (this.reserved_stock) {
    throw new Error('El stock ya está reservado para este ítem');
  }
  
  if (sequelize.models.Product) {
    const product = await sequelize.models.Product.findByPk(this.product_id);
    
    if (!product) {
      throw new Error('Producto no encontrado');
    }
    
    if (product.track_inventory && product.stock_quantity < this.quantity) {
      throw new Error('Stock insuficiente para reservar');
    }
    
    if (product.track_inventory) {
      await product.updateStock(this.quantity, 'subtract', `Reservado para orden ${this.order_id}`);
    }
    
    this.reserved_stock = true;
    this.stock_reserved_date = new Date();
    await this.save();
  }
};

// Método de instancia para liberar stock reservado
OrderItem.prototype.releaseStock = async function() {
  if (!this.reserved_stock) return;
  
  if (sequelize.models.Product) {
    const product = await sequelize.models.Product.findByPk(this.product_id);
    
    if (product && product.track_inventory) {
      await product.updateStock(this.quantity, 'add', `Stock liberado de orden ${this.order_id}`);
    }
    
    this.reserved_stock = false;
    this.stock_reserved_date = null;
    await this.save();
  }
};

// Método de instancia para asignar stock definitivamente
OrderItem.prototype.allocateStock = async function() {
  if (!this.reserved_stock) {
    await this.reserveStock();
  }
  
  this.stock_allocated = true;
  await this.save();
};

// Método de instancia para generar códigos QR
OrderItem.prototype.generateQRCodes = async function() {
  if (!this.has_qr_code || this.qr_code_generated) return;
  
  if (sequelize.models.QRCode) {
    // Generar un código QR por cada unidad del producto
    for (let i = 0; i < this.quantity; i++) {
      await sequelize.models.QRCode.create({
        product_id: this.product_id,
        order_id: this.order_id,
        order_item_id: this.id,
        client_id: null, // Se asignará cuando se entregue
        code_type: 'product',
        is_active: true
      });
    }
    
    this.qr_code_generated = true;
    this.qr_codes_count = this.quantity;
    await this.save();
  }
};

// Método de instancia para marcar como entregado
OrderItem.prototype.markAsDelivered = async function() {
  this.item_status = 'delivered';
  this.actual_delivery_date = new Date().toISOString().split('T')[0];
  
  // Actualizar estadísticas del producto
  if (sequelize.models.Product) {
    const product = await sequelize.models.Product.findByPk(this.product_id);
    if (product) {
      await product.updateSalesStats(this.quantity, this.total_price);
    }
  }
  
  await this.save();
};

// Método de instancia para actualizar totales de la orden
OrderItem.prototype.updateOrderTotals = async function() {
  if (sequelize.models.Order) {
    const order = await sequelize.models.Order.findByPk(this.order_id, {
      include: [{
        model: OrderItem,
        as: 'orderItems'
      }]
    });
    
    if (order) {
      const totals = order.calculateTotals();
      await order.update(totals);
    }
  }
};

// Método de instancia para verificar disponibilidad
OrderItem.prototype.checkAvailability = async function() {
  if (sequelize.models.Product) {
    const product = await sequelize.models.Product.findByPk(this.product_id);
    
    if (!product) {
      return {
        available: false,
        message: 'Producto no encontrado'
      };
    }
    
    return product.checkAvailability(this.delivery_mode, this.quantity);
  }
  
  return {
    available: false,
    message: 'No se pudo verificar disponibilidad'
  };
};

// Método de clase para buscar ítems que necesitan QR
OrderItem.findNeedingQRGeneration = function() {
  return this.findAll({
    where: {
      has_qr_code: true,
      qr_code_generated: false,
      item_status: ['confirmed', 'preparing', 'ready']
    },
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        required: false
      },
      {
        model: sequelize.models.Order,
        as: 'order',
        required: false
      }
    ]
  });
};

// Método de clase para buscar ítems por estado
OrderItem.findByStatus = function(status) {
  return this.findAll({
    where: {
      item_status: status
    },
    include: [
      {
        model: sequelize.models.Product,
        as: 'product',
        required: false
      },
      {
        model: sequelize.models.Order,
        as: 'order',
        required: false,
        include: [{
          model: sequelize.models.Client,
          as: 'client',
          required: false
        }]
      }
    ],
    order: [['created_at', 'ASC']]
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
OrderItem.associate = function(models) {
  // Un ítem pertenece a una orden
  if (models.Order) {
    OrderItem.belongsTo(models.Order, {
      foreignKey: 'order_id',
      as: 'order',
      onDelete: 'CASCADE'
    });
  }
  
  // Un ítem corresponde a un producto
  if (models.Product) {
    OrderItem.belongsTo(models.Product, {
      foreignKey: 'product_id',
      as: 'product',
      onDelete: 'RESTRICT'
    });
  }
  
  // Un ítem puede tener muchos códigos QR
  if (models.QRCode) {
    OrderItem.hasMany(models.QRCode, {
      foreignKey: 'order_item_id',
      as: 'qrCodes'
    });
  }
};

module.exports = OrderItem;