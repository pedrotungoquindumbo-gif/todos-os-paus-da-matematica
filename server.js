import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// ============================================================================
// CONFIGURAÇÃO DO MODO DE MANUTENÇÃO (MAINTENANCE MODE)
// ----------------------------------------------------------------------------
// Para ATIVAR o modo de manutenção: defina como true
// Para DESATIVAR e exibir o site normal: defina como false
// Também pode ser controlado pela variável de ambiente: MAINTENANCE_MODE=true/false
// ============================================================================
let MAINTENANCE_MODE = process.env.MAINTENANCE_MODE !== undefined 
  ? process.env.MAINTENANCE_MODE === 'true' 
  : true; // <--- Altere aqui para false quando quiser desativar!

// Servir arquivos estáticos sem interceptar automaticamente a raiz com index.html
app.use(express.static(__dirname, { index: false }));

// Roteamento com suporte a modo de manutenção
app.get('*', (req, res) => {
  // Acesso explícito à página de manutenção
  if (req.path === '/manutencao' || req.path === '/maintenance.html') {
    return res.sendFile(path.join(__dirname, 'maintenance.html'));
  }

  // Acesso ao site original se necessário (/site)
  if (req.path === '/site') {
    return res.sendFile(path.join(__dirname, 'index.html'));
  }

  // Se o modo de manutenção estiver ativo, exibir a página de manutenção
  if (MAINTENANCE_MODE) {
    return res.sendFile(path.join(__dirname, 'maintenance.html'));
  }

  // Modo normal: exibe o site principal
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor iniciado em http://${HOST}:${PORT}`);
  console.log(`Modo de Manutenção: ${MAINTENANCE_MODE ? 'ATIVADO (Exibindo página de construção)' : 'DESATIVADO (Exibindo index.html)'}`);
});
