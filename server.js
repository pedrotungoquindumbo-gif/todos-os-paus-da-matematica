import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

// Configuração do modo de manutenção
let MAINTENANCE_MODE = process.env.MAINTENANCE_MODE !== undefined 
  ? process.env.MAINTENANCE_MODE === 'true' 
  : true;

// Servir arquivos estáticos
app.use(express.static(__dirname, { index: false }));
app.use(express.static(path.join(__dirname, 'public'), { index: false }));

// Roteamento com suporte a modo de manutenção
app.get('*', (req, res) => {
  // Acesso explícito à página de manutenção
  if (req.path === '/manutencao' || req.path === '/maintenance.html') {
    return res.sendFile(path.join(__dirname, 'maintenance.html'));
  }

  // Acesso ao site original se necessário (/site ou /site.html)
  if (req.path === '/site' || req.path === '/site.html' || req.path === '/principal') {
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
  console.log(`Modo de Manutenção: ${MAINTENANCE_MODE ? 'ATIVADO (Exibindo página de manutenção)' : 'DESATIVADO (Exibindo index.html)'}`);
});
