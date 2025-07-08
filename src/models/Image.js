// Archivo: src/models/Image.js
//creo el modelo para almacenar imágenes directamente en PostgreSQL

const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');
const crypto = require('crypto');

const Image = sequelize.define('Image', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
    comment: 'ID único de la imagen'
  },
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre original del archivo'
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: 'Nombre original del archivo subido'
  },
  mime_type: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      isIn: {
        args: [['image/jpeg', 'image/png', 'image/webp', 'image/gif']],
        msg: 'Tipo de archivo no soportado'
      }
    },
    comment: 'Tipo MIME de la imagen'
  },
  file_extension: {
    type: DataTypes.STRING(10),
    allowNull: false,
    validate: {
      isIn: {
        args: [['jpg', 'jpeg', 'png', 'webp', 'gif']],
        msg: 'Extensión de archivo no soportada'
      }
    },
    comment: 'Extensión del archivo'
  },
  // Almacenamiento de la imagen en base64
  image_data: {
    type: DataTypes.TEXT('long'), // Para MySQL, en PostgreSQL será TEXT
    allowNull: false,
    comment: 'Datos de la imagen en formato base64'
  },
  // Metadatos de la imagen
  file_size: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 10485760 // 10MB máximo
    },
    comment: 'Tamaño del archivo en bytes'
  },
  width: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Ancho de la imagen en píxeles'
  },
  height: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Alto de la imagen en píxeles'
  },
  // Diferentes versiones/tamaños de la imagen
  thumbnail_data: {
    type: DataTypes.TEXT('medium'),
    allowNull: true,
    comment: 'Thumbnail de la imagen en base64 (150x150)'
  },
  medium_data: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
    comment: 'Versión mediana de la imagen en base64 (500x500)'
  },
  // Hash para deduplicación
  file_hash: {
    type: DataTypes.STRING(64),
    allowNull: false,
    unique: true,
    comment: 'Hash SHA-256 del archivo para evitar duplicados'
  },
  // Información de uso
  usage_type: {
    type: DataTypes.ENUM(
      'profile', 'product', 'category', 'receipt', 'prize', 
      'qr_code', 'banner', 'other'
    ),
    allowNull: false,
    defaultValue: 'other',
    comment: 'Tipo de uso de la imagen'
  },
  // Referencias opcionales
  product_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'products',
      key: 'id'
    },
    onDelete: 'CASCADE',
    comment: 'ID del producto si es imagen de producto'
  },
  // Estados de la imagen
  is_active: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Indica si la imagen está activa'
  },
  is_public: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la imagen es pública'
  },
  // Información de subida
  uploaded_by_user_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    },
    comment: 'ID del usuario que subió la imagen'
  },
  uploaded_by_client_id: {
    type: DataTypes.UUID,
    allowNull: true,
    references: {
      model: 'clients',
      key: 'id'
    },
    comment: 'ID del cliente que subió la imagen'
  },
  // Información de procesamiento
  processed: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si la imagen fue procesada (thumbnails generados)'
  },
  processing_error: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error durante el procesamiento si aplica'
  },
  // Metadatos EXIF (si se requieren)
  exif_data: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Metadatos EXIF de la imagen'
  },
  // Información de optimización
  compression_ratio: {
    type: DataTypes.DECIMAL(5, 2),
    allowNull: true,
    comment: 'Ratio de compresión aplicado'
  },
  original_size: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Tamaño original antes de compresión'
  },
  // Configuración de acceso
  access_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Número de veces que se ha accedido a la imagen'
  },
  last_accessed: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Fecha del último acceso'
  },
  // Información de validación
  virus_scanned: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Indica si fue escaneada por virus'
  },
  scan_result: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'Resultado del escaneo de virus'
  },
  // Tags y descripción
  alt_text: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: 'Texto alternativo para accesibilidad'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Descripción de la imagen'
  },
  tags: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Tags para categorización y búsqueda'
  }
}, {
  tableName: 'images',
  timestamps: true,
  paranoid: true, // Soft delete
  indexes: [
    {
      unique: true,
      fields: ['file_hash']
    },
    {
      fields: ['usage_type']
    },
    {
      fields: ['product_id']
    },
    {
      fields: ['is_active']
    },
    {
      fields: ['is_public']
    },
    {
      fields: ['uploaded_by_user_id']
    },
    {
      fields: ['uploaded_by_client_id']
    },
    {
      fields: ['processed']
    },
    {
      fields: ['file_size']
    },
    {
      fields: ['mime_type']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['last_accessed']
    }
  ],
  comment: 'Tabla de imágenes almacenadas directamente en PostgreSQL'
});

// Hook para generar hash del archivo antes de crear
Image.beforeCreate(async (image) => {
  // Generar hash SHA-256 del contenido
  if (image.image_data) {
    const hash = crypto.createHash('sha256').update(image.image_data).digest('hex');
    image.file_hash = hash;
  }
  
  // Extraer extensión del nombre original
  if (!image.file_extension && image.original_name) {
    const extension = image.original_name.split('.').pop().toLowerCase();
    image.file_extension = extension;
  }
  
  // Generar filename único si no se proporcionó
  if (!image.filename) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    image.filename = `${timestamp}_${random}.${image.file_extension}`;
  }
});

// Método de instancia para obtener la imagen en diferentes tamaños
Image.prototype.getImageData = function(size = 'original') {
  switch (size) {
    case 'thumbnail':
      return this.thumbnail_data || this.image_data;
    case 'medium':
      return this.medium_data || this.image_data;
    case 'original':
    default:
      return this.image_data;
  }
};

// Método de instancia para obtener URL de datos
Image.prototype.getDataURL = function(size = 'original') {
  const imageData = this.getImageData(size);
  if (!imageData) return null;
  
  return `data:${this.mime_type};base64,${imageData}`;
};

// Método de instancia para registrar acceso
Image.prototype.registerAccess = async function() {
  this.access_count += 1;
  this.last_accessed = new Date();
  await this.save();
};

// Método de instancia para generar thumbnails
Image.prototype.generateThumbnails = async function() {
  if (this.processed) return;
  
  try {
    // Aquí se implementaría la lógica de redimensionamiento
    // Por simplicidad, por ahora solo marcamos como procesado
    // En una implementación real, usarías una librería como Sharp
    
    this.processed = true;
    await this.save();
    
  } catch (error) {
    this.processing_error = error.message;
    await this.save();
    throw error;
  }
};

// Método de instancia para verificar si es duplicado
Image.prototype.isDuplicate = async function() {
  const duplicate = await Image.findOne({
    where: {
      file_hash: this.file_hash,
      id: { [sequelize.Sequelize.Op.ne]: this.id }
    }
  });
  
  return !!duplicate;
};

// Método de clase para buscar por hash (deduplicación)
Image.findByHash = function(hash) {
  return this.findOne({
    where: {
      file_hash: hash,
      is_active: true
    }
  });
};

// Método de clase para crear desde base64
Image.createFromBase64 = async function(base64Data, options = {}) {
  // Extraer información del base64
  const matches = base64Data.match(/^data:([^;]+);base64,(.+)$/);
  if (!matches) {
    throw new Error('Formato de base64 inválido');
  }
  
  const mimeType = matches[1];
  const imageData = matches[2];
  
  // Calcular tamaño
  const fileSize = Buffer.byteLength(imageData, 'base64');
  
  // Validar tamaño máximo
  const maxSize = parseInt(process.env.MAX_IMAGE_SIZE) || 5242880; // 5MB por defecto
  if (fileSize > maxSize) {
    throw new Error(`Imagen muy grande. Máximo ${maxSize} bytes`);
  }
  
  // Verificar duplicados
  const hash = crypto.createHash('sha256').update(imageData).digest('hex');
  const existing = await this.findByHash(hash);
  
  if (existing) {
    return existing; // Retornar imagen existente si es duplicada
  }
  
  const image = await this.create({
    original_name: options.filename || `image_${Date.now()}.${mimeType.split('/')[1]}`,
    mime_type: mimeType,
    image_data: imageData,
    file_size: fileSize,
    file_hash: hash,
    usage_type: options.usage_type || 'other',
    product_id: options.product_id,
    uploaded_by_user_id: options.uploaded_by_user_id,
    uploaded_by_client_id: options.uploaded_by_client_id,
    is_public: options.is_public || false,
    alt_text: options.alt_text,
    description: options.description,
    tags: options.tags
  });
  
  // Procesar thumbnails en background
  setTimeout(() => {
    image.generateThumbnails().catch(console.error);
  }, 100);
  
  return image;
};

// Método de clase para limpiar imágenes huérfanas
Image.cleanupOrphaned = async function() {
  // Buscar imágenes que no están referenciadas en ninguna parte
  const orphanedImages = await this.findAll({
    where: {
      is_active: true,
      // Agregar condiciones para verificar referencias
      id: {
        [sequelize.Sequelize.Op.notIn]: sequelize.literal(`(
          SELECT profile_image_id FROM users WHERE profile_image_id IS NOT NULL
          UNION
          SELECT profile_image_id FROM clients WHERE profile_image_id IS NOT NULL
          UNION
          SELECT image_id FROM product_categories WHERE image_id IS NOT NULL
          UNION
          SELECT image_id FROM prizes WHERE image_id IS NOT NULL
          UNION
          SELECT receipt_image_id FROM bank_transfers WHERE receipt_image_id IS NOT NULL
        )`)
      }
    }
  });
  
  // Marcar como inactivas (soft delete)
  for (const image of orphanedImages) {
    image.is_active = false;
    await image.save();
  }
  
  return orphanedImages.length;
};

// Método de clase para estadísticas de almacenamiento
Image.getStorageStats = async function() {
  const stats = await this.findAll({
    where: { is_active: true },
    attributes: [
      'usage_type',
      [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
      [sequelize.fn('SUM', sequelize.col('file_size')), 'total_size'],
      [sequelize.fn('AVG', sequelize.col('file_size')), 'avg_size'],
      [sequelize.fn('MAX', sequelize.col('file_size')), 'max_size'],
      [sequelize.fn('MIN', sequelize.col('file_size')), 'min_size']
    ],
    group: ['usage_type'],
    raw: true
  });
  
  return stats;
};

// Método de clase para buscar imágenes por tipo de uso
Image.findByUsageType = function(usageType, options = {}) {
  const whereClause = {
    usage_type: usageType,
    is_active: true
  };
  
  if (options.is_public !== undefined) {
    whereClause.is_public = options.is_public;
  }
  
  return this.findAll({
    where: whereClause,
    order: options.order || [['created_at', 'DESC']],
    limit: options.limit,
    offset: options.offset
  });
};

// Definir asociaciones
Image.associate = function(models) {
  // Una imagen puede ser subida por un usuario
  Image.belongsTo(models.User, {
    foreignKey: 'uploaded_by_user_id',
    as: 'uploadedByUser'
  });
  
  // Una imagen puede ser subida por un cliente
  Image.belongsTo(models.Client, {
    foreignKey: 'uploaded_by_client_id',
    as: 'uploadedByClient'
  });
  
  // Una imagen puede pertenecer a un producto
  Image.belongsTo(models.Product, {
    foreignKey: 'product_id',
    as: 'product',
    onDelete: 'CASCADE'
  });
  
  // Una imagen puede ser usada como perfil de usuario
  Image.hasMany(models.User, {
    foreignKey: 'profile_image_id',
    as: 'userProfiles'
  });
  
  // Una imagen puede ser usada como perfil de cliente
  Image.hasMany(models.Client, {
    foreignKey: 'profile_image_id',
    as: 'clientProfiles'
  });
  
  // Una imagen puede ser usada como imagen de categoría
  Image.hasMany(models.ProductCategory, {
    foreignKey: 'image_id',
    as: 'categories'
  });
  
  // Una imagen puede ser usada como imagen de premio
  Image.hasMany(models.Prize, {
    foreignKey: 'image_id',
    as: 'prizes'
  });
  
  // Una imagen puede ser un comprobante de transferencia
  Image.hasMany(models.BankTransfer, {
    foreignKey: 'receipt_image_id',
    as: 'bankTransferReceipts'
  });
};

module.exports = Image;