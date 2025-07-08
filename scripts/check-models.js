// scripts/force-clean-postgres.js
// Script especializado para resolver problemas de ENUM y ALTER TABLE en PostgreSQL

require('dotenv').config();
const { Client } = require('pg');

async function forceCleanPostgres() {
  console.log('🚨 LIMPIEZA FORZADA PARA PROBLEMAS DE ENUM 🚨');
  console.log('Este script resuelve problemas específicos de ALTER TABLE con ENUMs');
  console.log('');
  
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
    console.log('✅ Conectado a PostgreSQL');

    // Paso 1: Matar conexiones activas problemáticas
    console.log('🔄 Terminando conexiones activas...');
    try {
      const killQuery = `
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = $1 
        AND pid <> pg_backend_pid()
        AND state = 'active'
      `;
      await client.query(killQuery, [process.env.DB_NAME]);
      console.log('✅ Conexiones terminadas');
    } catch (error) {
      console.log('⚠️  No se pudieron terminar todas las conexiones:', error.message);
    }

    // Paso 2: Forzar eliminación de esquema completo
    console.log('💥 Eliminando esquema público completo...');
    try {
      await client.query('DROP SCHEMA public CASCADE');
      console.log('✅ Esquema público eliminado');
      
      await client.query('CREATE SCHEMA public');
      console.log('✅ Esquema público recreado');
      
      await client.query(`GRANT ALL ON SCHEMA public TO ${process.env.DB_USER}`);
      await client.query('GRANT ALL ON SCHEMA public TO public');
      console.log('✅ Permisos restaurados');
      
    } catch (error) {
      console.log('⚠️  Error con esquema completo:', error.message);
      
      // Fallback: Eliminar elementos uno por uno
      console.log('🔄 Intentando limpieza elemento por elemento...');
      await cleanElementByElement(client);
    }

    // Paso 3: Verificación final y estadísticas
    await verifyCleanup(client);
    
    console.log('');
    console.log('🎉 LIMPIEZA FORZADA COMPLETADA');
    console.log('Ahora puedes ejecutar: npm start');
    console.log('Asegurate de tener RECREATE_TABLES=true en tu .env');

  } catch (error) {
    console.error('❌ Error durante la limpieza forzada:', error.message);
    console.error('Stack:', error.stack);
    
    // Sugerencias específicas según el error
    if (error.code === '57P01') {
      console.log('💡 Error de conexión administrativa. Intenta:');
      console.log('   - Conectarte como superusuario');
      console.log('   - Verificar permisos de tu usuario');
    } else if (error.code === '42501') {
      console.log('💡 Error de permisos. Intenta:');
      console.log('   - Usar un usuario con permisos de superusuario');
      console.log('   - Pedir al administrador que ejecute la limpieza');
    }
    
  } finally {
    await client.end();
  }
}

async function cleanElementByElement(client) {
  // Paso 1: Eliminar todas las vistas
  try {
    const viewsQuery = `
      SELECT viewname FROM pg_views 
      WHERE schemaname = 'public'
    `;
    const viewsResult = await client.query(viewsQuery);
    
    for (const view of viewsResult.rows) {
      try {
        await client.query(`DROP VIEW IF EXISTS "${view.viewname}" CASCADE`);
        console.log(`   ✅ Vista "${view.viewname}" eliminada`);
      } catch (error) {
        console.log(`   ⚠️  Error eliminando vista "${view.viewname}": ${error.message}`);
      }
    }
  } catch (error) {
    console.log('⚠️  Error procesando vistas:', error.message);
  }

  // Paso 2: Eliminar todas las funciones
  try {
    const functionsQuery = `
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.prokind = 'f'
    `;
    const functionsResult = await client.query(functionsQuery);
    
    for (const func of functionsResult.rows) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS "public"."${func.proname}"(${func.args}) CASCADE`);
        console.log(`   ✅ Función "${func.proname}" eliminada`);
      } catch (error) {
        console.log(`   ⚠️  Error eliminando función "${func.proname}": ${error.message}`);
      }
    }
  } catch (error) {
    console.log('⚠️  Error procesando funciones:', error.message);
  }

  // Paso 3: Eliminar todas las tablas con dependencias
  try {
    const tablesQuery = `
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `;
    const tablesResult = await client.query(tablesQuery);
    
    console.log(`🗑️  Eliminando ${tablesResult.rows.length} tablas...`);
    
    // Intentar eliminar todas las tablas de una vez
    if (tablesResult.rows.length > 0) {
      const tableNames = tablesResult.rows.map(t => `"public"."${t.tablename}"`).join(', ');
      try {
        await client.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
        console.log('✅ Todas las tablas eliminadas en batch');
      } catch (error) {
        // Si falla en batch, intentar una por una
        console.log('⚠️  Batch falló, eliminando una por una...');
        for (const table of tablesResult.rows) {
          try {
            await client.query(`DROP TABLE IF EXISTS "public"."${table.tablename}" CASCADE`);
            console.log(`   ✅ Tabla "${table.tablename}" eliminada`);
          } catch (error) {
            console.log(`   ⚠️  Error eliminando tabla "${table.tablename}": ${error.message}`);
          }
        }
      }
    }
  } catch (error) {
    console.log('⚠️  Error procesando tablas:', error.message);
  }

  // Paso 4: Eliminar todos los tipos (incluyendo ENUMs)
  try {
    const typesQuery = `
      SELECT t.typname
      FROM pg_type t
      JOIN pg_namespace n ON t.typnamespace = n.oid
      WHERE n.nspname = 'public'
      AND t.typtype IN ('e', 'c', 'd')
      ORDER BY t.typname
    `;
    const typesResult = await client.query(typesQuery);
    
    console.log(`🗑️  Eliminando ${typesResult.rows.length} tipos personalizados...`);
    
    for (const type of typesResult.rows) {
      try {
        await client.query(`DROP TYPE IF EXISTS "public"."${type.typname}" CASCADE`);
        console.log(`   ✅ Tipo "${type.typname}" eliminado`);
      } catch (error) {
        console.log(`   ⚠️  Error eliminando tipo "${type.typname}": ${error.message}`);
      }
    }
  } catch (error) {
    console.log('⚠️  Error procesando tipos:', error.message);
  }

  // Paso 5: Eliminar secuencias
  try {
    const sequencesQuery = `
      SELECT sequencename FROM pg_sequences 
      WHERE schemaname = 'public'
    `;
    const sequencesResult = await client.query(sequencesQuery);
    
    for (const sequence of sequencesResult.rows) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS "public"."${sequence.sequencename}" CASCADE`);
        console.log(`   ✅ Secuencia "${sequence.sequencename}" eliminada`);
      } catch (error) {
        console.log(`   ⚠️  Error eliminando secuencia "${sequence.sequencename}": ${error.message}`);
      }
    }
  } catch (error) {
    console.log('⚠️  Error procesando secuencias:', error.message);
  }
}

async function verifyCleanup(client) {
  console.log('🔍 Verificando limpieza...');
  
  try {
    const checks = await Promise.all([
      client.query("SELECT COUNT(*) as count FROM pg_tables WHERE schemaname = 'public'"),
      client.query("SELECT COUNT(*) as count FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')"),
      client.query("SELECT COUNT(*) as count FROM pg_sequences WHERE schemaname = 'public'"),
      client.query("SELECT COUNT(*) as count FROM pg_views WHERE schemaname = 'public'")
    ]);

    const [tables, enums, sequences, views] = checks;

    console.log('📊 Estado final de la base de datos:');
    console.log(`   📋 Tablas: ${tables.rows[0].count}`);
    console.log(`   🔢 ENUMs: ${enums.rows[0].count}`);
    console.log(`   📈 Secuencias: ${sequences.rows[0].count}`);
    console.log(`   👁️  Vistas: ${views.rows[0].count}`);

    const totalObjects = parseInt(tables.rows[0].count) + 
                        parseInt(enums.rows[0].count) + 
                        parseInt(sequences.rows[0].count) + 
                        parseInt(views.rows[0].count);

    if (totalObjects === 0) {
      console.log('✅ Base de datos completamente limpia');
      return true;
    } else {
      console.log(`⚠️  Quedan ${totalObjects} objetos en la base de datos`);
      return false;
    }

  } catch (error) {
    console.log('⚠️  Error verificando limpieza:', error.message);
    return false;
  }
}

// Función auxiliar para casos extremos
async function nuclearOption() {
  console.log('');
  console.log('💥 OPCIÓN NUCLEAR: RECREAR BASE DE DATOS COMPLETA 💥');
  console.log('⚠️  ESTO ELIMINARÁ TODO EN LA BASE DE DATOS');
  console.log('');
  
  // Esta función requeriría permisos de superusuario
  console.log('Para ejecutar la opción nuclear:');
  console.log('1. Conecta como superusuario de PostgreSQL');
  console.log('2. Ejecuta estos comandos SQL:');
  console.log(`   DROP DATABASE "${process.env.DB_NAME}";`);
  console.log(`   CREATE DATABASE "${process.env.DB_NAME}" OWNER ${process.env.DB_USER};`);
  console.log('3. Reinicia tu aplicación con RECREATE_TABLES=true');
}

// Ejecutar el script
const action = process.argv[2];

if (action === 'nuclear') {
  nuclearOption();
} else {
  forceCleanPostgres().catch(error => {
    console.error('💥 Error crítico:', error.message);
    console.log('');
    console.log('🆘 Si este script falla, considera la opción nuclear:');
    console.log('   node scripts/force-clean-postgres.js nuclear');
  });
}