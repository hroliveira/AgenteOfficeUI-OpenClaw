'use client';

import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { MOCK_MODE, OPENCLAW_URL, OPENCLAW_TOKEN, AGENT_NAMES, TOOLS } from '@/config/constants';

interface ApiAgent {
  id: string;
  name?: string;
  status?: 'idle' | 'working' | 'busy' | 'error';
  avatar?: string;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function resolveOpenClawUrl() {
  if (OPENCLAW_URL) return OPENCLAW_URL;
  return '';
}

export function useAgentWebSocket() {
  const bootstrapAgents = useAgentStore(s => s.bootstrapAgents);
  const processEvent = useAgentStore(s => s.processEvent);
  const setConnectionStatus = useAgentStore(s => s.setConnectionStatus);
  const updateAgentPosition = useAgentStore(s => s.updateAgentPosition);
  const setSendMessage = useAgentStore(s => s.setSendMessage);


  const bootstrapAgentsRef = useRef(bootstrapAgents);
  const processEventRef = useRef(processEvent);
  const setStatusRef = useRef(setConnectionStatus);
  const updatePosRef = useRef(updateAgentPosition);
  const setSendMessageRef = useRef(setSendMessage);

  useEffect(() => {
    bootstrapAgentsRef.current = bootstrapAgents;
    processEventRef.current = processEvent;
    setStatusRef.current = setConnectionStatus;
    updatePosRef.current = updateAgentPosition;
    setSendMessageRef.current = setSendMessage;
  }, [bootstrapAgents, processEvent, setConnectionStatus, updateAgentPosition, setSendMessage]);

  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let mockEventTimer: ReturnType<typeof setInterval> | null = null;
    let mockMoveTimer: ReturnType<typeof setInterval> | null = null;

    const loadConfiguredAgents = async () => {
      try {
        const response = await fetch('/api/agents', { cache: 'no-store' });
        if (!response.ok) return [];
        const data = await response.json() as { agents?: ApiAgent[] };
        const agents = data.agents || [];
        if (active && agents.length) {
          bootstrapAgentsRef.current(agents);
        }
        return agents.map(agent => agent.id);
      } catch {
        return [];
      }
    };

    const init = async () => {
      const configuredAgentIds = await loadConfiguredAgents();
      const fallbackAgentIds = AGENT_NAMES.slice(0, 8).map(name => name.toLowerCase());
      const simulatedAgentIds = configuredAgentIds.length ? configuredAgentIds : fallbackAgentIds;

      if (MOCK_MODE) {
        if (active) setStatusRef.current('connected');

        // Inicializa os agentes
        if (!configuredAgentIds.length) fallbackAgentIds.forEach((agentId, i) => {
          setTimeout(() => {
            if (active) processEventRef.current({ 
              type: 'agent.started', 
              agentId
            });
          }, i * 200);
        });

        // Loop de Eventos (Trabalho/Ferramentas)
        mockEventTimer = setInterval(() => {
          if (!active) return;
          const agentId = getRandomItem(simulatedAgentIds);
          const type = getRandomItem(['agent.tool.called', 'agent.finished', 'agent.tool.called'] as const);
          
          processEventRef.current({
            type,
            agentId,
            tool: type === 'agent.tool.called' ? getRandomItem(TOOLS) : undefined
          });
        }, 3000);

        // NOVO: Loop de Movimentação (Vida no ambiente)
        mockMoveTimer = setInterval(() => {
          if (!active) return;
          const agentId = getRandomItem(simulatedAgentIds);
          // Gera uma nova posição aleatória dentro da sala
          const newX = Math.floor(Math.random() * 60) + 20;
          const newY = Math.floor(Math.random() * 60) + 20;
          updatePosRef.current(agentId, newX, newY);
        }, 4000);

        return;
      }

      const connect = () => {
        if (!active) return;
        try {
          const openClawUrl = resolveOpenClawUrl();
          if (!openClawUrl) {
            setStatusRef.current('disconnected');
            return;
          }

          const url = new URL(openClawUrl);
          if (OPENCLAW_TOKEN) url.searchParams.set('token', OPENCLAW_TOKEN);
          
          ws = new WebSocket(url.toString());
          
          ws.onopen = () => { 
            console.log('WS Connected to:', url.toString());
            if (active) {
              setStatusRef.current('connected');
              setSendMessageRef.current((msg) => {
                if (ws?.readyState === WebSocket.OPEN) {
                  ws.send(JSON.stringify(msg));
                }
              });
            }
          };
          ws.onerror = (e) => {
            console.error('WS Connection Error:', e);
          };
          ws.onmessage = (e) => {
            if (!active) return;
            try { 
              const data = JSON.parse(e.data);
              console.log('WS Event:', data);
              processEventRef.current(data); 
            } catch {
              // Ignore malformed gateway messages and keep the stream alive.
            }
          };
          ws.onclose = () => {
            if (active) {
              setStatusRef.current('disconnected');
              setSendMessageRef.current(null);
              setTimeout(connect, 5000);
            }
          };
        } catch {
          if (active) {
            setStatusRef.current('disconnected');
            setSendMessageRef.current(null);
            setTimeout(connect, 5000);
          }
        }
      };

      connect();
    };

    init();

    return () => {
      active = false;
      if (ws) ws.close();
      if (mockEventTimer) clearInterval(mockEventTimer);
      if (mockMoveTimer) clearInterval(mockMoveTimer);
    };
  }, []); 
}
