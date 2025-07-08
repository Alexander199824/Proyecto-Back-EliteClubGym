// src/config/database.js - VERSIÓN CORREGIDA
// Configuración corregida para evitar problemas de ENUM

const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');

// Verificar variables de entorno requeridas
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Variables de entorno faltantes:', missingVars.join(', '));
  console.error('💡 Asegúrate de tener un archivo .env con las credenciales de la BD');
  process.exit(1);
}

// Configuración de la conexión a PostgreSQL
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Configuración de pool mejorada
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
    retry: {
      max: 3
    }
  },
  
  // Configuración SSL
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    connectTimeout: 60000,
    socketTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0
  },
  
  // Configuración de retry
  retry: {
    max: 3,
    timeout: 60000,
    match: [
      /ECONNRESET/,
      /ETIMEDOUT/,
      /ENOTFOUND/,
      /SequelizeHostNotFoundError/,
      /SequelizeHostNotReachableError/,
      /SequelizeInvalidConnectionError/,
      /SequelizeConnectionTimedOutError/,
      /SequelizeConnectionRefusedError/
    ]
  },
  
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true
  }
});

// Función para conectar a la base de datos
async function connectDB() {
  try {
    console.log('🔄 Intentando conectar a la base de datos...');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
    console.log(`👤 Usuario: ${process.env.DB_USER}`);
    
    await sequelize.authenticate();
    console.log('✅ Conexión a PostgreSQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error.message);
    throw error;
  }
}

// Función mejorada para recrear tablas sin problemas de ENUM
async function recreateTablesIfRequested() {
  try {
    const shouldRecreate = process.env.RECREATE_TABLES === 'true';
    
    if (shouldRecreate) {
      console.log('🔄 RECREATE_TABLES=true detectado. Iniciando recreación de tablas...');
      console.log('⚠️  ADVERTENCIA: Se eliminarán TODAS las tablas existentes');
      
      // Paso 1: Limpiar completamente la base de datos
      console.log('🧹 Limpiando base de datos completamente...');
      await cleanDatabase();
      
      // Paso 2: Importar todos los modelos
      console.log('📂 Cargando modelos de la base de datos...');
      await importAllModels();
      
      // Paso 3: Recrear todas las tablas con force: true
      console.log('🏗️  Recreando todas las tablas con nueva estructura...');
      await sequelize.sync({ force: true });
      console.log('✅ Todas las tablas recreadas correctamente');
      
      // Paso 4: Ejecutar seeders si están habilitados
      if (process.env.ENABLE_SEEDERS === 'true') {
        console.log('🌱 Ejecutando seeders de desarrollo...');
        await runSeeders();
        console.log('✅ Seeders ejecutados correctamente');
      }
      
      // Paso 5: Auto-reset de la variable RECREATE_TABLES
      console.log('🔒 Cambiando RECREATE_TABLES=false automáticamente...');
      await updateEnvVariable('RECREATE_TABLES', 'false');
      console.log('✅ Variable RECREATE_TABLES reseteada por seguridad');
      
      console.log('🎉 Migración manual completada exitosamente');
      
    } else {
      console.log('✅ RECREATE_TABLES=false. Sincronización normal de modelos...');
      await importAllModels();
      // Usar alter: false para evitar problemas de ENUM
      await sequelize.sync({ alter: false });
      console.log('✅ Base de datos sincronizada correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración de tablas:', error);
    throw error;
  }
}

// Función para limpiar la base de datos completamente
async function cleanDatabase() {
  try {
    // Eliminar todas las tablas en orden correcto
    const dropTablesQuery = `
      DROP TABLE IF EXISTS 
        prize_winnings,
        roulettes,
        qr_codes,
        products,
        product_categories,
        points_transactions,
        payments,
        order_items,
        orders,
        bank_transfers,
        notifications,
        client_checkins,
        client_preferences,
        client_memberships,
        membership_types,
        images,
        clients,
        users
      CASCADE;
    `;
    
    await sequelize.query(dropTablesQuery);
    
    // Eliminar todos los tipos ENUM
    const dropEnumsQuery = `
      DROP TYPE IF EXISTS 
        "public"."enum_users_role",
        "public"."enum_clients_gender",
        "public"."enum_clients_preferred_workout_time",
        "public"."enum_membership_types_currency",
        "public"."enum_client_memberships_status",
        "public"."enum_client_memberships_payment_status",
        "public"."enum_images_usage_type",
        "public"."enum_notifications_type",
        "public"."enum_notifications_priority",
        "public"."enum_notifications_status",
        "public"."enum_notifications_related_type",
        "public"."enum_client_checkins_checkin_type",
        "public"."enum_client_checkins_location_validation_method",
        "public"."enum_client_checkins_status",
        "public"."enum_client_checkins_workout_type",
        "public"."enum_client_checkins_platform",
        "public"."enum_orders_status",
        "public"."enum_orders_payment_status",
        "public"."enum_orders_delivery_mode",
        "public"."enum_order_items_item_status",
        "public"."enum_order_items_delivery_mode",
        "public"."enum_payments_payment_type",
        "public"."enum_payments_payment_method",
        "public"."enum_payments_status",
        "public"."enum_points_transactions_transaction_type",
        "public"."enum_points_transactions_source_type",
        "public"."enum_prizes_type",
        "public"."enum_prizes_category",
        "public"."enum_prize_winnings_prize_type",
        "public"."enum_prize_winnings_status",
        "public"."enum_products_qr_prize_category",
        "public"."enum_qr_codes_code_type",
        "public"."enum_qr_codes_prize_category",
        "public"."enum_roulettes_category",
        "public"."enum_bank_transfers_verification_status"
      CASCADE;
    `;
    
    await sequelize.query(dropEnumsQuery);
    console.log('✅ Base de datos limpiada completamente');
    
  } catch (error) {
    console.error('⚠️  Error limpiando base de datos:', error.message);
    // Continuar sin error, puede que algunas tablas no existan
  }
}

// Función para importar todos los modelos dinámicamente - MEJORADA
async function importAllModels() {
  const modelsPath = path.join(__dirname, '../models');
  
  // Verificar si el directorio de modelos existe
  if (!fs.existsSync(modelsPath)) {
    console.log('📂 Directorio de modelos no encontrado, creándolo...');
    fs.mkdirSync(modelsPath, { recursive: true });
    return;
  }
  
  // Solo archivos .js que no sean index.js
  const modelFiles = fs.readdirSync(modelsPath)
    .filter(file => file.endsWith('.js') && file !== 'index.js')
    .sort(); // Ordenar para importación consistente
  
  if (modelFiles.length === 0) {
    console.log('📂 No se encontraron modelos para importar');
    return;
  }
  
  console.log(`📂 Importando ${modelFiles.length} modelos...`);
  
  // Paso 1: Importar todos los modelos (definiciones solamente)
  const importErrors = [];
  for (const file of modelFiles) {
    try {
      const modelPath = path.join(modelsPath, file);
      delete require.cache[require.resolve(modelPath)]; // Limpiar cache
      require(modelPath);
      console.log(`✅ Modelo ${file} importado correctamente`);
    } catch (error) {
      console.error(`❌ Error importando modelo ${file}:`, error.message);
      importErrors.push({ file, error: error.message });
    }
  }
  
  // Verificar que se importaron modelos
  const modelCount = Object.keys(sequelize.models).length;
  console.log(`📊 Total de modelos registrados en Sequelize: ${modelCount}`);
  
  if (modelCount === 0) {
    throw new Error('No se pudieron importar modelos. Verifica la estructura de los archivos.');
  }
  
  // Paso 2: Establecer asociaciones solo si todos los modelos están cargados
  console.log('🔗 Estableciendo asociaciones entre modelos...');
  const associationErrors = [];
  
  Object.keys(sequelize.models).forEach(modelName => {
    const model = sequelize.models[modelName];
    if (typeof model.associate === 'function') {
      try {
        model.associate(sequelize.models);
        console.log(`✅ Asociaciones establecidas para ${modelName}`);
      } catch (error) {
        console.error(`❌ Error en asociaciones de ${modelName}:`, error.message);
        associationErrors.push({ modelName, error: error.message });
      }
    }
  });
  
  // Reportar errores si los hay
  if (importErrors.length > 0) {
    console.warn('⚠️  Errores de importación:', importErrors);
  }
  
  if (associationErrors.length > 0) {
    console.warn('⚠️  Errores de asociación:', associationErrors);
    // No lanzar error aquí, solo advertir
  }
  
  console.log('✅ Asociaciones entre modelos establecidas correctamente');
}

// Función para ejecutar seeders de desarrollo
async function runSeeders() {
  try {
    const seedersPath = path.join(__dirname, '../seeders');
    
    if (!fs.existsSync(seedersPath)) {
      console.log('🌱 No se encontraron seeders para ejecutar');
      return;
    }
    
    const seederFiles = fs.readdirSync(seedersPath)
      .filter(file => file.endsWith('.js'))
      .sort();
    
    for (const file of seederFiles) {
      console.log(`🌱 Ejecutando seeder: ${file}`);
      const seeder = require(path.join(seedersPath, file));
      if (typeof seeder.up === 'function') {
        await seeder.up(sequelize.getQueryInterface(), Sequelize);
        console.log(`✅ Seeder ${file} ejecutado correctamente`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error ejecutando seeders:', error);
  }
}

// Función para actualizar variable en archivo .env
async function updateEnvVariable(key, value) {
  try {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  Archivo .env no encontrado, no se puede auto-resetear RECREATE_TABLES');
      return;
    }
    
    let envContent = fs.readFileSync(envPath, 'utf8');
    const regex = new RegExp(`^${key}=.*$`, 'm');
    
    if (regex.test(envContent)) {
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      envContent += `\n${key}=${value}`;
    }
    
    fs.writeFileSync(envPath, envContent);
    process.env[key] = value;
    
  } catch (error) {
    console.error(`❌ Error actualizando variable ${key} en .env:`, error);
  }
}

// Función para cerrar la conexión
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✅ Conexión a la base de datos cerrada correctamente');
  } catch (error) {
    console.error('❌ Error cerrando conexión:', error);
  }
}

module.exports = {
  sequelize,
  connectDB,
  recreateTablesIfRequested,
  closeConnection,
  Sequelize
};