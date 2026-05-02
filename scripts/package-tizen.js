/**
 * Script para empaquetar la app como .wgt para Samsung Tizen
 * Uso: node scripts/package-tizen.js
 * 
 * Requiere: Tizen CLI instalado (tizen command available)
 * O usa el método manual con zip
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '..', 'dist');
const CONFIG_XML = path.join(__dirname, '..', 'config.xml');
const ICON_SRC = path.join(__dirname, '..', 'public', 'cinemania.png');
const OUTPUT_WGT = path.join(__dirname, '..', 'cinemania.wgt');

// 1. Copiar config.xml al dist
console.log('Copiando config.xml...');
fs.copyFileSync(CONFIG_XML, path.join(DIST_DIR, 'config.xml'));

// 2. Copiar icon
if (fs.existsSync(ICON_SRC)) {
  console.log('Copiando icon.png...');
  fs.copyFileSync(ICON_SRC, path.join(DIST_DIR, 'icon.png'));
}

// 3. Intentar usar Tizen CLI
try {
  console.log('Intentando empaquetar con Tizen CLI...');
  execSync(`tizen package -t wgt -o "${OUTPUT_WGT}" -- "${DIST_DIR}"`, { stdio: 'inherit' });
  console.log(`\n✓ Paquete creado: cinemania.wgt`);
} catch {
  // 4. Fallback: crear zip manualmente (renombrar a .wgt)
  console.log('Tizen CLI no disponible. Creando zip manualmente...');
  try {
    execSync(`powershell Compress-Archive -Path "${DIST_DIR}\\*" -DestinationPath "${OUTPUT_WGT}" -Force`, { stdio: 'inherit' });
    console.log(`\n✓ Paquete creado: cinemania.wgt`);
    console.log('  Para instalar: importar en Tizen Studio o usar "tizen install"');
  } catch (e) {
    console.error('Error al crear el paquete:', e.message);
    console.log('\nPasos manuales:');
    console.log('1. Comprimir el contenido de la carpeta dist/ en un zip');
    console.log('2. Renombrar el zip a cinemania.wgt');
    console.log('3. Importar en Tizen Studio');
  }
}
