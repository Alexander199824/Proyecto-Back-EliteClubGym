// scripts/clean-database-improved.js
// Script mejorado para limpiar la base de datos PostgreSQL completamente

require('dotenv').config();
const { Client } = require('pg');

async function cleanDatabaseImproved() {
  console.log('🧹 Iniciando limpieza completa y mejorada de la base de datos...');
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_HOST.includes('render.com') ? {
      rejectUnauthorized: false
    } : false,
    connectionTimeoutMillis: 30000,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a la base de datos');

    // Paso 1: Terminar todas las conexiones activas a la base de datos (excepto la nuestra)
    console.log('🔄 Terminando conexiones activas...');
    const terminateConnectionsQuery = `
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = $1 AND pid <> pg_backend_pid();
    `;
    
    try {
      await client.query(terminateConnectionsQuery, [process.env.DB_NAME]);
      console.log('✅ Conexiones activas terminadas');
    } catch (error) {
      console.log('⚠️  No se pudieron terminar todas las conexiones:', error.message);
    }

    // Paso 2: Obtener todas las tablas dinámicamente
    console.log('🔍 Obteniendo lista de tablas...');
    const getTablesQuery = `
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%' 
      AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename;
    `;
    
    const tablesResult = await client.query(getTablesQuery);
    const tables = tablesResult.rows.map(row => row.tablename);
    
    if (tables.length > 0) {
      console.log(`📋 Encontradas ${tables.length} tablas:`, tables.join(', '));
      
      // Eliminar tablas una por una para mejor control de errores
      for (const table of tables) {
        try {
          await client.query(`DROP TABLE IF EXISTS "${table}" CASCADE`);
          console.log(`   ✅ Tabla "${table}" eliminada`);
        } catch (error) {
          console.log(`   ⚠️  Error eliminando tabla "${table}":`, error.message);
        }
      }
    } else {
      console.log('📋 No se encontraron tablas para eliminar');
    }

    // Paso 3: Obtener todos los tipos ENUM dinámicamente
    console.log('🔍 Obteniendo tipos ENUM...');
    const getEnumsQuery = `
      SELECT t.typname
      FROM pg_type t 
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE (t.typrelid = 0 OR (SELECT c.relkind = 'c' FROM pg_catalog.pg_class c WHERE c.oid = t.typrelid)) 
      AND NOT EXISTS(SELECT 1 FROM pg_catalog.pg_type el WHERE el.oid = t.typelem AND el.typarray = t.oid)
      AND n.nspname = 'public'
      AND t.typtype = 'e'
      ORDER BY t.typname;
    `;
    
    const enumsResult = await client.query(getEnumsQuery);
    const enums = enumsResult.rows.map(row => row.typname);
    
    if (enums.length > 0) {
      console.log(`📋 Encontrados ${enums.length} tipos ENUM:`, enums.join(', '));
      
      // Eliminar ENUMs uno por uno
      for (const enumType of enums) {
        try {
          await client.query(`DROP TYPE IF EXISTS "${enumType}" CASCADE`);
          console.log(`   ✅ ENUM "${enumType}" eliminado`);
        } catch (error) {
          console.log(`   ⚠️  Error eliminando ENUM "${enumType}":`, error.message);
        }
      }
    } else {
      console.log('📋 No se encontraron tipos ENUM para eliminar');
    }

    // Paso 4: Limpiar secuencias huérfanas
    console.log('🔍 Limpiando secuencias...');
    const getSequencesQuery = `
      SELECT sequencename 
      FROM pg_sequences 
      WHERE schemaname = 'public';
    `;
    
    try {
      const sequencesResult = await client.query(getSequencesQuery);
      const sequences = sequencesResult.rows.map(row => row.sequencename);
      
      for (const sequence of sequences) {
        try {
          await client.query(`DROP SEQUENCE IF EXISTS "${sequence}" CASCADE`);
          console.log(`   ✅ Secuencia "${sequence}" eliminada`);
        } catch (error) {
          console.log(`   ⚠️  Error eliminando secuencia "${sequence}":`, error.message);
        }
      }
    } catch (error) {
      console.log('⚠️  Error obteniendo secuencias:', error.message);
    }

    // Paso 5: Limpiar funciones personalizadas si las hay
    console.log('🔍 Limpiando funciones personalizadas...');
    const getFunctionsQuery = `
      SELECT proname, pg_get_function_identity_arguments(oid) as args
      FROM pg_proc 
      WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      AND prokind = 'f';
    `;
    
    try {
      const functionsResult = await client.query(getFunctionsQuery);
      
      for (const func of functionsResult.rows) {
        try {
          await client.query(`DROP FUNCTION IF EXISTS "${func.proname}"(${func.args}) CASCADE`);
          console.log(`   ✅ Función "${func.proname}" eliminada`);
        } catch (error) {
          console.log(`   ⚠️  Error eliminando función "${func.proname}":`, error.message);
        }
      }
    } catch (error) {
      console.log('⚠️  Error obteniendo funciones:', error.message);
    }

    // Paso 6: Verificar limpieza
    console.log('🔍 Verificando limpieza...');
    const finalCheck = await client.query(getTablesQuery);
    const remainingTables = finalCheck.rows.length;
    
    const finalEnumCheck = await client.query(getEnumsQuery);
    const remainingEnums = finalEnumCheck.rows.length;
    
    console.log(`📊 Verificación final:`);
    console.log(`   - Tablas restantes: ${remainingTables}`);
    console.log(`   - ENUMs restantes: ${remainingEnums}`);
    
    if (remainingTables === 0 && remainingEnums === 0) {
      console.log('🎉 Base de datos limpiada completamente');
    } else {
      console.log('⚠️  Algunos elementos no pudieron ser eliminados');
    }
    
    console.log('');
    console.log('Ahora puedes ejecutar: npm start');
    
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error.message);
    console.error('Stack trace:', error.stack);
  } finally {
    await client.end();
  }
}

// Función auxiliar para verificar el estado de la base de datos
async function checkDatabaseState() {
  console.log('🔍 Verificando estado actual de la base de datos...');
  
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    ssl: process.env.DB_HOST.includes('render.com') ? {
      rejectUnauthorized: false
    } : false,
  });

  try {
    await client.connect();
    
    // Contar tablas
    const tablesResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_tables 
      WHERE schemaname = 'public'
    `);
    
    // Contar ENUMs
    const enumsResult = await client.query(`
      SELECT COUNT(*) as count 
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    `);
    
    console.log(`📊 Estado actual:`);
    console.log(`   - Tablas: ${tablesResult.rows[0].count}`);
    console.log(`   - Tipos ENUM: ${enumsResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error verificando estado:', error.message);
  } finally {
    await client.end();
  }
}

// Ejecutar según el argumento
const action = process.argv[2];

if (action === 'check') {
  checkDatabaseState();
} else {
  cleanDatabaseImproved();
}