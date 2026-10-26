import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');

console.log('🔍 A verificar integridade de todas as imagens para publicação na Vercel...');

const htmlPath = path.join(rootDir, 'index.html');
const swPath = path.join(publicDir, 'sw.js');

if (!fs.existsSync(htmlPath)) {
  console.error('❌ Ficheiro index.html não encontrado na raiz!');
  process.exit(1);
}

const htmlContent = fs.readFileSync(htmlPath, 'utf-8');
const swContent = fs.existsSync(swPath) ? fs.readFileSync(swPath, 'utf-8') : '';

// Extrair referências a /assets/images/
const imageRegex = /["'\/](\/assets\/images\/[a-zA-Z0-9_\-\.]+\.(webp|png|jpg|jpeg|svg))/g;
const referencedImages = new Set();

let match;
while ((match = imageRegex.exec(htmlContent)) !== null) {
  referencedImages.add(match[1]);
}
while ((match = imageRegex.exec(swContent)) !== null) {
  referencedImages.add(match[1]);
}

if (referencedImages.size === 0) {
  console.error('❌ Nenhuma imagem /assets/images/ encontrada no index.html!');
  process.exit(1);
}

console.log(`📋 Encontradas ${referencedImages.size} imagens referenciadas no código.`);

let missingCount = 0;
const verifiedImages = [];

for (const imgUrl of referencedImages) {
  // Ex: /assets/images/foto-autor.webp -> public/assets/images/foto-autor.webp
  const localRelativePath = imgUrl.replace(/^\//, '');
  const fullPath = path.join(publicDir, localRelativePath);

  if (!fs.existsSync(fullPath)) {
    console.error(`❌ FALTANDO EM PUBLIC: ${imgUrl} -> Ficheiro não existe em: ${fullPath}`);
    missingCount++;
  } else {
    const stats = fs.statSync(fullPath);
    const sizeKb = (stats.size / 1024).toFixed(1);
    verifiedImages.push({ url: imgUrl, size: `${sizeKb} KB` });
  }
}

if (missingCount > 0) {
  console.error(`\n🚨 FALHA DE VERIFICAÇÃO: ${missingCount} imagem(ns) não existe(m) na pasta public/!`);
  process.exit(1);
}

console.log('\n✅ VERIFICAÇÃO AUTOMÁTICA BEM-SUCEDIDA:');
verifiedImages.forEach(img => {
  console.log(`   ✓ ${img.url.padEnd(45)} [${img.size}]`);
});
console.log(`\n🎉 Todas as ${verifiedImages.length} imagens existem em public/ e estão prontas para a Vercel com zero 404!`);
process.exit(0);
