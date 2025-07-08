// scripts/force-clean-postgres-enhanced.js
// Script MEJORADO y ESPECIALIZADO para resolver problemas específicos de PostgreSQL con Sequelize

require('dotenv').config();
const { Client } = require('pg');

async function forceCleanPostgreSQLEnhanced() {
  console.log('🚨 LIMPIEZA MEJORADA PARA POSTGRESQL 🚨');
  console.log('Este script resuelve problemas específicos de ENUMs, ALTER TABLE y dependencias');
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

    // Paso 1: Verificar estado inicial
    await analyzeCurrentState(client);

    // Paso 2: Terminar conexiones problemáticas
    console.log('🔄 Terminando conexiones activas conflictivas...');
    await terminateConflictingConnections(client);

    // Paso 3: Limpieza ESTRATÉGICA por orden de dependencias
    console.log('🗑️  Iniciando limpieza estratégica por orden de dependencias...');
    await strategicCleanup(client);

    // Paso 4: Verificación y reporte final
    await verifyAndReport(client);
    
    console.log('');
    console.log('🎉 LIMPIEZA POSTGRESQL COMPLETADA');
    console.log('✅ Base de datos lista para recreación sin problemas');
    console.log('');
    console.log('Próximos pasos:');
    console.log('1. Ejecuta: npm start');
    console.log('2. Asegúrate de tener RECREATE_TABLES=true en tu .env');
    console.log('3. El sistema recreará las tablas automáticamente');

  } catch (error) {
    console.error('❌ Error durante la limpieza:', error.message);
    console.error('');
    
    // Diagnóstico específico del error
    await diagnoseError(error, client);
    
  } finally {
    await client.end();
  }
}

// Función para analizar el estado actual de la base de datos
async function analyzeCurrentState(client) {
  try {
    console.log('🔍 Analizando estado actual de la base de datos...');
    
    // Contar objetos actuales
    const analysis = await client.query(`
      SELECT 
        'tables' as object_type,
        COUNT(*) as count
      FROM pg_tables 
      WHERE schemaname = 'public'
      UNION ALL
      SELECT 
        'enums' as object_type,
        COUNT(*) as count
      FROM pg_type 
      WHERE typtype = 'e' 
      AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
      UNION ALL
      SELECT 
        'sequences' as object_type,
        COUNT(*) as count
      FROM pg_sequences 
      WHERE schemaname = 'public'
      UNION ALL
      SELECT 
        'functions' as object_type,
        COUNT(*) as count
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public'
      AND p.prokind = 'f'
      UNION ALL
      SELECT 
        'views' as object_type,
        COUNT(*) as count
      FROM pg_views 
      WHERE schemaname = 'public'
    `);
    
    console.log('📊 Estado actual:');
    analysis.rows.forEach(row => {
      console.log(`   ${row.object_type}: ${row.count}`);
    });
    
    // Detectar ENUMs problemáticos (que pueden causar problemas con ALTER TABLE)
    const problematicEnums = await client.query(`
      SELECT 
        t.typname,
        array_agg(e.enumlabel ORDER BY e.enumsortorder) as enum_values
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE t.typtype = 'e'
      AND n.nspname = 'public'
      GROUP BY t.typname
      ORDER BY t.typname
    `);
    
    if (problematicEnums.rows.length > 0) {
      console.log('⚠️  ENUMs detectados que pueden causar problemas:');
      problematicEnums.rows.forEach(row => {
        console.log(`   ${row.typname}: [${row.enum_values.join(', ')}]`);
      });
    }
    
  } catch (error) {
    console.log('⚠️  Error analizando estado inicial:', error.message);
  }
}

// Función para terminar solo conexiones problemáticas
async function terminateConflictingConnections(client) {
  try {
    // Terminar solo conexiones activas que no sean IDLE
    const result = await client.query(`
      SELECT pg_terminate_backend(pid), state, query
      FROM pg_stat_activity
      WHERE datname = $1 
      AND pid <> pg_backend_pid()
      AND state IN ('active', 'idle in transaction', 'idle in transaction (aborted)')
    `, [process.env.DB_NAME]);
    
    if (result.rows.length > 0) {
      console.log(`✅ ${result.rows.length} conexiones conflictivas terminadas`);
    } else {
      console.log('✅ No hay conexiones conflictivas que terminar');
    }
    
  } catch (error) {
    console.log('⚠️  Error terminando conexiones:', error.message);
  }
}

// Función de limpieza estratégica respetando dependencias
async function strategicCleanup(client) {
  // Orden estratégico de limpieza para evitar errores de dependencias
  const cleanupSteps = [
    {
      name: 'Vistas (Views)',
      query: `
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'public'
        ORDER BY viewname
      `,
      dropCommand: (item) => `DROP VIEW IF EXISTS "public"."${item.viewname}" CASCADE`
    },
    {
      name: 'Funciones',
      query: `
        SELECT 
          p.proname,
          pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
        AND p.prokind = 'f'
        ORDER BY p.proname
      `,
      dropCommand: (item) => `DROP FUNCTION IF EXISTS "public"."${item.proname}"(${item.args}) CASCADE`
    },
    {
      name: 'Tablas (con CASCADE)',
      query: `
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT LIKE 'pg_%' 
        AND tablename NOT LIKE 'sql_%'
        ORDER BY tablename
      `,
      dropCommand: (item) => `DROP TABLE IF EXISTS "public"."${item.tablename}" CASCADE`,
      batchMode: true // Eliminar todas las tablas de una vez con CASCADE
    },
    {
      name: 'Secuencias',
      query: `
        SELECT sequencename 
        FROM pg_sequences 
        WHERE schemaname = 'public'
        ORDER BY sequencename
      `,
      dropCommand: (item) => `DROP SEQUENCE IF EXISTS "public"."${item.sequencename}" CASCADE`
    },
    {
      name: 'Tipos ENUM (orden específico)',
      query: `
        SELECT t.typname
        FROM pg_type t 
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
        WHERE t.typtype = 'e'
        AND n.nspname = 'public'
        ORDER BY t.typname
      `,
      dropCommand: (item) => `DROP TYPE IF EXISTS "public"."${item.typname}" CASCADE`
    }
  ];

  for (const step of cleanupSteps) {
    try {
      console.log(`🗑️  Limpiando: ${step.name}...`);
      
      const result = await client.query(step.query);
      
      if (result.rows.length === 0) {
        console.log(`   ✅ No hay ${step.name.toLowerCase()} para eliminar`);
        continue;
      }
      
      console.log(`   📋 Encontrados ${result.rows.length} ${step.name.toLowerCase()}`);
      
      if (step.batchMode && step.name === 'Tablas (con CASCADE)') {
        // Modo especial para tablas: eliminar todas de una vez con CASCADE
        await cleanupTablesBatch(client, result.rows);
      } else {
        // Limpieza individual para otros objetos
        await cleanupIndividual(client, result.rows, step);
      }
      
    } catch (error) {
      console.log(`   ⚠️  Error limpiando ${step.name}: ${error.message}`);
      
      // Para errores de dependencia, intentar DROP CASCADE más agresivo
      if (error.message.includes('depends on') || error.message.includes('dependency')) {
        console.log(`   🔄 Reintentando ${step.name} con CASCADE más agresivo...`);
        await forceDropWithCascade(client, step);
      }
    }
  }
}

// Función especializada para limpiar tablas en lote con CASCADE
async function cleanupTablesBatch(client, tables) {
  try {
    if (tables.length === 0) return;
    
    // Intentar eliminar todas las tablas de una vez con CASCADE
    const tableNames = tables.map(t => `"public"."${t.tablename}"`).join(', ');
    
    console.log(`   🗑️  Eliminando ${tables.length} tablas con CASCADE...`);
    await client.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
    console.log(`   ✅ Todas las tablas eliminadas correctamente`);
    
  } catch (error) {
    console.log(`   ⚠️  Batch falló: ${error.message}`);
    console.log(`   🔄 Intentando eliminación individual...`);
    
    // Fallback: eliminar una por una
    for (const table of tables) {
      try {
        await client.query(`DROP TABLE IF EXISTS "public"."${table.tablename}" CASCADE`);
        console.log(`     ✅ Tabla "${table.tablename}" eliminada`);
      } catch (tableError) {
        console.log(`     ⚠️  Error con tabla "${table.tablename}": ${tableError.message}`);
      }
    }
  }
}

// Función para limpieza individual de objetos
async function cleanupIndividual(client, items, step) {
  let successCount = 0;
  let errorCount = 0;
  
  for (const item of items) {
    try {
      const dropCommand = step.dropCommand(item);
      await client.query(dropCommand);
      successCount++;
    } catch (error) {
      errorCount++;
      console.log(`     ⚠️  Error: ${error.message}`);
    }
  }
  
  console.log(`   ✅ ${successCount} eliminados, ${errorCount} errores`);
}

// Función para forzar DROP con CASCADE agresivo
async function forceDropWithCascade(client, step) {
  try {
    const result = await client.query(step.query);
    
    for (const item of result.rows) {
      try {
        let dropCommand = step.dropCommand(item);
        // Asegurar que tiene CASCADE
        if (!dropCommand.includes('CASCADE')) {
          dropCommand = dropCommand.replace('IF EXISTS', 'IF EXISTS') + ' CASCADE';
        }
        
        await client.query(dropCommand);
        console.log(`     ✅ Forzado con CASCADE exitoso`);
      } catch (forceError) {
        console.log(`     ⚠️  Forzado falló: ${forceError.message}`);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  Error en forzado CASCADE: ${error.message}`);
  }
}

// Función para verificar y reportar estado final
async function verifyAndReport(client) {
  try {
    console.log('🔍 Verificando limpieza final...');
    
    const finalVerification = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables,
        (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as enums,
        (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'public') as sequences,
        (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public') as views,
        (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f') as functions
    `);
    
    const stats = finalVerification.rows[0];
    console.log('📊 Estado final de la base de datos:');
    console.log(`   📋 Tablas: ${stats.tables}`);
    console.log(`   🔢 ENUMs: ${stats.enums}`);
    console.log(`   📈 Secuencias: ${stats.sequences}`);
    console.log(`   👁️  Vistas: ${stats.views}`);
    console.log(`   ⚙️  Funciones: ${stats.functions}`);

    const totalObjects = parseInt(stats.tables) + parseInt(stats.enums) + 
                        parseInt(stats.sequences) + parseInt(stats.views) + 
                        parseInt(stats.functions);

    if (totalObjects === 0) {
      console.log('✅ Base de datos COMPLETAMENTE limpia');
      console.log('✅ Lista para recreación sin problemas de dependencias');
      return true;
    } else {
      console.log(`⚠️  Quedan ${totalObjects} objetos en la base de datos`);
      
      // Si quedan objetos, mostrar cuáles son
      if (parseInt(stats.tables) > 0) {
        await showRemainingTables(client);
      }
      if (parseInt(stats.enums) > 0) {
        await showRemainingEnums(client);
      }
      
      return false;
    }

  } catch (error) {
    console.log('⚠️  Error verificando limpieza final:', error.message);
    return false;
  }
}

// Función para mostrar tablas que no se pudieron eliminar
async function showRemainingTables(client) {
  try {
    const remainingTables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `);
    
    console.log('⚠️  Tablas que no se pudieron eliminar:');
    remainingTables.rows.forEach(row => {
      console.log(`     - ${row.tablename}`);
    });
  } catch (error) {
    console.log('⚠️  Error listando tablas restantes:', error.message);
  }
}

// Función para mostrar ENUMs que no se pudieron eliminar
async function showRemainingEnums(client) {
  try {
    const remainingEnums = await client.query(`
      SELECT t.typname
      FROM pg_type t 
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE t.typtype = 'e'
      AND n.nspname = 'public'
      ORDER BY t.typname
    `);
    
    console.log('⚠️  ENUMs que no se pudieron eliminar:');
    remainingEnums.rows.forEach(row => {
      console.log(`     - ${row.typname}`);
    });
  } catch (error) {
    console.log('⚠️  Error listando ENUMs restantes:', error.message);
  }
}

// Función para diagnosticar errores específicos
async function diagnoseError(error, client) {
  console.log('🔧 Diagnóstico del error:');
  
  if (error.code === '57P01') {
    console.log('💡 Error de conexión administrativa:');
    console.log('   - Verifica que tu usuario tenga permisos suficientes');
    console.log('   - Considera conectarte como superusuario');
    console.log('   - Verifica que no haya otras aplicaciones usando la BD');
  } 
  else if (error.code === '42501') {
    console.log('💡 Error de permisos:');
    console.log('   - Tu usuario no tiene permisos para eliminar estos objetos');
    console.log('   - Solicita permisos de superusuario al administrador');
    console.log('   - O pide que el administrador ejecute este script');
  }
  else if (error.code === '2BP01') {
    console.log('💡 Error de dependencias:');
    console.log('   - Hay dependencias entre objetos que impiden la eliminación');
    console.log('   - Considera usar la opción nuclear (DROP SCHEMA)');
  }
  else if (error.message.includes('ENUM')) {
    console.log('💡 Error específico de ENUM:');
    console.log('   - Los ENUMs tienen dependencias activas');
    console.log('   - Sequelize puede haber creado dependencias automáticas');
    console.log('   - Considera reiniciar las conexiones y reintentar');
  }
  else {
    console.log('💡 Error genérico:');
    console.log(`   Código: ${error.code || 'No definido'}`);
    console.log(`   Mensaje: ${error.message}`);
  }
  
  console.log('');
  console.log('🆘 Si el problema persiste, opciones adicionales:');
  console.log('   1. node scripts/force-clean-postgres-enhanced.js nuclear');
  console.log('   2. Contactar al administrador de la base de datos');
  console.log('   3. Recrear la base de datos manualmente');
}

// Función de opción nuclear: recrear schema completo
async function nuclearOption() {
  console.log('');
  console.log('💥 OPCIÓN NUCLEAR: RECREAR SCHEMA PÚBLICO COMPLETO 💥');
  console.log('⚠️  ESTO ELIMINARÁ ABSOLUTAMENTE TODO EN LA BASE DE DATOS');
  console.log('⚠️  REQUIERE PERMISOS DE SUPERUSUARIO');
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
  });

  try {
    await client.connect();
    console.log('✅ Conectado para opción nuclear');
    
    console.log('💥 Eliminando schema público...');
    await client.query('DROP SCHEMA public CASCADE');
    console.log('✅ Schema público eliminado');
    
    console.log('🏗️  Recreando schema público...');
    await client.query('CREATE SCHEMA public');
    console.log('✅ Schema público recreado');
    
    console.log('🔐 Restaurando permisos...');
    await client.query(`GRANT ALL ON SCHEMA public TO ${process.env.DB_USER}`);
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('✅ Permisos restaurados');
    
    console.log('');
    console.log('🎉 OPCIÓN NUCLEAR COMPLETADA');
    console.log('✅ Base de datos completamente limpia');
    console.log('✅ Lista para recreación');
    
  } catch (error) {
    console.error('❌ Error en opción nuclear:', error.message);
    console.log('');
    console.log('Si la opción nuclear falló:');
    console.log('1. Conecta como superusuario de PostgreSQL');
    console.log('2. Ejecuta manualmente:');
    console.log(`   DROP DATABASE "${process.env.DB_NAME}";`);
    console.log(`   CREATE DATABASE "${process.env.DB_NAME}" OWNER ${process.env.DB_USER};`);
    console.log('3. Reinicia tu aplicación con RECREATE_TABLES=true');
  } finally {
    await client.end();
  }
}

// Ejecutar el script
const action = process.argv[2];

if (action === 'nuclear') {
  nuclearOption();
} else {
  forceCleanPostgreSQLEnhanced().catch(error => {
    console.error('💥 Error crítico:', error.message);
    console.log('');
    console.log('🆘 Si este script falla, considera la opción nuclear:');
    console.log('   node scripts/force-clean-postgres-enhanced.js nuclear');
    console.log('');
    console.log('O ejecuta el script original como fallback:');
    console.log('   node scripts/force-clean-postgres.js');
  });
}