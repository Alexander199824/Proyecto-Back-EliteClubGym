// src/config/database.js - SOLUCIÓN FINAL PARA PROBLEMAS DE ALTER TABLE
// Configuración que evita completamente el uso de ALTER TABLE problemático

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

// Configuración de la conexión a PostgreSQL - OPTIMIZADA
const sequelize = new Sequelize({
  dialect: 'postgres',
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: process.env.NODE_ENV === 'development' ? console.log : false,
  
  // Configuración específica para PostgreSQL
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' || process.env.DB_HOST.includes('render.com') ? {
      require: true,
      rejectUnauthorized: false
    } : false,
    connectTimeout: 60000,
    socketTimeout: 60000,
    keepAlive: true,
    keepAliveInitialDelayMillis: 0,
    // CRÍTICO: Prevenir problemas con ENUMs y ALTER TABLE
    prependSearchPath: true,
    decimalNumbers: true
  },
  
  // Pool de conexiones optimizado
  pool: {
    max: 5,
    min: 0,
    acquire: 60000,
    idle: 10000,
    retry: {
      max: 3
    }
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
    freezeTableName: true,
    // IMPORTANTE: No usar paranoid por defecto
    paranoid: false
  },
  
  // NUEVO: Configuración que previene ALTER TABLE problemático
  sync: {
    alter: false,  // NUNCA usar alter
    force: false   // Controlado manualmente
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

// Función COMPLETAMENTE REESCRITA para evitar ALTER TABLE
async function recreateTablesIfRequested() {
  try {
    const shouldRecreate = process.env.RECREATE_TABLES === 'true';
    
    if (shouldRecreate) {
      console.log('🔄 RECREATE_TABLES=true detectado. Iniciando proceso seguro...');
      console.log('⚠️  Se recrearán TODAS las tablas desde cero para evitar problemas de ALTER TABLE');
      
      // Paso 1: VERIFICAR que la base está limpia ANTES de continuar
      console.log('🔍 Verificando que la base de datos esté completamente limpia...');
      const isClean = await verifyDatabaseIsClean();
      
      if (!isClean) {
        console.log('⚠️  La base de datos NO está limpia. Ejecutando limpieza automática...');
        await executeCleanupScript();
        
        // Verificar nuevamente después de la limpieza
        const isCleanAfter = await verifyDatabaseIsClean();
        if (!isCleanAfter) {
          throw new Error('No se pudo limpiar la base de datos completamente. Ejecuta manualmente: node scripts/force-clean-postgres-enhanced.js');
        }
      }
      
      console.log('✅ Base de datos verificada como limpia');
      
      // Paso 2: Importar modelos en orden correcto
      console.log('📂 Cargando modelos en orden correcto...');
      await importModelsInCorrectOrder();
      
      // Paso 3: Crear tablas ÚNICAMENTE con force: true en base limpia
      console.log('🏗️  Creando todas las tablas desde cero con force: true...');
      await sequelize.sync({ 
        force: true,        // SEGURO porque la BD está completamente limpia
        alter: false,       // NUNCA usar alter
        hooks: false,       // Sin hooks durante creación inicial
        logging: process.env.NODE_ENV === 'development' ? console.log : false
      });
      
      console.log('✅ Todas las tablas creadas exitosamente');
      
      // Paso 4: Ejecutar seeders si están habilitados
      if (process.env.ENABLE_SEEDERS === 'true') {
        console.log('🌱 Ejecutando seeders de desarrollo...');
        await runSeeders();
        console.log('✅ Seeders ejecutados correctamente');
      }
      
      // Paso 5: Auto-reset de RECREATE_TABLES por seguridad
      console.log('🔒 Reseteando RECREATE_TABLES=false automáticamente...');
      await updateEnvVariable('RECREATE_TABLES', 'false');
      console.log('✅ Variable RECREATE_TABLES reseteada por seguridad');
      
      console.log('🎉 Recreación completada sin problemas de ALTER TABLE');
      
    } else {
      console.log('✅ RECREATE_TABLES=false. Usando sincronización ultra-conservadora...');
      await importModelsInCorrectOrder();
      
      // Verificar si hay tablas existentes
      const tablesExist = await checkIfTablesExist();
      
      if (tablesExist) {
        console.log('✅ Tablas existentes detectadas. NO se ejecutará sync para evitar ALTER TABLE');
        console.log('💡 Si necesitas actualizar el esquema, usa RECREATE_TABLES=true');
      } else {
        console.log('🏗️  No hay tablas. Creando desde cero...');
        await sequelize.sync({ 
          force: false,       // No forzar en base con tablas
          alter: false,       // NUNCA usar alter
          hooks: false,       // Sin hooks
          logging: false      // Sin ruido
        });
        console.log('✅ Tablas creadas correctamente');
      }
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración de tablas:', error);
    
    // Diagnóstico específico del error
    if (error.message.includes('syntax error') && error.message.includes('UNIQUE')) {
      console.error('');
      console.error('🔧 DIAGNÓSTICO: Error de sintaxis SQL con UNIQUE');
      console.error('💡 SOLUCIÓN: La base de datos no está completamente limpia');
      console.error('🚨 ACCIÓN REQUERIDA:');
      console.error('   1. Ejecuta: node scripts/force-clean-postgres-enhanced.js');
      console.error('   2. O usa: node scripts/force-clean-postgres-enhanced.js nuclear');
      console.error('   3. Luego reinicia la aplicación');
    }
    
    throw error;
  }
}

// Función para verificar que la base de datos está completamente limpia
async function verifyDatabaseIsClean() {
  try {
    const [result] = await sequelize.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables,
        (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as enums,
        (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'public') as sequences
    `);
    
    const stats = result[0];
    const totalObjects = parseInt(stats.tables) + parseInt(stats.enums) + parseInt(stats.sequences);
    
    console.log(`📊 Estado de la base de datos: ${stats.tables} tablas, ${stats.enums} enums, ${stats.sequences} secuencias`);
    
    return totalObjects === 0;
    
  } catch (error) {
    console.log('⚠️  Error verificando limpieza:', error.message);
    return false;
  }
}

// Función para verificar si existen tablas
async function checkIfTablesExist() {
  try {
    const [result] = await sequelize.query(`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
      AND tablename NOT LIKE 'pg_%'
    `);
    
    return parseInt(result[0].count) > 0;
    
  } catch (error) {
    console.log('⚠️  Error verificando existencia de tablas:', error.message);
    return false;
  }
}

// Función para ejecutar script de limpieza automáticamente
async function executeCleanupScript() {
  console.log('🔄 Ejecutando script de limpieza automática...');
  
  try {
    // Intentar ejecutar la limpieza directamente
    await directCleanup();
    console.log('✅ Limpieza automática completada');
    
  } catch (error) {
    console.error('❌ Error en limpieza automática:', error.message);
    throw new Error('Limpieza automática falló. Ejecuta manualmente: node scripts/force-clean-postgres-enhanced.js');
  }
}

// Función de limpieza directa integrada
async function directCleanup() {
  console.log('🗑️  Ejecutando limpieza directa de PostgreSQL...');
  
  try {
    // Terminar conexiones activas
    await sequelize.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid()
      AND state <> 'idle'
    `);
    
    // Eliminar todas las tablas con CASCADE
    const [tables] = await sequelize.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      ORDER BY tablename
    `);
    
    if (tables.length > 0) {
      const tableNames = tables.map(t => `"${t.tablename}"`).join(', ');
      await sequelize.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
      console.log(`   ✅ ${tables.length} tablas eliminadas`);
    }
    
    // Eliminar todos los ENUMs
    const [enums] = await sequelize.query(`
      SELECT t.typname
      FROM pg_type t 
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE t.typtype = 'e'
      AND n.nspname = 'public'
    `);
    
    for (const enumType of enums) {
      try {
        await sequelize.query(`DROP TYPE IF EXISTS "public"."${enumType.typname}" CASCADE`);
      } catch (error) {
        // Ignorar errores de dependencias en ENUMs
      }
    }
    
    if (enums.length > 0) {
      console.log(`   ✅ ${enums.length} ENUMs eliminados`);
    }
    
    // Eliminar secuencias
    const [sequences] = await sequelize.query(`
      SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
    `);
    
    for (const seq of sequences) {
      try {
        await sequelize.query(`DROP SEQUENCE IF EXISTS "public"."${seq.sequencename}" CASCADE`);
      } catch (error) {
        // Ignorar errores
      }
    }
    
    if (sequences.length > 0) {
      console.log(`   ✅ ${sequences.length} secuencias eliminadas`);
    }
    
  } catch (error) {
    console.error('❌ Error en limpieza directa:', error.message);
    throw error;
  }
}

// Función para importar modelos en orden correcto (previene dependencias)
async function importModelsInCorrectOrder() {
  const modelsPath = path.join(__dirname, '../models');
  
  if (!fs.existsSync(modelsPath)) {
    console.log('📂 Directorio de modelos no encontrado, creándolo...');
    fs.mkdirSync(modelsPath, { recursive: true });
    return;
  }
  
  // Orden específico que minimiza problemas de dependencias
  const modelLoadOrder = [
    'User.js',           // Sin dependencias externas
    'Image.js',          // Puede referenciar User
    'MembershipType.js', // Sin dependencias complejas
    'ProductCategory.js',// Puede autoreferenciar
    'Product.js',        // Depende de ProductCategory
    'Client.js',         // Puede referenciar Image
    'ClientPreferences.js', // Depende de Client
    'ClientMembership.js',  // Depende de Client y MembershipType
    'Prize.js',          // Puede referenciar Product e Image
    'Roulette.js',       // Sin dependencias complejas
    'QRCode.js',         // Depende de Product y Prize
    'Order.js',          // Depende de Client
    'OrderItem.js',      // Depende de Order y Product
    'Payment.js',        // Depende de Client, Order, MembershipType
    'BankTransfer.js',   // Depende de Client y Payment
    'ClientCheckin.js',  // Depende de Client y ClientMembership
    'PointsTransaction.js', // Depende de Client y ClientCheckin
    'PrizeWinning.js',   // Depende de Client, Prize, Roulette, QRCode
    'Notification.js'    // Depende de Client
  ];
  
  const allFiles = fs.readdirSync(modelsPath)
    .filter(file => file.endsWith('.js') && file !== 'index.js');
  
  // Cargar en orden + archivos no listados al final
  const orderedFiles = [
    ...modelLoadOrder.filter(file => allFiles.includes(file)),
    ...allFiles.filter(file => !modelLoadOrder.includes(file))
  ];
  
  console.log(`📂 Importando ${orderedFiles.length} modelos en orden optimizado...`);
  
  // Paso 1: Limpiar cache y cargar definiciones
  for (const file of orderedFiles) {
    try {
      const modelPath = path.join(modelsPath, file);
      // Limpiar cache para evitar problemas
      delete require.cache[require.resolve(modelPath)];
      require(modelPath);
      console.log(`✅ ${file} cargado`);
    } catch (error) {
      console.error(`❌ Error cargando ${file}:`, error.message);
      // No lanzar error aquí, continuar con otros modelos
    }
  }
  
  const modelCount = Object.keys(sequelize.models).length;
  console.log(`📊 Total de modelos registrados: ${modelCount}`);
  
  if (modelCount === 0) {
    throw new Error('No se pudieron cargar modelos. Verifica la estructura de archivos.');
  }
  
  // Paso 2: Establecer asociaciones de manera segura
  console.log('🔗 Estableciendo asociaciones...');
  
  Object.keys(sequelize.models).forEach(modelName => {
    const model = sequelize.models[modelName];
    if (typeof model.associate === 'function') {
      try {
        model.associate(sequelize.models);
        console.log(`✅ Asociaciones para ${modelName}`);
      } catch (error) {
        console.error(`⚠️  Error en asociaciones de ${modelName}: ${error.message}`);
        // No lanzar error, solo advertir
      }
    }
  });
  
  console.log('✅ Modelos cargados y asociaciones establecidas');
}

// Función para ejecutar seeders de desarrollo
async function runSeeders() {
  try {
    const seedersPath = path.join(__dirname, '../seeders');
    
    if (!fs.existsSync(seedersPath)) {
      console.log('🌱 No se encontraron seeders');
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
        console.log(`✅ Seeder ${file} completado`);
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
      console.log('⚠️  Archivo .env no encontrado');
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
    console.error(`❌ Error actualizando ${key}:`, error);
  }
}

// Función para cerrar la conexión
async function closeConnection() {
  try {
    await sequelize.close();
    console.log('✅ Conexión cerrada correctamente');
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