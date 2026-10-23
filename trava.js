/*
 * trava.js · tela de senha do gerador e dos painéis
 *
 * Só entra quem tem a senha do "Salvar na live" (a SENHA_EDICAO do servidor). A senha fica
 * guardada só até fechar o navegador, a não ser que marque "lembrar neste computador".
 * As telas do OBS (borda, fila, alertas...) continuam abertas: o OBS e a StreamElements precisam delas.
 */
(function (global) {
  'use strict';

  var CHAVE = 'evelinperes-senha', LEMBRAR = 'evelinperes-senha-lembrar';
  // a versão antiga guardava a senha pra sempre, sem perguntar
  try { global.localStorage.removeItem(CHAVE); } catch (e) {}

  function senha() {
    try { return global.sessionStorage.getItem(CHAVE) || global.localStorage.getItem(LEMBRAR) || ''; } catch (e) { return ''; }
  }
  function guarda(s, lembrar) {
    try {
      global.sessionStorage.setItem(CHAVE, s);
      if (lembrar) global.localStorage.setItem(LEMBRAR, s);
    } catch (e) {}
  }
  function esquece() {
    try { global.sessionStorage.removeItem(CHAVE); global.localStorage.removeItem(LEMBRAR); } catch (e) {}
  }
  // 200 = senha certa, 401 = errada, 429 = muitas tentativas, 0 = sem servidor
  function confere(s) {
    return fetch('/api/conferir', { headers: { 'Authorization': 'Bearer ' + s }, cache: 'no-store' })
      .then(function (r) { return r.status; }, function () { return 0; });
  }

  var CSS = [
    'body.travado main, body.travado #ondas, body.travado .salvar { visibility: hidden; }',
    '.trava { position: fixed; inset: 0; z-index: 100; display: none; place-items: center; padding: 20px;',
    '  background: radial-gradient(ellipse at 20% 0%, #fff 0%, transparent 55%), radial-gradient(ellipse at 90% 80%, #c9f1f3 0%, transparent 45%), linear-gradient(#fff8fb, #ffe6f0 60%, #ffd6e7); }',
    'body.travado .trava { display: grid; }',
    '.trava form { width: 100%; max-width: 360px; background: #fff; border-radius: 24px; padding: 26px 24px; text-align: center;',
    '  box-shadow: 0 0 0 2px #ffd3e5, 0 16px 44px rgba(255, 92, 158, 0.2); font-family: Nunito, "Segoe UI", sans-serif; color: #6e2449; }',
    '.trava img { width: 64px; height: 64px; }',
    '.trava h2 { margin: 8px 0 4px; font: 700 26px Fredoka, Nunito, sans-serif; color: #ff5c9e; }',
    '.trava p { margin: 0 0 16px; color: #a4607f; font-weight: 700; }',
    '.trava input[type=password] { width: 100%; box-sizing: border-box; font: 700 16px Nunito, sans-serif; color: #6e2449; background: #fff4f8;',
    '  border: 2px solid #ffd3e5; border-radius: 12px; padding: 11px 14px; outline: none; }',
    '.trava input[type=password]:focus { border-color: #ffa3cb; background: #fff; }',
    '.trava label { display: flex; align-items: center; justify-content: center; gap: 8px; margin: 12px 0 16px; font-weight: 700; font-size: 14px; cursor: pointer; }',
    '.trava input[type=checkbox] { accent-color: #ff5c9e; width: 18px; height: 18px; }',
    '.trava button { width: 100%; font: 700 17px Fredoka, Nunito, sans-serif; color: #fff; background: #ff5c9e; border: 0; border-radius: 12px;',
    '  padding: 12px; cursor: pointer; box-shadow: 0 4px 0 #e0437f; }',
    '.trava button:disabled { opacity: 0.6; cursor: default; }',
    '.trava .erro { min-height: 20px; margin: 12px 0 0; color: #d33b4f; font-weight: 800; font-size: 14px; }'
  ].join('\n');

  // mostra a tela de senha (se precisar) e chama pronto() quando liberar
  function entrar(pronto) {
    var estilo = document.createElement('style');
    estilo.textContent = CSS;
    document.head.appendChild(estilo);
    var tela = document.createElement('div');
    tela.className = 'trava';
    tela.innerHTML = '<form autocomplete="on"><img src="favicon.svg" alt=""><h2>Painel da evelin_peres</h2>' +
      '<p>Digite a senha pra entrar.</p>' +
      '<input type="text" name="username" value="evelin_peres" autocomplete="username" hidden>' +
      '<input type="password" autocomplete="current-password" aria-label="Senha" required>' +
      '<label><input type="checkbox"> Lembrar neste computador</label>' +
      '<button type="submit">Entrar</button><p class="erro" role="alert"></p></form>';
    document.body.appendChild(tela);
    var form = tela.querySelector('form'), campo = tela.querySelector('input[type=password]');
    var lembrar = tela.querySelector('input[type=checkbox]'), erro = tela.querySelector('.erro'), botao = tela.querySelector('button');

    function libera() {
      document.body.classList.remove('travado');
      tela.remove();
      pronto();
    }
    function trava() {
      document.body.classList.add('travado');
      setTimeout(function () { campo.focus(); }, 50);
    }
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var s = campo.value.trim();
      if (!s) return;
      botao.disabled = true;
      erro.textContent = '';
      confere(s).then(function (st) {
        botao.disabled = false;
        if (st === 200 || st === 0) { guarda(s, lembrar.checked); libera(); }
        else if (st === 429) erro.textContent = 'Muitas tentativas. Espera uns minutinhos.';
        else { erro.textContent = 'Senha errada.'; campo.select(); }
      });
    });

    // já entrou nesta sessão: abre na hora e confere no fundo (só trava de novo se a senha mudou)
    var s = senha();
    if (!s) { trava(); return; }
    libera();
    confere(s).then(function (st) {
      if (st === 401) { esquece(); global.location.reload(); }
    });
  }

  global.Trava = { entrar: entrar, senha: senha, guarda: guarda, esquece: esquece };
})(window);
