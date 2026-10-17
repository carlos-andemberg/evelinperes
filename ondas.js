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
  // Lê as opções do link (?espessura=1.5&nami=0 ...). O tipo vem do valor padrão.
  function parametros(padrao) {
    var q = new URLSearchParams(global.location.search), op = {};
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

  // ------------------------------------------------------------- caminho
  // Retângulo de cantos redondos recuado `d` da beirada. Percorre: baixo (esq→dir),
  // direita (baixo→cima), cima (dir→esq), esquerda (cima→baixo). A normal aponta
  // pra dentro da tela, que é o "pra cima" da água.
  function caminho(W, H, d, r) {
    var x0 = d, y0 = d, x1 = W - d, y1 = H - d;
    r = Math.max(4, Math.min(r, (x1 - x0) / 2 - 1, (y1 - y0) / 2 - 1));
    var lw = Math.max(0, x1 - x0 - 2 * r), lh = Math.max(0, y1 - y0 - 2 * r), arco = Math.PI * r / 2;
    var segs = [
      { reta: true, len: lw, x: x0 + r, y: y1, tx: 1, ty: 0 },
      { reta: false, len: arco, cx: x1 - r, cy: y1 - r, a0: Math.PI / 2 },
      { reta: true, len: lh, x: x1, y: y1 - r, tx: 0, ty: -1 },
      { reta: false, len: arco, cx: x1 - r, cy: y0 + r, a0: 0 },
      { reta: true, len: lw, x: x1 - r, y: y0, tx: -1, ty: 0 },
      { reta: false, len: arco, cx: x0 + r, cy: y0 + r, a0: -Math.PI / 2 },
      { reta: true, len: lh, x: x0, y: y0 + r, tx: 0, ty: 1 },
      { reta: false, len: arco, cx: x0 + r, cy: y1 - r, a0: -Math.PI }
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
            var a = g.a0 - s / r, c = Math.cos(a), sn = Math.sin(a);
            o.x = g.cx + r * c; o.y = g.cy + r * sn; o.tx = sn; o.ty = -c;
          }
          o.nx = o.ty; o.ny = -o.tx;
          return o;
        }
        s -= g.len;
      }
      return o;
    }
    return { P: P, ponto: ponto, lw: lw, lh: lh, r: r, d: d, x0: x0, y0: y0, x1: x1, y1: y1 };
  }

  // Uma camada de onda: amostra o caminho e guarda o que precisa pra mexer a cada quadro
  function camada(W, H, d, r, A, lambda, w, ph, passo) {
    var c = caminho(W, H, d, r), n = Math.max(16, Math.ceil(c.P / passo)), o = {};
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

  function pilula(c, x, y, w, h) {
    var r = h / 2;
    c.beginPath();
    c.moveTo(x + r, y);
    c.lineTo(x + w - r, y);
    c.arc(x + w - r, y + r, r, -Math.PI / 2, Math.PI / 2);
    c.lineTo(x + r, y + h);
    c.arc(x + r, y + r, r, Math.PI / 2, Math.PI * 1.5);
    c.closePath();
  }

  // --------------------------------------------------------------- motor
  // nome: plaquinha com o nome (vazio = sem plaquinha). cam: {x, y, w, h, ref: [largura, altura]}
  // é a câmera na tela de referência; a plaquinha fica em cima dela.
  var PADRAO = {
    tema: 'rosa', espessura: 1, velocidade: 1,
    nami: true, tamanho: 1, nado: 'volta', pulo: 25,
    bolhas: true, brilhos: true, enfeites: true,
    nome: '', nometam: 1, peixes: 3, cam: null
  };

  function iniciar(canvas, opcoes) {
    var op = {}, k;
    for (k in PADRAO) op[k] = PADRAO[k];
    for (k in opcoes || {}) op[k] = opcoes[k];
    var tema = TEMAS[op.tema] || TEMAS.rosa;
    var ctx = canvas.getContext('2d');
    var W = 0, H = 0, dpr = 1, u = 1, camadas = [];
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
      if (document.fonts && document.fonts.load) document.fonts.load('700 40px Fredoka');
    }

    function medir() {
      dpr = Math.min(global.devicePixelRatio || 1, 2);
      W = global.innerWidth; H = global.innerHeight;
      canvas.width = Math.round(W * dpr); canvas.height = Math.round(H * dpr);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      u = Math.max(0.3, Math.min(W, H) / 1080);
      var e = Math.max(0.3, op.espessura), R = 64 * u, passo = Math.max(3, 5 * u);
      camadas = [
        camada(W, H, 36 * u * e, R, 9 * u * Math.sqrt(e), 300 * u, 1.45, 0, passo),
        camada(W, H, 25 * u * e, R, 7 * u * Math.sqrt(e), 215 * u, 1.85, 1.7, passo),
        camada(W, H, 14 * u * e, R, 5 * u * Math.sqrt(e), 165 * u, 2.35, 3.1, passo)
      ];
      var kk = 0.88 * u * op.tamanho;
      sprite.width = Math.ceil(SO.w * kk * dpr); sprite.height = Math.ceil(SO.h * kk * dpr);
      var trilho = camadas[0].c;
      if (op.nado === 'embaixo') nami.s = Math.min(Math.max(nami.s, 0), trilho.lw);
      else nami.s = nami.s % trilho.P;
    }

    function preencher(L, estilo, alpha) {
      ctx.beginPath();
      ctx.rect(-4, -4, W + 8, H + 8);
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
        var g = ctx.createConicGradient(giro, W / 2, H / 2);
        g.addColorStop(0, c1); g.addColorStop(0.25, c2); g.addColorStop(0.5, c1); g.addColorStop(0.75, c2); g.addColorStop(1, c1);
        return g;
      }
      var l = ctx.createLinearGradient(0, 0, W, H);
      l.addColorStop(0, c1); l.addColorStop(0.5, c2); l.addColorStop(1, c1);
      return l;
    }

    // ----- Nami: posição no trilho, pulos, virada
    function atualizaNami(dt) {
      var L = camadas[0], c = L.c, vel = 125 * u * op.velocidade * (0.6 + 0.4 * op.tamanho);
      if (op.nado === 'embaixo') {
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
        if (!nami.pulo && nami.proxPulo <= 0 && Math.abs(nami.flip) > 0.95) pular();
      }
      if (nami.pulo) {
        nami.pulo.t += dt;
        if (nami.pulo.t >= nami.pulo.dur) {
          respingo(nami.x, nami.y, nami.nx, nami.ny, 16);
          nami.pulo = null;
        }
      }
    }

    function pular() {
      if (!op.nami || nami.pulo) return;
      nami.pulo = { t: 0, dur: 1.45, h: (95 + Math.random() * 40) * u * Math.max(0.7, op.tamanho), giro: Math.random() < 0.4 };
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
      var kk = 0.88 * u * op.tamanho;
      var prof = off * 0.8 - 7 * u * Math.max(0.6, op.espessura);
      var alt = 0, incl = Math.atan2(onda(L, nami.s + 8 * u, t * op.velocidade) - off, 8 * u) * -0.6, giro = 0;
      if (nami.pulo) {
        var p = nami.pulo, q = p.t / p.dur, vel = 125 * u * op.velocidade;
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

    function desenhaBolhas(dt) {
      ctx.lineWidth = Math.max(1, 1.1 * u);
      for (var i = bolhas.length - 1; i >= 0; i--) {
        var b = bolhas[i];
        b.vida += dt;
        if (b.vida > b.max) { bolhas.splice(i, 1); continue; }
        var bal = Math.sin(b.vida * 7 + b.fase) * 10 * u;
        b.x += (b.vx - b.ny * bal) * dt; b.y += (b.vy + b.nx * bal) * dt;
        var a = Math.min(1, b.vida * 5, (b.max - b.vida) * 4);
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
        ctx.globalAlpha = Math.min(1, (g.max - g.vida) * 4);
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
      var c = camadas[0].c, R = c.r, d = c.d, s = 0.7071;
      var cantos = [
        { x: d + R - R * s, y: H - d - R + R * s, cx: 0, cy: H, tipo: 'estrela' },
        { x: W - d - R + R * s, y: H - d - R + R * s, cx: W, cy: H, tipo: 'concha' },
        { x: d + R - R * s, y: d + R - R * s, cx: 0, cy: 0, tipo: 'perolas' },
        { x: W - d - R + R * s, y: d + R - R * s, cx: W, cy: 0, tipo: 'perolas' }
      ];
      var tam = 21 * u * Math.min(1.4, Math.max(0.7, op.espessura));
      cantos.forEach(function (q, i) {
        var x = q.x + (q.cx - q.x) * 0.4, y = q.y + (q.cy - q.y) * 0.4;
        ctx.save();
        ctx.translate(x, y + Math.sin(t * 1.6 + i) * 1.5 * u);
        if (q.tipo === 'estrela') { ctx.rotate(-0.25 + Math.sin(t * 0.9) * 0.12); estrelaDoMar(ctx, tam, tema.estrela, 'rgba(255,255,255,0.75)'); }
        else if (q.tipo === 'concha') { ctx.rotate(-0.35 + Math.sin(t * 1.1 + 1) * 0.08); concha(ctx, tam * 1.1, tema.acento2); }
        else { ctx.rotate(i === 2 ? 0.3 : -0.3); perolas(ctx, tam * 0.75); }
        ctx.restore();
      });
    }

    function geometriaPlaca(t) {
      var fs = 34 * u * op.nometam;
      ctx.font = '700 ' + fs + 'px Fredoka, Nunito, "Segoe UI", sans-serif';
      var tw = ctx.measureText(op.nome).width, h = fs * 1.62, w = tw + fs * 1.35;
      var faixa = camadas[0].c.d + camadas[0].A + 6 * u, cx, topo;
      if (op.cam) {
        var ex = W / op.cam.ref[0], ey = H / op.cam.ref[1];
        cx = (op.cam.x + op.cam.w / 2) * ex;
        topo = op.cam.y * ey;
      } else {
        cx = W / 2; topo = faixa + h;
      }
      // fica sentada na beirada de cima da câmera, sem entrar na onda da borda
      cx = Math.min(Math.max(cx, w / 2 + faixa), W - w / 2 - faixa);
      var cy = Math.max(topo - h * 0.2, faixa + h / 2) + Math.sin(t * 1.3) * 2.5 * u;
      return { fs: fs, w: w, h: h, cx: cx, cy: cy, rot: Math.sin(t * 0.8) * 0.02 };
    }

    function desenhaPlaca(t, dt) {
      var g = geometriaPlaca(t), i;

      // bolhinhas subindo em volta
      placa.prox -= dt;
      if (placa.prox <= 0) {
        placa.prox = 0.12 + Math.random() * 0.28;
        placa.bolhas.push({
          x: g.cx + (Math.random() - 0.5) * (g.w + 70 * u), y: g.cy + g.h * (0.15 + Math.random() * 0.55),
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
      var orx = g.w / 2 + 34 * u, ory = g.h / 2 + 17 * u;
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
          ctx.globalAlpha = Math.min(1, b.vida * 4, (b.max - b.vida) * 2.5) * 0.95;
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

      // a plaquinha
      ctx.save();
      ctx.translate(g.cx, g.cy);
      ctx.rotate(g.rot);
      pilula(ctx, -g.w / 2, -g.h / 2, g.w, g.h);
      var fundo = ctx.createLinearGradient(0, -g.h / 2, 0, g.h / 2);
      fundo.addColorStop(0, '#ffffff'); fundo.addColorStop(1, tema.frente2);
      ctx.shadowColor = 'rgba(255,92,158,0.45)';
      ctx.shadowBlur = 16 * u * dpr;
      ctx.shadowOffsetY = 4 * u * dpr;
      ctx.fillStyle = fundo;
      ctx.fill();
      ctx.shadowColor = 'transparent';
      ctx.lineWidth = 4.5 * u * op.nometam;
      ctx.strokeStyle = tema.acento2;
      ctx.stroke();
      // fio de pérolas por dentro
      var m = 7 * u * op.nometam;
      pilula(ctx, -g.w / 2 + m, -g.h / 2 + m, g.w - 2 * m, g.h - 2 * m);
      ctx.setLineDash([0.1, 6 * u * op.nometam]);
      ctx.lineCap = 'round';
      ctx.lineWidth = 2.6 * u * op.nometam;
      ctx.strokeStyle = tema.fundo;
      ctx.stroke();
      ctx.setLineDash([]);
      // o nome
      ctx.font = '700 ' + g.fs + 'px Fredoka, Nunito, "Segoe UI", sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = tema.acento2;
      ctx.fillText(op.nome, 0, g.fs * 0.06 + 3 * u * op.nometam);
      var letra = ctx.createLinearGradient(0, -g.fs / 2, 0, g.fs / 2);
      letra.addColorStop(0, tema.linha); letra.addColorStop(1, tema.acento);
      ctx.fillStyle = letra;
      ctx.fillText(op.nome, 0, g.fs * 0.06);
      // brilhinhos piscando nas pontas
      brilhinho(ctx, g.w / 2 - g.h * 0.32, -g.h / 2 + 2 * u, (4.5 + 2.5 * Math.sin(t * 3)) * u * op.nometam, '#ffffff');
      brilhinho(ctx, -g.w / 2 + g.h * 0.3, g.h / 2 - 1 * u, (4 + 2.5 * Math.sin(t * 3 + 2)) * u * op.nometam, tema.estrela);
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

      // a Nami nada por cima da onda do meio; a onda da frente cobre a barriga e a ponta do rabo
      if (op.nami) {
        atualizaNami(dt);
        desenhaNamiNaTela(t);
      }
      soltaBolhas(dt);

      preencher(C, degrade(tema.frente, tema.frente2, -t * 0.2), 0.93);
      contorno(C);
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2.4 * u; ctx.stroke();

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
      if (placa) desenhaPlaca(t, dt);
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
    PADRAO: PADRAO,
    parametros: parametros,
    emOBS: emOBS,
    iniciar: iniciar,
    desenhaNami: desenhaNami
  };
})(window);
