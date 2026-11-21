# Gândara 3D (beta)

Um pequeno jogo 3D low-poly, para o browser, passado na zona da Gândara e de Marrazes, em Leiria.
Anda-se a pé, de carro ou de mota por ruas reais, com o relevo verdadeiro do terreno.

**Jogar online:** https://silvaeusebio.github.io/gandara-3d/

Esta é uma versão beta: há coisas por acabar e pode ter erros.

## O que tem

- Cerca de 3 × 4,2 km de mapa, com as ruas e os edifícios do OpenStreetMap e as altitudes reais.
- Viadutos e passagens inferiores: as pontes ficam por cima, com rampas, e passa-se por baixo.
- O Castelo de Leiria, no extremo sul do mapa, com as muralhas, as torres e os Paços Novos; entra-se a pé pelos caminhos.
- A Rua dos Lavradios modelada à mão, casa a casa, a partir de imagens de satélite e de rua.
- O prédio do Tiago, com o apartamento por dentro feito a partir de um esboço (`esboco/Casa Tiago.png`).
- Um carro e uma mota, até 150 km/h.
- Uma missão contra o relógio: vais a casa do Tiago, falas com ele, escolhes um de três níveis de dificuldade e leva-lo a tua casa.
- Passeios, passadeiras, semáforos, paragens de autocarro, candeeiros e placas com o nome das ruas.

## Teclas

| Tecla | O que faz |
|---|---|
| W / S | andar · acelerar / travar |
| A / D | virar |
| Shift | correr |
| Espaço | saltar · travão de mão |
| Arrastar o rato | olhar à volta |
| Roda do rato | aproximar / afastar |
| Enter | entrar / sair (carro, mota, casa do Tiago) · falar com o Tiago |
| H | voltar a casa (com o carro e a mota) |
| 1 · 2 · 3 | escolher o nível (fácil, médio, difícil), quando o Tiago pergunta |
| 0 | cancelar a missão |
| T | ir para o prédio do Tiago (atalho de teste, para remover) |

## No telemóvel ou tablet

Abre o endereço do jogo no browser do telemóvel e roda-o para ficar deitado.

| No ecrã | O que faz |
|---|---|
| Manípulo à esquerda | a pé: andar e virar · a conduzir: só virar |
| Arrastar no ecrã | olhar à volta |
| Afastar ou juntar dois dedos | aproximar / afastar |
| Botão ● | entrar / sair (carro, mota, casa do Tiago) · falar com o Tiago |
| Saltar · Correr | a pé: saltar, e correr enquanto o botão estiver carregado |
| Acelerar · Travar · Sair | aparecem quando conduzes: acelerar, travar (e marcha-atrás) e sair do carro ou da mota |
| Botão ⌂ | voltar a casa |
| Fácil · Médio · Difícil | aparecem ao falar com o Tiago, para escolher o nível; Cancelar pára a missão |
| Botão T | ir para o prédio do Tiago (atalho de teste, para remover) |

## Correr no computador

O jogo é só HTML e JavaScript, sem instalação. Precisa de internet para ir buscar a biblioteca three.js.

- No Windows, com Python instalado: abrir `play.bat`.
- Em alternativa, servir a pasta com qualquer servidor web local e abrir `index.html`.

## Ficheiros

| Ficheiro | Para que serve |
|---|---|
| `index.html` | o jogo (motor, carro, mota, missão, ecrã) |
| `lavradios.js` | a Rua dos Lavradios, casa a casa |
| `tiago.js` | o prédio do Tiago e o apartamento |
| `castelo.js` | o Castelo de Leiria (muralhas, torres, paço e igreja, a partir do OpenStreetMap) |
| `map-data.js` | o mapa já processado (gerado, não editar à mão) |
| `build-map.mjs` | gera `map-data.js` a partir dos dados de origem: `node build-map.mjs` |
| `osm-area.json`, `osm-nodes.json` | dados de origem do OpenStreetMap |
| `height-raw.json` | altitudes de origem |
| `esboco/Casa Tiago.png` | esboço da planta do apartamento |

## Créditos e licenças dos dados

- Ruas, edifícios, passadeiras, semáforos e paragens: © contribuidores do [OpenStreetMap](https://www.openstreetmap.org/copyright), sob a licença ODbL. Os ficheiros `osm-area.json`, `osm-nodes.json` e `map-data.js` derivam desses dados e ficam sob a mesma licença.
- Altitudes: EU-DEM v1.1 (Copernicus, União Europeia), obtidas através da [OpenTopoData](https://www.opentopodata.org/).
- Gráficos 3D: [three.js](https://threejs.org/) (licença MIT), carregado a partir de unpkg.
- As casas feitas à mão foram modeladas com base em imagens do Google Maps e Street View, usadas só como referência visual.
