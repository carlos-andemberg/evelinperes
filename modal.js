/*
 * modal.js · janelinha de confirmação no tema (no lugar do confirm() do navegador)
 *
 *   Modal.confirmar({ titulo, texto, ok, cancelar, icone, perigo }).then(function (sim) { ... })
 *
 * Esc ou clicar fora cancela, Enter aperta o botão em foco, e o foco fica preso nos botões enquanto ela está aberta.
 */
(function (global) {
  'use strict';

  var CSS = [
    '.modal-fundo { position: fixed; inset: 0; z-index: 200; display: grid; place-items: center; padding: 20px;',
    '  background: rgba(110, 36, 73, 0.35); backdrop-filter: blur(3px); -webkit-backdrop-filter: blur(3px); animation: modal-surge 0.18s ease-out; }',
    '.modal { position: relative; width: 100%; max-width: 420px; background: #fff; border-radius: 26px; padding: 30px 26px 22px; text-align: center;',
    '  box-shadow: 0 0 0 3px #ffd3e5, 0 0 0 7px #fff, 0 0 0 9px #ffa3cb, 0 22px 50px rgba(255, 92, 158, 0.3);',
    '  font-family: Nunito, "Segoe UI", sans-serif; color: #6e2449; animation: modal-pula 0.32s cubic-bezier(0.2, 1.5, 0.4, 1); overflow: hidden; }',
    '.modal::before { content: ""; position: absolute; left: 0; right: 0; top: 0; height: 14px;',
    '  background: radial-gradient(circle at 10px -4px, transparent 11px, #ffd3e5 12px) 0 0 / 20px 14px repeat-x; }',
    '.modal .modal-icone { font-size: 40px; line-height: 1; margin-bottom: 6px; }',
    '.modal h2 { margin: 0 0 8px; font: 700 24px Fredoka, Nunito, sans-serif; color: #ff5c9e; }',
    '.modal p { margin: 0 0 22px; color: #a4607f; font-weight: 700; line-height: 1.5; }',
    '.modal .modal-botoes { display: flex; gap: 10px; }',
    '.modal button { flex: 1; font: 700 16px Fredoka, Nunito, sans-serif; border: 0; border-radius: 14px; padding: 12px 14px; cursor: pointer; }',
    '.modal .modal-ok { color: #fff; background: #ff5c9e; box-shadow: 0 4px 0 #e0437f; }',
    '.modal .modal-ok.perigo { background: #e23a6a; box-shadow: 0 4px 0 #b52350; }',
    '.modal .modal-nao { color: #ff5c9e; background: #fff; box-shadow: 0 0 0 2px #ffd3e5, 0 4px 0 #ffd3e5; }',
    '.modal button:active { transform: translateY(3px); }',
    '.modal button:focus-visible { outline: 3px solid #ffa3cb; outline-offset: 2px; }',
    '@keyframes modal-surge { from { opacity: 0; } }',
    '@keyframes modal-pula { from { opacity: 0; transform: translateY(16px) scale(0.92); } }',
    '@media (prefers-reduced-motion: reduce) { .modal-fundo, .modal { animation: none; } }'
  ].join('\n');

  var injetado = false;
  function injeta() {
    if (injetado) return;
    injetado = true;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
  }

  function confirmar(o) {
    o = o || {};
    injeta();
    return new Promise(function (responde) {
      var antes = document.activeElement;
      var fundo = document.createElement('div');
      fundo.className = 'modal-fundo';
      fundo.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-titulo" aria-describedby="modal-texto">' +
        '<div class="modal-icone" aria-hidden="true"></div><h2 id="modal-titulo"></h2><p id="modal-texto"></p>' +
        '<div class="modal-botoes"><button type="button" class="modal-nao"></button><button type="button" class="modal-ok"></button></div></div>';
      fundo.querySelector('.modal-icone').textContent = o.icone || '🐚';
      fundo.querySelector('h2').textContent = o.titulo || 'Tem certeza?';
      fundo.querySelector('p').textContent = o.texto || '';
      var nao = fundo.querySelector('.modal-nao'), ok = fundo.querySelector('.modal-ok');
      nao.textContent = o.cancelar || 'Cancelar';
      ok.textContent = o.ok || 'Sim';
      if (o.perigo) ok.classList.add('perigo');
      document.body.appendChild(fundo);
      // numa ação que apaga coisa, o foco começa no "Cancelar"
      (o.perigo ? nao : ok).focus();

      function fecha(sim) {
        document.removeEventListener('keydown', teclas, true);
        fundo.remove();
        if (antes && antes.focus) antes.focus();
        responde(sim);
      }
      function teclas(e) {
        if (e.key === 'Escape') { e.preventDefault(); fecha(false); }
        else if (e.key === 'Tab') {
          e.preventDefault();
          (document.activeElement === ok ? nao : ok).focus();
        }
      }
      document.addEventListener('keydown', teclas, true);
      ok.addEventListener('click', function () { fecha(true); });
      nao.addEventListener('click', function () { fecha(false); });
      fundo.addEventListener('click', function (e) { if (e.target === fundo) fecha(false); });
    });
  }

  global.Modal = { confirmar: confirmar };
})(window);
