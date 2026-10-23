/*
 * ondas.js · borda de ondas com a Nami nadando
 *
 * Usado pela borda.html e pela fila.html. Desenha tudo num <canvas> que cobre a tela:
 * três camadas de onda (rosa, rosinha e branca) que andam em volta da tela, espuma,
 * brilhinhos, bolhas, enfeites nos cantos e a Nami nadando dentro das ondas.
 *
 * Nada de imagem: a Nami é desenhada na mão (caminhos do canvas), então fica nítida
 * em qualquer resolução.
 */
(function (global) {
  'use strict';

  var TAU = Math.PI * 2;

  // ------------------------------------------------------------------ temas
  // fundo/fundo2: onda de trás · meio: onda do meio · frente/frente2: onda da frente
  // linha: filete entre as ondas · brilho: brilho de dentro · acento: textos e detalhes
  var TEMAS = {
    rosa: {
      nome: 'Rosa e branco',
      fundo: '#ffb0cf', fundo2: '#ffd3e5', meio: '#ffdbe9', frente: '#ffffff', frente2: '#fff0f6',
      linha: '#ff8fbd', brilho: '#ff7fb2', estrela: '#ff7fb0', acento: '#ff5c9e', acento2: '#ffa3cb',
      texto: '#8a2f5d', ceu: ['#fff9fc', '#ffe9f2', '#ffd3e5']
    },
    lilas: {
      nome: 'Lilás e branco',
      fundo: '#d4b3ff', fundo2: '#ead8ff', meio: '#efe3ff', frente: '#ffffff', frente2: '#f8f2ff',
      linha: '#b48cff', brilho: '#a77bff', estrela: '#c79cff', acento: '#9763ff', acento2: '#c9a8ff',
      texto: '#4b2d7a', ceu: ['#fcfaff', '#f0e7ff', '#e2d2ff']
    },
    agua: {
      nome: 'Água e rosa',
      fundo: '#93dfe8', fundo2: '#c3f1f3', meio: '#dcf8f8', frente: '#ffffff', frente2: '#f0fdfd',
      linha: '#5ccdd6', brilho: '#4fc6d1', estrela: '#ff8fbd', acento: '#13a9b8', acento2: '#7fe0e6',
      texto: '#1e5962', ceu: ['#f7feff', '#e2f8fa', '#ccf0f4']
    }
  };

  // Cores da Nami (cabelo rosa, cauda verde-água, cajado dourado)
  var COR = {
    pele: '#ffdccb', pele2: '#f2b39c', peleLuz: '#fff0e8',
    cabelo: '#ff5a9d', cabelo2: '#ffa4cd', cabelo3: '#d93d83',
    cauda: '#24aeb6', cauda2: '#4fd2c9', cauda3: '#93ecdf',
    barbatana: 'rgba(168,244,236,0.93)', barbatana2: 'rgba(120,226,222,0.9)',
    top: '#ff7fb5', top2: '#ffc0da', cajado: '#f6c955', cajado2: '#b9801f', orbe: '#86f3ff',
    olho: '#35275e', boca: '#d24f7c'
  };

  // ------------------------------------------------------------ parâmetros
  // Lê as opções do link (?espessura=1.5&nami=0 ...), ou de `fonte` (URLSearchParams ou objeto).
  // O tipo vem do valor padrão.
  function parametros(padrao, fonte) {
    var q = fonte instanceof URLSearchParams ? fonte : new URLSearchParams(fonte || global.location.search), op = {};
    Object.keys(padrao).forEach(function (k) {
      var d = padrao[k], v = q.get(k);
      if (v === null) { op[k] = d; return; }
      if (typeof d === 'boolean') op[k] = !/^(0|n|nao|não|false|off|sem)$/i.test(v.trim());
      else if (typeof d === 'number') {
        var n = parseFloat(v.replace(',', '.'));
        op[k] = isFinite(n) ? n : d;
      } else op[k] = v;
    });
    return op;
  }

  var emOBS = !!global.obsstudio;

  // ------------------------------------------------------------ link único
  // Sem opções no link (ou com ?auto), a tela usa o que foi salvo no gerador ("Salvar na live")
  // e recarrega sozinha quando salvam de novo. Com opções no link (ou ?auto=0), vale o link.
  // `fundo` e `caixa` são da prévia e não contam. comecar(q) recebe um URLSearchParams.
  // opcoes.podeRecarregar(): se devolver false, a atualização espera (ex.: um alerta tocando)
  function automatico(tela, comecar, opcoes) {
    opcoes = opcoes || {};
    var q = new URLSearchParams(global.location.search);
    // fundo/caixa (prévia) e teste/demo (alertas) não são opções: o link continua sendo o único
    var proprias = Array.from(q.keys()).filter(function (k) { return ['fundo', 'caixa', 'auto', 'teste', 'demo'].indexOf(k) < 0; });
    var auto = q.has('auto') ? q.get('auto') !== '0' : proprias.length === 0;
    if (!auto) { comecar(q); return; }

    var CHAVE = 'evelinperes-config', versao = null;
    function guardado() { try { return JSON.parse(global.localStorage.getItem(CHAVE)); } catch (e) { return null; } }
    function aplica(cfg) {
      versao = cfg ? cfg.versao : -1;
      var p = new URLSearchParams((cfg && cfg[tela]) || {});
      q.forEach(function (v, k) { p.set(k, v); });   // fundo=1 da prévia continua valendo
      comecar(p);
    }
    function recarrega() {
      if (opcoes.podeRecarregar && !opcoes.podeRecarregar()) { setTimeout(recarrega, 1500); return; }
      try { global.sessionStorage.setItem('evelinperes-recarga', '1'); } catch (e) {}
      global.location.reload();
    }
    function confere() {
      fetch('/api/config', { cache: 'no-store' }).then(function (r) { return r.json(); })
        .then(function (cfg) { if (cfg.versao !== versao) recarrega(); }).catch(function () {});
    }
    function escuta() {
      if (global.EventSource) {
        var es = new EventSource('/api/eventos');
        es.addEventListener('config', function (e) {
          try { if (JSON.parse(e.data).versao !== versao) recarrega(); } catch (err) {}
        });
      }
      // reserva, caso o aviso na hora não chegue
      setInterval(confere, 60000);
    }
    fetch('/api/config', { cache: 'no-store' }).then(function (r) {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    }).then(function (cfg) {
      try { global.localStorage.setItem(CHAVE, JSON.stringify(cfg)); } catch (e) {}
      aplica(cfg);
      escuta();
    }).catch(function () {
      // sem servidor: usa a última versão que esta tela viu
      aplica(guardado());
      escuta();
    });
  }

  // A recarga por causa do "Salvar na live" não zera o que estava contando (ex.: tempo na fila)
  function veioDeRecarga() {
    try {
      var sim = global.sessionStorage.getItem('evelinperes-recarga') === '1';
      global.sessionStorage.removeItem('evelinperes-recarga');
      return sim;
    } catch (e) { return false; }
  }

  // ------------------------------------------------------------- caminho
  // Retângulo de cantos redondos de (x0, y0) a (x1, y1). A normal é sempre o "pra cima"
  // da água, pra onde as ondas crescem e a Nami fica de cabeça:
  //   fora = false (borda da tela): percorre baixo (esq→dir), direita (↑), cima (dir→esq),
  //     esquerda (↓), com a normal pra dentro da tela;
  //   fora = true (borda da câmera): percorre cima (esq→dir), direita (↓), baixo (dir→esq),
  //     esquerda (↑), com a normal pra fora da câmera.
  function caminho(x0, y0, x1, y1, r, fora) {
    r = Math.max(4, Math.min(r, (x1 - x0) / 2 - 1, (y1 - y0) / 2 - 1));
    var lw = Math.max(0, x1 - x0 - 2 * r), lh = Math.max(0, y1 - y0 - 2 * r), arco = Math.PI * r / 2;
    var segs = fora ? [
      { reta: true, len: lw, x: x0 + r, y: y0, tx: 1, ty: 0 },
      { reta: false, len: arco, cx: x1 - r, cy: y0 + r, a0: -Math.PI / 2, giro: 1 },
      { reta: true, len: lh, x: x1, y: y0 + r, tx: 0, ty: 1 },
      { reta: false, len: arco, cx: x1 - r, cy: y1 - r, a0: 0, giro: 1 },
      { reta: true, len: lw, x: x1 - r, y: y1, tx: -1, ty: 0 },
      { reta: false, len: arco, cx: x0 + r, cy: y1 - r, a0: Math.PI / 2, giro: 1 },
      { reta: true, len: lh, x: x0, y: y1 - r, tx: 0, ty: -1 },
      { reta: false, len: arco, cx: x0 + r, cy: y0 + r, a0: Math.PI, giro: 1 }
    ] : [
      { reta: true, len: lw, x: x0 + r, y: y1, tx: 1, ty: 0 },
      { reta: false, len: arco, cx: x1 - r, cy: y1 - r, a0: Math.PI / 2, giro: -1 },
      { reta: true, len: lh, x: x1, y: y1 - r, tx: 0, ty: -1 },
      { reta: false, len: arco, cx: x1 - r, cy: y0 + r, a0: 0, giro: -1 },
      { reta: true, len: lw, x: x1 - r, y: y0, tx: -1, ty: 0 },
      { reta: false, len: arco, cx: x0 + r, cy: y0 + r, a0: -Math.PI / 2, giro: -1 },
      { reta: true, len: lh, x: x0, y: y0 + r, tx: 0, ty: 1 },
      { reta: false, len: arco, cx: x0 + r, cy: y1 - r, a0: -Math.PI, giro: -1 }
    ];
    var P = 2 * lw + 2 * lh + 4 * arco;
    function ponto(s, o) {
      s = ((s % P) + P) % P;
      for (var i = 0; i < 8; i++) {
        var g = segs[i];
        if (s <= g.len || i === 7) {
          if (g.reta) {
            o.x = g.x + g.tx * s; o.y = g.y + g.ty * s; o.tx = g.tx; o.ty = g.ty;
          } else {
            var a = g.a0 + g.giro * s / r, c = Math.cos(a), sn = Math.sin(a);
            o.x = g.cx + r * c; o.y = g.cy + r * sn; o.tx = -g.giro * sn; o.ty = g.giro * c;
          }
          o.nx = o.ty; o.ny = -o.tx;
          return o;
        }
        s -= g.len;
      }
      return o;
    }
    return { P: P, ponto: ponto, lw: lw, lh: lh, r: r, x0: x0, y0: y0, x1: x1, y1: y1, fora: !!fora };
  }

  // Uma camada de onda: amostra o caminho e guarda o que precisa pra mexer a cada quadro
  function camada(c, A, lambda, w, ph, passo) {
    var n = Math.max(16, Math.ceil(c.P / passo)), o = {};
    var L = {
      c: c, n: n, A: A, w: w, ph: ph,
      ss: new Float32Array(n), bx: new Float32Array(n), by: new Float32Array(n),
      nx: new Float32Array(n), ny: new Float32Array(n), off: new Float32Array(n),
      px: new Float32Array(n), py: new Float32Array(n)
    };
    for (var i = 0; i < n; i++) {
      var s = i * c.P / n;
      c.ponto(s, o);
      L.ss[i] = s; L.bx[i] = o.x; L.by[i] = o.y; L.nx[i] = o.nx; L.ny[i] = o.ny;
    }
    // número inteiro de ondas na volta toda, pra não ter emenda
    var n1 = Math.max(4, Math.round(c.P / lambda));
    L.k1 = TAU * n1 / c.P;
    L.k2 = TAU * (Math.round(n1 * 2.3) + 1) / c.P;
    return L;
  }

  function onda(L, s, t) {
    return L.A * (0.62 * Math.sin(L.k1 * s - L.w * t + L.ph) + 0.38 * Math.sin(L.k2 * s + L.w * 0.55 * t + L.ph * 1.7));
  }

  // ------------------------------------------------------------- a Nami
  // Coordenadas locais: ~140 unidades de comprimento, olhando pra +x, "pra cima" = -y.
  // f = fase do nado (radianos) · olho = 1 aberto, 0 fechado

  function curva(c, p, mover) {
    if (mover) c.moveTo(p[0].x, p[0].y); else c.lineTo(p[0].x, p[0].y);
    for (var i = 1; i < p.length - 1; i++) {
      c.quadraticCurveTo(p[i].x, p[i].y, (p[i].x + p[i + 1].x) / 2, (p[i].y + p[i + 1].y) / 2);
    }
    c.lineTo(p[p.length - 1].x, p[p.length - 1].y);
  }

  // Fita afinando, usada nas mechas de cabelo
  function mecha(c, f, ax, ay, L, queda, larg, def, cor, cor2) {
    var M = 12, pts = [], cima = [], baixo = [], j, v;
    for (j = 0; j < M; j++) {
      v = j / (M - 1);
      pts.push({ x: ax - v * L, y: ay + queda * v * v + Math.sin(f * 0.8 - v * 3.4 + def) * (0.6 + 5 * v) });
    }
    for (j = 0; j < M; j++) {
      var a = pts[Math.max(0, j - 1)], b = pts[Math.min(M - 1, j + 1)];
      var dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      v = j / (M - 1);
      var ww = larg * Math.pow(1 - v, 0.6) * (1 + 0.35 * Math.sin(v * Math.PI)) + 0.35;
      cima.push({ x: pts[j].x - dy / l * ww, y: pts[j].y + dx / l * ww });
      baixo.push({ x: pts[j].x + dy / l * ww, y: pts[j].y - dx / l * ww });
    }
    c.beginPath();
    curva(c, cima, true);
    curva(c, baixo.reverse(), false);
    c.closePath();
    var g = c.createLinearGradient(ax, 0, ax - L, 0);
    g.addColorStop(0, cor); g.addColorStop(1, cor2 || cor);
    c.fillStyle = g;
    c.fill();
  }

  function desenhaNami(c, f, olho) {
    if (olho === undefined) olho = 1;
    var N = 16, i, u, sp = [], nu = [], w = [];
    for (i = 0; i < N; i++) {
      u = i / (N - 1);
      sp.push({ x: 1 - u * 70, y: 4 + (0.6 + 9 * u * u) * Math.sin(f - u * 2.7) - 0.6 * Math.sin(f) });
    }
    for (i = 0; i < N; i++) {
      var a = sp[Math.max(0, i - 1)], b = sp[Math.min(N - 1, i + 1)];
      var dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1;
      nu.push({ x: -dy / l, y: dx / l });
      u = i / (N - 1);
      w.push(2.1 + 7.6 * Math.pow(1 - u, 1.35) + 1.7 * Math.exp(-Math.pow((u - 0.2) / 0.15, 2)));
    }
    var up = [], dn = [];
    for (i = 0; i < N; i++) {
      up.push({ x: sp[i].x + nu[i].x * w[i], y: sp[i].y + nu[i].y * w[i] });
      dn.push({ x: sp[i].x - nu[i].x * w[i], y: sp[i].y - nu[i].y * w[i] });
    }

    c.lineCap = 'round';
    c.lineJoin = 'round';

    // mecha de trás (mais escura, dá profundidade)
    mecha(c, f, 23, -12.5, 44, 4, 6.2, 0.0, COR.cabelo3, '#ff74ae');

    // --- cauda
    var T = sp[N - 1], Q = sp[N - 3];
    var tdx = T.x - Q.x, tdy = T.y - Q.y, tl = Math.hypot(tdx, tdy) || 1;
    tdx /= tl; tdy /= tl;
    var flick = 0.5 * Math.cos(f - 3.6), cs = Math.cos(flick), sn = Math.sin(flick);
    var dX = tdx * cs - tdy * sn, dY = tdx * sn + tdy * cs, nX = -dY, nY = dX;
    var P = function (a, b) { return { x: T.x + dX * a + nX * b, y: T.y + dY * a + nY * b }; };

    // barbatana do rabo (atrás da cauda)
    var r0 = w[N - 1], p0 = P(-1, r0), p1 = P(-1, -r0);
    var q1 = P(3, 13), lu = P(18, 15.5), q2 = P(11, 5), nt = P(11, 0), q3 = P(11, -5), ll = P(18, -15.5), q4 = P(3, -13);
    c.beginPath();
    c.moveTo(p0.x, p0.y);
    c.quadraticCurveTo(q1.x, q1.y, lu.x, lu.y);
    c.quadraticCurveTo(q2.x, q2.y, nt.x, nt.y);
    c.quadraticCurveTo(q3.x, q3.y, ll.x, ll.y);
    c.quadraticCurveTo(q4.x, q4.y, p1.x, p1.y);
    c.closePath();
    var gf = c.createLinearGradient(T.x, T.y, T.x + dX * 18, T.y + dY * 18);
    gf.addColorStop(0, COR.barbatana2); gf.addColorStop(1, 'rgba(214,252,247,0.95)');
    c.fillStyle = gf; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.75)'; c.lineWidth = 0.8; c.stroke();
    c.strokeStyle = 'rgba(40,170,175,0.35)'; c.lineWidth = 0.7;
    c.beginPath();
    for (i = -3; i <= 3; i++) {
      if (!i) continue;
      var e0 = P(1, i * 0.5), e1 = P(15 - Math.abs(i) * 0.6, i * 4.3);
      c.moveTo(e0.x, e0.y); c.lineTo(e1.x, e1.y);
    }
    c.stroke();

    // corpo da cauda
    c.beginPath();
    curva(c, up, true);
    curva(c, dn.slice().reverse(), false);
    c.closePath();
    var gc = c.createLinearGradient(2, 0, -72, 0);
    gc.addColorStop(0, COR.cauda); gc.addColorStop(0.55, COR.cauda2); gc.addColorStop(1, COR.cauda3);
    c.fillStyle = gc; c.fill();
    var gs = c.createLinearGradient(0, -8, 0, 15);
    gs.addColorStop(0, 'rgba(255,255,255,0.32)'); gs.addColorStop(0.45, 'rgba(255,255,255,0)'); gs.addColorStop(1, 'rgba(0,70,90,0.22)');
    c.fillStyle = gs; c.fill();

    // escaminhas
    c.strokeStyle = 'rgba(255,255,255,0.42)'; c.lineWidth = 0.75;
    c.beginPath();
    for (i = 1; i < N - 4; i++) {
      var ang = Math.atan2(sp[i + 1].y - sp[i - 1].y, sp[i + 1].x - sp[i - 1].x), rr = Math.max(1.3, w[i] * 0.3);
      for (var k = -1; k <= 1; k += (i % 2 ? 2 : 1)) {
        var ex = sp[i].x + nu[i].x * w[i] * 0.5 * k, ey = sp[i].y + nu[i].y * w[i] * 0.5 * k;
        c.moveTo(ex + Math.cos(ang - Math.PI / 2) * rr, ey + Math.sin(ang - Math.PI / 2) * rr);
        c.arc(ex, ey, rr, ang - Math.PI / 2, ang + Math.PI / 2);
      }
    }
    c.stroke();
    // reflexo em cima da cauda
    c.strokeStyle = 'rgba(255,255,255,0.55)'; c.lineWidth = 1.3;
    c.beginPath();
    var reflexo = [];
    for (i = 1; i < N * 0.72; i++) reflexo.push({ x: sp[i].x + nu[i].x * w[i] * 0.62, y: sp[i].y + nu[i].y * w[i] * 0.62 });
    curva(c, reflexo, true);
    c.stroke();

    // nadadeira do quadril
    var hb = dn[2], hb2 = dn[4], ab = Math.sin(f - 0.6);
    c.beginPath();
    c.moveTo(hb.x, hb.y);
    c.quadraticCurveTo(hb.x - 3, hb.y + 8 + ab * 1.5, hb.x - 13, hb.y + 8.5 + ab * 2.5);
    c.quadraticCurveTo(hb.x - 9, hb.y + 2.5, hb2.x, hb2.y);
    c.closePath();
    c.fillStyle = COR.barbatana; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.6; c.stroke();

    // mechas da frente, caindo por cima das costas
    mecha(c, f, 25, -15.5, 50, 3, 7.2, 0.9, COR.cabelo, COR.cabelo2);
    mecha(c, f, 21.5, -9, 38, 7, 5.4, 1.9, '#ff6aa8', COR.cabelo2);

    // --- cajado (atrás do braço)
    c.strokeStyle = COR.cajado2; c.lineWidth = 2.5;
    c.beginPath(); c.moveTo(13, 15); c.lineTo(44.5, 3.6); c.stroke();
    c.strokeStyle = COR.cajado; c.lineWidth = 1.3;
    c.beginPath(); c.moveTo(13.4, 14.4); c.lineTo(44.2, 3.2); c.stroke();
    // orbe de água com brilho pulsando
    var pulso = 0.75 + 0.25 * Math.sin(f * 0.7);
    var go = c.createRadialGradient(47, 2.6, 0.5, 47, 2.6, 7.5);
    go.addColorStop(0, 'rgba(255,255,255,' + (0.95 * pulso) + ')');
    go.addColorStop(0.35, 'rgba(134,243,255,' + (0.75 * pulso) + ')');
    go.addColorStop(1, 'rgba(134,243,255,0)');
    c.fillStyle = go; c.beginPath(); c.arc(47, 2.6, 7.5, 0, TAU); c.fill();
    var go2 = c.createRadialGradient(46.2, 1.6, 0.3, 47, 2.6, 3.1);
    go2.addColorStop(0, '#ffffff'); go2.addColorStop(0.5, COR.orbe); go2.addColorStop(1, '#3cc7e0');
    c.fillStyle = go2; c.beginPath(); c.arc(47, 2.6, 3.1, 0, TAU); c.fill();
    c.strokeStyle = COR.cajado; c.lineWidth = 1.2;
    c.beginPath(); c.arc(47, 2.6, 4.3, Math.PI * 0.55, Math.PI * 1.95); c.stroke();
    c.beginPath(); c.arc(50.6, 0.4, 1.2, Math.PI, TAU * 0.95); c.stroke();

    // --- tronco
    c.beginPath();
    c.moveTo(-1.5, -5.6);
    c.bezierCurveTo(6, -6.8, 14, -6.2, 23, -5.6);
    c.bezierCurveTo(26.3, -3, 26.3, 2, 24.2, 5);
    c.bezierCurveTo(18, 9, 12, 8, 8, 9);
    c.bezierCurveTo(4, 10, 1, 13, -1.5, 14.2);
    c.closePath();
    var gt = c.createLinearGradient(0, -7, 0, 14);
    gt.addColorStop(0, COR.peleLuz); gt.addColorStop(0.5, COR.pele); gt.addColorStop(1, COR.pele2);
    c.fillStyle = gt; c.fill();
    // top de concha
    c.beginPath();
    c.moveTo(14.5, 2.6);
    c.quadraticCurveTo(18.5, 10, 24.4, 5.2);
    c.lineTo(25.4, 0.6);
    c.quadraticCurveTo(20, 1.6, 14.5, 2.6);
    c.closePath();
    var gtp = c.createLinearGradient(15, 1, 22, 9);
    gtp.addColorStop(0, COR.top2); gtp.addColorStop(1, COR.top);
    c.fillStyle = gtp; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 0.6;
    c.beginPath(); c.moveTo(19.5, 2); c.lineTo(20.5, 7.4); c.moveTo(22.6, 1.4); c.lineTo(23.2, 6); c.stroke();
    // cintinho de pérolas entre a pele e a cauda
    c.strokeStyle = COR.top; c.lineWidth = 3;
    c.beginPath(); c.moveTo(up[0].x + 0.6, up[0].y + 0.6); c.quadraticCurveTo(up[0].x + 3.2, 4, dn[0].x + 0.6, dn[0].y - 0.6); c.stroke();
    c.fillStyle = '#fff6fb';
    for (i = 0; i < 4; i++) {
      var tt = (i + 0.5) / 4, bx = up[0].x + 0.6 + (dn[0].x - up[0].x) * tt + Math.sin(tt * Math.PI) * 1.4;
      var by = up[0].y + 0.6 + (dn[0].y - up[0].y - 1.2) * tt;
      c.beginPath(); c.arc(bx, by, 0.95, 0, TAU); c.fill();
    }

    // --- braço segurando o cajado
    c.strokeStyle = COR.pele2; c.lineWidth = 4;
    c.beginPath(); c.moveTo(20.5, 0.5); c.quadraticCurveTo(24.5, 7.5, 31.2, 8.4); c.stroke();
    c.strokeStyle = COR.pele; c.lineWidth = 3;
    c.beginPath(); c.moveTo(20.5, 0.5); c.quadraticCurveTo(24.5, 7.5, 31.2, 8.4); c.stroke();
    c.fillStyle = COR.pele; c.beginPath(); c.arc(31.6, 8.3, 2, 0, TAU); c.fill();

    // --- pescoço e cabeça
    c.fillStyle = COR.pele;
    c.beginPath(); c.moveTo(21.5, -4.5); c.lineTo(27.5, -7); c.lineTo(28.5, 1); c.lineTo(23, 3); c.closePath(); c.fill();
    var hg = c.createRadialGradient(34, -9, 1.5, 31, -6, 11);
    hg.addColorStop(0, COR.peleLuz); hg.addColorStop(1, COR.pele);
    c.fillStyle = hg; c.beginPath(); c.arc(31, -6, 10.5, 0, TAU); c.fill();

    // cabelo por cima da cabeça, com franjinha
    c.beginPath();
    c.moveTo(41, -9.2);
    c.bezierCurveTo(41, -18.5, 30, -21.5, 23.5, -16);
    c.bezierCurveTo(18.6, -11.5, 19.2, -3, 23.3, 1.4);
    c.lineTo(27.4, -1.6);
    c.bezierCurveTo(28, -7, 32.5, -10.3, 35.8, -9.8);
    c.quadraticCurveTo(37.8, -7.4, 38.6, -6.6);
    c.quadraticCurveTo(39.4, -8.6, 41, -9.2);
    c.closePath();
    var gh = c.createLinearGradient(24, -20, 36, -4);
    gh.addColorStop(0, COR.cabelo3); gh.addColorStop(0.45, COR.cabelo); gh.addColorStop(1, COR.cabelo2);
    c.fillStyle = gh; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.5)'; c.lineWidth = 1.1;
    c.beginPath(); c.arc(30.5, -8.5, 9.2, -Math.PI * 0.86, -Math.PI * 0.6); c.stroke();

    // orelha de barbatana
    var bal = Math.sin(f * 0.8) * 0.9;
    c.beginPath();
    c.moveTo(27.6, -4.2);
    c.quadraticCurveTo(22, -9.5 + bal, 17, -12.5 + bal);
    c.quadraticCurveTo(21, -6.8, 18.6, -3.4 + bal * 0.4);
    c.quadraticCurveTo(23.5, -3, 27.6, -1.6);
    c.closePath();
    c.fillStyle = COR.barbatana; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 0.6; c.stroke();
    c.strokeStyle = 'rgba(40,170,175,0.4)';
    c.beginPath(); c.moveTo(26.6, -3.4); c.lineTo(19.6, -9.6 + bal); c.moveTo(26.4, -2.6); c.lineTo(20.4, -4.8 + bal * 0.6); c.stroke();

    // rostinho
    var ab2 = Math.max(0.08, olho);
    c.fillStyle = COR.olho;
    c.beginPath(); c.ellipse(35.4, -5.4, 2.15, 3.05 * ab2, 0, 0, TAU); c.fill();
    if (olho > 0.45) {
      c.fillStyle = '#ffffff';
      c.beginPath(); c.arc(36.1, -6.7, 0.95, 0, TAU); c.fill();
      c.beginPath(); c.arc(34.8, -4.1, 0.45, 0, TAU); c.fill();
    }
    c.strokeStyle = COR.olho; c.lineWidth = 0.95;
    c.beginPath(); c.moveTo(32.9, -8.2 + (1 - ab2) * 2.6); c.quadraticCurveTo(35.3, -9.9 + (1 - ab2) * 3.4, 37.9, -8.1 + (1 - ab2) * 2.6); c.stroke();
    c.beginPath(); c.moveTo(37.6, -8.3 + (1 - ab2) * 2.6); c.lineTo(38.7, -9.2 + (1 - ab2) * 2.6); c.stroke();
    c.fillStyle = 'rgba(255,110,155,0.45)';
    c.beginPath(); c.ellipse(36.8, -1.5, 2.3, 1.15, 0, 0, TAU); c.fill();
    c.strokeStyle = COR.boca; c.lineWidth = 0.85;
    c.beginPath(); c.moveTo(39.1, -1.2); c.quadraticCurveTo(39.9, 0.2, 40.9, -0.7); c.stroke();
  }

  // ------------------------------------------------------------ enfeites
  function estrelaDoMar(c, r, cor, cor2) {
    c.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.46 : r;
      if (i) c.lineTo(Math.cos(a) * rr, Math.sin(a) * rr); else c.moveTo(Math.cos(a) * rr, Math.sin(a) * rr);
    }
    c.closePath();
    c.lineJoin = 'round';
    c.lineWidth = r * 0.3;
    c.strokeStyle = cor; c.fillStyle = cor;
    c.stroke(); c.fill();
    c.fillStyle = cor2;
    for (i = 0; i < 5; i++) {
      var b = -Math.PI / 2 + i * TAU / 5;
      for (var j = 1; j <= 2; j++) {
        c.beginPath(); c.arc(Math.cos(b) * r * 0.3 * j, Math.sin(b) * r * 0.3 * j, r * 0.075, 0, TAU); c.fill();
      }
    }
    c.beginPath(); c.arc(0, 0, r * 0.1, 0, TAU); c.fill();
  }

  function concha(c, r, cor) {
    var n = 7, a0 = -Math.PI * 0.92, a1 = -Math.PI * 0.08, i;
    c.beginPath();
    c.moveTo(0, r * 0.18);
    for (i = 0; i <= n; i++) {
      var a = a0 + (a1 - a0) * i / n, x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (!i) c.lineTo(x, y);
      else {
        var am = a0 + (a1 - a0) * (i - 0.5) / n;
        c.quadraticCurveTo(Math.cos(am) * r * 1.13, Math.sin(am) * r * 1.13, x, y);
      }
    }
    c.closePath();
    var g = c.createRadialGradient(0, 0, r * 0.1, 0, -r * 0.2, r * 1.1);
    g.addColorStop(0, '#ffffff'); g.addColorStop(1, cor);
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.95)'; c.lineWidth = r * 0.06; c.stroke();
    c.strokeStyle = 'rgba(200,90,140,0.35)'; c.lineWidth = r * 0.045;
    c.beginPath();
    for (i = 1; i < n; i++) {
      var aa = a0 + (a1 - a0) * i / n;
      c.moveTo(0, r * 0.12); c.lineTo(Math.cos(aa) * r * 0.95, Math.sin(aa) * r * 0.95);
    }
    c.stroke();
    c.fillStyle = cor;
    c.beginPath(); c.moveTo(-r * 0.32, r * 0.06); c.lineTo(r * 0.32, r * 0.06); c.lineTo(r * 0.2, r * 0.32); c.lineTo(-r * 0.2, r * 0.32); c.closePath(); c.fill();
  }

  function perolas(c, r) {
    [[-r * 0.55, r * 0.15, r * 0.42], [r * 0.4, r * 0.25, r * 0.36], [0, -r * 0.35, r * 0.5]].forEach(function (p) {
      var g = c.createRadialGradient(p[0] - p[2] * 0.35, p[1] - p[2] * 0.35, p[2] * 0.1, p[0], p[1], p[2]);
      g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#fbe9f2'); g.addColorStop(1, '#e9c6d9');
      c.fillStyle = g; c.beginPath(); c.arc(p[0], p[1], p[2], 0, TAU); c.fill();
    });
  }

  function brilhinho(c, x, y, s, cor) {
    c.save();
    c.translate(x, y);
    c.fillStyle = cor;
    c.beginPath();
    c.moveTo(0, -s);
    c.quadraticCurveTo(s * 0.16, -s * 0.16, s, 0);
    c.quadraticCurveTo(s * 0.16, s * 0.16, 0, s);
    c.quadraticCurveTo(-s * 0.16, s * 0.16, -s, 0);
    c.quadraticCurveTo(-s * 0.16, -s * 0.16, 0, -s);
    c.fill();
    c.fillStyle = '#ffffff';
    c.beginPath(); c.arc(0, 0, s * 0.22, 0, TAU); c.fill();
    c.restore();
  }

  // Peixinho fofo: comprimento s em px, olhando pra +x. f = fase do rabo abanando.
  var PEIXES = [
    { corpo: '#ff8fbd', corpo2: '#ff5c9e', barriga: '#ffe1ee', cauda: '#ff6fab' },
    { corpo: '#6fdcd4', corpo2: '#20a8b2', barriga: '#d8fbf6', cauda: '#3cc4c4' },
    { corpo: '#ffc77a', corpo2: '#ff9a4a', barriga: '#fff3d6', cauda: '#ffad5c' },
    { corpo: '#c7a6ff', corpo2: '#9b6bff', barriga: '#f1e8ff', cauda: '#b28cff' }
  ];
  function peixinho(c, s, f, cor) {
    c.save();
    c.scale(s / 2, s / 2);
    // rabo
    c.save();
    c.translate(-0.62, 0);
    c.rotate(Math.sin(f) * 0.38);
    c.beginPath();
    c.moveTo(0.05, 0);
    c.quadraticCurveTo(-0.3, -0.5, -0.55, -0.55);
    c.quadraticCurveTo(-0.38, 0, -0.55, 0.55);
    c.quadraticCurveTo(-0.3, 0.5, 0.05, 0);
    c.fillStyle = cor.cauda; c.fill();
    c.restore();
    // barbatana de cima
    c.beginPath(); c.moveTo(-0.3, -0.4); c.quadraticCurveTo(-0.05, -0.86, 0.26, -0.44); c.closePath();
    c.fillStyle = cor.cauda; c.fill();
    // corpo
    var g = c.createLinearGradient(0, -0.5, 0, 0.5);
    g.addColorStop(0, cor.corpo2); g.addColorStop(0.45, cor.corpo); g.addColorStop(1, cor.barriga);
    c.beginPath(); c.ellipse(0.02, 0, 0.72, 0.5, 0, 0, TAU);
    c.fillStyle = g; c.fill();
    c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 0.1;
    c.beginPath(); c.ellipse(-0.14, 0, 0.13, 0.43, 0, -Math.PI / 2, Math.PI / 2); c.stroke();
    // nadadeira do lado, abanando
    c.beginPath(); c.moveTo(0.06, 0.12); c.quadraticCurveTo(-0.14, 0.34 + Math.sin(f * 1.3) * 0.07, -0.3, 0.2); c.quadraticCurveTo(-0.1, 0.12, 0.06, 0.12);
    c.fillStyle = 'rgba(255,255,255,0.75)'; c.fill();
    // olho, bochecha e boquinha
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0.4, -0.1, 0.17, 0, TAU); c.fill();
    c.fillStyle = '#35275e'; c.beginPath(); c.arc(0.44, -0.09, 0.105, 0, TAU); c.fill();
    c.fillStyle = '#ffffff'; c.beginPath(); c.arc(0.47, -0.13, 0.04, 0, TAU); c.fill();
    c.fillStyle = 'rgba(255,110,155,0.5)'; c.beginPath(); c.ellipse(0.42, 0.17, 0.1, 0.06, 0, 0, TAU); c.fill();
    c.strokeStyle = 'rgba(80,30,60,0.6)'; c.lineWidth = 0.05;
    c.beginPath(); c.arc(0.64, 0.07, 0.07, 0.3, Math.PI * 0.9); c.stroke();
    c.restore();
  }

  // Letras do nome (Google Fonts, carregadas pela página). cursiva = letras emendadas.
  var LETRAS = {
    pacifico: { nome: 'Praia (cursiva)', familia: 'Pacifico', css: '400 {px}px Pacifico, cursive', cursiva: true, esc: 1.05 },
    cherry: { nome: 'Fofinha', familia: 'Cherry Bomb One', css: '400 {px}px "Cherry Bomb One", Fredoka, sans-serif', cursiva: false, esc: 1.05 },
    sniglet: { nome: 'Bolinha', familia: 'Sniglet', css: '800 {px}px Sniglet, Fredoka, sans-serif', cursiva: false, esc: 1.08 },
    fredoka: { nome: 'Redondinha', familia: 'Fredoka', css: '700 {px}px Fredoka, Nunito, sans-serif', cursiva: false, esc: 1 }
  };

  // Espaço (em px) em volta da webcam na borda "só da câmera". Depende só do tamanho da câmera,
  // então a fonte do OBS não muda quando mexe no nome, na letra, na Nami ou na grossura: o que
  // não couber nesse espaço encolhe (o nome, a borda, a Nami e o pulo; veja op.caber no motor).
  // Com as opções padrão cabe tudo: as ondas, o brilho, o nome com os peixinhos e o pulo com giro.
  function margensCamera(camW, camH) {
    var u = Math.max(0.3, Math.min(camW, camH) / 333);
    var lado = Math.ceil(70 * u), cima = Math.ceil(200 * u);
    return { cima: cima, baixo: lado, esquerda: lado, direita: lado };
  }

  // --------------------------------------------------------------- motor
  // nome: plaquinha com o nome (vazio = sem plaquinha). cam: {x, y, w, h, ref: [largura, altura]}
  // é a câmera na tela de referência; a plaquinha fica em cima dela.
  var PADRAO = {
    tema: 'rosa', espessura: 1, velocidade: 1,
    nami: true, tamanho: 1, nado: 'volta', pulo: 25,
    bolhas: true, brilhos: true, enfeites: true,
    nome: '', nometam: 1, peixes: 3, letra: 'pacifico', cam: null
  };

  function iniciar(canvas, opcoes) {
    var op = {}, k;
    for (k in PADRAO) op[k] = PADRAO[k];
    for (k in opcoes || {}) op[k] = opcoes[k];
    var tema = TEMAS[op.tema] || TEMAS.rosa;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, u = 1, camadas = [];
    // com op.cam a borda é em volta da câmera: furo = buraco transparente onde ela aparece
    var furo = null, escNami = 0.88, velNami = 125;
    // op.caber: tudo tem que caber no espaço em volta da câmera (fonte de tamanho fixo).
    // tamNami e puloMax são a Nami e o pulo já encolhidos pra caber, se precisar.
    var tamNami = 1, puloMax = Infinity, espaco = null;
    var bolhas = [], gotas = [], brilhos = [];
    var sprite = document.createElement('canvas'), sctx = sprite.getContext('2d'), SO = { x: 96, y: 40, w: 152, h: 82 };
    var nami = { s: 0, dir: 1, flip: 1, fase: 0, pulo: null, proxPulo: 0, proxBolha: 0, piscar: 2.5, olho: 1 };
    var tempo = 0, ultimo = 0, rodando = true, raf = 0;
    var tmp = {};

    // plaquinha do nome com peixinhos dando a volta nela
    var placa = null;
    if (op.nome) {
      placa = { bolhas: [], peixes: [], prox: 0 };
      var np = Math.max(0, Math.min(12, Math.round(op.peixes)));
      for (var pi = 0; pi < np; pi++) {
        placa.peixes.push({ a: pi * TAU / np, r: 0.85 + Math.random() * 0.3, cor: PEIXES[pi % PEIXES.length], f: Math.random() * TAU, faixa: (pi % 2) * 0.18 });
      }
      var fonte = LETRAS[op.letra] || LETRAS.pacifico;
      if (document.fonts && document.fonts.load) document.fonts.load(fonte.css.replace('{px}', '40'));
    }

    function medir() {
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      W = global.innerWidth; H = global.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      var e = Math.max(0.3, op.espessura), rq = Math.sqrt(e);
      if (op.cam) {
        // borda em volta da câmera: a água fica do lado de fora e as ondas crescem pra fora
        // op.cam pode ser uma função do tamanho da fonte (a borda "só da câmera" se ajeita sozinha)
        var cam = typeof op.cam === 'function' ? op.cam(W, H) : op.cam;
        var ex = W / cam.ref[0], ey = H / cam.ref[1];
        var x0 = cam.x * ex, y0 = cam.y * ey, x1 = (cam.x + cam.w) * ex, y1 = (cam.y + cam.h) * ey;
        u = Math.max(0.3, Math.min(x1 - x0, y1 - y0) / 333);
        tamNami = op.tamanho; puloMax = Infinity; espaco = null;
        if (op.caber) {
          // a fonte tem tamanho fixo: a borda, a Nami e o pulo encolhem se não couberem
          espaco = { cima: y0, lado: Math.min(x0, W - x1, H - y1), largura: W };
          var cabe = function (ee) { return (25 * ee + 6 * Math.sqrt(ee) + 14) * u <= espaco.lado; };
          while (e > 0.3 && !cabe(e)) e = Math.max(0.3, e - 0.05);
          rq = Math.sqrt(e);
          var anelPx = (25 * e + 6 * rq) * u;
          tamNami = Math.max(0.5, Math.min(op.tamanho, (espaco.lado - anelPx - 7 * u) / (16 * u)));
          puloMax = Math.max(0, espaco.cima - anelPx - 48 * u * tamNami - 8 * u);
        }
        var Rc = 22 * u, pc = Math.max(2.5, 4 * u);
        var anel = function (d, A, lambda, w, ph) {
          return camada(caminho(x0 - d, y0 - d, x1 + d, y1 + d, Rc + d, true), A, lambda, w, ph, pc);
        };
        camadas = [
          anel(25 * u * e, 6 * u * rq, 125 * u, 1.5, 0),
          anel(16 * u * e, 4.5 * u * rq, 100 * u, 1.9, 1.7),
          anel(8 * u * e, 3 * u * rq, 80 * u, 2.4, 3.1)
        ];
        // a borda cobre 3 px da câmera e arredonda os cantos dela
        furo = { x: x0 + 3 * u, y: y0 + 3 * u, w: x1 - x0 - 6 * u, h: y1 - y0 - 6 * u, r: Rc - 3 * u };
        escNami = 0.66; velNami = 80;
      } else {
        u = Math.max(0.3, Math.min(W, H) / 1080);
        var R = 64 * u, passo = Math.max(3, 5 * u);
        var faixa = function (d, A, lambda, w, ph) {
          return camada(caminho(d, d, W - d, H - d, R, false), A, lambda, w, ph, passo);
        };
        camadas = [
          faixa(36 * u * e, 9 * u * rq, 300 * u, 1.45, 0),
          faixa(25 * u * e, 7 * u * rq, 215 * u, 1.85, 1.7),
          faixa(14 * u * e, 5 * u * rq, 165 * u, 2.35, 3.1)
        ];
        furo = null; escNami = 0.88; velNami = 125; tamNami = op.tamanho; puloMax = Infinity; espaco = null;
      }
      var kk = escNami * u * tamNami;
      sprite.width = Math.ceil(SO.w * kk * dpr); sprite.height = Math.ceil(SO.h * kk * dpr);
      var trilho = camadas[0].c;
      if (vaiEVolta()) nami.s = Math.min(Math.max(nami.s, 0), trilho.lw);
      else nami.s = nami.s % trilho.P;
    }

    // "embaixo" (tela) e "cima" (câmera): nada só no primeiro lado do caminho, indo e voltando
    function vaiEVolta() { return op.nado === 'embaixo' || op.nado === 'cima'; }

    function retRedondo(x, y, w, h, r) {
      r = Math.max(0, Math.min(r, w / 2, h / 2));
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }

    function preencher(L, estilo, alpha) {
      ctx.beginPath();
      if (furo) retRedondo(furo.x, furo.y, furo.w, furo.h, furo.r);
      else ctx.rect(-4, -4, W + 8, H + 8);
      ctx.moveTo(L.px[0], L.py[0]);
      for (var i = 1; i < L.n; i++) ctx.lineTo(L.px[i], L.py[i]);
      ctx.closePath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = estilo;
      ctx.fill('evenodd');
      ctx.globalAlpha = 1;
    }

    function contorno(L) {
      ctx.beginPath();
      ctx.moveTo(L.px[0], L.py[0]);
      for (var i = 1; i < L.n; i++) ctx.lineTo(L.px[i], L.py[i]);
      ctx.closePath();
    }

    function degrade(c1, c2, giro) {
      if (ctx.createConicGradient) {
        var g = furo ? ctx.createConicGradient(giro, furo.x + furo.w / 2, furo.y + furo.h / 2) : ctx.createConicGradient(giro, W / 2, H / 2);
        g.addColorStop(0, c1); g.addColorStop(0.25, c2); g.addColorStop(0.5, c1); g.addColorStop(0.75, c2); g.addColorStop(1, c1);
        return g;
      }
      var l = ctx.createLinearGradient(0, 0, W, H);
      l.addColorStop(0, c1); l.addColorStop(0.5, c2); l.addColorStop(1, c1);
      return l;
    }

    // ----- Nami: posição no trilho, pulos, virada
    function atualizaNami(dt) {
      var L = camadas[0], c = L.c, vel = velNami * u * op.velocidade * (0.6 + 0.4 * tamNami);
      if (vaiEVolta()) {
        var margem = Math.min(c.lw * 0.2, 90 * u);
        nami.s += nami.dir * vel * dt;
        if (nami.s > c.lw - margem && nami.dir > 0) nami.dir = -1;
        if (nami.s < margem && nami.dir < 0) nami.dir = 1;
        nami.flip += Math.max(-dt * 3.5, Math.min(dt * 3.5, nami.dir - nami.flip));
      } else {
        nami.s = (nami.s + vel * dt) % c.P;
        nami.flip = 1;
      }
      nami.fase += dt * (nami.pulo ? 4 : 7.2) * (0.7 + 0.3 * op.velocidade);
      nami.piscar -= dt;
      if (nami.piscar < 0) {
        var q = -nami.piscar / 0.16;
        if (q >= 1) { nami.piscar = 2 + Math.random() * 4; nami.olho = 1; }
        else nami.olho = Math.abs(1 - 2 * q);
      }
      if (op.pulo > 0) {
        nami.proxPulo -= dt;
        if (nami.proxPulo <= 0) nami.querPular = true;
      }
      if (nami.querPular && !nami.pulo && podePular()) pular();
      if (nami.pulo) {
        nami.pulo.t += dt;
        if (nami.pulo.t >= nami.pulo.dur) {
          respingo(nami.x, nami.y, nami.nx, nami.ny, 16);
          nami.pulo = null;
        }
      }
    }

    // Na borda da câmera ela só pula da beirada de cima, e só onde dá pra cair antes da quina:
    // assim o pulo cabe no espaço que margensCamera reserva em cima e nada corta.
    function podePular() {
      if (Math.abs(nami.flip) < 0.95) return false;
      if (!furo) return true;
      var c = camadas[0].c, m = 10 * u;
      var viagem = velNami * u * op.velocidade * (0.6 + 0.4 * tamNami) * 1.45;
      var s = ((nami.s % c.P) + c.P) % c.P;
      if (s < m || s > c.lw - m) return false;
      return vaiEVolta() && nami.dir < 0 ? s - viagem > m : s + viagem < c.lw - m;
    }

    function pular() {
      if (!op.nami || nami.pulo) return;
      // clique na hora errada: pula assim que chegar na beirada de cima
      if (!podePular()) { nami.querPular = true; return; }
      nami.querPular = false;
      nami.pulo = { t: 0, dur: 1.45, h: Math.min(puloMax, (95 + Math.random() * 40) * u * Math.max(0.7, tamNami) * (furo ? 0.7 : 1)), giro: Math.random() < 0.4 };
      nami.proxPulo = op.pulo * (0.75 + Math.random() * 0.5);
      respingo(nami.x, nami.y, nami.nx, nami.ny, 14);
    }

    function respingo(x, y, nx, ny, n) {
      if (x === undefined) return;
      for (var i = 0; i < n; i++) {
        var forca = (110 + Math.random() * 190) * u, lado = (Math.random() - 0.5) * 200 * u;
        gotas.push({
          x: x, y: y, vx: nx * forca - ny * lado, vy: ny * forca + nx * lado,
          gx: -nx * 650 * u, gy: -ny * 650 * u, r: (1.5 + Math.random() * 2.8) * u, vida: 0, max: 0.6 + Math.random() * 0.5
        });
      }
    }

    function desenhaNamiNaTela(t) {
      var L = camadas[0], c = L.c, o = c.ponto(nami.s, tmp);
      var off = onda(L, nami.s, t * op.velocidade);
      var kk = escNami * u * tamNami;
      var prof = off * 0.8 - (furo ? 3 : 7) * u * Math.max(0.6, op.espessura);
      var alt = 0, incl = Math.atan2(onda(L, nami.s + 8 * u, t * op.velocidade) - off, 8 * u) * -0.6, giro = 0;
      if (nami.pulo) {
        var p = nami.pulo, q = p.t / p.dur, vel = velNami * u * op.velocidade;
        alt = p.h * 4 * q * (1 - q);
        var dAlt = p.h * 4 * (1 - 2 * q) / p.dur;
        incl = -Math.atan2(dAlt, vel * 1.6);
        if (p.giro) giro = -TAU * (q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2);
      }
      var x = o.x + o.nx * (prof + alt), y = o.y + o.ny * (prof + alt);
      nami.x = o.x + o.nx * off; nami.y = o.y + o.ny * off; nami.nx = o.nx; nami.ny = o.ny;
      nami.cx = x; nami.cy = y; nami.ang = Math.atan2(o.ty, o.tx); nami.k = kk;

      // desenha a Nami parada num canvas pequeno e depois cola girada na tela
      sctx.setTransform(1, 0, 0, 1, 0, 0);
      sctx.clearRect(0, 0, sprite.width, sprite.height);
      sctx.setTransform(kk * dpr, 0, 0, kk * dpr, SO.x * kk * dpr, SO.y * kk * dpr);
      desenhaNami(sctx, nami.fase, nami.olho);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(nami.ang);
      ctx.scale(nami.flip || 0.001, 1);
      ctx.rotate(incl + giro);
      ctx.shadowColor = 'rgba(255,255,255,0.95)';
      ctx.shadowBlur = 7 * u * dpr;
      ctx.drawImage(sprite, -SO.x * kk, -SO.y * kk, sprite.width / dpr, sprite.height / dpr);
      ctx.restore();
    }

    function soltaBolhas(dt) {
      // bolhinhas da Nami
      if (op.nami && nami.cx !== undefined) {
        nami.proxBolha -= dt;
        if (nami.proxBolha <= 0) {
          nami.proxBolha = 0.25 + Math.random() * 0.45;
          var a = nami.ang, f = nami.flip >= 0 ? 1 : -1, kk = nami.k;
          var lx = 40 * kk * f, ly = -4 * kk;
          bolhas.push({
            x: nami.cx + Math.cos(a) * lx - Math.sin(a) * ly, y: nami.cy + Math.sin(a) * lx + Math.cos(a) * ly,
            vx: nami.nx * 45 * u, vy: nami.ny * 45 * u, nx: nami.nx, ny: nami.ny,
            r: (1.6 + Math.random() * 2.4) * u, vida: 0, max: 1 + Math.random() * 0.8, fase: Math.random() * TAU
          });
        }
      }
      // bolhas soltas na água
      if (op.bolhas && Math.random() < dt * 4) {
        var L = camadas[2], i = (Math.random() * L.n) | 0;
        bolhas.push({
          x: L.bx[i] - L.nx[i] * 6 * u, y: L.by[i] - L.ny[i] * 6 * u,
          vx: L.nx[i] * (22 + Math.random() * 22) * u, vy: L.ny[i] * (22 + Math.random() * 22) * u, nx: L.nx[i], ny: L.ny[i],
          r: (1.4 + Math.random() * 3) * u, vida: 0, max: 0.9 + Math.random() * 0.9, fase: Math.random() * TAU
        });
      }
      // brilhinhos na espuma
      if (op.brilhos && Math.random() < dt * 5) {
        var Lf = camadas[1], j = (Math.random() * Lf.n) | 0, dd = (Math.random() * 16 - 6) * u;
        brilhos.push({ i: j, dd: dd, vida: 0, max: 0.9 + Math.random() * 0.9, s: (4 + Math.random() * 6) * u, rosa: Math.random() < 0.45 });
      }
    }

    // bolhas e gotas somem de mansinho perto da beirada da fonte, em vez de cortar
    function perto(x, y) {
      return Math.max(0, Math.min(1, Math.min(x, W - x, y, H - y) / (14 * u)));
    }

    function desenhaBolhas(dt) {
      ctx.lineWidth = Math.max(1, 1.1 * u);
      for (var i = bolhas.length - 1; i >= 0; i--) {
        var b = bolhas[i];
        b.vida += dt;
        if (b.vida > b.max) { bolhas.splice(i, 1); continue; }
        var bal = Math.sin(b.vida * 7 + b.fase) * 10 * u;
        b.x += (b.vx - b.ny * bal) * dt; b.y += (b.vy + b.nx * bal) * dt;
        var a = Math.min(1, b.vida * 5, (b.max - b.vida) * 4, perto(b.x, b.y));
        ctx.globalAlpha = a * 0.9;
        ctx.strokeStyle = '#ffffff';
        ctx.fillStyle = 'rgba(255,255,255,0.25)';
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, TAU); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath(); ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function desenhaGotas(dt) {
      for (var i = gotas.length - 1; i >= 0; i--) {
        var g = gotas[i];
        g.vida += dt;
        if (g.vida > g.max) { gotas.splice(i, 1); continue; }
        g.vx += g.gx * dt; g.vy += g.gy * dt;
        g.x += g.vx * dt; g.y += g.vy * dt;
        ctx.globalAlpha = Math.min(1, (g.max - g.vida) * 4, perto(g.x, g.y));
        ctx.fillStyle = i % 3 ? '#ffffff' : tema.acento2;
        ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, TAU); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function desenhaBrilhos(dt) {
      var L = camadas[1];
      for (var i = brilhos.length - 1; i >= 0; i--) {
        var b = brilhos[i];
        b.vida += dt;
        if (b.vida > b.max) { brilhos.splice(i, 1); continue; }
        var q = b.vida / b.max, s = b.s * Math.sin(Math.PI * q);
        var x = L.px[b.i] + L.nx[b.i] * b.dd, y = L.py[b.i] + L.ny[b.i] * b.dd;
        brilhinho(ctx, x, y, s, b.rosa ? tema.estrela : '#ffffff');
      }
    }

    function desenhaEnfeites(t) {
      var s = 0.7071, cantos, tam;
      if (furo) {
        // nos cantos da câmera, em cima da onda do meio (estrela e concha em cima, que aparecem mais)
        var m = camadas[1].c, rm = m.r;
        cantos = [
          { x: m.x0 + rm - rm * s, y: m.y0 + rm - rm * s, tipo: 'estrela' },
          { x: m.x1 - rm + rm * s, y: m.y0 + rm - rm * s, tipo: 'concha' },
          { x: m.x0 + rm - rm * s, y: m.y1 - rm + rm * s, tipo: 'perolas' },
          { x: m.x1 - rm + rm * s, y: m.y1 - rm + rm * s, tipo: 'perolas' }
        ];
        tam = 14 * u * Math.min(1.4, Math.max(0.7, op.espessura));
      } else {
        // nos cantos da tela, entre a onda e a quina
        var c = camadas[0].c, R = c.r, x0 = c.x0, y0 = c.y0, x1 = c.x1, y1 = c.y1;
        cantos = [
          { x: (x0 + R - R * s) * 0.6, y: (y1 - R + R * s) * 0.6 + H * 0.4, tipo: 'estrela' },
          { x: (x1 - R + R * s) * 0.6 + W * 0.4, y: (y1 - R + R * s) * 0.6 + H * 0.4, tipo: 'concha' },
          { x: (x0 + R - R * s) * 0.6, y: (y0 + R - R * s) * 0.6, tipo: 'perolas' },
          { x: (x1 - R + R * s) * 0.6 + W * 0.4, y: (y0 + R - R * s) * 0.6, tipo: 'perolas' }
        ];
        tam = 21 * u * Math.min(1.4, Math.max(0.7, op.espessura));
      }
      cantos.forEach(function (q, i) {
        var x = q.x, y = q.y;
        ctx.save();
        ctx.translate(x, y + Math.sin(t * 1.6 + i) * 1.5 * u);
        if (q.tipo === 'estrela') { ctx.rotate(-0.25 + Math.sin(t * 0.9) * 0.12); estrelaDoMar(ctx, tam, tema.estrela, 'rgba(255,255,255,0.75)'); }
        else if (q.tipo === 'concha') { ctx.rotate(-0.35 + Math.sin(t * 1.1 + 1) * 0.08); concha(ctx, tam * 1.1, tema.acento2); }
        else { ctx.rotate(i === 2 ? 0.3 : -0.3); perolas(ctx, tam * 0.75); }
        ctx.restore();
      });
    }

    function geometriaPlaca(t) {
      var fs = 36 * u * op.nometam;
      var L = LETRAS[op.letra] || LETRAS.pacifico;
      fs *= L.esc;
      ctx.font = L.css.replace('{px}', fs.toFixed(1));
      var tw = ctx.measureText(op.nome).width;
      if (espaco && furo) {
        // altura do nome com a órbita dos peixinhos e a largura da órbita têm que caber na fonte
        var anelPx = (furo.y - 3 * u) - (camadas[0].c.y0 - camadas[0].A), raiaPx = (24 * tamNami + 6) * u;
        var peixe = op.peixes > 0 ? 33 * u * 1.15 * Math.max(0.7, op.nometam) * 0.62 : 0;
        var fsAlto = (espaco.cima - anelPx - raiaPx - 12 * 1.18 * u - peixe - 8 * u) / (0.625 + 0.625 * 1.18);
        var proporcao = tw / fs;
        var fsLargo = (espaco.largura / 2 - 6 * u - peixe - 26 * 1.18 * u) / ((proporcao / 2 + 0.25) * 1.18);
        var cabe = Math.max(8 * u, Math.min(fs, fsAlto, fsLargo));
        if (cabe < fs) {
          fs = cabe;
          ctx.font = L.css.replace('{px}', fs.toFixed(1));
          tw = ctx.measureText(op.nome).width;
        }
      }
      var h = fs * 1.25, w = tw + fs * 0.5;
      var A = camadas[0], cx, cy;
      if (furo) {
        // flutuando acima da raia em que a Nami nada em cima da câmera, pra não ficar na frente dela
        var topoOnda = A.c.y0 - A.A, raia = (24 * tamNami + 6) * u;
        cx = furo.x + furo.w / 2;
        cy = topoOnda - raia - h / 2;
      } else {
        cx = W / 2;
        cy = A.c.y0 + A.A + 6 * u + h / 2;
      }
      cx = Math.min(Math.max(cx, w / 2 + 4 * u), W - w / 2 - 4 * u);
      cy = Math.max(cy, h / 2 + 4 * u) + Math.sin(t * 1.3) * 2.5 * u;
      return { fs: fs, w: w, h: h, cx: cx, cy: cy, raia: furo ? (24 * tamNami + 6) * u : 0 };
    }

    function desenhaPlaca(t, dt) {
      var g = geometriaPlaca(t), i;

      // bolhinhas subindo em volta
      placa.prox -= dt;
      if (placa.prox <= 0) {
        placa.prox = 0.12 + Math.random() * 0.28;
        placa.bolhas.push({
          x: g.cx + (Math.random() - 0.5) * (g.w + 60 * u), y: g.cy + g.h * 0.5 + Math.random() * g.raia,
          v: (26 + Math.random() * 30) * u, r: (2.5 + Math.random() * 5) * u, f: Math.random() * TAU,
          vida: 0, max: 1.5 + Math.random() * 1.4, frente: Math.random() < 0.5
        });
      }
      for (i = placa.bolhas.length - 1; i >= 0; i--) {
        var b = placa.bolhas[i];
        b.vida += dt; b.y -= b.v * dt;
        if (b.vida > b.max) placa.bolhas.splice(i, 1);
      }

      // peixinhos dando a volta (os de cima passam por trás da plaquinha)
      var orx = g.w / 2 + 26 * u, ory = g.h / 2 + 12 * u;
      var peixes = placa.peixes.map(function (p) {
        p.a += 0.55 * op.velocidade * dt;
        p.f += dt * 9;
        var k = 1 + p.faixa, sn = Math.sin(p.a);
        var q = {
          p: p, x: g.cx + Math.cos(p.a) * orx * k, y: g.cy + sn * ory * k + Math.sin(t * 2 + p.f * 0.1) * 2 * u,
          vx: -Math.sin(p.a), vy: Math.cos(p.a) * ory / orx, frente: sn > 0
        };
        // de vez em quando solta uma bolhinha pela boca
        if (Math.random() < dt * 0.5) {
          placa.bolhas.push({ x: q.x + (q.vx < 0 ? -1 : 1) * 12 * u * p.r, y: q.y - 2 * u, v: 30 * u, r: 2 * u, f: 0, vida: 0, max: 1.2, frente: q.frente });
        }
        return q;
      });

      function bolhasPlaca(frente) {
        ctx.lineWidth = Math.max(1, 1.2 * u);
        placa.bolhas.forEach(function (b) {
          if (b.frente !== frente) return;
          var x = b.x + Math.sin(b.vida * 4 + b.f) * 5 * u;
          ctx.globalAlpha = Math.min(1, b.vida * 4, (b.max - b.vida) * 2.5, perto(x, b.y)) * 0.95;
          ctx.fillStyle = 'rgba(255,255,255,0.3)';
          ctx.strokeStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(x, b.y, b.r, 0, TAU); ctx.fill(); ctx.stroke();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.3, 0, TAU); ctx.fill();
        });
        ctx.globalAlpha = 1;
      }
      function peixesPlaca(frente) {
        peixes.forEach(function (q) {
          if (q.frente !== frente) return;
          ctx.save();
          ctx.globalAlpha = frente ? 1 : 0.85;
          ctx.translate(q.x, q.y);
          if (q.vx < 0) ctx.scale(-1, 1);
          ctx.rotate(Math.atan2(q.vy, Math.abs(q.vx)) * 0.55);
          ctx.shadowColor = 'rgba(255,255,255,0.9)';
          ctx.shadowBlur = 4 * u * dpr;
          peixinho(ctx, 33 * u * q.p.r * (frente ? 1 : 0.8) * Math.max(0.7, op.nometam), q.p.f, q.p.cor);
          ctx.restore();
        });
      }

      bolhasPlaca(false);
      peixesPlaca(false);

      // o nome: só as letras, sem fundo, flutuando
      // (letra cursiva flutua a palavra inteira, pra não quebrar a emenda das letras)
      var L = LETRAS[op.letra] || LETRAS.pacifico, fs = g.fs, k = op.nometam;
      ctx.save();
      ctx.translate(g.cx, g.cy);
      ctx.font = L.css.replace('{px}', fs.toFixed(1));
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      var pedacos = L.cursiva ? [op.nome] : Array.from(op.nome);
      var largs = pedacos.map(function (p) { return ctx.measureText(p).width; });
      var total = largs.reduce(function (a, b) { return a + b; }, 0), x = -total / 2;
      var pos = pedacos.map(function (p, j) {
        var fase = t * 2.4 - j * 0.6;
        var q = L.cursiva
          ? { x: x, w: largs[j], dy: Math.sin(t * 1.6) * 3 * u * k, rot: Math.sin(t * 1.1) * 0.03 }
          : { x: x, w: largs[j], dy: Math.sin(fase) * 4 * u * k, rot: Math.sin(fase + 1.2) * 0.07 };
        x += largs[j];
        return q;
      });
      var letra = ctx.createLinearGradient(0, -fs * 0.5, 0, fs * 0.5);
      letra.addColorStop(0, tema.linha); letra.addColorStop(1, tema.acento);
      // três passadas: contorno branco com brilho rosa, sombrinha e a cor
      [0, 1, 2].forEach(function (passada) {
        pedacos.forEach(function (p, j) {
          var q = pos[j];
          ctx.save();
          ctx.translate(q.x + q.w / 2, q.dy);
          ctx.rotate(q.rot);
          if (passada === 0) {
            ctx.shadowColor = 'rgba(255,92,158,0.6)';
            ctx.shadowBlur = 9 * u * dpr;
            ctx.lineWidth = fs * 0.2;
            ctx.strokeStyle = '#ffffff';
            ctx.strokeText(p, -q.w / 2, 0);
          } else if (passada === 1) {
            ctx.fillStyle = tema.acento2;
            ctx.fillText(p, -q.w / 2, fs * 0.07);
          } else {
            ctx.fillStyle = letra;
            ctx.fillText(p, -q.w / 2, 0);
          }
          ctx.restore();
        });
      });
      // brilhinhos piscando nas pontas
      brilhinho(ctx, total / 2 + 5 * u * k, -fs * 0.38, (4.5 + 2.5 * Math.sin(t * 3)) * u * k, '#ffffff');
      brilhinho(ctx, -total / 2 - 6 * u * k, fs * 0.22, (4 + 2.5 * Math.sin(t * 3 + 2)) * u * k, tema.estrela);
      ctx.restore();

      peixesPlaca(true);
      bolhasPlaca(true);
    }

    function quadro(agora) {
      if (!rodando) return;
      raf = global.requestAnimationFrame(quadro);
      if (!ultimo) ultimo = agora;
      var dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;
      tempo += dt;
      var t = tempo, tv = t * op.velocidade;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      if (op.antes) op.antes(ctx, W, H, t, u, dt);

      for (var j = 0; j < 3; j++) {
        var L = camadas[j];
        for (var i = 0; i < L.n; i++) {
          var off = onda(L, L.ss[i], tv);
          L.off[i] = off;
          L.px[i] = L.bx[i] + L.nx[i] * off;
          L.py[i] = L.by[i] + L.ny[i] * off;
        }
      }
      var A = camadas[0], B = camadas[1], C = camadas[2];

      // brilho rosado do lado de dentro (meia faixa aparece, o resto fica embaixo da onda)
      contorno(A);
      ctx.strokeStyle = tema.brilho;
      ctx.globalAlpha = 0.12; ctx.lineWidth = 20 * u; ctx.stroke();
      ctx.globalAlpha = 0.28; ctx.lineWidth = 9 * u; ctx.stroke();
      ctx.globalAlpha = 1;

      preencher(A, degrade(tema.fundo, tema.fundo2, t * 0.25), 0.97);
      contorno(A);
      ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.6 * u; ctx.stroke();

      preencher(B, tema.meio, 0.8);
      contorno(B);
      ctx.strokeStyle = tema.linha; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.4 * u; ctx.stroke(); ctx.globalAlpha = 1;

      // o nome vem antes da Nami: quando ela nada ou pula ali, passa na frente das letras
      if (placa) desenhaPlaca(t, dt);

      // a Nami nada por cima da onda do meio; a onda da frente cobre a barriga e a ponta do rabo
      if (op.nami) {
        atualizaNami(dt);
        desenhaNamiNaTela(t);
      }
      soltaBolhas(dt);

      preencher(C, degrade(tema.frente, tema.frente2, -t * 0.2), 0.93);
      contorno(C);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4 * u; ctx.stroke();
      if (furo) {
        // beiradinha limpa em volta da câmera
        ctx.beginPath();
        retRedondo(furo.x, furo.y, furo.w, furo.h, furo.r);
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.5 * u; ctx.stroke();
        ctx.beginPath();
        retRedondo(furo.x + 1.7 * u, furo.y + 1.7 * u, furo.w - 3.4 * u, furo.h - 3.4 * u, Math.max(0, furo.r - 1.7 * u));
        ctx.strokeStyle = tema.acento2; ctx.lineWidth = 1.2 * u; ctx.stroke();
      }

      // espuma nas cristas
      ctx.fillStyle = '#ffffff';
      for (i = 0; i < C.n; i += 3) {
        if (C.off[i] > C.A * 0.55) {
          ctx.beginPath(); ctx.arc(C.px[i] + C.nx[i] * 2 * u, C.py[i] + C.ny[i] * 2 * u, (1.1 + (C.off[i] / C.A - 0.55) * 3) * u, 0, TAU); ctx.fill();
        }
      }

      desenhaBolhas(dt);
      desenhaGotas(dt);
      if (op.brilhos) desenhaBrilhos(dt);
      if (op.enfeites) desenhaEnfeites(t);
      if (op.depois) op.depois(ctx, W, H, t, u, dt);
    }

    medir();
    nami.proxPulo = Math.min(6, op.pulo * 0.4);
    global.addEventListener('resize', medir);
    raf = global.requestAnimationFrame(quadro);

    return {
      op: op,
      tema: tema,
      pular: pular,
      parar: function () { rodando = false; global.cancelAnimationFrame(raf); global.removeEventListener('resize', medir); }
    };
  }

  global.Ondas = {
    TEMAS: TEMAS,
    LETRAS: LETRAS,
    PADRAO: PADRAO,
    margensCamera: margensCamera,
    parametros: parametros,
    automatico: automatico,
    veioDeRecarga: veioDeRecarga,
    emOBS: emOBS,
    iniciar: iniciar,
    desenhaNami: desenhaNami,
    // enfeites avulsos, pros painéis e alertas
    peixinho: peixinho,
    PEIXES: PEIXES,
    estrelaDoMar: estrelaDoMar,
    concha: concha,
    perolas: perolas,
    brilhinho: brilhinho
  };
})(window);
