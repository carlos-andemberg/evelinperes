# Overlays da Nami da evelin_peres 🌊💗

Overlays pro OBS da [evelin_peres](https://www.twitch.tv/evelin_peres), no tema da Nami do League of Legends: branco com rosa clarinho, ondinhas em volta da câmera e a Nami nadando nelas. As páginas são HTML/CSS/JS puro, sem build, feitas pra fonte **Navegador** do OBS, e um servidorzinho em Node (sem dependências) guarda as opções da live.

**No ar:** [evelinperes.carlosandemberg.com.br](https://evelinperes.carlosandemberg.com.br). Lá você escolhe as opções, vê a prévia e clica em **Salvar na live**.

## Senha do gerador

O gerador (`index.html`) e os painéis (`paineis.html`) abrem com uma tela de senha: é a mesma senha do **Salvar na live** (a `SENHA_EDICAO` do servidor). Ela fica guardada só até fechar o navegador, a não ser que marque **Lembrar neste computador**. As telas do OBS (borda, fila, alertas...) não pedem senha, porque o OBS e a StreamElements precisam abrir elas.

## Link único (atualiza sozinho)

No OBS cada tela tem o seu link, colado uma vez só:

- `https://evelinperes.carlosandemberg.com.br/borda.html` (Borda 1 da câmera; `borda2.html`, `borda3.html` e `borda4.html` são as outras, uma por cena em que a câmera muda de tamanho)
- `https://evelinperes.carlosandemberg.com.br/fila.html` (estou na fila)
- `https://evelinperes.carlosandemberg.com.br/comecando.html` (a live já vai começar)
- `https://evelinperes.carlosandemberg.com.br/encerrando.html` (obrigada por assistir)
- `https://evelinperes.carlosandemberg.com.br/voltoja.html` (volto já)

Sem nada depois do `.html`, a tela usa as opções salvas no gerador. Mexeu no gerador e clicou em **Salvar na live**: as telas abertas no OBS recebem o aviso na hora e se atualizam sozinhas, e o tempo na fila continua contando. Se o servidor cair, a tela usa a última versão que viu.

Cada tela tem as próprias opções: a borda da câmera e a tela de fila não dividem nada (cores, Nami, câmera, tudo separado).

O **Salvar na live** pede uma senha (a variável `SENHA_EDICAO` no Coolify); o navegador lembra depois da primeira vez. Num computador novo, o gerador já abre com o que está na live, e o aviso no rodapé mostra se tem mudança que ainda não foi salva.

Links com opções escritas neles (`borda.html?tema=agua...`) continuam funcionando e não mudam sozinhos: o gerador mostra esse "link fixo" escondidinho, pra testes.

| Arquivo | O que é | Tamanho no OBS |
|---|---|---|
| `borda.html` | Borda de ondas em volta da webcam, com a Nami nadando e o nome flutuando em cima. Fundo transparente | **1920 × 1080** (o tamanho da tela do OBS) |
| `fila.html` | As telas de cena: estou na fila, a live já vai começar, obrigada por assistir e volto já (o servidor entrega a mesma página como `comecando.html`, `encerrando.html` e `voltoja.html`) | **1920 × 1080** (ou em pé, 1080 × 1920) |
| `cenas.js` | Os textos e o relógio padrão de cada tela de cena | — |
| `alertas.html` | Os alertas (seguir, sub, sub de presente, raid, bits, doação), que entram no overlay da StreamElements por um widget | o overlay da StreamElements (1920 × 1080) |
| `paineis.html`, `paineis/` | O gerador das imagens dos painéis do Sobre da Twitch, e as quatro já prontas | — |
| `index.html` | Gerador: escolhe cores, skins, cromas, textos e o lugar da câmera, mostra a prévia e salva na live | — |
| `servidor.js` | Serve as páginas e guarda as opções da live (`/api/config`), avisando as telas abertas quando mudam (`/api/eventos`) | — |
| `ondas.js` | O motor: as três camadas de onda (em volta da câmera ou da tela), espuma, bolhas, brilhos, enfeites, o nome com os peixinhos e a Nami desenhada no canvas | — |
| `dados.js`, `nami.json` | Skins, cromas e habilidades da Nami (a lista se atualiza sozinha; `nami.json` é a cópia de reserva) | — |

## A borda da câmera

São quatro bordas, uma pra cada cena do OBS em que a câmera tem outro tamanho ou lugar (ex.: Borda 1 no jogo, Borda 2 na conversa). Cada uma tem a própria câmera, as próprias opções, um apelido pra você saber qual é e o próprio link (`borda.html`, `borda2.html`, `borda3.html`, `borda4.html`). No gerador, os botões **Borda 1 a 4** escolhem qual você está mexendo.

A borda abraça a webcam: três camadas de onda (rosa por fora, rosinha no meio e branca colada na câmera) correm em volta dela, com espuma nas cristas, brilhinhos, bolhas e um contorno limpinho que arredonda os cantos da câmera. Nos cantos ficam a estrela-do-mar, a concha e as pérolas. O resto da tela fica livre.

A Nami é desenhada no código (nada de imagem, fica nítida em qualquer tamanho): cabelo rosa balançando, orelhas de barbatana, cauda verde-água com escamas, cajado com o orbe de água brilhando, piscadinha. Ela nada em volta da câmera em cima das ondas, de pé na beirada de cima, soltando bolhinhas, e de vez em quando **pula** pra fora da água (às vezes dando um giro) e cai com um respingo.

### O nome

Em cima da câmera flutua **evelin_peres**, só as letras, sem fundo: contorno branco com brilho rosa, sombrinha e degradê rosa. Na letra cursiva a palavra inteira flutua; nas outras cada letrinha balança no seu tempo. Em volta, peixinhos (rosa, verde-água, laranja e lilás) dão a volta no nome e bolhinhas sobem da água. O nome fica acima da faixa em que a Nami nada, e ela sempre passa na frente dele.

Letras: **Praia** (Pacifico, cursiva, a padrão), **Fofinha** (Cherry Bomb One), **Bolinha** (Sniglet) e **Redondinha** (Fredoka).

### A câmera

Já vem no lugar e no formato da live, que é quase quadrada e fica no canto de baixo à direita: **x 1591, y 747, 329 × 333** numa tela 1920 × 1080. A parte da borda que passa da beirada da tela some junto, como se continuasse pra fora.

Se mudar a câmera no OBS, ajuste no gerador. Lá tem uma tela pequena: arraste a câmera pra mudar de lugar e puxe as bolinhas dos cantos pra mudar o tamanho. Também tem os formatos prontos (igual à live, 16:9, 4:3, quadradinha) e os campos de X, Y, largura e altura. No OBS esses números ficam em: botão direito na câmera → **Transformar → Editar transformação** (Posição e Tamanho). Se a câmera fica em outro lugar em outra cena, é só fazer outro link pra ela.

### Colocar no OBS

O padrão é a borda **só da câmera**: a fonte tem o tamanho exato da webcam mais o espaço da borda, do nome com os peixinhos e do pulo da Nami (ela só pula da beirada de cima, e só onde dá pra cair antes da quina). Assim dá pra agrupar a borda com a câmera e arrastar o grupo pra qualquer canto, até encostado na beirada da tela, sem cortar nada. Bolhas e respingos somem de mansinho antes da beirada da fonte.

Pra câmera da live (329 × 333 em x 1591, y 747):

1. **Fontes → + → Navegador**
2. **URL**: `https://evelinperes.carlosandemberg.com.br/borda.html`
3. **Largura 469, Altura 601** (só muda se a câmera mudar de tamanho; o gerador mostra)
4. Botão direito na borda → **Transformar → Editar transformação** → **Posição x 1521, y 549**: aí a borda cai certinho em volta da câmera.
5. Deixe a borda **acima da câmera** na lista de fontes, selecione as duas → botão direito → **Agrupar itens selecionados**. Agora é só arrastar o grupo.

O tamanho da fonte só muda se a câmera mudar de tamanho. Mexer no nome, na letra, na Nami ou na grossura não muda nada no OBS: se algo não couber no espaço, encolhe (o nome, a borda, a Nami ou o pulo). Se a fonte tiver outro tamanho, a borda se ajeita lá dentro e escala junto. Com `modo=tela`, a fonte volta a ser a tela inteira (1920 × 1080) com a borda no lugar da câmera.

Abrindo o link num navegador normal aparece a splash da Nami de fundo e um quadro escuro no lugar da câmera, só de prévia, e clicar faz a Nami pular. No OBS o fundo fica transparente.

### Opções da borda

Junte com `&`, ex.: `borda.html?espessura=1.4&nado=embaixo`. O gerador monta isso pra você.

| Opção | O que faz |
|---|---|
| `tema=rosa` | Cores: `rosa` (branco e rosa clarinho, o padrão), `lilas` ou `agua` |
| `espessura=1` | Grossura da borda em volta da câmera: `0.5` fininha, `2.5` bem grossa |
| `velocidade=1` | Velocidade das ondas e da Nami |
| `nami=0` | Sem a Nami |
| `tamanho=1` | Tamanho da Nami (`0.6` a `2`) |
| `nado=cima` | A Nami nada só em cima da câmera, indo e voltando (o padrão, `volta`, é em volta da câmera toda) |
| `pulo=25` | Segundos entre um pulo e outro (`pulo=0` desliga) |
| `bolhas=0` | Sem bolhas |
| `brilhos=0` | Sem brilhinhos |
| `enfeites=0` | Sem estrela, concha e pérolas nos cantos |
| `nome=evelin_peres` | Nome flutuando em cima da câmera (`nome=` vazio esconde) |
| `nometam=1` | Tamanho do nome (`0.6` a `1.8`) |
| `letra=pacifico` | Letra do nome: `pacifico`, `cherry`, `sniglet` ou `fredoka` |
| `peixes=3` | Quantos peixinhos dão a volta no nome (`peixes=0` tira) |
| `camx=1591&camy=747` | Canto de cima-esquerdo da câmera, em pixels da tela do OBS (a borda vai em volta dela) |
| `camlargura=329&camaltura=333` | Tamanho da câmera |
| `resolucao=1920x1080` | Tamanho da tela do OBS em que os números da câmera foram medidos |
| `modo=tela` | A fonte é a tela inteira e a borda cai em `camx`/`camy` (o padrão, `solta`, é a fonte só da câmera) |
| `fundo=0` | Força o fundo transparente mesmo fora do OBS |

## As telas de cena

São quatro, todas no mesmo jeitinho (fundo de mar, borda de ondas com a Nami, skin trocando, recadinhos, habilidades e espaço pra câmera), e **cada uma com as próprias opções e o próprio link**:

| Tela | Link | Título | Relógio |
|---|---|---|---|
| Estou na fila | `fila.html` | Estou na fila... | conta o tempo na fila |
| A live já vai começar | `comecando.html` | A live já vai começar... | contagem regressiva (5 minutos, dá pra mudar) e "já já!" no fim |
| Obrigada por assistir | `encerrando.html` | Obrigada por assistir! | desligado |
| Volto já | `voltoja.html` | Volto já... | conta o tempo fora |

No gerador, a aba **Telas** tem um botão pra cada uma: o que mexer numa não muda as outras. Dá pra trocar título, recadinhos, o texto do relógio, ligar ou desligar os três pontinhos, e escolher entre relógio que sobe ou contagem regressiva.

## A tela de fila

Pra cena de quando ela está esperando a partida. Aqui a borda de ondas vai em volta da tela toda, com a Nami nadando, e o fundo é um mar rosinha (raios de luz e bolhas subindo).

- **Skin da Nami**: a arte das skins escolhidas vai trocando, com zoom lento e uma barrinha mostrando quando vem a próxima. Só a arte, sem texto por cima (com `nomeskin=1` aparecem o nome e a raridade). Embaixo ficam as bolinhas de todas as skins escolhidas.
- **Croma**: em cada skin dá pra escolher um croma, que aparece num selinho no canto da arte, com o nome e a cor.
- **Tempo na fila**: uma bolha que vai enchendo de água enquanto o tempo passa.
- **Recadinhos**: frases que vão trocando embaixo do tempo (ex.: comandos do chat).
- **Habilidades da Nami**: passiva, Q, W, E e R, com o nome de cada uma aparecendo em sequência.
- **Espaço pra câmera** (opcional): um buraco transparente com moldura. A câmera vai **embaixo** desta fonte no OBS. No gerador dá pra arrastar e redimensionar o espaço no formato da sua webcam, e ele mostra a posição e o tamanho exatos.

As skins vêm da lista do CommunityDragon, então skin nova da Nami aparece sozinha. Se a lista não carregar, vale a cópia em `nami.json`. As artes vêm do Data Dragon da Riot.

### Colocar no OBS

1. Numa cena **Fila**: **Fontes → + → Navegador**
2. **URL**: `https://evelinperes.carlosandemberg.com.br/fila.html` (ou o link do gerador)
3. **Largura 1920, Altura 1080**
4. Marque **Atualizar navegador quando a cena ficar ativa**: assim o tempo na fila começa do zero toda vez que você troca pra essa cena.
5. Com o espaço pra câmera ligado, ponha a câmera **embaixo** da fonte da fila, na posição que o gerador mostra.

### Opções da fila

Além das opções da borda:

| Opção | O que faz |
|---|---|
| `skins=0,15,41` | Quais skins entram, pelo número (o padrão é todas). Os números estão no gerador e em `nami.json` |
| `croma=15:17,41:43` | Croma de cada skin (`skin:croma`) |
| `troca=10` | Segundos entre uma skin e outra (`troca=0` deixa fixa na primeira) |
| `aleatorio=1` | Embaralha a ordem das skins |
| `titulo=Estou na fila` | O título (os três pontinhos pulando entram sozinhos) |
| `pilula=League of Legends` | A etiqueta em cima do título (`pilula=` vazio esconde) |
| `recados=Frase 1\|Frase 2` | Recadinhos, separados por `\|` |
| `tempo=0` | Esconde o tempo na fila |
| `habilidades=0` | Esconde as habilidades |
| `miniaturas=0` | Esconde as bolinhas das skins |
| `relogio=desce&minutos=5` | Contagem regressiva de 5 minutos (`relogio=sobe` conta desde que a cena abriu) |
| `rotulo=começa em` | Texto em cima do relógio |
| `pontos=0` | Tira os três pontinhos do título |
| `camera=1` | Liga o espaço pra câmera |
| `camx=1240&camy=605` | Lugar do espaço da câmera, em pixels da tela do OBS (sem isso ele fica no cantinho da coluna do título) |
| `camlargura=576&camaltura=324` | Tamanho do espaço da câmera (o gerador tem o formato igual à câmera do jogo, 4:3 e quadradinha) |
| `resolucao=1920x1080` | Tamanho da tela do OBS em que os números da câmera foram medidos |
| `nomeskin=1` | Mostra o nome, a raridade e o croma por cima da arte (o padrão é só a arte) |

Numa fonte em pé (ex.: 1080 × 1920) a tela se arruma sozinha: título em cima, depois tempo, câmera e a arte da skin.

## Alertas (StreamElements)

Cada alerta: uma onda rosa sobe do pé da tela, a Nami pula da água (às vezes girando) por cima do nome, que aparece flutuando, letra por letra, com uma frase embaixo e a mensagem num balãozinho. No fim tudo afunda. Cada tipo tem o seu efeito e o seu som:

| Tipo | Título | Efeito | Som padrão |
|---|---|---|---|
| Seguir | Novo seguidor! | corações subindo | Bolhinhas |
| Sub | Novo sub! (com os meses) | estrelinhas em volta do nome | Caixinha de música |
| Sub de presente | Sub de presente! | conchas e pérolas caindo | Pozinho mágico |
| Raid | Raid! (com quantas pessoas) | um cardume de peixinhos atravessando a tela | Fanfarra do mar |
| Bits | Bits! | cristais caindo | Cristais |
| Doação | Doação! (em reais) | pérolas e moedinhas pulando da água | Moedinhas |

Os sons ficam em `sons.js` e são feitos na hora, sem arquivo: Bolhinhas, Splash da Nami (o som antigo), Caixinha de música, Harpa, Pozinho mágico, Cristais, Moedinhas, Sininhos, Fanfarra do mar e Onda do mar. No gerador cada tipo escolhe o seu (com **▶ Ouvir**), pode ficar sem som, ou tocar um arquivo próprio pelo link direto de um .mp3, .ogg ou .wav.

Depois do som, uma voz em português lê o alerta e a mensagem: "joãozinho fez uma raid com 42 pessoas!", "conchinha doou 10 reais e 50 centavos!" e por aí vai. Links, emojis e os "Cheer100" dos bits são pulados, risada comprida encurta, e o alerta espera a voz terminar (até 40 s a mais). A voz é a do Google Tradutor (a da StreamElements agora pede login): ela vem em .mp3, por isso toca no OBS, e o `alertas.html` não manda de onde veio (`referrer`), senão o Google recusa. Se o Google não responder, tenta a voz do navegador.

Os alertas vêm do overlay da StreamElements por um **widget customizado** que só repassa os eventos pro `alertas.html` do site. O visual, o som e os textos ficam no site: mudou no gerador (aba **Alertas**) e clicou em **Salvar na live**, os alertas mudam sozinhos (se tiver um alerta tocando, a atualização espera ele acabar). Vários alertas seguidos entram numa fila.

Pra colocar (uma vez só): StreamElements → **Overlays** → o overlay que já está no OBS → **+ → Static / Custom → Custom widget** → **Settings → Open editor** e cole o HTML, o CSS e o JS que o gerador mostra. Deixe o widget com 1920 × 1080 na posição 0, 0 e desligue no AlertBox os tipos que estes alertas fazem.

Pra testar: o **Emulate** da StreamElements, ou os botões do gerador (os da prévia tocam só ali; os de **Testar no OBS** mandam pros alertas abertos e pedem a senha). `alertas.html?demo` toca todos em sequência e `alertas.html?teste=raid` toca um.

Opções (no gerador, ou no link): `tema`, `letra` (do nome), `som=0`, `volume=0.6`, `duracao=7.5`, `mensagens=0`, os títulos `tseguir`, `tsub`, `tpresente`, `traid`, `tbits`, `tdoacao`, e os sons `somseguir`, `somsub`, `sompresente`, `somraid`, `sombits`, `somdoacao` (`bolhas`, `splash`, `caixinha`, `harpa`, `magia`, `cristal`, `moedas`, `sino`, `fanfarra`, `onda`, `nenhum` ou um link https), e a voz: `voz=0`, `vozmsg=0` (não lê a mensagem), `vozvolume=0.9`.

## Painéis do Sobre

`paineis.html` faz as imagens dos painéis do Sobre da Twitch com a mesma borda de ondas da câmera (estrela-do-mar, concha e pérolas nos cantos) em volta de uma janelinha de mar rosinha, e o título em letras flutuando bem legíveis: miolo rosa forte, contorno branco grosso e uma beiradinha escura por fora. O enfeite pode ser a Nami nadando na onda de cima, peixinhos, pérolas ou bolhas. Saem em **640 × 220** (o dobro do que a Twitch mostra), com fundo transparente fora da borda. Dá pra mudar o texto, o enfeite, as cores e a letra, adicionar painéis e baixar; tirou um sem querer, tem **Desfazer**, e **Voltar os painéis padrão** traz os quatro de volta. As quatro primeiras (Sobre mim, Regras, Doações, Setup) já estão prontas em `paineis/`.

Na Twitch: **Sobre → Editar painéis → Adicionar uma imagem**. O texto de baixo vai na descrição do painel.

## Personalizar

As cores ficam em `TEMAS`, no começo de `ondas.js` (e as da Nami em `COR`, logo abaixo). Os textos padrão ficam no `Ondas.parametros({...})` de cada página. Edite, faça o push e o deploy. No OBS, botão direito na fonte → **Atualizar**.

## Publicar

**Coolify**

1. **Projects → New Resource → Public Repository** (ou **GitHub App**, pra fazer deploy a cada push) e cole a URL deste repositório.
2. **Build Pack**: `Dockerfile` (Node na porta **80**). Em **Health Checks**, ligue o healthcheck no caminho `/`.
3. **Storages**: um volume em `/dados` (é onde fica o `config.json` com as opções da live; sem ele, cada deploy apaga o que foi salvo).
4. **Environment Variables**: `SENHA_EDICAO` com a senha do **Salvar na live**.
5. Defina o domínio e clique em **Deploy**.

Os scripts vão com `?v=` e um código do conteúdo no link (o Dockerfile troca o `?v=dev` no build), então depois de cada deploy o navegador, o Cloudflare e o OBS pegam a versão nova.

**Local**: `SENHA_EDICAO=teste DADOS=_dados node servidor.js 5550` na pasta e abra `http://localhost:5550`. Só pra ver as páginas, sem salvar, `python -m http.server 5550` também serve (aí o gerador avisa que está sem servidor).

---

Projeto de fã. League of Legends, Nami e as artes das skins são da Riot Games; este projeto não tem ligação com a Riot.
