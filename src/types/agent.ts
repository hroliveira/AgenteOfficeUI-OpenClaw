export type AgentStatus = 'idle' | 'working' | 'busy' | 'error';

export type RoomId =
  | 'conference'
  | 'jarvis'
  | 'kitchen'
  | 'scribe'
  | 'atlas'
  | 'claw'
  | 'sentinel'
  | 'pixel'
  | 'nova'
  | 'vibe'
  | 'trendy';

export interface Agent {
  id: string;
  name: string;
  status: AgentStatus;
  lastTool: string | null;
  room: RoomId;
  position: { x: number; y: number };
  avatar: string;
  updatedAt: number;
  emoji?: string;
  description?: string;
  workspace?: string;
  primaryModel?: string;
  fallbackModels?: string[];
  heartbeat?: string;
  skills?: string[];
}

export type AgentEventType =
  | 'agent.started'
  | 'agent.finished'
  | 'agent.tool.called'
  | 'agent.error';

export interface AgentEvent {
  type: AgentEventType;
  agentId: string;
  tool?: string;
}
