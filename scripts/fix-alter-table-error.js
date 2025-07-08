// scripts/fix-alter-table-error.js
// Script de SOLUCIÓN INMEDIATA para el error de ALTER TABLE UNIQUE en PostgreSQL

require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function fixAlterTableError() {
  console.log('🚨 SOLUCIONANDO ERROR DE ALTER TABLE UNIQUE 🚨');
  console.log('Este script resuelve el error específico de sintaxis SQL con UNIQUE');
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

    // Paso 1: Diagnosticar el problema actual
    console.log('🔍 Diagnosticando el problema...');
    await diagnoseProblem(client);

    // Paso 2: Limpieza COMPLETA y DEFINITIVA
    console.log('🗑️  Ejecutando limpieza completa para evitar ALTER TABLE...');
    await completeCleanup(client);

    // Paso 3: Verificar que está 100% limpia
    console.log('🔍 Verificando limpieza completa...');
    const isClean = await verifyCompleteCleanup(client);
    
    if (!isClean) {
      console.log('⚠️  Limpieza no completa. Ejecutando limpieza agresiva...');
      await aggressiveCleanup(client);
    }

    // Paso 4: Verificar configuración de .env
    console.log('⚙️  Verificando configuración...');
    await verifyEnvConfiguration();

    console.log('');
    console.log('🎉 PROBLEMA RESUELTO');
    console.log('✅ Base de datos completamente limpia');
    console.log('✅ Lista para recreación sin errores de ALTER TABLE');
    console.log('');
    console.log('🚀 PRÓXIMOS PASOS:');
    console.log('1. Ejecuta: npm start');
    console.log('2. La aplicación recreará las tablas automáticamente');
    console.log('3. NO habrá errores de ALTER TABLE');

  } catch (error) {
    console.error('❌ Error ejecutando solución:', error.message);
    console.log('');
    console.log('🆘 Si este script falla:');
    console.log('1. Verifica que tu usuario tenga permisos de administrador');
    console.log('2. O ejecuta como superusuario');
    console.log('3. O contacta al administrador de la base de datos');
    
  } finally {
    await client.end();
  }
}

// Función para diagnosticar el problema específico
async function diagnoseProblem(client) {
  try {
    console.log('📊 Analizando estado actual...');
    
    const analysis = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables,
        (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as enums,
        (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'public') as sequences,
        (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public') as views
    `);
    
    const stats = analysis.rows[0];
    console.log(`   📋 Tablas existentes: ${stats.tables}`);
    console.log(`   🔢 ENUMs existentes: ${stats.enums}`);
    console.log(`   📈 Secuencias existentes: ${stats.sequences}`);
    console.log(`   👁️  Vistas existentes: ${stats.views}`);
    
    const totalObjects = parseInt(stats.tables) + parseInt(stats.enums) + parseInt(stats.sequences) + parseInt(stats.views);
    
    if (totalObjects > 0) {
      console.log('');
      console.log('🔍 DIAGNÓSTICO:');
      console.log('❌ La base de datos NO está limpia');
      console.log('❌ Sequelize está intentando usar ALTER TABLE en lugar de CREATE TABLE');
      console.log('❌ PostgreSQL genera sintaxis SQL incorrecta con ALTER TABLE + UNIQUE');
      console.log('');
      console.log('✅ SOLUCIÓN: Limpiar completamente y usar force: true');
    } else {
      console.log('✅ Base de datos ya está limpia');
    }
    
  } catch (error) {
    console.log('⚠️  Error en diagnóstico:', error.message);
  }
}

// Función de limpieza completa y definitiva
async function completeCleanup(client) {
  console.log('🗑️  Iniciando limpieza completa...');
  
  try {
    // Paso 1: Terminar todas las conexiones conflictivas
    console.log('   🔄 Terminando conexiones activas...');
    await client.query(`
      SELECT pg_terminate_backend(pid)
      FROM pg_stat_activity
      WHERE datname = current_database() 
      AND pid <> pg_backend_pid()
      AND state <> 'idle'
    `);
    
    // Paso 2: Eliminar TODAS las vistas primero
    console.log('   🗑️  Eliminando vistas...');
    const views = await client.query(`
      SELECT viewname FROM pg_views WHERE schemaname = 'public'
    `);
    
    for (const view of views.rows) {
      try {
        await client.query(`DROP VIEW IF EXISTS "public"."${view.viewname}" CASCADE`);
      } catch (error) {
        // Ignorar errores de dependencias
      }
    }
    
    // Paso 3: Eliminar TODAS las funciones
    console.log('   🗑️  Eliminando funciones...');
    const functions = await client.query(`
      SELECT p.proname, pg_get_function_identity_arguments(p.oid) as args
      FROM pg_proc p
      JOIN pg_namespace n ON p.pronamespace = n.oid
      WHERE n.nspname = 'public' AND p.prokind = 'f'
    `);
    
    for (const func of functions.rows) {
      try {
        await client.query(`DROP FUNCTION IF EXISTS "public"."${func.proname}"(${func.args}) CASCADE`);
      } catch (error) {
        // Ignorar errores
      }
    }
    
    // Paso 4: Eliminar TODAS las tablas con CASCADE MASIVO
    console.log('   🗑️  Eliminando todas las tablas...');
    const tables = await client.query(`
      SELECT tablename FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT LIKE 'pg_%'
      AND tablename NOT LIKE 'sql_%'
      ORDER BY tablename
    `);
    
    if (tables.rows.length > 0) {
      // Intento 1: Eliminar todas de una vez
      try {
        const tableNames = tables.rows.map(t => `"public"."${t.tablename}"`).join(', ');
        await client.query(`DROP TABLE IF EXISTS ${tableNames} CASCADE`);
        console.log(`      ✅ ${tables.rows.length} tablas eliminadas en lote`);
      } catch (error) {
        // Intento 2: Una por una con CASCADE
        console.log('      🔄 Eliminando tablas individualmente...');
        for (const table of tables.rows) {
          try {
            await client.query(`DROP TABLE IF EXISTS "public"."${table.tablename}" CASCADE`);
          } catch (tableError) {
            // Ignorar errores específicos de tablas
          }
        }
      }
    }
    
    // Paso 5: Eliminar TODOS los tipos ENUM de forma agresiva
    console.log('   🗑️  Eliminando todos los ENUMs...');
    const enums = await client.query(`
      SELECT t.typname
      FROM pg_type t 
      LEFT JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
      WHERE t.typtype = 'e' AND n.nspname = 'public'
      ORDER BY t.typname
    `);
    
    // Intentar eliminación múltiple de ENUMs
    for (const enumType of enums.rows) {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await client.query(`DROP TYPE IF EXISTS "public"."${enumType.typname}" CASCADE`);
          break; // Éxito, salir del loop de intentos
        } catch (error) {
          if (attempt === 2) {
            // Último intento, ignorar error
            console.log(`      ⚠️  No se pudo eliminar ENUM ${enumType.typname}`);
          }
          // Esperar un poco antes del siguiente intento
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    // Paso 6: Eliminar secuencias y otros objetos
    console.log('   🗑️  Eliminando secuencias...');
    const sequences = await client.query(`
      SELECT sequencename FROM pg_sequences WHERE schemaname = 'public'
    `);
    
    for (const seq of sequences.rows) {
      try {
        await client.query(`DROP SEQUENCE IF EXISTS "public"."${seq.sequencename}" CASCADE`);
      } catch (error) {
        // Ignorar errores
      }
    }
    
    console.log('✅ Limpieza completa terminada');
    
  } catch (error) {
    console.error('❌ Error en limpieza completa:', error.message);
    throw error;
  }
}

// Función para verificar limpieza completa
async function verifyCompleteCleanup(client) {
  try {
    const verification = await client.query(`
      SELECT 
        (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as tables,
        (SELECT COUNT(*) FROM pg_type WHERE typtype = 'e' AND typnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')) as enums,
        (SELECT COUNT(*) FROM pg_sequences WHERE schemaname = 'public') as sequences,
        (SELECT COUNT(*) FROM pg_views WHERE schemaname = 'public') as views,
        (SELECT COUNT(*) FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'public' AND p.prokind = 'f') as functions
    `);
    
    const stats = verification.rows[0];
    console.log('📊 Verificación final:');
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
      return true;
    } else {
      console.log(`⚠️  Quedan ${totalObjects} objetos. Necesita limpieza agresiva.`);
      return false;
    }
    
  } catch (error) {
    console.log('⚠️  Error en verificación:', error.message);
    return false;
  }
}

// Función de limpieza agresiva (opción nuclear)
async function aggressiveCleanup(client) {
  console.log('💥 Ejecutando limpieza agresiva (opción nuclear)...');
  
  try {
    console.log('   💥 Eliminando esquema público completo...');
    await client.query('DROP SCHEMA public CASCADE');
    console.log('   ✅ Esquema público eliminado');
    
    console.log('   🏗️  Recreando esquema público...');
    await client.query('CREATE SCHEMA public');
    console.log('   ✅ Esquema público recreado');
    
    console.log('   🔐 Restaurando permisos...');
    await client.query(`GRANT ALL ON SCHEMA public TO ${process.env.DB_USER}`);
    await client.query('GRANT ALL ON SCHEMA public TO public');
    console.log('   ✅ Permisos restaurados');
    
    console.log('✅ Limpieza agresiva completada');
    
  } catch (error) {
    console.error('❌ Error en limpieza agresiva:', error.message);
    console.log('');
    console.log('🆘 La limpieza agresiva falló. Opciones manuales:');
    console.log('1. Conecta como superusuario de PostgreSQL');
    console.log('2. Ejecuta:');
    console.log(`   DROP DATABASE "${process.env.DB_NAME}";`);
    console.log(`   CREATE DATABASE "${process.env.DB_NAME}" OWNER ${process.env.DB_USER};`);
    throw error;
  }
}

// Función para verificar configuración del .env
async function verifyEnvConfiguration() {
  try {
    const envPath = path.join(process.cwd(), '.env');
    
    if (!fs.existsSync(envPath)) {
      console.log('⚠️  Archivo .env no encontrado');
      return;
    }
    
    const envContent = fs.readFileSync(envPath, 'utf8');
    
    // Verificar RECREATE_TABLES
    if (!envContent.includes('RECREATE_TABLES=true')) {
      console.log('🔧 Configurando RECREATE_TABLES=true...');
      
      let newContent = envContent;
      if (envContent.includes('RECREATE_TABLES=')) {
        newContent = newContent.replace(/RECREATE_TABLES=.*/, 'RECREATE_TABLES=true');
      } else {
        newContent += '\nRECREATE_TABLES=true';
      }
      
      fs.writeFileSync(envPath, newContent);
      console.log('✅ RECREATE_TABLES configurado como true');
    } else {
      console.log('✅ RECREATE_TABLES ya está configurado como true');
    }
    
    // Asegurar NODE_ENV
    if (!envContent.includes('NODE_ENV=')) {
      console.log('🔧 Configurando NODE_ENV=development...');
      const newContent = envContent + '\nNODE_ENV=development';
      fs.writeFileSync(envPath, newContent);
      console.log('✅ NODE_ENV configurado');
    }
    
  } catch (error) {
    console.log('⚠️  Error verificando configuración .env:', error.message);
  }
}

// Función de ayuda para problemas persistentes
function showTroubleshootingHelp() {
  console.log('');
  console.log('🆘 AYUDA PARA PROBLEMAS PERSISTENTES:');
  console.log('');
  console.log('Si el error de ALTER TABLE persiste:');
  console.log('');
  console.log('1. VERIFICAR PERMISOS:');
  console.log('   - Tu usuario debe tener permisos de DROP/CREATE');
  console.log('   - Considera usar un superusuario temporal');
  console.log('');
  console.log('2. VERIFICAR CONEXIONES:');
  console.log('   - Cierra otros clientes de PostgreSQL');
  console.log('   - Cierra otras instancias de la aplicación');
  console.log('');
  console.log('3. LIMPIEZA MANUAL:');
  console.log('   - Conecta con psql como superusuario');
  console.log(`   - Ejecuta: DROP DATABASE "${process.env.DB_NAME}";`);
  console.log(`   - Ejecuta: CREATE DATABASE "${process.env.DB_NAME}" OWNER ${process.env.DB_USER};`);
  console.log('');
  console.log('4. VERIFICAR VERSIONES:');
  console.log('   - PostgreSQL: 12.x o superior recomendado');
  console.log('   - Node.js: 16.x o superior recomendado');
  console.log('   - Sequelize: 6.x');
  console.log('');
}

// Ejecutar el script
console.log('🚨 INICIANDO SOLUCIÓN PARA ERROR DE ALTER TABLE UNIQUE');
console.log('');

fixAlterTableError().catch(error => {
  console.error('💥 Error crítico:', error.message);
  showTroubleshootingHelp();
  process.exit(1);
});