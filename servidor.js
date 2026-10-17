/*
 * servidor.js · serve as páginas e guarda as opções da live
 *
 * Node puro, sem dependências. Além dos arquivos, tem a API do "link único":
 *   GET  /api/config    → { versao, salvoEm, borda: {...}, fila: {...}, comecando: {...}, ..., estado: {...} }
 *   PUT  /api/config    → salva (precisa de "Authorization: Bearer <SENHA_EDICAO>")
 *   GET  /api/conferir  → 200 se a senha confere, 401 se não
 *   GET  /api/eventos   → Server-Sent Events: avisa as telas abertas (no OBS) quando as opções mudam
 *
 * Variáveis: PORTA (80), PASTA (pasta das páginas), DADOS (pasta do config.json: volume no Coolify),
 * SENHA_EDICAO (sem ela ninguém consegue salvar). Local: `node servidor.js 5550`.
 */
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORTA = +process.argv[2] || +process.env.PORTA || 80;
const PASTA = path.resolve(process.env.PASTA || __dirname);
const DADOS = path.resolve(process.env.DADOS || path.join(__dirname, 'dados'));
const ARQUIVO = path.join(DADOS, 'config.json');
const SENHA = process.env.SENHA_EDICAO || '';

const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json', '.txt': 'text/plain; charset=utf-8'
};

// as telas que têm opções salvas; as de cena (fila, começando, encerrando, volto já) usam a
// mesma página, fila.html, que o servidor também entrega com o nome de cada uma
// as bordas da câmera (uma por cena do OBS) também usam a mesma página, borda.html
const TELAS = ['borda', 'borda2', 'borda3', 'borda4', 'fila', 'comecando', 'encerrando', 'voltoja'];
const APELIDOS = {
  '/borda2.html': '/borda.html', '/borda3.html': '/borda.html', '/borda4.html': '/borda.html',
  '/comecando.html': '/fila.html', '/encerrando.html': '/fila.html', '/voltoja.html': '/fila.html'
};

// ------------------------------------------------------------- opções salvas
let config = { versao: 0, salvoEm: null, estado: null };
TELAS.forEach((t) => { config[t] = {}; });
try { config = Object.assign(config, JSON.parse(fs.readFileSync(ARQUIVO, 'utf8'))); } catch (e) { /* ainda não salvou nada */ }

// as opções viram parâmetros de link: só texto, número ou sim/não, com chave curtinha
function limpaParams(o) {
  const r = {};
  if (!o || typeof o !== 'object' || Array.isArray(o)) return r;
  Object.keys(o).slice(0, 80).forEach((k) => {
    const v = o[k];
    if (!/^[a-z]{1,20}$/.test(k)) return;
    if (typeof v === 'string' && v.length <= 600) r[k] = v;
    else if (typeof v === 'number' && isFinite(v)) r[k] = String(v);
    else if (typeof v === 'boolean') r[k] = v ? '1' : '0';
  });
  return r;
}

// ------------------------------------------------------------- telas ouvindo
const ouvintes = new Set();
function avisaTodos() {
  const msg = 'event: config\ndata: ' + JSON.stringify({ versao: config.versao }) + '\n\n';
  ouvintes.forEach((res) => res.write(msg));
}
// o Cloudflare fecha conexão parada depois de 100 s: um "oi" a cada 25 s mantém aberta
setInterval(() => ouvintes.forEach((res) => res.write(': oi\n\n')), 25000).unref();

// ------------------------------------------------------------- senha
function senhaConfere(req) {
  if (!SENHA) return false;
  const m = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  if (!m) return false;
  const a = crypto.createHash('sha256').update(m[1]).digest();
  const b = crypto.createHash('sha256').update(SENHA).digest();
  return crypto.timingSafeEqual(a, b);
}
// 10 senhas erradas em 10 minutos e o IP espera (o Cloudflare manda o IP de verdade)
const erros = new Map();
const ipDe = (req) => req.headers['cf-connecting-ip'] || req.socket.remoteAddress || '?';
function bloqueado(req) {
  const e = erros.get(ipDe(req));
  return !!e && e.n >= 10 && Date.now() - e.t < 10 * 60e3;
}
function errou(req) {
  const k = ipDe(req), e = erros.get(k);
  if (!e || Date.now() - e.t > 10 * 60e3) erros.set(k, { n: 1, t: Date.now() });
  else e.n++;
}

// ------------------------------------------------------------- respostas
function json(res, codigo, obj) {
  res.writeHead(codigo, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

function lerCorpo(req, max) {
  return new Promise((ok, falha) => {
    let n = 0;
    const partes = [];
    req.on('data', (c) => {
      n += c.length;
      if (n > max) { falha(new Error('grande demais')); req.destroy(); } else partes.push(c);
    });
    req.on('end', () => ok(Buffer.concat(partes).toString('utf8')));
    req.on('error', falha);
  });
}

async function salvar(req, res) {
  if (bloqueado(req)) return json(res, 429, { erro: 'Muitas tentativas. Espera uns minutinhos.' });
  if (!senhaConfere(req)) {
    errou(req);
    return json(res, 401, { erro: SENHA ? 'Senha errada.' : 'O servidor está sem senha configurada.' });
  }
  let dados;
  try { dados = JSON.parse(await lerCorpo(req, 96 * 1024)); } catch (e) { return json(res, 400, { erro: 'Dados inválidos.' }); }
  const estado = dados.estado && typeof dados.estado === 'object' && !Array.isArray(dados.estado) ? dados.estado : null;
  const novo = {
    versao: config.versao + 1,
    salvoEm: new Date().toISOString(),
    estado: estado && JSON.stringify(estado).length <= 64 * 1024 ? estado : null
  };
  // tela que não veio no pedido fica como estava (um gerador antigo não apaga as telas novas)
  TELAS.forEach((t) => { novo[t] = dados[t] !== undefined ? limpaParams(dados[t]) : (config[t] || {}); });
  fs.mkdirSync(DADOS, { recursive: true });
  fs.writeFileSync(ARQUIVO + '.tmp', JSON.stringify(novo));
  fs.renameSync(ARQUIVO + '.tmp', ARQUIVO);
  config = novo;
  avisaTodos();
  console.log('opções salvas, versão ' + config.versao);
  json(res, 200, { versao: config.versao, salvoEm: config.salvoEm });
}

function eventos(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream; charset=utf-8', 'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive', 'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\nevent: config\ndata: ' + JSON.stringify({ versao: config.versao }) + '\n\n');
  ouvintes.add(res);
  req.on('close', () => ouvintes.delete(res));
}

function arquivo(req, res, caminho) {
  let rel;
  try { rel = decodeURIComponent(caminho); } catch (e) { rel = '/'; }
  if (rel.endsWith('/')) rel += 'index.html';
  const abs = path.join(PASTA, path.normalize(rel));
  const naoAchei = () => { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); res.end('Não achei.'); };
  if (!abs.startsWith(PASTA + path.sep) || path.basename(abs).startsWith('.')) return naoAchei();
  fs.stat(abs, (err, st) => {
    if (err || !st.isFile()) return naoAchei();
    const ext = path.extname(abs).toLowerCase();
    // imagens guardam por um dia; páginas e scripts sempre conferem se mudou
    const cache = /^\.(png|ico|svg|webmanifest)$/.test(ext) ? 'public, max-age=86400' : 'no-cache';
    const etag = 'W/"' + st.size.toString(16) + '-' + Math.floor(st.mtimeMs).toString(16) + '"';
    if (req.headers['if-none-match'] === etag) {
      res.writeHead(304, { ETag: etag, 'Cache-Control': cache });
      return res.end();
    }
    res.writeHead(200, { 'Content-Type': TIPOS[ext] || 'application/octet-stream', 'Content-Length': st.size, 'Cache-Control': cache, ETag: etag });
    if (req.method === 'HEAD') return res.end();
    fs.createReadStream(abs).pipe(res);
  });
}

const servidor = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const p = url.pathname;
  if (p === '/api/config' && req.method === 'GET') return json(res, 200, config);
  if (p === '/api/config' && (req.method === 'PUT' || req.method === 'POST')) {
    return salvar(req, res).catch((e) => { console.error(e); json(res, 500, { erro: 'Não deu pra salvar.' }); });
  }
  if (p === '/api/conferir') {
    if (bloqueado(req)) return json(res, 429, { erro: 'Muitas tentativas. Espera uns minutinhos.' });
    if (senhaConfere(req)) return json(res, 200, { ok: true });
    errou(req);
    return json(res, 401, { erro: SENHA ? 'Senha errada.' : 'O servidor está sem senha configurada.' });
  }
  if (p === '/api/eventos') return eventos(req, res);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  arquivo(req, res, APELIDOS[p] || p);
});

servidor.listen(PORTA, () => console.log('no ar na porta ' + PORTA + (SENHA ? '' : ' (sem SENHA_EDICAO: ninguém salva)')));
process.on('SIGTERM', () => process.exit(0));
