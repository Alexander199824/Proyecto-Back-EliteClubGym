// Archivo: src/models/Order.js
// CORREGIDO: Modelo para las órdenes de compra con modalidades de entrega

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la orden'
  },
  client_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'clients',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del cliente que realizó la orden'
  },
  order_number: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // CORREGIDO: Removido unique: true de aquí
    comment: 'Número único de la orden para tracking'
  },
  status: {
    type: DataTypes.ENUM(
      'pending', 'pending_payment', 'confirmed', 'preparing', 
      'ready_pickup', 'shipped', 'delivered', 'cancelled', 'refunded'
    ),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado actual de la orden'
  },
  payment_status: {
    type: DataTypes.ENUM('pending', 'processing', 'paid', 'failed', 'refunded', 'partial'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Estado del pago de la orden'
  },
  // Modalidad de entrega
  delivery_mode: {
    type: DataTypes.ENUM('pickup', 'delivery', 'reservation', 'backorder'),
    allowNull: false,
    comment: 'Modalidad de entrega: pickup=Recogida, delivery=Envío, reservation=Apartado, backorder=Bajo pedido'
  },
  // Información de totales
  subtotal: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0,
        msg: 'El subtotal no puede ser negativo'
      }
    },
    comment: 'Subtotal de productos sin impuestos ni envío'
  },
  tax_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Monto de impuestos'
  },
  shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Costo de envío'
  },
  discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: 0
    },
    comment: 'Monto de descuento aplicado'
  },
  total_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: {
        args: 0,
        msg: 'El total no puede ser negativo'
      }
    },
    comment: 'Monto total de la orden'
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
    comment: 'Moneda de la orden'
  },
  // Información de entrega
  delivery_address: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Dirección de entrega en formato JSON'
  },
  delivery_instructions: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Instrucciones especiales para la entrega'
  },
  estimated_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha estimada de entrega'
  },
  actual_delivery_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha real de entrega'
  },
  pickup_location: {
    type: DataTypes.STRING(200),
    allowNull: true,
    defaultValue: 'Elite Fitness Club - Recepción',
    comment: 'Ubicación para recogida del producto'
  },
  // Tracking
  tracking_number: {
    type: DataTypes.STRING(100),
    allowNull: true,
    // CORREGIDO: Removido unique: true de aquí
    comment: 'Número de seguimiento para envíos'
  },
  carrier_name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Nombre de la empresa de envío'
  },
  // Fechas importantes
  order_date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW,
    comment: 'Fecha y hora de creación de la orden'
  },
  confirmed_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se confirmó la orden'
  },
  shipped_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se envió la orden'
  },
  cancelled_date: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha cuando se canceló la orden'
  },
  // Información del cliente al momento de la orden
  client_info: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información del cliente al momento de crear la orden'
  },
  // Configuración de la orden
  requires_prescription: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la orden requiere prescripción médica'
  },
  prescription_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la prescripción fue verificada'
  },
  age_verification_required: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si se requiere verificación de edad'
  },
  age_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la edad fue verificada'
  },
  // Códigos de descuento
  coupon_code: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Código de cupón aplicado'
  },
  coupon_discount_amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Monto de descuento por cupón'
  },
  // Notas
  client_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas del cliente sobre la orden'
  },
  staff_notes: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Notas internas del personal'
  },
  // Información de procesamiento
  processed_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que procesó la orden'
  },
  // Para órdenes bajo pedido y apartado
  supplier_order_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha cuando se pidió al proveedor (para backorder)'
  },
  supplier_estimated_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha estimada de llegada del proveedor'
  },
  reservation_expires_date: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: 'Fecha de expiración de la reserva'
  },
  // Historial de estados
  status_history: {
    type: DataTypes.JSON,
    allowNull: false,
    defaultValue: [],
    comment: 'Historial de cambios de estado con timestamps'
  },
  // Información de contacto de emergencia para entrega
  emergency_contact: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Contacto de emergencia para entrega'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    // CORREGIDO: Movido unique constraints a indexes
    {
      unique: true,
      fields: ['order_number']
    },
    {
      unique: true,
      fields: ['tracking_number'],
      where: {
        tracking_number: {
          [sequelize.Sequelize.Op.ne]: null
        }
      }
    },
    {
      fields: ['client_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['payment_status']
    },
    {
      fields: ['delivery_mode']
    },
    {
      fields: ['order_date']
    },
    {
      fields: ['estimated_delivery_date']
    },
    {
      fields: ['processed_by_user_id']
    },
    {
      // Índice compuesto para búsquedas frecuentes
      fields: ['client_id', 'status', 'delivery_mode']
    },
    {
      // Índice para órdenes pendientes de procesamiento
      fields: ['status', 'order_date']
    }
  ],
  comment: 'Tabla de órdenes de compra con modalidades de entrega'
});

// Hook para generar número de orden automáticamente
Order.beforeCreate(async (order) => {
  if (!order.order_number) {
    const date = new Date();
    const year = date.getFullYear().toString().slice(-2);
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    order.order_number = `ORD-${year}${month}${day}-${random}`;
  }
  
  // Inicializar historial de estado
  order.status_history = [{
    status: order.status,
    timestamp: new Date(),
    reason: 'Orden creada'
  }];
  
  // Calcular fecha estimada de entrega según modalidad
  if (!order.estimated_delivery_date) {
    const estimatedDate = new Date();
    switch (order.delivery_mode) {
      case 'pickup':
        estimatedDate.setHours(estimatedDate.getHours() + 2);
        break;
      case 'delivery':
        estimatedDate.setDate(estimatedDate.getDate() + 3);
        break;
      case 'reservation':
        estimatedDate.setDate(estimatedDate.getDate() + 7);
        break;
      case 'backorder':
        estimatedDate.setDate(estimatedDate.getDate() + 14);
        break;
    }
    order.estimated_delivery_date = estimatedDate.toISOString().split('T')[0];
  }
});

// Hook para actualizar historial de estado cuando cambia
Order.beforeUpdate(async (order) => {
  if (order.changed('status')) {
    const history = order.status_history || [];
    history.push({
      status: order.status,
      previous_status: order._previousDataValues.status,
      timestamp: new Date(),
      reason: 'Estado actualizado'
    });
    order.status_history = history;
    
    // Actualizar fechas específicas según el estado
    const now = new Date();
    switch (order.status) {
      case 'confirmed':
        if (!order.confirmed_date) order.confirmed_date = now;
        break;
      case 'shipped':
        if (!order.shipped_date) order.shipped_date = now;
        break;
      case 'delivered':
        if (!order.actual_delivery_date) {
          order.actual_delivery_date = now.toISOString().split('T')[0];
        }
        break;
      case 'cancelled':
        if (!order.cancelled_date) order.cancelled_date = now;
        break;
    }
  }
});

// Método de instancia para calcular totales
Order.prototype.calculateTotals = function() {
  // Este método será llamado después de actualizar los items
  // Los totales se calculan basándose en los OrderItems relacionados
  let subtotal = 0;
  
  if (this.orderItems) {
    subtotal = this.orderItems.reduce((total, item) => {
      return total + (parseFloat(item.unit_price) * item.quantity);
    }, 0);
  }
  
  const taxRate = 0.12; // 12% IVA en Guatemala
  const taxAmount = subtotal * taxRate;
  const total = subtotal + taxAmount + parseFloat(this.shipping_cost) - parseFloat(this.discount_amount);
  
  return {
    subtotal: parseFloat(subtotal.toFixed(2)),
    tax_amount: parseFloat(taxAmount.toFixed(2)),
    total_amount: parseFloat(total.toFixed(2))
  };
};

// Método de instancia para actualizar estado
Order.prototype.updateStatus = async function(newStatus, reason = null, updatedByUserId = null) {
  const validTransitions = {
    'pending': ['pending_payment', 'confirmed', 'cancelled'],
    'pending_payment': ['confirmed', 'cancelled'],
    'confirmed': ['preparing', 'cancelled'],
    'preparing': ['ready_pickup', 'shipped', 'cancelled'],
    'ready_pickup': ['delivered', 'cancelled'],
    'shipped': ['delivered', 'cancelled'],
    'delivered': ['refunded'],
    'cancelled': [],
    'refunded': []
  };
  
  if (!validTransitions[this.status].includes(newStatus)) {
    throw new Error(`No se puede cambiar el estado de ${this.status} a ${newStatus}`);
  }
  
  this.status = newStatus;
  if (updatedByUserId) {
    this.processed_by_user_id = updatedByUserId;
  }
  
  await this.save();
  
  // Enviar notificación al cliente
  await this.sendStatusNotification(reason);
};

// Método de instancia para generar tracking number
Order.prototype.generateTrackingNumber = function() {
  if (this.delivery_mode === 'delivery' && !this.tracking_number) {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    this.tracking_number = `TRK-${timestamp}-${random}`;
  }
  return this.tracking_number;
};

// Método de instancia para verificar si puede ser cancelada
Order.prototype.canBeCancelled = function() {
  const cancellableStatuses = ['pending', 'pending_payment', 'confirmed'];
  return cancellableStatuses.includes(this.status);
};

// Método de instancia para verificar si está vencida (para reservas)
Order.prototype.isExpired = function() {
  if (this.delivery_mode === 'reservation' && this.reservation_expires_date) {
    const today = new Date().toISOString().split('T')[0];
    return this.reservation_expires_date < today;
  }
  return false;
};

// Método de instancia para enviar notificación de estado
Order.prototype.sendStatusNotification = async function(reason = null) {
  const Notification = sequelize.models.Notification;
  if (!Notification) return;
  
  const statusMessages = {
    'confirmed': 'Tu orden ha sido confirmada y está siendo procesada',
    'preparing': 'Estamos preparando tu orden',
    'ready_pickup': 'Tu orden está lista para recoger en el gimnasio',
    'shipped': `Tu orden ha sido enviada. Número de seguimiento: ${this.tracking_number}`,
    'delivered': 'Tu orden ha sido entregada correctamente',
    'cancelled': 'Tu orden ha sido cancelada'
  };
  
  const message = statusMessages[this.status] || `Estado de tu orden actualizado: ${this.status}`;
  
  await Notification.create({
    client_id: this.client_id,
    title: `Orden ${this.order_number}`,
    message: message,
    type: 'order',
    related_id: this.id,
    priority: 'medium'
  });
};

// Método de clase para buscar órdenes por estado y modalidad
Order.findByStatusAndMode = function(status, deliveryMode = null) {
  const whereClause = { status };
  if (deliveryMode) {
    whereClause.delivery_mode = deliveryMode;
  }
  
  return this.findAll({
    where: whereClause,
    include: [
      {
        model: sequelize.models.Client,
        as: 'client'
      },
      {
        model: sequelize.models.OrderItem,
        as: 'orderItems',
        include: [{
          model: sequelize.models.Product,
          as: 'product'
        }]
      }
    ],
    order: [['order_date', 'DESC']]
  });
};

// Método de clase para órdenes que requieren atención
Order.findRequiringAttention = function() {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
  
  return this.findAll({
    where: {
      [sequelize.Sequelize.Op.or]: [
        // Órdenes pendientes de más de 24 horas
        {
          status: 'pending',
          order_date: {
            [sequelize.Sequelize.Op.lt]: new Date(Date.now() - 24 * 60 * 60 * 1000)
          }
        },
        // Reservas que expiran pronto
        {
          delivery_mode: 'reservation',
          reservation_expires_date: {
            [sequelize.Sequelize.Op.lte]: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
          }
        },
        // Órdenes preparándose por más de 3 días
        {
          status: 'preparing',
          confirmed_date: {
            [sequelize.Sequelize.Op.lt]: threeDaysAgo
          }
        }
      ]
    },
    order: [['order_date', 'ASC']]
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
Order.associate = function(models) {
  // Una orden pertenece a un cliente
  if (models.Client) {
    Order.belongsTo(models.Client, {
      foreignKey: 'client_id',
      as: 'client',
      onDelete: 'CASCADE'
    });
  }
  
  // Una orden tiene muchos items
  if (models.OrderItem) {
    Order.hasMany(models.OrderItem, {
      foreignKey: 'order_id',
      as: 'orderItems'
    });
  }
  
  // Una orden puede tener muchos pagos
  if (models.Payment) {
    Order.hasMany(models.Payment, {
      foreignKey: 'order_id',
      as: 'payments'
    });
  }
  
  // Una orden fue procesada por un usuario
  if (models.User) {
    Order.belongsTo(models.User, {
      foreignKey: 'processed_by_user_id',
      as: 'processedBy'
    });
  }
};

module.exports = Order;