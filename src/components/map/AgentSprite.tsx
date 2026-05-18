'use client';

import Image from 'next/image';
import { memo } from 'react';
import { Agent } from '@/types/agent';
import { useAgentStore } from '@/store/useAgentStore';

interface AgentSpriteProps {
  agent: Agent;
  index: number;
  total: number;
}

const STATUS_CLASS: Record<Agent['status'], string> = {
  idle: 'bg-slate-500',
  working: 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]',
  busy: 'bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]',
  error: 'bg-red-400 shadow-[0_0_10px_rgba(248,113,113,0.8)]',
};

export const AgentSprite = memo(function AgentSprite({ agent, index, total }: AgentSpriteProps) {
  const selectAgent = useAgentStore(s => s.selectAgent);
  const isSelected = useAgentStore(s => s.selectedAgentId === agent.id);
  const columns = Math.max(1, Math.min(3, total));
  const col = index % columns;
  const row = Math.floor(index / columns);
  const x = 22 + col * 28;
  const y = 46 + row * 26;

  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        selectAgent(agent.id);
      }}
      className={`agent-sprite group ${isSelected ? 'agent-sprite-selected' : ''}`}
      style={{ left: `${x}%`, top: `${Math.min(y, 78)}%` }}
      aria-label={`Open ${agent.name}`}
    >
      <span className="agent-sprite-shadow" />
      <span className="agent-sprite-body">
        <Image
          src={agent.avatar}
          alt=""
          width={44}
          height={44}
          className="h-full w-full object-cover pixelated"
        />
      </span>
      <span className={`agent-sprite-status ${STATUS_CLASS[agent.status]}`} />
      <span className="agent-sprite-label">{agent.name}</span>
    </button>
  );
});
