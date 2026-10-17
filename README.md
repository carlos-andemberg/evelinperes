# Overlays da Nami da evelin_peres 🌊💗

Overlays pro OBS da [evelin_peres](https://www.twitch.tv/evelin_peres), no tema da Nami do League of Legends: branco com rosa clarinho, ondinhas nas bordas e a Nami nadando nelas. É HTML/CSS/JS puro, sem build e sem dependências, feito pra fonte **Navegador** do OBS.

**No ar:** [evelinperes.carlosandemberg.com.br](https://evelinperes.carlosandemberg.com.br). Lá você escolhe as opções, vê a prévia e copia o link pro OBS.

| Arquivo | O que é | Tamanho no OBS |
|---|---|---|
| `borda.html` | Borda de ondas com a Nami nadando. Fundo transparente, vai por cima de qualquer cena | **1920 × 1080** (ou o tamanho da sua tela) |
| `fila.html` | Tela de "estou na fila": skin da Nami trocando, tempo na fila, recadinhos, habilidades e espaço pra câmera | **1920 × 1080** (ou em pé, 1080 × 1920) |
| `index.html` | Gerador de link: escolhe cores, skins, cromas e textos, mostra a prévia e copia o link | — |
| `ondas.js` | O motor: as três camadas de onda, espuma, bolhas, brilhos, enfeites e a Nami desenhada no canvas | — |
| `dados.js`, `nami.json` | Skins, cromas e habilidades da Nami (a lista se atualiza sozinha; `nami.json` é a cópia de reserva) | — |

## A borda

Três camadas de onda correm em volta da tela: rosa atrás, rosinha no meio e branca na frente, com espuma nas cristas, brilhinhos e bolhas subindo. Nos cantos ficam uma estrela-do-mar, uma concha e pérolas. As ondas sempre fecham a volta certinho, então não tem emenda em nenhuma resolução: a borda mede a tela e se ajusta sozinha (720p, 1080p, 1440p, tela em pé...).

A Nami é desenhada no código (nada de imagem, fica nítida em qualquer tamanho): cabelo rosa balançando, orelhas de barbatana, cauda verde-água com escamas, cajado com o orbe de água brilhando, piscadinha. Ela nada em volta da tela toda por cima da onda do meio, com a barriga e a ponta do rabo dentro da espuma, soltando bolhinhas. De vez em quando ela **pula** pra fora da água (às vezes dando um giro) e cai com um respingo.

### O nome em cima da câmera

Em cima da câmera fica uma plaquinha branca e rosa com **evelin_peres**, com fio de pérolas, brilhinhos piscando, peixinhos (rosa, verde-água, laranja e lilás) dando a volta nela e bolhinhas subindo. Os peixinhos que passam por cima vão por trás da plaquinha e os de baixo passam na frente.

A câmera já vem no lugar e no formato da live, que é quase quadrada e fica no canto de baixo à direita: **x 1591, y 747, 329 × 333** numa tela 1920 × 1080. Se mudar a câmera no OBS, ajuste no gerador. Lá tem uma tela pequena: arraste a câmera pra mudar de lugar e puxe as bolinhas dos cantos pra mudar o tamanho. Também tem os formatos prontos (igual à live, 16:9, 4:3, quadradinha) e os campos de X, Y, largura e altura. No OBS esses números ficam em: botão direito na câmera → **Transformar → Editar transformação** (Posição e Tamanho).

A plaquinha fica centralizada em cima da câmera e nunca entra na onda da borda.

### Colocar no OBS

1. **Fontes → + → Navegador**
2. **URL**: `https://evelinperes.carlosandemberg.com.br/borda.html`
3. **Largura 1920, Altura 1080** (o tamanho da tela do OBS, em **Configurações → Vídeo → Resolução base**)
4. Deixe a borda **no topo** da lista de fontes. Dá pra usar a mesma fonte em todas as cenas (botão direito → **Copiar** e **Colar (referência)** nas outras).

Abrindo o link num navegador normal aparece a splash da Nami de fundo, só de prévia, e clicar faz a Nami pular. No OBS o fundo fica transparente.

### Opções da borda

Junte com `&`, ex.: `borda.html?espessura=1.4&nado=embaixo`. O gerador monta isso pra você.

| Opção | O que faz |
|---|---|
| `tema=rosa` | Cores: `rosa` (branco e rosa clarinho, o padrão), `lilas` ou `agua` |
| `espessura=1` | Grossura da borda: `0.5` fininha, `2.5` bem grossa |
| `velocidade=1` | Velocidade das ondas e da Nami |
| `nami=0` | Sem a Nami |
| `tamanho=1` | Tamanho da Nami (`0.6` a `2`) |
| `nado=embaixo` | A Nami nada só embaixo, indo e voltando (o padrão, `volta`, é em volta da tela toda) |
| `pulo=25` | Segundos entre um pulo e outro (`pulo=0` desliga) |
| `bolhas=0` | Sem bolhas |
| `brilhos=0` | Sem brilhinhos |
| `enfeites=0` | Sem estrela, concha e pérolas nos cantos |
| `nome=evelin_peres` | Texto da plaquinha em cima da câmera (`nome=` vazio esconde) |
| `nometam=1` | Tamanho da plaquinha (`0.6` a `1.8`) |
| `peixes=3` | Quantos peixinhos dão a volta na plaquinha (`peixes=0` tira) |
| `camx=1591&camy=747` | Canto de cima-esquerdo da câmera, em pixels da tela do OBS |
| `camlargura=329&camaltura=333` | Tamanho da câmera |
| `resolucao=1920x1080` | Tamanho da tela do OBS em que os números da câmera foram medidos |
| `fundo=0` | Força o fundo transparente mesmo fora do OBS |

## A tela de fila

Pra cena de quando ela está esperando a partida. A borda e a Nami nadando são as mesmas, com o fundo de mar rosinha (raios de luz e bolhas subindo).

- **Skin da Nami**: a arte das skins escolhidas vai trocando, com zoom lento, o nome, a raridade (Épica, Lendária, Mítica, Legado) e uma barrinha mostrando quando vem a próxima. Embaixo ficam as bolinhas de todas as skins escolhidas.
- **Croma**: em cada skin dá pra escolher um croma, que aparece num selinho no canto da arte, com o nome e a cor.
- **Tempo na fila**: uma bolha que vai enchendo de água enquanto o tempo passa.
- **Recadinhos**: frases que vão trocando embaixo do tempo (ex.: comandos do chat).
- **Habilidades da Nami**: passiva, Q, W, E e R, com o nome de cada uma aparecendo em sequência.
- **Espaço pra câmera** (opcional): um buraco transparente com moldura. A câmera vai **embaixo** desta fonte no OBS. O gerador mostra a posição e o tamanho exatos.

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
