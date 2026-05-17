import { create } from 'zustand';
import { Agent, AgentStatus, RoomId } from '@/types/agent';
import { AGENT_NAMES, ROOM_IDS } from '@/config/constants';

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
}

interface AgentStore {
  agents: Record<string, Agent>;
  connectionStatus: 'connected' | 'disconnected' | 'connecting';
  eventLog: { id: string; message: string; timestamp: number }[];
  selectedAgentId: string | null;
  agentMessages: Record<string, Message[]>;
  sendMessage: ((msg: Record<string, unknown>) => void) | null;

  // actions
  bootstrapAgents: (agents: AgentBootstrap[]) => void;
  processEvent: (event: IncomingAgentEvent) => void;
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'connecting') => void;
  getAgentsByRoom: (roomId: RoomId) => Agent[];
  selectAgent: (id: string | null) => void;
  sendAgentCommand: (agentId: string, command: string) => void;
  updateAgentPosition: (agentId: string, x: number, y: number) => void;
  updateAgentAvatar: (agentId: string, avatar: string) => void;
  setSendMessage: (fn: ((msg: Record<string, unknown>) => void) | null) => void;
}

interface AgentBootstrap {
  id: string;
  name?: string;
  status?: AgentStatus;
  room?: RoomId;
  avatar?: string;
  emoji?: string;
  description?: string;
  workspace?: string;
  primaryModel?: string;
  fallbackModels?: string[];
  heartbeat?: string;
  skills?: string[];
}

interface IncomingAgentEvent {
  id?: string;
  name?: string;
  agentId?: string;
  agent_id?: string;
  event?: string;
  method?: string;
  payload?: {
    id?: string;
    name?: string;
    agentId?: string;
  };
  status?: AgentStatus;
  tool?: string;
  tool_name?: string;
  type?: string;
}

function randomRoom(): RoomId {
  return ROOM_IDS[Math.floor(Math.random() * ROOM_IDS.length)];
}

function randomPosition() {
  return {
    x: Math.floor(Math.random() * 70) + 15,
    y: Math.floor(Math.random() * 60) + 15,
  };
}

function randomAvatar() {
  const avatars = ['/assets/avatars/avatar1.png', '/assets/avatars/avatar2.png', '/assets/avatars/avatar3.png'];
  return avatars[Math.floor(Math.random() * avatars.length)];
}

function humanizeName(id: string): string {
  if (!id) return 'Unknown Agent';
  const found = AGENT_NAMES.find(n => n.toLowerCase() === id.toLowerCase());
  return found ?? id.charAt(0).toUpperCase() + id.slice(1);
}

function addLog(
  log: { id: string; message: string; timestamp: number }[],
  message: string
) {
  const newEntry = { id: `${Date.now()}-${Math.random()}`, message, timestamp: Date.now() };
  return [newEntry, ...log].slice(0, 50);
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  agents: {},
  connectionStatus: 'disconnected',
  eventLog: [],
  selectedAgentId: null,
  agentMessages: {},
  sendMessage: null,

  bootstrapAgents: (incomingAgents) => {
    set(state => {
      const agents = { ...state.agents };
      const eventLog = incomingAgents.length
        ? addLog(state.eventLog, `${incomingAgents.length} agentes carregados do OpenClaw`)
        : state.eventLog;

      for (const incoming of incomingAgents) {
        if (!incoming.id) continue;
        const current = agents[incoming.id];
        agents[incoming.id] = {
          id: incoming.id,
          name: incoming.name || current?.name || humanizeName(incoming.id),
          status: incoming.status || current?.status || 'idle',
          lastTool: current?.lastTool ?? null,
          room: incoming.room || current?.room || randomRoom(),
          position: current?.position || randomPosition(),
          avatar: incoming.avatar || current?.avatar || randomAvatar(),
          emoji: incoming.emoji || current?.emoji,
          description: incoming.description || current?.description,
          workspace: incoming.workspace || current?.workspace,
          primaryModel: incoming.primaryModel || current?.primaryModel,
          fallbackModels: incoming.fallbackModels || current?.fallbackModels || [],
          heartbeat: incoming.heartbeat || current?.heartbeat,
          skills: incoming.skills || current?.skills || [],
          updatedAt: Date.now(),
        };
      }

      return { agents, eventLog };
    });
  },

  processEvent: (event) => {
    const id = event.agentId || event.id || event.name || event.agent_id || 
               event.payload?.agentId || event.payload?.id || event.payload?.name;
    
    if (!id) {
      if (event.event?.startsWith('connect.') || event.method === 'connect') return;
      return;
    }

    set(state => {
      const agents = { ...state.agents };

      if (!agents[id]) {
        agents[id] = {
          id: String(id),
          name: humanizeName(String(id)),
          status: 'idle',
          lastTool: null,
          room: randomRoom(),
          position: randomPosition(),
          avatar: randomAvatar(),
          updatedAt: Date.now(),
        };
      }

      const agent = { ...agents[id] };
      let statusUpdate: AgentStatus = event.status ?? agent.status;
      let logMessage = '';

      const type = event.type || event.event;

      switch (type) {
        case 'agent.started':
        case 'started':
          statusUpdate = 'working';
          logMessage = `▶ ${agent.name} iniciou`;
          break;
        case 'agent.finished':
        case 'finished':
        case 'completed':
          statusUpdate = 'idle';
          logMessage = `✓ ${agent.name} concluiu`;
          break;
        case 'agent.tool.called':
        case 'tool_called':
        case 'tool.called':
          statusUpdate = 'busy';
          agent.lastTool = event.tool || event.tool_name || null;
          logMessage = `⚡ ${agent.name} → ${agent.lastTool ?? 'tool'}`;
          break;
        case 'agent.error':
        case 'error':
          statusUpdate = 'error';
          logMessage = `✗ ${agent.name} erro!`;
          break;
        default:
          // Se for um evento desconhecido mas tiver status, atualiza
          if (event.status) statusUpdate = event.status as AgentStatus;
          break;
      }

      agents[id] = { ...agent, status: statusUpdate, updatedAt: Date.now() };

      return {
        agents,
        eventLog: logMessage ? addLog(state.eventLog, logMessage) : state.eventLog,
      };
    });
  },

  setConnectionStatus: (status) => set({ connectionStatus: status }),

  getAgentsByRoom: (roomId: RoomId) => {
    const { agents } = get();
    return Object.values(agents).filter(a => a.room === roomId);
  },

  selectAgent: (id) => set({ selectedAgentId: id }),

  sendAgentCommand: (agentId, command) => {
    const messageId = `${Date.now()}`;
    const userMsg: Message = { id: messageId, role: 'user', content: command, timestamp: Date.now() };
    
    set(state => ({
      agentMessages: {
        ...state.agentMessages,
        [agentId]: [...(state.agentMessages[agentId] || []), userMsg]
      }
    }));

    // Simulação de resposta no Mock Mode
    setTimeout(() => {
      const replyId = `${Date.now()}-reply`;
      const replyMsg: Message = { 
        id: replyId, 
        role: 'agent', 
        content: `Comando recebido: "${command}". Iniciando processamento...`, 
        timestamp: Date.now() 
      };
      
      set(state => ({
        agentMessages: {
          ...state.agentMessages,
          [agentId]: [...(state.agentMessages[agentId] || []), replyMsg]
        }
      }));
    }, 1000);

    // Envia o comando real se o socket estiver ativo
    const { sendMessage } = get();
    if (sendMessage) {
      sendMessage({
        type: 'agent.command',
        agentId,
        content: command,
        timestamp: Date.now()
      });
    }
  },

  updateAgentPosition: (agentId, x, y) => set(state => {
    if (!state.agents[agentId]) return state;
    return {
      agents: {
        ...state.agents,
        [agentId]: { ...state.agents[agentId], position: { x, y } }
      }
    };
  }),

  updateAgentAvatar: (agentId, avatar) => set(state => {
    if (!state.agents[agentId]) return state;
    return {
      agents: {
        ...state.agents,
        [agentId]: { ...state.agents[agentId], avatar }
      }
    };
  }),

  setSendMessage: (fn) => set({ sendMessage: fn })
}));
