// Archivo: scripts/fix-associations.js
// Yo como desarrollador creo un script para verificar y corregir las asociaciones

const fs = require('fs');
const path = require('path');

const modelsDir = path.join(__dirname, '../src/models');
const modelFiles = fs.readdirSync(modelsDir).filter(file => file.endsWith('.js'));

console.log('🔍 Verificando asociaciones en modelos...');

modelFiles.forEach(file => {
  const filePath = path.join(modelsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  // Buscar asociaciones sin verificación de existencia del modelo
  const hasUnsafeAssociations = content.includes('models.') && 
                                !content.includes('if (models.');
  
  if (hasUnsafeAssociations && content.includes('.associate')) {
    console.log(`⚠️  ${file} tiene asociaciones que pueden necesitar verificación`);
  }
});

console.log('✅ Verificación completada');