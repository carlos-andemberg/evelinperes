// Gera o vídeo da transição de cena (Stinger do OBS, com fundo transparente) a partir do transicao.html.
//
//   Com o servidor local no ar (node servidor.js 5560):
//   NAVEGADOR=<chrome ou edge> FFMPEG=<ffmpeg com libvpx-vp9> node ferramentas/gera-transicao.js [saida.webm]
//
//   VOZ=<áudio da fala>   junta a fala da Nami, começando no segundo Transicao.FALA
//   SEM_FRASE=1           sem a frase escrita na tela (sem VOZ, o som é só o da onda)
//   FOTOS=0.4,1.5,2.9     em vez do vídeo, salva esses instantes em PNG ao lado da saída
//   SITE=<endereço>       de onde abrir a página (padrão: http://localhost:5560)
//
// Em máquina compartilhada, rode pelo atalho que limita os núcleos.
'use strict';
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SITE = process.env.SITE || 'http://localhost:5560';
const NAVEGADOR = process.env.NAVEGADOR;
const FFMPEG = process.env.FFMPEG;
const SAIDA = path.resolve(process.argv[2] || 'transicao-nami.webm');
const FPS = 60;
const dorme = (ms) => new Promise((r) => setTimeout(r, ms));

// WAV de 16 bits a partir do que a página devolve (intercalado, em base64)
function wav(base64, hz, canais) {
  const pcm = Buffer.from(base64, 'base64');
  const h = Buffer.alloc(44);
  h.write('RIFF', 0); h.writeUInt32LE(36 + pcm.length, 4); h.write('WAVEfmt ', 8);
  h.writeUInt32LE(16, 16); h.writeUInt16LE(1, 20); h.writeUInt16LE(canais, 22); h.writeUInt32LE(hz, 24);
  h.writeUInt32LE(hz * canais * 2, 28); h.writeUInt16LE(canais * 2, 32); h.writeUInt16LE(16, 34);
  h.write('data', 36); h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// o som da onda, feito sem caixa de som num OfflineAudioContext: uma passada de água quando ela sobe
// e outra quando vai embora, com umas bolhas; a primeira já baixou quando a fala começa
const SOM = `(async () => {
  const hz = 48000, ctx = new OfflineAudioContext(2, Math.ceil(hz * Transicao.DUR), hz);
  function passada(ini, pico, fim, ganho, f0, f1, f2) {
    const tam = Math.ceil(hz * (fim - ini)), buf = ctx.createBuffer(2, tam, hz);
    for (let c = 0; c < 2; c++) { const d = buf.getChannelData(c); for (let i = 0; i < tam; i++) d[i] = Math.random() * 2 - 1; }
    const src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = buf; fl.type = 'lowpass'; fl.Q.value = 0.8;
    fl.frequency.setValueAtTime(f0, ini); fl.frequency.exponentialRampToValueAtTime(f1, pico); fl.frequency.exponentialRampToValueAtTime(f2, fim);
    g.gain.setValueAtTime(0.0001, ini); g.gain.linearRampToValueAtTime(ganho, pico); g.gain.linearRampToValueAtTime(0.0001, fim);
    src.connect(fl); fl.connect(g); g.connect(ctx.destination); src.start(ini);
  }
  function bolha(t, f) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(f, t); o.frequency.exponentialRampToValueAtTime(f * 2.4, t + 0.07);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.09, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.11);
    o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + 0.12);
  }
  passada(0, 0.5, 1.15, 0.3, 350, 3000, 600);
  passada(2.4, 2.95, 3.38, 0.22, 450, 2500, 350);
  [[0.18, 420], [0.31, 560], [0.44, 700], [2.62, 500], [2.78, 640], [2.95, 820]].forEach((b) => bolha(b[0], b[1]));
  const b = await ctx.startRendering(), e = b.getChannelData(0), d = b.getChannelData(1);
  const pcm = new Int16Array(b.length * 2);
  for (let i = 0; i < b.length; i++) {
    pcm[i * 2] = Math.max(-1, Math.min(1, e[i])) * 32767;
    pcm[i * 2 + 1] = Math.max(-1, Math.min(1, d[i])) * 32767;
  }
  let s = '';
  const u8 = new Uint8Array(pcm.buffer);
  for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
  return btoa(s);
})()`;

(async () => {
  if (!NAVEGADOR) throw new Error('Falta NAVEGADOR: o caminho do Chrome ou do Edge.');
  const pasta = fs.mkdtempSync(path.join(os.tmpdir(), 'transicao-'));
  const porta = 9300 + Math.floor(Math.random() * 500);
  const nav = spawn(NAVEGADOR, ['--headless=new', '--disable-gpu', '--no-first-run', '--hide-scrollbars',
    '--user-data-dir=' + path.join(pasta, 'perfil'), '--remote-debugging-port=' + porta, 'about:blank'], { stdio: 'ignore' });
  let alvo;
  for (let i = 0; i < 75 && !alvo; i++) {
    await dorme(200);
    try { alvo = (await (await fetch('http://127.0.0.1:' + porta + '/json')).json()).find((t) => t.type === 'page'); } catch (e) { /* ainda abrindo */ }
  }
  if (!alvo) throw new Error('O navegador não abriu.');
  const ws = new WebSocket(alvo.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r));
  let id = 0;
  const pend = new Map();
  ws.addEventListener('message', (m) => {
    const d = JSON.parse(m.data);
    if (d.id && pend.has(d.id)) { pend.get(d.id)(d.result); pend.delete(d.id); }
  });
  const cmd = (method, params) => new Promise((r) => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
  const avalia = async (expression) => {
    const r = await cmd('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails).slice(0, 400));
    return r.result.value;
  };

  await cmd('Runtime.enable');
  await cmd('Page.navigate', { url: SITE + '/transicao.html?gravar' + (process.env.SEM_FRASE ? '&semfrase' : '') });
  await dorme(1500);
  await avalia('Transicao.pronto.then(() => true)');
  const quadro = (t) => avalia(`Transicao.desenha(${t}); document.getElementById('c').toDataURL('image/png').split(',')[1]`);
  const fim = (codigo) => { ws.close(); nav.kill(); process.exit(codigo); };

  if (process.env.FOTOS) {
    for (const t of process.env.FOTOS.split(',')) {
      const nome = path.join(path.dirname(SAIDA), 'quadro-' + t + '.png');
      fs.writeFileSync(nome, Buffer.from(await quadro(+t), 'base64'));
      console.log(nome);
    }
    return fim(0);
  }

  if (!FFMPEG) throw new Error('Falta FFMPEG: o caminho de um ffmpeg com libvpx-vp9.');
  const DUR = await avalia('Transicao.DUR'), FALA = await avalia('Transicao.FALA');
  const somArq = path.join(pasta, 'onda.wav');
  fs.writeFileSync(somArq, wav(await avalia(SOM), 48000, 2));

  const entradas = ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-i', somArq];
  let audio = ['-map', '0:v', '-map', '1:a'];
  if (process.env.VOZ) {
    entradas.push('-i', process.env.VOZ);
    const ms = Math.round(FALA * 1000);
    audio = ['-filter_complex', `[2:a]aresample=48000,adelay=${ms}:all=1[v];[1:a][v]amix=inputs=2:duration=first:normalize=0[a]`, '-map', '0:v', '-map', '[a]'];
  }
  const ff = spawn(FFMPEG, entradas.concat(audio, ['-c:v', 'libvpx-vp9', '-pix_fmt', 'yuva420p', '-crf', '30', '-b:v', '0',
    '-deadline', 'good', '-cpu-used', '2', '-row-mt', '1', '-threads', String(process.env.TEST_CPUS || 4), '-auto-alt-ref', '0',
    '-c:a', 'libopus', '-b:a', '128k', '-t', String(DUR), SAIDA]), { stdio: ['pipe', 'inherit', 'inherit'] });
  const fechou = new Promise((r) => ff.on('close', r));
  const total = Math.ceil(DUR * FPS);
  for (let n = 0; n < total; n++) {
    const png = Buffer.from(await quadro(n / FPS), 'base64');
    if (!ff.stdin.write(png)) await new Promise((r) => ff.stdin.once('drain', r));
    if (n % 30 === 0) console.log('quadro ' + n + ' de ' + total);
  }
  ff.stdin.end();
  const codigo = await fechou;
  console.log(codigo === 0 ? 'pronto: ' + SAIDA + ' (' + (fs.statSync(SAIDA).size / 1048576).toFixed(1) + ' MB)' : 'ffmpeg falhou: ' + codigo);
  fim(codigo === 0 ? 0 : 1);
})().catch((e) => { console.error(e); process.exit(1); });
