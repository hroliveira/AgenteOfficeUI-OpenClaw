# Roadmap - Agente Office UI

Este roadmap organiza a evolucao do Agente Office UI em etapas pequenas para controlar custo de tokens, reduzir risco e manter o app usavel a cada entrega.

## Regra de execucao

- Cada etapa deve ser implementada, validada com `npm run lint` e `npm run build`, commitada e enviada para o GitHub.
- Antes de continuar em dias comuns, Lilith deve perguntar ao Toshyro se pode seguir.
- Excecao autorizada: em 2026-05-20, Lilith pode executar a etapa 2 sem perguntar antes e deve avisar depois para teste.
- Alteracoes que mexem em config real do OpenClaw, agentes, bindings, tokens ou restart de gateway precisam de confirmacao explicita, exceto quando ja estiverem descritas na etapa autorizada.

## Etapas

### 1. Backlog e controle de execucao

Status: feito em 2026-05-16.

Objetivo: criar a lista priorizada de evolucao do produto e registrar o protocolo de execucao para economizar tokens.

Entregaveis:

- Documento `docs/ROADMAP.md`.
- Link no `README.md`.
- Lembretes no OpenClaw para continuidade.

Critérios de aceite:

- Roadmap versionado no repo.
- Proxima etapa claramente definida.
- Lembrete diario criado.
- Tarefa autorizada de 2026-05-20 agendada.

### 2. Painel de agente com dados reais

Status: feito em 2026-05-17.

Objetivo: transformar o clique em um agente em um painel util, mostrando dados reais carregados pelo backend local.

Entregaveis:

- Expandir `/api/agents` com campos uteis e seguros: id, nome, papel, workspace, modelo principal, status de heartbeat e skills.
- Atualizar o inspector para mostrar esses dados.
- Remover textos genericos que deem impressao de demo quando ha agentes reais.
- Manter fallback demo quando `/api/agents` falhar.

Critérios de aceite:

- Ao abrir `http://192.168.100.104:3034`, os agentes reais aparecem.
- Ao clicar em Lilith, Tomas, Cecilia, Maya, Daikokuten ou Ariel, o painel mostra dados especificos daquele agente.
- Nenhum token, secret ou caminho sensivel desnecessario aparece no browser.
- `npm run lint` e `npm run build` passam.

### 3. Agent Activity read-only

Status: feito em 2026-05-17.

Objetivo: mostrar o que cada agente esta fazendo ou fez recentemente sem permitir comandos pela UI.

Entregaveis:

- Rota local `/api/agent-activity` agregando tasks, sessions e schedule.
- Painel `AGENT ACTIVITY` recolhido por padrao.
- Status derivado por agente: running, recent, idle ou error.
- Sanitizacao de summaries para nao expor tokens, session keys, URLs ou payloads completos.

Critérios de aceite:

- Um card por agente principal: Lilith, Tomas, Cecilia, Maya, Daikokuten e Ariel.
- Ultima atividade mostra fonte, horario, resumo curto e status.
- `npm run lint` e `npm run build` passam.

### 4. Chat local com agente escolhido

Status: pendente.

Objetivo: permitir enviar uma mensagem para um agente a partir da UI.

Entregaveis:

- Rota backend para enviar mensagem via mecanismo seguro do OpenClaw.
- Campo de chat no inspector.
- Historico local da conversa por agente.
- Estados de envio, sucesso e erro.

Critérios de aceite:

- Usuario escolhe um agente, digita uma mensagem e recebe resposta ou erro claro.
- O browser nao recebe token do gateway.
- Erros de permissao ou agente indisponivel aparecem de forma legivel.

### 5. Tasks e execucoes

Status: corte read-only feito em 2026-05-17; criacao de task ainda pendente.

Objetivo: criar uma aba operacional para acompanhar tarefas e execucoes recentes.

Entregaveis:

- Aba `Tasks`.
- Lista de tarefas ativas, recentes e finalizadas quando a API local permitir.
- Botao para criar uma tarefa simples para um agente.
- Estados: queued, running, completed, failed/canceled.

Critérios de aceite:

- Usuario consegue ver o que esta rodando ou terminou.
- Tarefas longas nao travam a UI.
- Falhas aparecem com mensagem curta e acionavel.

### 6. Crons e lembretes

Status: corte read-only feito em 2026-05-17; criacao de lembrete ainda pendente.

Objetivo: permitir visualizar e criar lembretes/tarefas recorrentes de forma segura.

Entregaveis:

- Aba `Schedule`.
- Lista de crons existentes.
- Formulario simples para lembrete one-shot.
- Guardrails para evitar spam e agendamentos duplicados.

Critérios de aceite:

- Usuario consegue criar um lembrete simples.
- Agendamentos perigosos ou recorrentes exigem confirmacao.

### 7. CRUD seguro de agentes

Status: pendente.

Objetivo: criar, editar, desativar e eventualmente deletar agentes com revisao antes de aplicar.

Entregaveis:

- Wizard de criacao de agente.
- Edicao controlada de nome, identidade, modelo, workspace, skills e heartbeat.
- Preview de diff da configuracao antes de salvar.
- Botao de desativar antes de permitir delete real.

Critérios de aceite:

- Nenhuma alteracao destrutiva acontece sem confirmacao explicita.
- O app mostra o diff antes de aplicar mudancas.
- Config invalida nao e salva.

### 8. Observabilidade

Status: feito em 2026-05-17.

Objetivo: mostrar saude operacional sem transformar a UI em painel tecnico demais.

Entregaveis:

- Status do gateway.
- Status dos canais Telegram/WebChat.
- Erros recentes.
- Uso de tokens/custo quando disponivel.

Critérios de aceite:

- Usuario entende rapidamente se o sistema esta saudavel.
- Nenhum segredo aparece em tela.

## Proxima etapa autorizada

Etapa 4: Chat local com agente escolhido. Requer confirmacao explicita antes de implementar, porque envolve envio de mensagens para agentes e guardrails de permissao.
