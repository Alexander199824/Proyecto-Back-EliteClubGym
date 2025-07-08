// Archivo: scripts/check-models.js
// creo un script para verificar que solo tengamos los 19 modelos correctos

const fs = require('fs');
const path = require('path');

const expectedModels = [
  'BankTransfer.js',
  'Client.js',
  'ClientCheckin.js',
  'ClientMembership.js',
  'ClientPreferences.js',
  'Image.js',
  'MembershipType.js',
  'Notification.js',
  'Order.js',
  'OrderItem.js',
  'Payment.js',
  'PointsTransaction.js',
  'Prize.js',
  'PrizeWinning.js',
  'Product.js',
  'ProductCategory.js',
  'QRCode.js',
  'Roulette.js',
  'User.js'
];

const modelsPath = path.join(__dirname, '../src/models');

console.log('🔍 Verificando modelos en src/models/...');

if (!fs.existsSync(modelsPath)) {
  console.error('❌ Directorio src/models/ no encontrado');
  process.exit(1);
}

const actualFiles = fs.readdirSync(modelsPath)
  .filter(file => file.endsWith('.js'))
  .sort();

console.log(`📊 Archivos encontrados: ${actualFiles.length}`);
console.log(`📊 Archivos esperados: ${expectedModels.length}`);

// Verificar archivos extra
const extraFiles = actualFiles.filter(file => !expectedModels.includes(file));
if (extraFiles.length > 0) {
  console.error('❌ Archivos EXTRA encontrados (estos causan problemas):');
  extraFiles.forEach(file => {
    console.error(`   - ${file}`);
  });
  console.log('💡 Elimina estos archivos y vuelve a intentar');
  process.exit(1);
}

// Verificar archivos faltantes
const missingFiles = expectedModels.filter(file => !actualFiles.includes(file));
if (missingFiles.length > 0) {
  console.error('❌ Archivos FALTANTES:');
  missingFiles.forEach(file => {
    console.error(`   - ${file}`);
  });
  process.exit(1);
}

console.log('✅ Todos los modelos están correctos');
console.log('📁 Archivos encontrados:');
actualFiles.forEach(file => {
  console.log(`   ✓ ${file}`);
});