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
