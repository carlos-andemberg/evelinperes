# Overlays da Nami da evelin_peres 🌊💗

Overlays pro OBS da [evelin_peres](https://www.twitch.tv/evelin_peres), no tema da Nami do League of Legends: branco com rosa clarinho, ondinhas em volta da câmera e a Nami nadando nelas. É HTML/CSS/JS puro, sem build e sem dependências, feito pra fonte **Navegador** do OBS.

**No ar:** [evelinperes.carlosandemberg.com.br](https://evelinperes.carlosandemberg.com.br). Lá você escolhe as opções, vê a prévia e copia o link pro OBS.

| Arquivo | O que é | Tamanho no OBS |
|---|---|---|
| `borda.html` | Borda de ondas em volta da webcam, com a Nami nadando e o nome flutuando em cima. Fundo transparente | **1920 × 1080** (o tamanho da tela do OBS) |
| `fila.html` | Tela de "estou na fila": skin da Nami trocando, tempo na fila, recadinhos, habilidades e espaço pra câmera | **1920 × 1080** (ou em pé, 1080 × 1920) |
| `index.html` | Gerador de link: escolhe cores, skins, cromas e textos, mostra a prévia e copia o link | — |
| `ondas.js` | O motor: as três camadas de onda (em volta da câmera ou da tela), espuma, bolhas, brilhos, enfeites, o nome com os peixinhos e a Nami desenhada no canvas | — |
| `dados.js`, `nami.json` | Skins, cromas e habilidades da Nami (a lista se atualiza sozinha; `nami.json` é a cópia de reserva) | — |

## A borda da câmera

A borda abraça a webcam: três camadas de onda (rosa por fora, rosinha no meio e branca colada na câmera) correm em volta dela, com espuma nas cristas, brilhinhos, bolhas e um contorno limpinho que arredonda os cantos da câmera. Nos cantos ficam a estrela-do-mar, a concha e as pérolas. O resto da tela fica livre.

A Nami é desenhada no código (nada de imagem, fica nítida em qualquer tamanho): cabelo rosa balançando, orelhas de barbatana, cauda verde-água com escamas, cajado com o orbe de água brilhando, piscadinha. Ela nada em volta da câmera em cima das ondas, de pé na beirada de cima, soltando bolhinhas, e de vez em quando **pula** pra fora da água (às vezes dando um giro) e cai com um respingo.

### O nome

Em cima da câmera flutua **evelin_peres**, só as letras, sem fundo: contorno branco com brilho rosa, sombrinha e degradê rosa. Na letra cursiva a palavra inteira flutua; nas outras cada letrinha balança no seu tempo. Em volta, peixinhos (rosa, verde-água, laranja e lilás) dão a volta no nome e bolhinhas sobem da água. O nome fica acima da faixa em que a Nami nada, e ela sempre passa na frente dele.

Letras: **Praia** (Pacifico, cursiva, a padrão), **Fofinha** (Cherry Bomb One), **Bolinha** (Sniglet) e **Redondinha** (Fredoka).

### A câmera

Já vem no lugar e no formato da live, que é quase quadrada e fica no canto de baixo à direita: **x 1591, y 747, 329 × 333** numa tela 1920 × 1080. A parte da borda que passa da beirada da tela some junto, como se continuasse pra fora.

Se mudar a câmera no OBS, ajuste no gerador. Lá tem uma tela pequena: arraste a câmera pra mudar de lugar e puxe as bolinhas dos cantos pra mudar o tamanho. Também tem os formatos prontos (igual à live, 16:9, 4:3, quadradinha) e os campos de X, Y, largura e altura. No OBS esses números ficam em: botão direito na câmera → **Transformar → Editar transformação** (Posição e Tamanho). Se a câmera fica em outro lugar em outra cena, é só fazer outro link pra ela.

### Colocar no OBS

1. **Fontes → + → Navegador**
2. **URL**: `https://evelinperes.carlosandemberg.com.br/borda.html`
3. **Largura 1920, Altura 1080** (o tamanho da tela do OBS, em **Configurações → Vídeo → Resolução base**)
4. Deixe a borda **acima da câmera** na lista de fontes. Se a câmera fica no mesmo lugar nas outras cenas, dá pra usar a mesma fonte nelas (botão direito → **Copiar** e **Colar (referência)**).

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
| `fundo=0` | Força o fundo transparente mesmo fora do OBS |

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
| `camera=1` | Liga o espaço pra câmera |
| `camx=1240&camy=605` | Lugar do espaço da câmera, em pixels da tela do OBS (sem isso ele fica no cantinho da coluna do título) |
| `camlargura=576&camaltura=324` | Tamanho do espaço da câmera (o gerador tem o formato igual à câmera do jogo, 4:3 e quadradinha) |
| `resolucao=1920x1080` | Tamanho da tela do OBS em que os números da câmera foram medidos |
| `nomeskin=1` | Mostra o nome, a raridade e o croma por cima da arte (o padrão é só a arte) |

Numa fonte em pé (ex.: 1080 × 1920) a tela se arruma sozinha: título em cima, depois tempo, câmera e a arte da skin.

## Personalizar

As cores ficam em `TEMAS`, no começo de `ondas.js` (e as da Nami em `COR`, logo abaixo). Os textos padrão ficam no `Ondas.parametros({...})` de cada página. Edite, faça o push e o deploy. No OBS, botão direito na fonte → **Atualizar**.

## Publicar

São arquivos estáticos, então qualquer hospedagem estática serve.

**Coolify**

1. **Projects → New Resource → Public Repository** (ou **GitHub App**, pra fazer deploy a cada push) e cole a URL deste repositório.
2. **Build Pack**: `Dockerfile` (nginx na porta **80**). Em **Health Checks**, ligue o healthcheck no caminho `/`.
3. Defina o domínio e clique em **Deploy**.

**Local**: `python -m http.server 5550` na pasta e abra `http://localhost:5550`.

---

Projeto de fã. League of Legends, Nami e as artes das skins são da Riot Games; este projeto não tem ligação com a Riot.
