// scripts/check-model-syntax.js
// Script para detectar problemas de sintaxis en modelos que causan errores de ALTER TABLE

const fs = require('fs');
const path = require('path');

function checkModelSyntax() {
  console.log('🔍 REVISANDO MODELOS PARA DETECTAR PROBLEMAS DE SINTAXIS SQL');
  console.log('');
  
  const modelsDir = path.join(__dirname, '../src/models');
  
  if (!fs.existsSync(modelsDir)) {
    console.log('❌ Directorio de modelos no encontrado:', modelsDir);
    return;
  }
  
  const modelFiles = fs.readdirSync(modelsDir)
    .filter(file => file.endsWith('.js') && file !== 'index.js')
    .sort();
  
  console.log(`📂 Revisando ${modelFiles.length} archivos de modelos...`);
  console.log('');
  
  let issuesFound = 0;
  const problemFiles = [];
  
  modelFiles.forEach(file => {
    console.log(`🔍 Revisando: ${file}`);
    
    const filePath = path.join(modelsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    const issues = [];
    
    // 1. Buscar unique: true en definición de campos (problemático)
    const uniqueInFieldPattern = /(\w+):\s*{[^}]*type:\s*DataTypes\.\w+[^}]*unique:\s*true[^}]*}/g;
    let match;
    while ((match = uniqueInFieldPattern.exec(content)) !== null) {
      issues.push({
        type: 'UNIQUE_IN_FIELD',
        field: match[1],
        description: 'Campo con unique: true dentro de la definición (causa problemas de ALTER TABLE)',
        suggestion: 'Mover unique a la sección indexes'
      });
    }
    
    // 2. Buscar DataTypes.TEXT con parámetros (problemático en PostgreSQL)
    const textWithParamsPattern = /DataTypes\.TEXT\(['"`][^'"`]*['"`]\)/g;
    while ((match = textWithParamsPattern.exec(content)) !== null) {
      issues.push({
        type: 'TEXT_WITH_PARAMS',
        match: match[0],
        description: 'DataTypes.TEXT con parámetros no es compatible con PostgreSQL',
        suggestion: 'Cambiar a DataTypes.TEXT sin parámetros'
      });
    }
    
    // 3. Buscar ENUMs mal formateados
    const enumPattern = /type:\s*DataTypes\.ENUM\(([^)]+)\)/g;
    while ((match = enumPattern.exec(content)) !== null) {
      const enumValues = match[1];
      if (enumValues.includes("'") && enumValues.includes('"')) {
        issues.push({
          type: 'MIXED_QUOTES_ENUM',
          match: match[0],
          description: 'ENUM con comillas mixtas puede causar problemas',
          suggestion: 'Usar solo comillas simples o dobles consistentemente'
        });
      }
    }
    
    // 4. Buscar referencias a modelos sin verificación
    const unsafeReferencesPattern = /models\.(\w+)(?!\s*&&)/g;
    const modelReferences = [];
    while ((match = unsafeReferencesPattern.exec(content)) !== null) {
      if (!content.includes(`if (models.${match[1]})`)) {
        modelReferences.push(match[1]);
      }
    }
    
    if (modelReferences.length > 0) {
      issues.push({
        type: 'UNSAFE_MODEL_REFERENCES',
        models: [...new Set(modelReferences)],
        description: 'Referencias a modelos sin verificación de existencia',
        suggestion: 'Envolver en if (models.ModelName) para evitar errores'
      });
    }
    
    // 5. Buscar paranoid: true con timestamps: false (incompatible)
    if (content.includes('paranoid: true') && content.includes('timestamps: false')) {
      issues.push({
        type: 'PARANOID_WITHOUT_TIMESTAMPS',
        description: 'paranoid: true requiere timestamps: true',
        suggestion: 'Cambiar timestamps a true o paranoid a false'
      });
    }
    
    if (issues.length > 0) {
      console.log(`❌ ${issues.length} problema(s) encontrado(s):`);
      issues.forEach((issue, index) => {
        console.log(`   ${index + 1}. ${issue.type}: ${issue.description}`);
        if (issue.field) console.log(`      Campo: ${issue.field}`);
        if (issue.match) console.log(`      Código: ${issue.match}`);
        if (issue.models) console.log(`      Modelos: ${issue.models.join(', ')}`);
        console.log(`      💡 Solución: ${issue.suggestion}`);
        console.log('');
      });
      issuesFound += issues.length;
      problemFiles.push({ file, issues });
    } else {
      console.log(`✅ Sin problemas detectados`);
    }
    
    console.log('');
  });
  
  // Resumen final
  console.log('📊 RESUMEN DE REVISIÓN:');
  console.log(`   Total archivos revisados: ${modelFiles.length}`);
  console.log(`   Archivos con problemas: ${problemFiles.length}`);
  console.log(`   Total problemas encontrados: ${issuesFound}`);
  console.log('');
  
  if (issuesFound > 0) {
    console.log('🚨 PROBLEMAS CRÍTICOS DETECTADOS:');
    console.log('');
    
    // Mostrar problemas más críticos primero
    const criticalIssues = problemFiles.filter(pf => 
      pf.issues.some(issue => 
        issue.type === 'UNIQUE_IN_FIELD' || 
        issue.type === 'TEXT_WITH_PARAMS'
      )
    );
    
    if (criticalIssues.length > 0) {
      console.log('💥 ESTOS PROBLEMAS CAUSAN ERRORES DE ALTER TABLE:');
      criticalIssues.forEach(pf => {
        console.log(`   📁 ${pf.file}:`);
        pf.issues.forEach(issue => {
          if (issue.type === 'UNIQUE_IN_FIELD' || issue.type === 'TEXT_WITH_PARAMS') {
            console.log(`      ❌ ${issue.description}`);
            console.log(`      💡 ${issue.suggestion}`);
          }
        });
        console.log('');
      });
    }
    
    console.log('🔧 ACCIONES RECOMENDADAS:');
    console.log('1. Corregir los problemas CRÍTICOS mostrados arriba');
    console.log('2. Ejecutar limpieza de base de datos');
    console.log('3. Reiniciar aplicación con RECREATE_TABLES=true');
    console.log('');
    
  } else {
    console.log('✅ ¡Ningún problema detectado en los modelos!');
    console.log('💡 El problema puede estar en la configuración de database.js');
    console.log('   o en el estado de la base de datos.');
  }
}

// Función para generar código corregido automáticamente
function generateFixSuggestions() {
  console.log('');
  console.log('🔧 GENERANDO SUGERENCIAS DE CORRECCIÓN:');
  console.log('');
  
  console.log('Para corregir campos con unique: true, cambia esto:');
  console.log('❌ INCORRECTO:');
  console.log('   email: {');
  console.log('     type: DataTypes.STRING(100),');
  console.log('     unique: true  // ← ESTO CAUSA EL PROBLEMA');
  console.log('   }');
  console.log('');
  console.log('✅ CORRECTO:');
  console.log('   email: {');
  console.log('     type: DataTypes.STRING(100),');
  console.log('     // unique removido de aquí');
  console.log('   }');
  console.log('   // Y agregar en la sección indexes:');
  console.log('   indexes: [');
  console.log('     {');
  console.log('       unique: true,');
  console.log('       fields: [\'email\']');
  console.log('     }');
  console.log('   ]');
  console.log('');
  
  console.log('Para corregir DataTypes.TEXT con parámetros:');
  console.log('❌ INCORRECTO:');
  console.log('   DataTypes.TEXT(\'long\')   // No compatible con PostgreSQL');
  console.log('');
  console.log('✅ CORRECTO:');
  console.log('   DataTypes.TEXT           // Compatible con PostgreSQL');
  console.log('');
}

console.log('🚨 INICIANDO REVISIÓN DE MODELOS PARA DETECTAR PROBLEMAS SQL');
console.log('');

checkModelSyntax();
generateFixSuggestions();