/*
 * dados.js · skins, cromas e habilidades da Nami
 *
 * Tenta a lista atualizada do CommunityDragon (assim skin nova aparece sozinha) e,
 * se não der, usa a cópia em nami.json. As imagens vêm do Data Dragon da Riot.
 */
(function (global) {
  'use strict';

  var CDRAGON = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/pt_br/v1/champions/267.json';
  var DDRAGON = 'https://ddragon.leagueoflegends.com/cdn/';
  var CROMAS = 'https://raw.communitydragon.org/latest/plugins/rcp-be-lol-game-data/global/default/v1/champion-chroma-images/267/';
  var RARIDADE = { kEpic: 'Épica', kLegendary: 'Lendária', kMythic: 'Mítica', kUltimate: 'Suprema', kTranscendent: 'Transcendente', kExalted: 'Exaltada' };

  function comPrazo(url, ms) {
    var ctrl = global.AbortController ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, ms);
    return fetch(url, ctrl ? { signal: ctrl.signal } : {}).then(function (r) {
      clearTimeout(timer);
      if (!r.ok) throw new Error(url + ' ' + r.status);
      return r.json();
    });
  }

  function doCDragon(d) {
    return d.skins.map(function (s) {
      return {
        num: s.id % 1000,
        nome: s.isBase ? 'Nami Clássica' : s.name,
        raridade: RARIDADE[s.rarity] || '',
        legado: !!s.isLegacy,
        cromas: (s.chromas || []).map(function (c) {
          var m = /\(([^)]+)\)\s*$/.exec(c.name);
          return { num: c.id % 1000, nome: m ? m[1] : c.name.replace(s.name, '').trim(), cores: c.colors || [] };
        })
      };
    });
  }

  var promessa = null;
  function carregar() {
    if (promessa) return promessa;
    var local = fetch('nami.json').then(function (r) { return r.json(); });
    promessa = local.then(function (base) {
      return comPrazo(CDRAGON, 4500).then(function (vivo) {
        var skins = doCDragon(vivo);
        if (!skins.length) throw new Error('vazio');
        return { versao: base.versao, titulo: vivo.title || base.titulo, skins: skins, habilidades: base.habilidades };
      }).catch(function () { return base; });
    });
    return promessa;
  }

  global.NamiDados = {
    carregar: carregar,
    splash: function (num) { return DDRAGON + 'img/champion/centered/Nami_' + num + '.jpg'; },
    splashInteira: function (num) { return DDRAGON + 'img/champion/splash/Nami_' + num + '.jpg'; },
    quadrado: function (num) { return DDRAGON + 'img/champion/tiles/Nami_' + num + '.jpg'; },
    croma: function (num) { return CROMAS + (267000 + num) + '.png'; },
    icone: function (h, versao) { return DDRAGON + versao + '/img/' + h.icone; },
    // "41:43,15:17" -> {41: 43, 15: 17}
    lerCromas: function (txt) {
      var m = {};
      String(txt || '').split(',').forEach(function (par) {
        var p = par.split(':');
        if (p.length === 2 && p[0] !== '' && p[1] !== '') m[parseInt(p[0], 10)] = parseInt(p[1], 10);
      });
      return m;
    }
  };
})(window);
