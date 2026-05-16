'use client';

import { useEffect, useRef } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { MOCK_MODE, OPENCLAW_URL, OPENCLAW_TOKEN, AGENT_NAMES, TOOLS } from '@/config/constants';

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function useAgentWebSocket() {
  const processEvent = useAgentStore(s => s.processEvent);
  const setConnectionStatus = useAgentStore(s => s.setConnectionStatus);
  const updateAgentPosition = useAgentStore(s => s.updateAgentPosition);
  const setSendMessage = useAgentStore(s => s.setSendMessage);


  const processEventRef = useRef(processEvent);
  const setStatusRef = useRef(setConnectionStatus);
  const updatePosRef = useRef(updateAgentPosition);

  useEffect(() => {
    processEventRef.current = processEvent;
    setStatusRef.current = setConnectionStatus;
    updatePosRef.current = updateAgentPosition;
  }, [processEvent, setConnectionStatus, updateAgentPosition]);

  useEffect(() => {
    let active = true;
    let ws: WebSocket | null = null;
    let mockEventTimer: ReturnType<typeof setInterval> | null = null;
    let mockMoveTimer: ReturnType<typeof setInterval> | null = null;

    const init = () => {
      if (MOCK_MODE) {
        if (active) setStatusRef.current('connected');

        // Inicializa os agentes
        AGENT_NAMES.slice(0, 8).forEach((name, i) => {
          setTimeout(() => {
            if (active) processEventRef.current({ 
              type: 'agent.started', 
              agentId: name.toLowerCase() 
            });
          }, i * 200);
        });

        // Loop de Eventos (Trabalho/Ferramentas)
        mockEventTimer = setInterval(() => {
          if (!active) return;
          const agentId = getRandomItem(AGENT_NAMES).toLowerCase();
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
          const agentId = getRandomItem(AGENT_NAMES).toLowerCase();
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
          const url = new URL(OPENCLAW_URL);
          if (OPENCLAW_TOKEN) url.searchParams.set('token', OPENCLAW_TOKEN);
          
          ws = new WebSocket(url.toString());
          
          ws.onopen = () => { 
            console.log('WS Connected to:', url.toString());
            if (active) {
              setConnectionStatus('connected');
              // Injeta a função de envio na store
              setSendMessage((msg) => {
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
            } catch (err) {}
          };
          ws.onclose = () => {
            if (active) {
              setConnectionStatus('disconnected');
              setSendMessage(null);
              setTimeout(connect, 5000);
            }
          };
        } catch (err) {
          if (active) {
            setConnectionStatus('disconnected');
            setSendMessage(null);
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
