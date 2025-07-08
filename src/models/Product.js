// Archivo: src/models/Product.js
// CORREGIDO: Modelo para el catálogo de productos/complementos del gimnasio

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único del producto'
  },
  category_id: {
    type: DataTypes.UUID,
    allowNull: false,
    references: {
      model: 'product_categories',
      key: 'id'
    },
    onDelete: 'RESTRICT',
    comment: 'ID de la categoría del producto'
  },
  name: {
    type: DataTypes.STRING(200),
    allowNull: false,
    validate: {
      notEmpty: {
        msg: 'El nombre del producto es requerido'
      },
      len: {
        args: [2, 200],
        msg: 'El nombre debe tener entre 2 y 200 caracteres'
      }
    },
    comment: 'Nombre del producto'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción detallada del producto'
  },
  short_description: {
    type: DataTypes.STRING(500),
    allowNull: true,
    comment: 'Descripción corta para listados'
  },
  sku: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // CORREGIDO: Removido unique: true de aquí
    validate: {
      notEmpty: {
        msg: 'El SKU es requerido'
      }
    },
    comment: 'Código SKU único del producto'
  },
  brand: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Marca del producto'
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
    comment: 'Precio del producto en Quetzales'
  },
  cost_price: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: {
        args: 0,
        msg: 'El precio de costo no puede ser negativo'
      }
    },
    comment: 'Precio de costo del producto (para reportes de utilidad)'
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
    comment: 'Moneda del precio'
  },
  // Control de inventario
  stock_quantity: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    validate: {
      min: {
        args: 0,
        msg: 'El stock no puede ser negativo'
      }
    },
    comment: 'Cantidad actual en inventario'
  },
  min_stock_level: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 5,
    validate: {
      min: {
        args: 0,
        msg: 'El stock mínimo no puede ser negativo'
      }
    },
    comment: 'Nivel mínimo de stock antes de alertar'
  },
  max_stock_level: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Nivel máximo de stock recomendado'
  },
  track_inventory: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si se debe hacer seguimiento del inventario'
  },
  // Modalidades de entrega disponibles
  allow_pickup: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite recogida en gimnasio'
  },
  allow_delivery: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite envío a domicilio'
  },
  allow_reservation: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite apartado del producto'
  },
  allow_backorder: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite pedido bajo orden cuando no hay stock'
  },
  // Configuración de envío
  shipping_weight: {
    type: DataTypes.DECIMAL(8, 3),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Peso del producto en kilogramos para cálculo de envío'
  },
  shipping_dimensions: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Dimensiones del producto en cm {length, width, height}'
  },
  free_shipping_threshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Monto mínimo para envío gratis de este producto'
  },
  // Tiempos de procesamiento
  pickup_time_hours: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 2,
    validate: {
      min: 0
    },
    comment: 'Horas necesarias para preparar el producto para recogida'
  },
  delivery_time_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 3,
    validate: {
      min: 1
    },
    comment: 'Días estimados para entrega a domicilio'
  },
  reservation_time_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 7,
    validate: {
      min: 1
    },
    comment: 'Días estimados para tener producto apartado disponible'
  },
  backorder_time_days: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 14,
    validate: {
      min: 1
    },
    comment: 'Días estimados para producto bajo pedido'
  },
  // Estados del producto
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el producto está activo para venta'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si el producto debe destacarse'
  },
  is_digital: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si es un producto digital (no requiere inventario físico)'
  },
  requires_prescription: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si requiere prescripción médica'
  },
  age_restriction: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Edad mínima requerida para comprar el producto'
  },
  // Información nutricional (para suplementos)
  nutrition_facts: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Información nutricional en formato JSON'
  },
  ingredients: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Lista de ingredientes del producto'
  },
  allergen_info: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Información sobre alérgenos'
  },
  serving_size: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Tamaño de la porción recomendada'
  },
  servings_per_container: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Número de porciones por envase'
  },
  // Configuración de códigos QR y gamificación
  has_qr_code: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si el producto tiene código QR para gamificación'
  },
  qr_prize_category: {
    type: DataTypes.ENUM('basic', 'premium', 'exclusive'),
    allowNull: false,
    defaultValue: 'basic',
    comment: 'Categoría de premios para la ruleta QR'
  },
  // Metadatos
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Etiquetas del producto para búsqueda y filtros'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de visualización'
  },
  // Información del proveedor
  supplier_name: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Nombre del proveedor principal'
  },
  supplier_contact: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Contacto del proveedor'
  },
  supplier_product_code: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Código del producto en el catálogo del proveedor'
  },
  // Estadísticas
  total_sold: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de unidades vendidas (actualizado automáticamente)'
  },
  total_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Ingresos totales generados por este producto'
  },
  average_rating: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: true,
    validate: {
      min: 0,
      max: 5
    },
    comment: 'Calificación promedio del producto (0-5 estrellas)'
  },
  review_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número total de reseñas'
  }
}, {
  tableName: 'products',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    // CORREGIDO: Movido unique constraint a indexes
    {
      unique: true,
      fields: ['sku']
    },
    {
      fields: ['category_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['stock_quantity']
    },
    {
      fields: ['price']
    },
    {
      fields: ['brand']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['total_sold']
    },
    {
      fields: ['average_rating']
    },
    {
      // Índice compuesto para búsquedas
      fields: ['is_active', 'category_id', 'price']
    },
    {
      // Índice de texto completo para búsquedas
      fields: ['name', 'description']
    }
  ],
  comment: 'Tabla de productos/complementos del gimnasio'
});

// Método de instancia para verificar disponibilidad según modalidad
Product.prototype.checkAvailability = function(deliveryMode, quantity = 1) {
  const result = {
    available: false,
    message: '',
    estimatedTime: null
  };

  if (!this.is_active) {
    result.message = 'Producto no disponible';
    return result;
  }

  switch (deliveryMode) {
    case 'pickup':
      if (!this.allow_pickup) {
        result.message = 'Recogida no disponible para este producto';
      } else if (this.track_inventory && this.stock_quantity < quantity) {
        result.message = 'Stock insuficiente para recogida inmediata';
      } else {
        result.available = true;
        result.estimatedTime = `${this.pickup_time_hours} horas`;
        result.message = 'Disponible para recogida';
      }
      break;

    case 'delivery':
      if (!this.allow_delivery) {
        result.message = 'Envío a domicilio no disponible';
      } else if (this.track_inventory && this.stock_quantity < quantity) {
        result.message = 'Stock insuficiente para envío inmediato';
      } else {
        result.available = true;
        result.estimatedTime = `${this.delivery_time_days} días`;
        result.message = 'Disponible para envío';
      }
      break;

    case 'reservation':
      if (!this.allow_reservation) {
        result.message = 'Apartado no disponible para este producto';
      } else {
        result.available = true;
        result.estimatedTime = `${this.reservation_time_days} días`;
        result.message = 'Disponible para apartado';
      }
      break;

    case 'backorder':
      if (!this.allow_backorder) {
        result.message = 'Pedido bajo orden no disponible';
      } else {
        result.available = true;
        result.estimatedTime = `${this.backorder_time_days} días`;
        result.message = 'Disponible bajo pedido';
      }
      break;
  }

  return result;
};

// Método de instancia para verificar si está en stock bajo
Product.prototype.isLowStock = function() {
  if (!this.track_inventory) return false;
  return this.stock_quantity <= this.min_stock_level;
};

// Método de instancia para calcular margen de utilidad
Product.prototype.getProfitMargin = function() {
  if (!this.cost_price || this.cost_price <= 0) return null;
  const profit = parseFloat(this.price) - parseFloat(this.cost_price);
  return ((profit / parseFloat(this.price)) * 100).toFixed(2);
};

// Método de instancia para actualizar stock - CORREGIDO
Product.prototype.updateStock = async function(quantity, operation = 'subtract', reason = 'Venta') {
  if (!this.track_inventory) return;

  const oldQuantity = this.stock_quantity;
  
  if (operation === 'add') {
    this.stock_quantity += quantity;
  } else if (operation === 'subtract') {
    if (this.stock_quantity < quantity) {
      throw new Error('Stock insuficiente');
    }
    this.stock_quantity -= quantity;
  } else if (operation === 'set') {
    this.stock_quantity = quantity;
  }

  await this.save();

  // Log simple para tracking de inventario
  console.log(`Stock actualizado para producto ${this.sku}: ${oldQuantity} -> ${this.stock_quantity} (${operation} ${quantity}): ${reason}`);

  return this.stock_quantity;
};

// Método de instancia para actualizar estadísticas de venta
Product.prototype.updateSalesStats = async function(quantity, totalAmount) {
  this.total_sold += quantity;
  this.total_revenue = parseFloat(this.total_revenue) + parseFloat(totalAmount);
  await this.save();
};

// Método de clase para buscar productos con filtros
Product.findWithFilters = function(filters = {}) {
  const whereClause = { is_active: true };
  const includeClause = [];

  if (filters.category_id) {
    whereClause.category_id = filters.category_id;
  }

  if (filters.brand) {
    whereClause.brand = filters.brand;
  }

  if (filters.min_price || filters.max_price) {
    whereClause.price = {};
    if (filters.min_price) whereClause.price[sequelize.Sequelize.Op.gte] = filters.min_price;
    if (filters.max_price) whereClause.price[sequelize.Sequelize.Op.lte] = filters.max_price;
  }

  if (filters.search) {
    whereClause[sequelize.Sequelize.Op.or] = [
      { name: { [sequelize.Sequelize.Op.iLike]: `%${filters.search}%` } },
      { description: { [sequelize.Sequelize.Op.iLike]: `%${filters.search}%` } },
      { sku: { [sequelize.Sequelize.Op.iLike]: `%${filters.search}%` } }
    ];
  }

  if (filters.featured) {
    whereClause.is_featured = true;
  }

  if (sequelize.models.ProductCategory) {
    includeClause.push({
      model: sequelize.models.ProductCategory,
      as: 'category',
      required: false
    });
  }

  const orderClause = [];
  if (filters.sort_by) {
    switch (filters.sort_by) {
      case 'price_asc':
        orderClause.push(['price', 'ASC']);
        break;
      case 'price_desc':
        orderClause.push(['price', 'DESC']);
        break;
      case 'name':
        orderClause.push(['name', 'ASC']);
        break;
      case 'popularity':
        orderClause.push(['total_sold', 'DESC']);
        break;
      case 'rating':
        orderClause.push(['average_rating', 'DESC']);
        break;
      default:
        orderClause.push(['sort_order', 'ASC'], ['name', 'ASC']);
    }
  } else {
    orderClause.push(['sort_order', 'ASC'], ['name', 'ASC']);
  }

  return this.findAll({
    where: whereClause,
    include: includeClause,
    order: orderClause,
    limit: filters.limit || 50,
    offset: filters.offset || 0
  });
};

// Método de clase para productos con stock bajo
Product.findLowStock = function() {
  return this.findAll({
    where: {
      is_active: true,
      track_inventory: true,
      stock_quantity: {
        [sequelize.Sequelize.Op.lte]: sequelize.col('min_stock_level')
      }
    },
    order: [['stock_quantity', 'ASC']]
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
Product.associate = function(models) {
  // Un producto pertenece a una categoría
  if (models.ProductCategory) {
    Product.belongsTo(models.ProductCategory, {
      foreignKey: 'category_id',
      as: 'category',
      onDelete: 'RESTRICT'
    });
  }

  // Un producto puede tener muchas imágenes
  if (models.Image) {
    Product.hasMany(models.Image, {
      foreignKey: 'product_id',
      as: 'images'
    });
  }

  // Un producto puede tener muchos ítems de orden
  if (models.OrderItem) {
    Product.hasMany(models.OrderItem, {
      foreignKey: 'product_id',
      as: 'orderItems'
    });
  }

  // Un producto puede tener muchos códigos QR
  if (models.QRCode) {
    Product.hasMany(models.QRCode, {
      foreignKey: 'product_id',
      as: 'qrCodes'
    });
  }

  // Un producto puede ser premio gratuito
  if (models.Prize) {
    Product.hasMany(models.Prize, {
      foreignKey: 'free_product_id',
      as: 'prizesAsFreeProduct'
    });
  }
};

module.exports = Product;