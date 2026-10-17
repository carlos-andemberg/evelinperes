/*
 * cenas.js · as telas de cena (fila, começando, encerrando, volto já)
 *
 * Todas usam o mesmo fila.html; o servidor entrega ele também como comecando.html,
 * encerrando.html e voltoja.html, e o nome do arquivo diz qual tela é. Cada uma tem as
 * próprias opções salvas, o próprio link único e estes textos e relógio padrão.
 */
(function (global) {
  'use strict';

  var CENAS = {
    fila: {
      nome: 'Estou na fila', icone: '🐚', arquivo: 'fila.html',
      titulo: 'Estou na fila', pontos: true,
      relogio: 'sobe', rotulo: 'tempo na fila', tempo: true,
      recados: 'Já já começa a partida!|Aproveita pra pegar uma água 💧|Digita !pix, !insta ou !elo no chat'
    },
    comecando: {
      nome: 'A live já vai começar', icone: '⏰', arquivo: 'comecando.html',
      titulo: 'A live já vai começar', pontos: true,
      relogio: 'desce', rotulo: 'começa em', tempo: true,
      recados: 'Pega sua água e se ajeita aí 💧|Enquanto isso, deixa o follow pra não perder nada|Digita !insta e !pix no chat'
    },
    encerrando: {
      nome: 'Obrigada por assistir', icone: '💕', arquivo: 'encerrando.html',
      titulo: 'Obrigada por assistir!', pontos: false,
      relogio: 'sobe', rotulo: 'até a próxima', tempo: false,
      recados: 'Obrigada por cada minutinho aqui 💕|Até a próxima live!|Segue no insta: !insta'
    },
    voltoja: {
      nome: 'Volto já', icone: '☕', arquivo: 'voltoja.html',
      titulo: 'Volto já', pontos: true,
      relogio: 'sobe', rotulo: 'fora há', tempo: true,
      recados: 'Já já eu volto, não sai daí!|Aproveita pra pegar uma água 💧|Digita !pix, !insta ou !elo no chat'
    }
  };

  // qual tela é esta página (pelo nome do arquivo)
  function atual() {
    var m = /(comecando|encerrando|voltoja)\.html$/.exec(global.location.pathname);
    return m ? m[1] : 'fila';
  }

  global.Cenas = { CENAS: CENAS, ORDEM: ['fila', 'comecando', 'encerrando', 'voltoja'], atual: atual };
})(window);
