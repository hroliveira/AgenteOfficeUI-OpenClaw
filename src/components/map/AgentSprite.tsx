'use client';

import Image from 'next/image';
import type { CSSProperties } from 'react';
import { memo } from 'react';
import { Agent } from '@/types/agent';
import { useAgentStore } from '@/store/useAgentStore';

interface AgentSpriteProps {
  agent: Agent;
  index: number;
  total: number;
  anchorX?: number;
  anchorY?: number;
}

const STATUS_CLASS: Record<Agent['status'], string> = {
  idle: 'agent-sprite-idle',
  working: 'agent-sprite-working',
  busy: 'agent-sprite-busy',
  error: 'agent-sprite-error',
};

export const AgentSprite = memo(function AgentSprite({ agent, index, total, anchorX = 50, anchorY = 56 }: AgentSpriteProps) {
  const selectAgent = useAgentStore(s => s.selectAgent);
  const isSelected = useAgentStore(s => s.selectedAgentId === agent.id);
  const columns = Math.max(1, Math.min(3, total));
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = anchorX + (col - (columns - 1) / 2) * 18;
  const y = anchorY + row * 19;
  const patrolX = ((agent.id.length + index) % 2 === 0 ? 1 : -1) * (5 + (agent.id.length % 4));
  const patrolY = ((agent.name.length + index) % 2 === 0 ? 1 : -1) * (3 + (agent.name.length % 3));
  const spriteStyle = {
    left: `${Math.max(12, Math.min(x, 88))}%`,
    top: `${Math.max(22, Math.min(y, 82))}%`,
    '--patrol-x': `${patrolX}px`,
    '--patrol-y': `${patrolY}px`,
    '--walk-delay': `-${(agent.id.length + index) % 7}s`,
  } as CSSProperties;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        selectAgent(agent.id);
      }}
      className={`agent-sprite group ${isSelected ? 'agent-sprite-selected' : ''}`}
      style={spriteStyle}
      aria-label={`Open ${agent.name}`}
    >
      <span className="agent-sprite-walker">
        <span className="agent-sprite-shadow" />
        <span className={`agent-sprite-person ${STATUS_CLASS[agent.status]}`}>
          <span className="agent-sprite-head">
            <Image
              src={agent.avatar}
              alt=""
              width={24}
              height={24}
              className="h-full w-full object-cover pixelated"
            />
          </span>
          <span className="agent-sprite-torso" />
          <span className="agent-sprite-arm agent-sprite-arm-left" />
          <span className="agent-sprite-arm agent-sprite-arm-right" />
          <span className="agent-sprite-leg agent-sprite-leg-left" />
          <span className="agent-sprite-leg agent-sprite-leg-right" />
        </span>
        <span className="agent-sprite-status" />
        <span className="agent-sprite-label">{agent.name}</span>
      </span>
    </button>
  );
});
