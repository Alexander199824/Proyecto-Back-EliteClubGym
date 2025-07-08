// Archivo: src/models/ProductCategory.js
// CORREGIDO: Modelo para categorizar los productos del gimnasio

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const ProductCategory = sequelize.define('ProductCategory', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la categoría'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    // CORREGIDO: Removido unique: true de aquí
    validate: {
      notEmpty: {
        msg: 'El nombre de la categoría es requerido'
      },
      len: {
        args: [2, 100],
        msg: 'El nombre debe tener entre 2 y 100 caracteres'
      }
    },
    comment: 'Nombre de la categoría de productos'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de la categoría'
  },
  slug: {
    type: DataTypes.STRING(100),
    allowNull: false,
    // CORREGIDO: Removido unique: true de aquí
    validate: {
      is: {
        args: /^[a-z0-9-]+$/,
        msg: 'El slug debe contener solo letras minúsculas, números y guiones'
      }
    },
    comment: 'URL amigable de la categoría'
  },
  parent_category_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'product_categories',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la categoría padre (para subcategorías)'
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si la categoría está activa'
  },
  is_featured: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la categoría debe destacarse'
  },
  sort_order: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Orden de visualización'
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
    comment: 'Color asociado a la categoría'
  },
  icon_name: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Nombre del ícono para mostrar en la interfaz'
  },
  image_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'images',
      key: 'id'
    },
    onDelete: 'SET NULL',
    comment: 'ID de la imagen representativa de la categoría'
  },
  // Configuración de gamificación
  qr_prize_multiplier: {
    type: DataTypes.DECIMAL(3, 2),
    allowNull: false,
    defaultValue: 1.00,
    validate: {
      min: {
        args: 0.1,
        msg: 'El multiplicador debe ser mayor a 0.1'
      },
      max: {
        args: 5.0,
        msg: 'El multiplicador no puede ser mayor a 5.0'
      }
    },
    comment: 'Multiplicador de premios para productos de esta categoría'
  },
  // Configuración de envío
  default_shipping_cost: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Costo de envío por defecto para productos de esta categoría'
  },
  free_shipping_threshold: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    validate: {
      min: 0
    },
    comment: 'Monto mínimo para envío gratis en esta categoría'
  },
  // Restricciones
  requires_age_verification: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si los productos de esta categoría requieren verificación de edad'
  },
  min_age: {
    type: DataTypes.INTEGER,
    allowNull: true,
    validate: {
      min: 0,
      max: 100
    },
    comment: 'Edad mínima para comprar productos de esta categoría'
  },
  requires_prescription: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si los productos requieren prescripción médica'
  },
  // SEO y marketing
  meta_title: {
    type: DataTypes.STRING(200),
    allowNull: true,
    comment: 'Título meta para SEO'
  },
  meta_description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción meta para SEO'
  },
  keywords: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Palabras clave para búsqueda y SEO'
  },
  // Estadísticas
  product_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de productos activos en esta categoría (calculado automáticamente)'
  },
  total_sales: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Total de productos vendidos en esta categoría'
  },
  total_revenue: {
    type: DataTypes.DECIMAL(12, 2),
    allowNull: false,
    defaultValue: 0,
    comment: 'Ingresos totales de esta categoría'
  },
  // Configuración de la categoría
  allows_reviews: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Permite reseñas en productos de esta categoría'
  },
  show_in_menu: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Mostrar en el menú principal'
  },
  show_product_count: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Mostrar contador de productos en la interfaz'
  }
}, {
  tableName: 'product_categories',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    // CORREGIDO: Movido unique constraints a indexes
    {
      unique: true,
      fields: ['name']
    },
    {
      unique: true,
      fields: ['slug']
    },
    {
      fields: ['parent_category_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_featured']
    },
    {
      fields: ['sort_order']
    },
    {
      fields: ['show_in_menu']
    },
    {
      fields: ['product_count']
    },
    {
      fields: ['total_sales']
    }
  ],
  comment: 'Tabla de categorías de productos'
});

// Hook para generar slug automáticamente
ProductCategory.beforeCreate(async (category) => {
  if (!category.slug && category.name) {
    category.slug = category.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
});

// Hook para actualizar slug cuando cambia el nombre
ProductCategory.beforeUpdate(async (category) => {
  if (category.changed('name') && !category.changed('slug')) {
    category.slug = category.name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  }
});

// Método de instancia para verificar si es una categoría padre
ProductCategory.prototype.isParent = function() {
  return this.parent_category_id === null;
};

// Método de instancia para verificar si es una subcategoría
ProductCategory.prototype.isSubcategory = function() {
  return this.parent_category_id !== null;
};

// Método de instancia para obtener la ruta completa de la categoría
ProductCategory.prototype.getFullPath = async function() {
  const path = [this.name];
  
  if (this.parent_category_id) {
    const parent = await ProductCategory.findByPk(this.parent_category_id);
    if (parent) {
      const parentPath = await parent.getFullPath();
      return parentPath.concat(path);
    }
  }
  
  return path;
};

// Método de instancia para actualizar contador de productos
ProductCategory.prototype.updateProductCount = async function() {
  if (sequelize.models.Product) {
    const count = await sequelize.models.Product.count({
      where: {
        category_id: this.id,
        is_active: true
      }
    });
    
    this.product_count = count;
    await this.save();
    
    // Actualizar también la categoría padre si existe
    if (this.parent_category_id) {
      const parent = await ProductCategory.findByPk(this.parent_category_id);
      if (parent) {
        await parent.updateProductCount();
      }
    }
  }
};

// Método de instancia para actualizar estadísticas de ventas
ProductCategory.prototype.updateSalesStats = async function(quantity, revenue) {
  this.total_sales += quantity;
  this.total_revenue = parseFloat(this.total_revenue) + parseFloat(revenue);
  await this.save();
  
  // Actualizar también la categoría padre si existe
  if (this.parent_category_id) {
    const parent = await ProductCategory.findByPk(this.parent_category_id);
    if (parent) {
      await parent.updateSalesStats(quantity, revenue);
    }
  }
};

// Método de clase para obtener categorías principales ordenadas
ProductCategory.findMainCategories = function() {
  return this.findAll({
    where: {
      parent_category_id: null,
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

// Método de clase para obtener subcategorías de una categoría
ProductCategory.findSubcategories = function(parentId) {
  return this.findAll({
    where: {
      parent_category_id: parentId,
      is_active: true
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

// Método de clase para obtener categorías destacadas
ProductCategory.findFeatured = function() {
  return this.findAll({
    where: {
      is_active: true,
      is_featured: true,
      show_in_menu: true
    },
    order: [['sort_order', 'ASC']]
  });
};

// Método de clase para obtener categorías con productos
ProductCategory.findWithProducts = function() {
  return this.findAll({
    where: {
      is_active: true,
      product_count: {
        [sequelize.Sequelize.Op.gt]: 0
      }
    },
    order: [['sort_order', 'ASC'], ['name', 'ASC']]
  });
};

// Método de clase para obtener jerarquía completa
ProductCategory.getHierarchy = async function() {
  const mainCategories = await this.findMainCategories();
  
  for (const category of mainCategories) {
    const subcategories = await this.findSubcategories(category.id);
    category.setDataValue('subcategories', subcategories);
  }
  
  return mainCategories;
};

// Método de clase para buscar por slug
ProductCategory.findBySlug = function(slug) {
  return this.findOne({
    where: {
      slug: slug,
      is_active: true
    }
  });
};

// CORREGIDO: Asociaciones protegidas con verificación de existencia
ProductCategory.associate = function(models) {
  // Una categoría puede tener una categoría padre
  ProductCategory.belongsTo(ProductCategory, {
    foreignKey: 'parent_category_id',
    as: 'parentCategory',
    onDelete: 'SET NULL'
  });
  
  // Una categoría puede tener muchas subcategorías
  ProductCategory.hasMany(ProductCategory, {
    foreignKey: 'parent_category_id',
    as: 'subcategories'
  });
  
  // Una categoría tiene muchos productos
  if (models.Product) {
    ProductCategory.hasMany(models.Product, {
      foreignKey: 'category_id',
      as: 'products'
    });
  }
  
  // Una categoría puede tener una imagen
  if (models.Image) {
    ProductCategory.belongsTo(models.Image, {
      foreignKey: 'image_id',
      as: 'image',
      onDelete: 'SET NULL'
    });
  }
};

module.exports = ProductCategory;