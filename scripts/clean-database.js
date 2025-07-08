// scripts/clean-database.js
// Script para limpiar la base de datos completamente

require('dotenv').config();
const { Client } = require('pg');

async function cleanDatabase() {
  console.log('🧹 Iniciando limpieza completa de la base de datos...');
  
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

    // 1. Eliminar todas las tablas (en orden correcto para evitar conflictos de FK)
    console.log('🗑️  Eliminando todas las tablas...');
    
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
    
    await client.query(dropTablesQuery);
    console.log('✅ Todas las tablas eliminadas');

    // 2. Eliminar todos los tipos ENUM
    console.log('🗑️  Eliminando tipos ENUM...');
    
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
    
    await client.query(dropEnumsQuery);
    console.log('✅ Todos los tipos ENUM eliminados');

    console.log('🎉 Base de datos limpiada completamente');
    console.log('');
    console.log('Ahora puedes ejecutar: npm start');
    
  } catch (error) {
    console.error('❌ Error limpiando la base de datos:', error.message);
  } finally {
    await client.end();
  }
}

cleanDatabase();