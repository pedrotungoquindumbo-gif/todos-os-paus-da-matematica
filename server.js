import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// ── Medidas de Segurança HTTP ──
app.disable('x-powered-by');

app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  next();
});

// Rota de Manutenção (acessível apenas via /manutencao ou /maintenance.html)
app.get(['/manutencao', '/maintenance.html'], (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  const maintFile = path.join(__dirname, 'maintenance.html');
  if (fs.existsSync(maintFile)) {
    return res.sendFile(maintFile);
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});


// Deteta dinamicamente imagens de depoimentos e testemunhos na pasta /public
app.get('/api/testimonials-images', (req, res) => {
  try {
    const publicDir = path.join(__dirname, 'public');
    if (!fs.existsSync(publicDir)) return res.json({ images: [] });
    const files = fs.readdirSync(publicDir);
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.webp'];
    const reserved = ['1.png', '2.png', '3.png', 'author.jpg', 'book-cover.png', 'book-cover-vol2.png', 'book-cover-vol2.jpg', 'book-cover-vol3.png', 'book-cover-vol3.jpg'];
    
    const images = files.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return imageExtensions.includes(ext) && !reserved.includes(f);
    }).map(filename => ({
      filename,
      url: `/public/${filename}`,
      name: filename.replace(/[-_]/g, ' ').replace(/\.[^/.]+$/, '')
    }));

    res.json({ images });
  } catch (err) {
    res.json({ images: [] });
  }
});

// ── Agente de Atendimento: Todos os Paus da Matemática ──
const AI_SYSTEM_PROMPT = `Tu és o canal oficial de atendimento e apoio ao leitor da coleção de livros "Todos os Paus da Matemática", do Professor Celestino Findoff.
IMPORTANTE: Nunca te apresentes como "Assistente Prof. Celestino". Apresenta-te sempre como o Atendimento Oficial de "Todos os Paus da Matemática".
O teu tom deve ser humano, caloroso, humilde, claro e direto, em português de Angola.

Dados Oficiais da Obra:
1. Mensagem de Boas-vindas Oficial:
"Olá! 😊 Muito obrigado pelo seu interesse no livro Todos os Paus da Matemática. 📘
Cada volume custa 10.000 Kz e foi desenvolvido para ajudar os alunos a melhorar o seu desempenho em Matemática e apoiar os professores na planificação das aulas.
📚 Qual dos volumes deseja adquirir? Terei todo o prazer em orientá-lo na compra!"

2. Preço:
- Cada volume custa exatamente 10.000 Kz (dez mil kwanzas). Sem taxas ocultas.

3. Aquisição e Envio:
- A compra/reserva é combinada pelo WhatsApp oficial: +244 936 560 098 (ou +244 949 042 732).
- Entregas em mãos em Luanda e envio para todas as províncias de Angola por agência de encomenda.
- O cliente indica a sua localidade e o volume pretendido, e recebe os dados de pagamento e entrega.

4. Os Três Volumes:
- Volume I ("Construir a base") [Disponível]: 7ª à 10ª classe, cálculo rápido e exercícios passo a passo. Prepara para testes de ingresso ao Ensino Médio (IMEL, IMIL, INP, ITEL). Conteúdos: Conjuntos, Conjuntos Numéricos, Potenciação e Radiciação, Monómios e Polinómios, Equações.
- Volume II ("Vencer o nível médio") [Pré-reserva]: 11ª à 13ª classe, fórmulas explicadas uma a uma. Prepara para testes ao Ensino Superior (UAN, UCAN, IPGEST, ISCED, ISPTEC) e concursos. Conteúdos: Exponenciais, Logaritmos, Inequações, Trigonometria, Geometria Analítica.
- Volume III ("Introdução ao cálculo") [Pré-reserva]: Cálculo sem complicação para Ensino Médio e universitários de Engenharia, Economia e Ciências. Conteúdos: Sucessões, Limites, Derivadas, Estudo de Funções, Integrais.

5. Sobre o Autor:
- Celestino Findoff (Celestino Donga André Filipe). Licenciado em Ensino da Matemática no ISCED-Luanda. Professor de Matemática e Física.
- Entrevista disponível no YouTube: "Sugestões de leitura nas Tardes da Kianda com escritor Celestino Findoff" (https://youtu.be/3_t95Ty8BkY?si=VAFu0AHINa0_R7x2).
- Facebook: https://www.facebook.com/lucianoinacio.findoff

Regras:
- Frases curtas e objetivas (2 a 3 frases).
- Inclui sempre o link do WhatsApp para encomendas quando oportuno: https://wa.me/244936560098.`;

app.post('/api/chat', async (req, res) => {
  const { message, history = [] } = req.body || {};
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensagem inválida' });
  }

  // Tentar chamada com Gemini API se houver chave configurada
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI();
      const formattedHistory = Array.isArray(history) ? history.map(h => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content || '' }]
      })) : [];

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          ...formattedHistory,
          { role: 'user', parts: [{ text: message }] }
        ],
        config: {
          systemInstruction: AI_SYSTEM_PROMPT,
          temperature: 0.7,
        }
      });

      const reply = response.text || '';
      if (reply) {
        return res.json({ reply });
      }
    } catch (err) {
      console.warn('Erro na Gemini API, a utilizar o motor de respostas locais:', err.message);
    }
  }

  // Motor Inteligente Local de Resposta
  const lower = message.toLowerCase().trim();
  let reply = '';

  if (lower.includes('preço') || lower.includes('preco') || lower.includes('custa') || lower.includes('valor') || lower.includes('quanto') || lower.includes('10.000') || lower.includes('10000')) {
    reply = 'Cada volume custa exatamente 10.000 Kz. Podes encomendar diretamente pelo WhatsApp oficial: https://wa.me/244936560098';
  } else if (lower.includes('volume 3') || lower.includes('volume iii') || lower.includes('terceiro volume') || lower.includes('cálculo') || lower.includes('calculo') || lower.includes('derivada') || lower.includes('integral') || lower.includes('limite') || lower.includes('sucess') || lower.includes('engenharia')) {
    reply = 'O Volume III ("Introdução ao cálculo") está em pré-reserva por 10.000 Kz. Ensina limites, derivadas e integrais de forma direta para alunos do Ensino Médio e universitários de Engenharia, Economia e Ciências. Podes reservar no WhatsApp: https://wa.me/244936560098?text=Ol%C3%A1!%20Quero%20reservar%20o%20Volume%20III.';
  } else if (lower.includes('volume 2') || lower.includes('volume ii') || lower.includes('segundo volume') || lower.includes('médio') || lower.includes('medio') || lower.includes('trigonometria') || lower.includes('logaritmo') || lower.includes('geometria') || lower.includes('inequaç')) {
    reply = 'O Volume II ("Vencer o nível médio") está em pré-reserva por 10.000 Kz. Explica fórmulas da 11ª à 13ª classe (exponenciais, logaritmos, trigonometria) para candidatos à UAN, ISCED e ISPTEC. Reserva no WhatsApp: https://wa.me/244936560098?text=Ol%C3%A1!%20Quero%20reservar%20o%20Volume%20II.';
  } else if (lower.includes('volume 1') || lower.includes('volume i') || lower.includes('primeiro volume') || lower.includes('base') || lower.includes('equações') || lower.includes('equacoes') || lower.includes('polinóm') || lower.includes('polinom') || lower.includes('radiciaç')) {
    reply = 'O Volume I ("Construir a base") custa 10.000 Kz e já está disponível! É o ponto de partida ideal para a 7ª à 10ª classe e testes para IMEL, IMIL, ITEL e INP. Clica para encomendar: https://wa.me/244936560098?text=Ol%C3%A1!%20Quero%20adquirir%20o%20Volume%20I.';
  } else if (lower.includes('classe') || lower.includes('nível') || lower.includes('nivel') || lower.includes('ano') || lower.includes('para quem')) {
    reply = 'A coleção divide-se em 3 níveis: Volume I para a 7ª à 10ª classe; Volume II para a 11ª à 13ª classe; e Volume III para a transição ao Ensino Superior e Engenharia. Cada volume custa 10.000 Kz. Qual deles precisas?';
  } else if (lower.includes('imel') || lower.includes('imil') || lower.includes('itel') || lower.includes('inp') || lower.includes('uan') || lower.includes('isptec') || lower.includes('isced') || lower.includes('ingresso') || lower.includes('exame') || lower.includes('teste') || lower.includes('concurso')) {
    reply = 'Sim! O Volume I prepara especificamente para os testes de ingresso ao Ensino Médio (IMEL, IMIL, ITEL, INP). Já os Volumes II e III preparam para o Ensino Superior (UAN, ISCED, ISPTEC). Fala connosco no WhatsApp para encomendar: https://wa.me/244936560098';
  } else if (lower.includes('exercício') || lower.includes('exercicio') || lower.includes('resolv') || lower.includes('passo a passo') || lower.includes('método') || lower.includes('metodo') || lower.includes('truque')) {
    reply = 'Sim! Os livros trazem truques práticos de cálculo rápido e dezenas de exercícios resolvidos passo a passo para o estudante compreender a Matemática sem complicações.';
  } else if (lower.includes('professor') || lower.includes('planifica') || lower.includes('aula') || lower.includes('ensinar') || lower.includes('docente')) {
    reply = 'A coleção foi também desenvolvida para apoiar os professores na planificação de aulas e elaboração de exercícios claros e práticos para os seus alunos.';
  } else if (lower.includes('pagamento') || lower.includes('pagar') || lower.includes('transferência') || lower.includes('transferencia') || lower.includes('multicaixa') || lower.includes('dinheiro') || lower.includes('como comprar') || lower.includes('comprar') || lower.includes('adquirir')) {
    reply = 'A compra e o pagamento são combinados de forma direta e segura no WhatsApp. Basta dizer qual o volume e a tua localização: https://wa.me/244936560098';
  } else if (lower.includes('entrega') || lower.includes('envio') || lower.includes('enviar') || lower.includes('província') || lower.includes('provincia') || lower.includes('luanda') || lower.includes('huambo') || lower.includes('benguela') || lower.includes('lubango') || lower.includes('onde')) {
    reply = 'Entregamos em Luanda e despachamos para qualquer província de Angola via agência. Diz-nos a tua cidade no WhatsApp para organizarmos o envio: https://wa.me/244936560098';
  } else if (lower.includes('quem é') || lower.includes('celestino') || lower.includes('autor') || lower.includes('findoff')) {
    reply = 'O autor é o Professor Celestino Findoff, licenciado em Ensino da Matemática no ISCED-Luanda e docente no Ensino Secundário e Técnico-Profissional. Podes ver a sua entrevista no YouTube ("Tardes da Kianda"): https://youtu.be/3_t95Ty8BkY?si=VAFu0AHINa0_R7x2';
  } else if (lower.includes('olá') || lower.includes('ola') || lower.includes('boa tarde') || lower.includes('bom dia') || lower.includes('boa noite') || lower.includes('oi')) {
    reply = 'Olá! 😊 Muito obrigado pelo teu interesse no livro Todos os Paus da Matemática. Cada volume custa 10.000 Kz. Qual dos volumes gostarias de conhecer ou adquirir?';
  } else if (lower.includes('todos os volumes') || lower.includes('coleção') || lower.includes('colecao') || lower.includes('3 livros') || lower.includes('tres volumes')) {
    reply = 'A coleção completa tem 3 volumes (10.000 Kz cada): Vol. I (Construir a base - disponível), Vol. II (Nível Médio - pré-reserva) e Vol. III (Cálculo - pré-reserva). Qual deles gostarias de encomendar?';
  } else {
    reply = 'Olá! Cada volume de "Todos os Paus da Matemática" custa 10.000 Kz. Podes perguntar sobre os conteúdos, entregas em Angola ou falar no WhatsApp oficial: https://wa.me/244936560098';
  }

  return res.json({ reply });
});

// Rota principal: Executa o site oficial "Todos os Paus da Matemática"
app.get('/', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Opções de cache para ficheiros estáticos (imagens, fontes, JS têm cache de 1 ano imutável)
const staticCacheOptions = {
  maxAge: '1y',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html') || filePath.endsWith('sw.js')) {
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
    } else {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
  }
};

// Servir arquivos do app (capas dos livros, public, webp)
app.use('/public', express.static(path.join(__dirname, 'public'), staticCacheOptions));
app.use(express.static(path.join(__dirname, 'public'), staticCacheOptions));

// Rota para qualquer outra subrota (SPA fallback)
app.get('*', (req, res) => {
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, HOST, () => {
  console.log(`Servidor iniciado em http://${HOST}:${PORT}`);
  console.log(`Coleção "Todos os Paus da Matemática" ativa e no ar em http://${HOST}:${PORT}`);
});

