import type { MapRoom, RoomId } from '@/types/agent';

export const MAP_ROOMS: MapRoom[] = [
  {
    id: 'jarvis',
    label: 'Command Hall',
    shortLabel: 'Command',
    description: 'Lilith coordena prioridade, contexto e operacao.',
    theme: 'command',
    x: 38,
    y: 7,
    w: 24,
    h: 18,
  },
  {
    id: 'claw',
    label: 'Dev Forge',
    shortLabel: 'Dev',
    description: 'Tomás trabalha arquitetura, codigo e manutencao tecnica.',
    theme: 'dev',
    x: 8,
    y: 34,
    w: 22,
    h: 19,
  },
  {
    id: 'sentinel',
    label: 'QA Watchtower',
    shortLabel: 'QA',
    description: 'Cecilia valida risco, regressao e decisao de release.',
    theme: 'qa',
    x: 70,
    y: 34,
    w: 22,
    h: 19,
  },
  {
    id: 'pixel',
    label: 'Market Studio',
    shortLabel: 'Market',
    description: 'Maya transforma estrategia em conteudo e copy.',
    theme: 'market',
    x: 8,
    y: 68,
    w: 22,
    h: 18,
  },
  {
    id: 'atlas',
    label: 'Treasury',
    shortLabel: 'Finance',
    description: 'Daikokuten organiza contas, dividas e prioridades financeiras.',
    theme: 'finance',
    x: 39,
    y: 69,
    w: 22,
    h: 18,
  },
  {
    id: 'conference',
    label: 'Platform Ops',
    shortLabel: 'Ops',
    description: 'Ariel cuida de gateway, runtime, integracoes e confiabilidade.',
    theme: 'ops',
    x: 70,
    y: 68,
    w: 22,
    h: 18,
  },
  {
    id: 'kitchen',
    label: 'Shared Lounge',
    shortLabel: 'Shared',
    description: 'Espaco de fallback para agentes sem sala dedicada.',
    theme: 'shared',
    x: 39,
    y: 39,
    w: 22,
    h: 15,
  },
];

export const AGENT_ROOM_MAP: Record<string, RoomId> = {
  main: 'jarvis',
  'clareza-dev': 'claw',
  'clareza-qa': 'sentinel',
  'nodesync-marketing': 'pixel',
  'personal-finance': 'atlas',
  'ariel-platform': 'conference',
};

export function roomForAgent(agentId: string): RoomId {
  return AGENT_ROOM_MAP[agentId] || 'kitchen';
}
