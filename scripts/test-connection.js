// Archivo: scripts/test-connection.js
// Yo como desarrollador creo un script para probar la conexión a la BD

require('dotenv').config();
const { Client } = require('pg');

async function testConnection() {
  console.log('🔍 Probando conexión a PostgreSQL...');
  console.log('📍 Configuración:');
  console.log(`   Host: ${process.env.DB_HOST}`);
  console.log(`   Puerto: ${process.env.DB_PORT || 5432}`);
  console.log(`   Base de datos: ${process.env.DB_NAME}`);
  console.log(`   Usuario: ${process.env.DB_USER}`);
  console.log(`   Password: ${process.env.DB_PASSWORD ? '***configurada***' : '❌ NO CONFIGURADA'}`);
  
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
    console.log('🔄 Conectando...');
    await client.connect();
    console.log('✅ Conexión exitosa!');
    
    const result = await client.query('SELECT version()');
    console.log('📊 Versión de PostgreSQL:', result.rows[0].version);
    
    await client.end();
    console.log('✅ Conexión cerrada correctamente');
    
  } catch (error) {
    console.error('❌ Error de conexión:', error.message);
    console.error('🔧 Detalles del error:', error);
    
    // Sugerencias según el tipo de error
    if (error.code === 'ENOTFOUND') {
      console.error('💡 El host no se pudo resolver. Verifica DB_HOST en .env');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Conexión rechazada. Verifica que la BD esté corriendo y el puerto');
    } else if (error.code === '28P01') {
      console.error('💡 Autenticación fallida. Verifica DB_USER y DB_PASSWORD');
    }
  }
}

testConnection();