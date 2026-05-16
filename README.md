# Agente Office UI - OpenClaw

Dashboard em Next.js para visualizar agentes OpenClaw em um escritorio pixelado, com salas, avatares, status, comandos por agente e modo demo.

## Roadmap

O plano de evolucao do cockpit esta em [docs/ROADMAP.md](docs/ROADMAP.md).

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

O modo demo e o padrao quando `NEXT_PUBLIC_OPENCLAW_URL` nao esta configurado. Use agentes simulados para validar a UI sem depender do WebSocket do OpenClaw:

    NEXT_PUBLIC_MOCK_MODE=true npm run dev:lan

## Conectar no OpenClaw real

Para conectar no OpenClaw real, informe explicitamente o WebSocket publico do gateway. Nao exponha token no codigo.

Exemplo:

- UI: http://192.168.100.104:3000
- WebSocket configurado: ws://HOST_PUBLICO_DO_GATEWAY:18789

    NEXT_PUBLIC_OPENCLAW_URL=ws://HOST_PUBLICO_DO_GATEWAY:18789 npm run dev:lan

Se o gateway exigir token:

    NEXT_PUBLIC_OPENCLAW_TOKEN=seu_token NEXT_PUBLIC_OPENCLAW_URL=ws://HOST_PUBLICO_DO_GATEWAY:18789 npm run dev:lan

Observacao: no ambiente local da Lilith, o gateway esta em loopback. Nesse caso, browsers acessando pela rede nao conseguem abrir `ws://192.168.100.104:18789`; rode em modo demo ou configure um endpoint publico/proxy seguro para o gateway.

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
