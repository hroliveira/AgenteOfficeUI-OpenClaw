# Agente Office UI - OpenClaw Pixel World

Dashboard em Next.js para visualizar agentes OpenClaw em um escritorio pixelado, com salas, avatares, status, comandos por agente e modo demo.

## Rodar local

    npm install
    npm run dev

Abra: http://localhost:3000

## Rodar na rede local

    npm run dev:lan

Depois acesse pelo IP da maquina onde o projeto esta rodando:

    http://SEU_IP_LOCAL:3000

Exemplo:

    http://192.168.100.104:3000

## Modo demo

Use para ver o pixel world com agentes simulados se o WebSocket do OpenClaw ainda nao estiver disponivel:

    NEXT_PUBLIC_MOCK_MODE=true npm run dev:lan

## Conectar no OpenClaw real

Por padrao, quando voce acessa pela rede, o frontend tenta conectar o WebSocket no mesmo host da pagina, porta 18789.

Exemplo:

- UI: http://192.168.100.104:3000
- WebSocket esperado: ws://192.168.100.104:18789

Se precisar apontar para outro endereco:

    NEXT_PUBLIC_OPENCLAW_URL=ws://192.168.100.104:18789 npm run dev:lan

Se o gateway exigir token:

    NEXT_PUBLIC_OPENCLAW_TOKEN=seu_token NEXT_PUBLIC_OPENCLAW_URL=ws://192.168.100.104:18789 npm run dev:lan

## Scripts

- npm run dev: servidor de desenvolvimento local.
- npm run dev:lan: servidor de desenvolvimento exposto em 0.0.0.0.
- npm run build: build de producao.
- npm run start: servidor de producao local depois do build.
- npm run start:lan: servidor de producao exposto em 0.0.0.0.
- npm run lint: validacao ESLint.

## Validacao

    npm run lint
    npm run build

