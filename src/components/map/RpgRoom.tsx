'use client';

import { memo } from 'react';
import { Agent, MapRoom } from '@/types/agent';
import { AgentSprite } from './AgentSprite';

interface RpgRoomProps {
  room: MapRoom;
  agents: Agent[];
  signals?: RoomSignalSummary;
  onFocus: (room: MapRoom) => void;
}

export type RoomSignalSummary = {
  activityCount: number;
  taskCount: number;
  scheduleCount: number;
  hasFailure: boolean;
  nextScheduleAt: string | null;
};

const THEME_CLASS: Record<MapRoom['theme'], string> = {
  command: 'rpg-room-command',
  dev: 'rpg-room-dev',
  qa: 'rpg-room-qa',
  market: 'rpg-room-market',
  finance: 'rpg-room-finance',
  ops: 'rpg-room-ops',
  shared: 'rpg-room-shared',
};

export const RpgRoom = memo(function RpgRoom({ room, agents, signals, onFocus }: RpgRoomProps) {
  const hasError = agents.some(agent => agent.status === 'error') || Boolean(signals?.hasFailure);
  const hasActiveAgent = agents.some(agent => agent.status !== 'idle') || Boolean(signals?.activityCount || signals?.taskCount || signals?.scheduleCount);

  return (
    <button
      type="button"
      onClick={() => onFocus(room)}
      className={`rpg-room ${THEME_CLASS[room.theme]}`}
      style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%` }}
      aria-label={`Open ${room.label}`}
    >
      <span className="rpg-room-floor" />
      <span className="rpg-room-header">
        <span className="truncate">{room.shortLabel}</span>
        <span className={`rpg-room-light ${hasError ? 'bg-red-400' : hasActiveAgent ? 'bg-emerald-400' : 'bg-slate-500'}`} />
      </span>
      <span className="rpg-room-count">{agents.length} AG</span>
      {signals && (signals.activityCount > 0 || signals.taskCount > 0 || signals.scheduleCount > 0) && (
        <span className="rpg-room-signals" aria-label={`${room.label} signals`}>
          {signals.activityCount > 0 && <span>A{signals.activityCount}</span>}
          {signals.taskCount > 0 && <span>T{signals.taskCount}</span>}
          {signals.scheduleCount > 0 && <span>S{signals.scheduleCount}</span>}
        </span>
      )}

      {agents.map((agent, index) => (
        <AgentSprite
          key={agent.id}
          agent={agent}
          index={index}
          total={agents.length}
          anchorX={room.agentX}
          anchorY={room.agentY}
        />
      ))}
    </button>
  );
});
