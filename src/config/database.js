// src/config/database.js - VERSIÓN CORREGIDA PARA POSTGRES
// Configuración corregida para evitar problemas de ENUM y orden de creación

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

// Función mejorada para recrear tablas sin problemas de ENUM - CORREGIDA
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
      
      // Paso 3: Crear tablas desde cero con force: true
      console.log('🏗️  Recreando todas las tablas desde cero...');
      await sequelize.sync({ 
        force: true,        // Elimina y recrea las tablas
        alter: false,       // No intentar ALTER TABLE
        hooks: false,       // Desactivar hooks durante la creación inicial
        logging: false      // Reducir noise en logs
      });
      
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
      console.log('✅ RECREATE_TABLES=false. Sincronización segura...');
      await importAllModels();
      
      // Usar sync sin alter para evitar problemas de SQL
      await sequelize.sync({ 
        alter: false,       // NUNCA usar alter en PostgreSQL con ENUMs
        force: false,       // No forzar recreación
        logging: false      // Reducir noise
      });
      console.log('✅ Base de datos sincronizada correctamente');
    }
    
  } catch (error) {
    console.error('❌ Error durante la migración de tablas:', error);
    
    // Si hay error y estamos recreando, intentar limpieza adicional
    if (process.env.RECREATE_TABLES === 'true') {
      console.log('🔧 Intentando limpieza adicional debido al error...');
      try {
        await cleanDatabase();
        console.log('✅ Limpieza adicional completada');
      } catch (cleanError) {
        console.error('❌ Error en limpieza adicional:', cleanError.message);
      }
    }
    
    throw error;
  }
}

// Función para limpiar la base de datos completamente - MEJORADA
async function cleanDatabase() {
  try {
    console.log('🗑️  Iniciando limpieza completa...');
    
    // Paso 1: Terminar todas las conexiones activas (excepto la nuestra)
    try {
      await sequelize.query(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = current_database() AND pid <> pg_backend_pid()
      `);
      console.log('✅ Conexiones activas terminadas');
    } catch (error) {
      // Ignorar errores de permisos aquí
      console.log('⚠️  No se pudieron terminar conexiones activas (normal en algunos entornos)');
    }
    
    // Paso 2: Obtener todas las tablas dinámicamente y eliminarlas
    try {
      const [tables] = await sequelize.query(`
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%' 
        AND tablename NOT LIKE 'sql_%'
        ORDER BY tablename
      `);
      
      if (tables.length > 0) {
        console.log(`🗑️  Eliminando ${tables.length} tablas...`);
        
        // Eliminar tablas una por una con CASCADE para mejor control
        for (const table of tables) {
          try {
            await sequelize.query(`DROP TABLE IF EXISTS "${table.tablename}" CASCADE`);
            console.log(`   ✅ Tabla "${table.tablename}" eliminada`);
          } catch (error) {
            console.log(`   ⚠️  Error eliminando tabla "${table.tablename}": ${error.message}`);
          }
        }
      } else {
        console.log('📋 No se encontraron tablas para eliminar');
      }
    } catch (error) {
      console.error('⚠️  Error obteniendo lista de tablas:', error.message);
    }
    
    // Paso 3: Obtener y eliminar todos los tipos ENUM dinámicamente
    try {
      const [enums] = await sequelize.query(`
        SELECT t.typname
        FROM pg_type t 
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typtype = 'e'
        AND n.nspname = 'public'
        ORDER BY t.typname
      `);
      
      if (enums.length > 0) {
        console.log(`🗑️  Eliminando ${enums.length} tipos ENUM...`);
        for (const enumType of enums) {
          try {
            await sequelize.query(`DROP TYPE IF EXISTS "public"."${enumType.typname}" CASCADE`);
            console.log(`   ✅ ENUM "${enumType.typname}" eliminado`);
          } catch (error) {
            console.log(`   ⚠️  Error eliminando ENUM "${enumType.typname}": ${error.message}`);
          }
        }
      } else {
        console.log('📋 No se encontraron tipos ENUM para eliminar');
      }
    } catch (error) {
      console.error('⚠️  Error obteniendo tipos ENUM:', error.message);
    }
    
    // Paso 4: Limpiar secuencias huérfanas
    try {
      const [sequences] = await sequelize.query(`
        SELECT schemaname, sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
      `);
      
      if (sequences.length > 0) {
        console.log(`🗑️  Eliminando ${sequences.length} secuencias...`);
        for (const sequence of sequences) {
          try {
            await sequelize.query(`DROP SEQUENCE IF EXISTS "public"."${sequence.sequencename}" CASCADE`);
            console.log(`   ✅ Secuencia "${sequence.sequencename}" eliminada`);
          } catch (error) {
            console.log(`   ⚠️  Error eliminando secuencia "${sequence.sequencename}": ${error.message}`);
          }
        }
      }
    } catch (error) {
      console.log('⚠️  Error procesando secuencias:', error.message);
    }
    
    // Paso 5: Verificación final
    try {
      const [finalTables] = await sequelize.query(`
        SELECT COUNT(*) as count FROM pg_tables WHERE schemaname = 'public'
      `);
      const [finalEnums] = await sequelize.query(`
        SELECT COUNT(*) as count FROM pg_type WHERE typtype = 'e' 
        AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      `);
      
      console.log(`📊 Verificación final:`);
      console.log(`   - Tablas restantes: ${finalTables[0].count}`);
      console.log(`   - ENUMs restantes: ${finalEnums[0].count}`);
      
      if (finalTables[0].count === 0 && finalEnums[0].count === 0) {
        console.log('✅ Base de datos limpiada completamente');
      } else {
        console.log('⚠️  Algunos elementos no pudieron ser eliminados completamente');
      }
    } catch (error) {
      console.log('⚠️  Error en verificación final:', error.message);
    }
    
  } catch (error) {
    console.error('❌ Error en limpieza de base de datos:', error.message);
    throw error;
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
      // Limpiar cache para evitar problemas de importación
      delete require.cache[require.resolve(modelPath)];
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
  
  // Paso 2: Establecer asociaciones de manera segura
  console.log('🔗 Estableciendo asociaciones entre modelos...');
  const associationErrors = [];
  
  // Primero hacer todas las asociaciones belongsTo y hasOne
  Object.keys(sequelize.models).forEach(modelName => {
    const model = sequelize.models[modelName];
    if (typeof model.associate === 'function') {
      try {
        // Llamar associate pero capturar errores
        model.associate(sequelize.models);
        console.log(`✅ Asociaciones establecidas para ${modelName}`);
      } catch (error) {
        console.error(`❌ Error en asociaciones de ${modelName}:`, error.message);
        associationErrors.push({ modelName, error: error.message });
      }
    }
  });
  
  // Reportar errores si los hay pero continuar
  if (importErrors.length > 0) {
    console.warn('⚠️  Errores de importación encontrados:');
    importErrors.forEach(err => console.warn(`   ${err.file}: ${err.error}`));
  }
  
  if (associationErrors.length > 0) {
    console.warn('⚠️  Errores de asociación encontrados:');
    associationErrors.forEach(err => console.warn(`   ${err.modelName}: ${err.error}`));
    // No lanzar error aquí, solo advertir
  }
  
  console.log('✅ Importación de modelos completada');
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