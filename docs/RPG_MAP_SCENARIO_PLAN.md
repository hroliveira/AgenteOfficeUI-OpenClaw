# Plano - Cenario RPG para Agente Office UI

## Objetivo

Evoluir o cenario atual de escritorio em cards para uma experiencia de mapa estilo RPG:

- visao geral do escritorio como mapa top-down;
- salas clicaveis;
- ao clicar em uma sala, ela expande ou entra em modo foco;
- agentes deixam de ser imagens flutuantes e passam a ser personagens/sprites no mapa;
- o cockpit continua operacional, sem virar apenas decoracao.

## Pesquisa resumida

Referencias tecnicas levantadas:

- Phaser Tilemap suporta mapas vindos de Tiled JSON, CSV ou arrays 2D, com orientacao orthogonal, isometric, hexagonal e staggered.
- Tiled Map Editor e um editor open source para mapas em camadas, object layers, tilesets e exportacao para JSON.
- Phaser oferece camera, cenas, input, tilemaps, sprites e animacoes em um pacote de game framework.
- Pixi.js e mais renderer do que game framework; bom para renderizacao 2D, mas exigiria mais infraestrutura propria.
- React-only/DOM grid e mais simples para prototipo, mas perde camera, tilemap real, colisao e animacao robusta.

Recomendacao: comecar com um prototipo DOM/CSS orientado a dados e migrar para Phaser/Tiled somente quando o comportamento do mapa estiver aprovado. Isso reduz risco e evita instalar uma engine antes de validar a UX.

## Decisao proposta

Implementar em duas camadas:

1. RPG Map Lite: React + CSS grid + assets pixel art.
2. RPG Map Engine: Phaser + Tiled JSON, se o modo mapa virar experiencia principal.

O primeiro corte deve preservar o app atual e permitir alternar entre:

- Office Grid atual;
- RPG Map experimental.

## Direcao visual aprovada

Atualizacao em 2026-05-18: Toshyro trouxe uma referencia visual de mapa top-down estilo board game/miniature room, com composicao ortografica, paredes metalicas, piso modular, moveis detalhados e luz fria/quente.

A direcao correta para os cenarios e:

- fundo top-down rico, como mapa de tabuleiro/cenario tatico;
- salas e corredores desenhados no proprio asset visual;
- agentes, labels e interacoes como camada HTML por cima;
- zonas clicaveis transparentes para nao esconder o cenario;
- manter legibilidade operacional acima de decoracao.

Primeiro asset integrado:

- public/assets/maps/agent-office-rpg-map-bg.png

## Escopo do MVP - RPG Map Lite

### Experiencia

- Adicionar um toggle de visualizacao: Grid / Map.
- Mapa top-down com salas conectadas por corredores.
- Cada sala e um retangulo/isometrico simples com nome, icone, status e quantidade de agentes.
- Clique em sala expande a sala em painel/modal/focus mode.
- Clique em agente reaproveita o AgentInspector.

### Visual

- Estilo: RPG pixel art top-down, nao 3D.
- Paleta ainda dark/cyber fantasy, mas com mais chao, paredes e objetos.
- Salas recomendadas:
  - Command Hall / Lilith;
  - Dev Forge / Tomas;
  - QA Watchtower / Cecilia;
  - Market Studio / Maya;
  - Treasury / Daikokuten;
  - Platform Ops / Ariel;
  - Shared Lounge / agentes sem sala especifica.

### Agentes como personagens

Primeiro corte:

- substituir avatar circular flutuante por AgentSprite;
- sprite simples composto por imagem pequena do avatar ou sprite gerado, sombra, nome curto e indicador de status.

Segundo corte:

- gerar sprites pixel art full-body para cada agente;
- usar spritesheet com estados idle, walking, working e error.

## Arquitetura proposta

### Novos arquivos

- src/components/map/RpgMap.tsx
- src/components/map/RpgRoom.tsx
- src/components/map/AgentSprite.tsx
- src/components/map/RoomFocus.tsx
- src/config/mapLayout.ts
- src/types/map.ts

### Dados

mapLayout.ts deve ser declarativo:

```ts
export const MAP_ROOMS = [
  {
    id: 'command',
    roomId: 'jarvis',
    label: 'Command Hall',
    x: 42,
    y: 12,
    w: 24,
    h: 18,
    theme: 'main'
  }
];
```

O mapeamento agente -> sala deve continuar usando agent.room ou uma funcao derivada por agent.id.

## Fases de implementacao

### Fase 1 - Planejamento visual e dados

Entregaveis:

- documento deste plano;
- layout inicial em mapLayout.ts;
- decisao final do modo visual: orthogonal top-down ou isometrico falso.

Validacao:

- Toshyro revisa o plano e aprova direcao visual.

### Fase 2 - RPG Map Lite

Entregaveis:

- toggle Grid / Map;
- RpgMap renderizando salas e corredores com CSS;
- agentes renderizados como AgentSprite;
- clique em agente abre AgentInspector;
- clique em sala abre RoomFocus.

Validacao:

- npm run lint;
- npm run build;
- teste manual em desktop e mobile;
- mapa nao quebra a leitura dos paineis operacionais.

### Fase 3 - Room Focus

Entregaveis:

- sala expandida com decoracao maior;
- lista dos agentes da sala;
- resumo de activity/tasks/schedule filtrado por agente da sala;
- botao para voltar ao mapa geral.

Validacao:

- entrar/sair de uma sala sem perder estado;
- nenhum texto sobrepoe agentes ou objetos.

### Fase 4 - Sprites RPG reais

Entregaveis:

- sprites full-body por agente;
- padrao visual consistente;
- estados visuais por status;
- fallback para avatar circular se sprite nao carregar.

Validacao:

- imagens leves;
- sem texto/watermark;
- legiveis em 32px/48px/64px.

### Fase 5 - Engine opcional com Phaser/Tiled

So executar se o mapa virar parte central do produto.

Entregaveis:

- instalar Phaser;
- criar mapa no Tiled;
- exportar JSON;
- renderizar tilemap em canvas;
- sincronizar selecao de sala/agente com React.

Validacao:

- performance estavel;
- camera/zoom funcionando;
- UI React continua acessivel;
- build e deploy sem conflito com Next.

## Riscos

- Overengineering: Phaser cedo demais pode atrasar o cockpit.
- Asset burden: sprites full-body exigem consistencia visual e manutencao.
- Legibilidade: mapa bonito pode reduzir clareza operacional.
- Mobile: mapa expansivel precisa funcionar em tela pequena.
- Performance: animacao demais pode pesar a UI.

## Recomendacao de ordem

1. Aprovar este plano.
2. Fazer Fase 2 como prototipo DOM/CSS.
3. Validar se a experiencia realmente ajuda a entender os agentes.
4. So depois investir em sprites full-body e/ou Phaser/Tiled.

## Criterios de aceite do primeiro corte

- Existe toggle Grid / Map.
- Mapa abre sem quebrar a UI atual.
- Cada agente aparece dentro de uma sala.
- Sala clicavel entra em modo foco.
- Agente clicavel abre o inspector atual.
- Sem nova permissao externa, sem comandos para agentes e sem alteracao de config real.
- npm run lint e npm run build passam.
