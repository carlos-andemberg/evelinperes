/*
 * sons.js · sons dos alertas, feitos na hora com o WebAudio (nenhum arquivo pra baixar)
 *
 *   Sons.LISTA              [{ id, nome, icone }] na ordem em que aparecem no gerador
 *   Sons.toca(som, volume)  toca um som da lista, ou um link direto de .mp3/.ogg/.wav
 *   Sons.para()             corta o link que estiver tocando
 *
 * Cada som tem o próprio timbre (bolhas, caixinha de música, harpa, sinos...), não só notas diferentes.
 */
(function (global) {
  'use strict';

  var audio = null, saida = null, eco = null, chiado = null, cordas = {}, arquivo = null;

  function contexto() {
    if (!audio) {
      audio = new (global.AudioContext || global.webkitAudioContext)();
      // tudo passa por um compressor (vários sons juntos não estouram) e um pouco vai pro eco de caverna do mar
      var comp = audio.createDynamicsCompressor();
      comp.threshold.value = -12;
      comp.ratio.value = 4;
      comp.connect(audio.destination);
      saida = comp;
      eco = audio.createConvolver();
      eco.buffer = salinha(2.4);
      eco.connect(comp);
    }
    if (audio.state === 'suspended' && audio.resume) audio.resume().catch(function () {});
    return audio;
  }

  // eco: ruído que vai sumindo, nos dois lados
  function salinha(seg) {
    var n = Math.floor(audio.sampleRate * seg), b = audio.createBuffer(2, n, audio.sampleRate);
    for (var c = 0; c < 2; c++) {
      var d = b.getChannelData(c);
      for (var i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 2.8);
    }
    return b;
  }

  // envelope: sobe em `ataque` e some até `fim`
  function envelope(g, t, pico, ataque, fim) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(pico, t + ataque);
    g.gain.exponentialRampToValueAtTime(0.0001, t + fim);
  }

  // um tom simples; o.ate faz a nota escorregar até outra frequência
  function tom(s, t, f, dur, o) {
    o = o || {};
    var osc = audio.createOscillator(), g = audio.createGain();
    osc.type = o.onda || 'sine';
    osc.frequency.setValueAtTime(f, t);
    if (o.ate) osc.frequency.exponentialRampToValueAtTime(o.ate, t + (o.em || dur));
    if (o.desafina) osc.detune.value = o.desafina;
    envelope(g, t, o.ganho || 0.2, o.ataque || 0.005, dur);
    osc.connect(g);
    g.connect(s);
    osc.start(t);
    osc.stop(t + dur + 0.05);
  }

  // chiado filtrado (água, espuma, brilho)
  function ruido(s, t, dur, o) {
    if (!chiado) {
      chiado = audio.createBuffer(1, audio.sampleRate * 2, audio.sampleRate);
      var d = chiado.getChannelData(0);
      for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    var src = audio.createBufferSource(), fl = audio.createBiquadFilter(), g = audio.createGain();
    src.buffer = chiado;
    src.loop = true;
    fl.type = o.filtro || 'lowpass';
    fl.Q.value = o.q || 0.7;
    fl.frequency.setValueAtTime(o.freq, t);
    (o.curva || []).forEach(function (p) { fl.frequency.exponentialRampToValueAtTime(p[1], t + p[0]); });
    envelope(g, t, o.ganho || 0.2, o.ataque || 0.01, dur);
    src.connect(fl);
    fl.connect(g);
    g.connect(s);
    src.start(t, Math.random());
    src.stop(t + dur + 0.05);
  }

  // corda dedilhada (Karplus-Strong): um estalinho de ruído que vira nota e vai morrendo
  function corda(s, t, f, ganho) {
    var chave = Math.round(f), b = cordas[chave];
    if (!b) {
      var sr = audio.sampleRate, n = Math.floor(sr * 1.8), p = Math.max(2, Math.round(sr / f)), ant = 0;
      b = cordas[chave] = audio.createBuffer(1, n, sr);
      var d = b.getChannelData(0);
      for (var i = 0; i < n; i++) {
        if (i < p) { ant = (ant + Math.random() * 2 - 1) * 0.5; d[i] = ant; }
        else d[i] = 0.4985 * (d[i - p] + (i > p ? d[i - p - 1] : 0));
      }
    }
    var src = audio.createBufferSource(), g = audio.createGain();
    src.buffer = b;
    g.gain.value = ganho;
    src.connect(g);
    g.connect(s);
    src.start(t);
  }

  // sino de FM: a modulação começa forte (o "blim" metálico) e vai acalmando
  function sino(s, t, f, dur, ganho) {
    var car = audio.createOscillator(), mod = audio.createOscillator(), mg = audio.createGain(), g = audio.createGain();
    car.frequency.value = f;
    mod.frequency.value = f * 1.4;
    mg.gain.setValueAtTime(f * 3.2, t);
    mg.gain.exponentialRampToValueAtTime(f * 0.08, t + dur * 0.7);
    mod.connect(mg);
    mg.connect(car.frequency);
    envelope(g, t, ganho, 0.004, dur);
    car.connect(g);
    g.connect(s);
    car.start(t); mod.start(t);
    car.stop(t + dur + 0.05); mod.stop(t + dur + 0.05);
  }

  // vidro/cristal: parciais que não são múltiplas da nota, as altas somem antes
  function vidro(s, t, f, ganho) {
    [[1, 1, 1.1], [2.76, 0.45, 0.55], [5.4, 0.2, 0.3], [8.93, 0.1, 0.18]].forEach(function (p) {
      if (f * p[0] < audio.sampleRate * 0.45) tom(s, t, f * p[0], p[2], { ganho: ganho * p[1], ataque: 0.002 });
    });
  }

  // dente de caixinha de música: nota pura com um brilhinho em cima
  function dente(s, t, f, ganho) {
    tom(s, t, f, 1.3, { ganho: ganho, ataque: 0.003 });
    tom(s, t, f * 3, 0.25, { ganho: ganho * 0.18, ataque: 0.002 });
    tom(s, t, f * 6.1, 0.08, { ganho: ganho * 0.08, ataque: 0.001 });
  }

  // metal da fanfarra: dois dente-de-serra desafinados num filtro que abre e fecha
  function metal(s, t, f, dur, ganho) {
    var fl = audio.createBiquadFilter(), g = audio.createGain();
    fl.type = 'lowpass';
    fl.Q.value = 2;
    fl.frequency.setValueAtTime(f * 1.2, t);
    fl.frequency.exponentialRampToValueAtTime(f * 7, t + 0.06);
    fl.frequency.exponentialRampToValueAtTime(f * 3, t + Math.min(dur, 0.4));
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(ganho, t + 0.035);
    g.gain.setValueAtTime(ganho * 0.8, t + Math.max(0.05, dur - 0.12));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur + 0.25);
    fl.connect(g);
    g.connect(s);
    [-8, 8].forEach(function (c) {
      var o = audio.createOscillator();
      o.type = 'sawtooth';
      o.frequency.value = f;
      o.detune.value = c;
      o.connect(fl);
      o.start(t);
      o.stop(t + dur + 0.3);
    });
  }

  function bloop(s, t, f, ganho) {
    tom(s, t, f, 0.11, { ate: f * 2.6, em: 0.07, ganho: ganho, ataque: 0.008 });
  }

  // nota da escala pentatônica (dó, ré, mi, sol, lá) a partir de uma base
  function penta(base, i) {
    var p = [0, 2, 4, 7, 9];
    return base * Math.pow(2, (p[i % 5] + 12 * Math.floor(i / 5)) / 12);
  }

  var LISTA = [
    { id: 'bolhas', nome: 'Bolhinhas', icone: '💧', eco: 0.25, toca: function (s, t) {
      [[0, 380], [0.09, 520], [0.15, 450], [0.26, 640], [0.33, 560], [0.44, 760], [0.5, 900], [0.58, 820]].forEach(function (b, i) {
        bloop(s, t + b[0], b[1], 0.48 - i * 0.025);
      });
      tom(s, t + 0.72, 1568, 0.9, { onda: 'triangle', ganho: 0.2 });
      tom(s, t + 0.82, 2093, 1.1, { onda: 'triangle', ganho: 0.17 });
    } },
    { id: 'splash', nome: 'Splash da Nami', icone: '💦', eco: 0.2, toca: function (s, t) {
      ruido(s, t, 0.5, { freq: 1800, ganho: 0.35, ataque: 0.004 });
      bloop(s, t + 0.05, 260, 0.35);
      [659, 784, 1047, 1319, 1568].forEach(function (f, j) {
        tom(s, t + 0.45 + j * 0.11, f, 0.9, { onda: 'triangle', ganho: 0.22, ataque: 0.02 });
      });
    } },
    { id: 'caixinha', nome: 'Caixinha de música', icone: '🎶', eco: 0.45, toca: function (s, t) {
      [1047, 1319, 1568, 2093, 1976, 1568, 1760, 2093].forEach(function (f, i) {
        dente(s, t + i * 0.15 + (i === 7 ? 0.12 : 0), f, i === 7 ? 0.19 : 0.145);
      });
      dente(s, t, 523, 0.12);
      dente(s, t + 1.17, 784, 0.1);
      dente(s, t + 1.17, 523, 0.1);
    } },
    { id: 'harpa', nome: 'Harpa', icone: '🪕', eco: 0.4, toca: function (s, t) {
      var maior = [0, 2, 4, 5, 7, 9, 11];
      for (var i = 0; i < 15; i++) {
        var f = 523.25 * Math.pow(2, (maior[i % 7] + 12 * Math.floor(i / 7)) / 12);
        corda(s, t + i * 0.045, f, 0.4);
      }
      corda(s, t + 0.85, 1046.5, 0.36);
      corda(s, t + 0.85, 1318.5, 0.32);
      corda(s, t + 0.85, 1568, 0.32);
    } },
    { id: 'magia', nome: 'Pozinho mágico', icone: '✨', eco: 0.6, toca: function (s, t) {
      ruido(s, t, 1.2, { filtro: 'highpass', freq: 5000, curva: [[1, 9000]], ganho: 0.1, ataque: 0.5 });
      for (var i = 0; i < 16; i++) tom(s, t + i * 0.035, penta(523.25, i), 0.5, { ganho: 0.09 + i * 0.005, ataque: 0.004 });
      [1047, 1319, 1568, 2093].forEach(function (f, j) {
        tom(s, t + 0.62 + j * 0.02, f, 1.8, { onda: 'triangle', ganho: 0.1, ataque: 0.03, desafina: j % 2 ? 6 : -6 });
      });
    } },
    { id: 'cristal', nome: 'Cristais', icone: '💎', eco: 0.5, toca: function (s, t) {
      [[0, 1760], [0.08, 2349], [0.17, 1976], [0.24, 2637], [0.34, 2093], [0.47, 3136]].forEach(function (n) {
        vidro(s, t + n[0], n[1], 0.16);
      });
      vidro(s, t + 0.7, 1568, 0.2);
      vidro(s, t + 0.7, 2349, 0.12);
    } },
    { id: 'moedas', nome: 'Moedinhas', icone: '💰', eco: 0.15, toca: function (s, t) {
      [[0, 988, 1319], [0.16, 1175, 1568], [0.32, 1319, 1760]].forEach(function (m) {
        tom(s, t + m[0], m[1], 0.07, { onda: 'square', ganho: 0.17, ataque: 0.002 });
        tom(s, t + m[0] + 0.07, m[2], 0.4, { onda: 'square', ganho: 0.17, ataque: 0.002 });
      });
      [2637, 3136, 3951].forEach(function (f, j) { tom(s, t + 0.6 + j * 0.06, f, 0.6, { onda: 'triangle', ganho: 0.16 }); });
    } },
    { id: 'sino', nome: 'Sininhos', icone: '🔔', eco: 0.45, toca: function (s, t) {
      sino(s, t, 1568, 1.6, 0.16);
      sino(s, t + 0.28, 1319, 1.6, 0.16);
      sino(s, t + 0.56, 1047, 2.4, 0.18);
      sino(s, t + 0.56, 523, 2.4, 0.08);
    } },
    { id: 'fanfarra', nome: 'Fanfarra do mar', icone: '🎺', eco: 0.3, toca: function (s, t) {
      metal(s, t, 392, 0.1, 0.1);
      metal(s, t + 0.13, 392, 0.1, 0.1);
      metal(s, t + 0.26, 392, 0.1, 0.1);
      [523, 659, 784].forEach(function (f) { metal(s, t + 0.4, f, 1.0, 0.072); });
      metal(s, t + 0.4, 1047, 1.0, 0.05);
      // tambor fundo na nota longa
      tom(s, t + 0.4, 110, 0.6, { ate: 60, ganho: 0.4, ataque: 0.003 });
      ruido(s, t + 0.4, 0.25, { freq: 900, ganho: 0.12, ataque: 0.002 });
    } },
    { id: 'onda', nome: 'Onda do mar', icone: '🌊', eco: 0.35, toca: function (s, t) {
      ruido(s, t, 2.8, { freq: 300, curva: [[1, 2400], [2.6, 420]], ganho: 0.32, ataque: 0.9 });
      ruido(s, t + 1.1, 1.6, { filtro: 'highpass', freq: 2500, curva: [[1.5, 6000]], ganho: 0.06, ataque: 0.15 });
      [349, 440, 523, 698].forEach(function (f, j) {
        tom(s, t + 0.3, f, 2.6, { ganho: 0.075, ataque: 0.7, desafina: j % 2 ? 5 : -5 });
      });
    } }
  ];
  var PORID = {};
  LISTA.forEach(function (x) { PORID[x.id] = x; });

  function para() {
    if (!arquivo) return;
    try { arquivo.pause(); } catch (e) {}
    arquivo = null;
  }

  function toca(som, volume) {
    var vol = Math.max(0, Math.min(1, +volume || 0));
    if (!som || !vol) return;
    if (/^https?:\/\//i.test(som)) {
      para();
      try {
        arquivo = new Audio(som);
        arquivo.volume = vol;
        var p = arquivo.play();
        if (p && p.catch) p.catch(function () {});
      } catch (e) {}
      return;
    }
    var S = PORID[som];
    if (!S) return;
    try {
      contexto();
      var bus = audio.createGain();
      bus.gain.value = vol;
      bus.connect(saida);
      if (S.eco) {
        var envio = audio.createGain();
        envio.gain.value = S.eco;
        bus.connect(envio);
        envio.connect(eco);
      }
      S.toca(bus, audio.currentTime + 0.03);
    } catch (e) { /* sem som, tudo bem */ }
  }

  global.Sons = {
    LISTA: LISTA.map(function (x) { return { id: x.id, nome: x.nome, icone: x.icone }; }),
    existe: function (id) { return !!PORID[id]; },
    toca: toca,
    para: para
  };
})(window);
