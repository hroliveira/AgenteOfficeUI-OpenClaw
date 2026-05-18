'use client';

import { useMemo, useState } from 'react';
import { MAP_ROOMS } from '@/config/mapLayout';
import { useAgentStore } from '@/store/useAgentStore';
import { MapRoom } from '@/types/agent';
import { RpgRoom } from './RpgRoom';
import { RoomFocus } from './RoomFocus';

export function RpgMap() {
  const agentsById = useAgentStore(s => s.agents);
  const agents = useMemo(() => Object.values(agentsById), [agentsById]);
  const [focusedRoom, setFocusedRoom] = useState<MapRoom | null>(null);

  const agentsByRoom = useMemo(() => {
    return agents.reduce<Record<string, typeof agents>>((acc, agent) => {
      acc[agent.room] = acc[agent.room] || [];
      acc[agent.room].push(agent);
      return acc;
    }, {});
  }, [agents]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 border-2 border-[#2d3748] bg-[#111827] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase leading-none text-white">RPG Map</h2>
          <p className="mt-1 text-xs leading-none text-slate-500">Top-down experimental office view</p>
        </div>
        <div className="text-[10px] uppercase tracking-[0.16em] text-cyan-300/80">
          {agents.length} agents mapped
        </div>
      </div>

      <div className="rpg-map-shell">
        <div className="rpg-map">
          <div className="rpg-corridor rpg-corridor-main" />
          <div className="rpg-corridor rpg-corridor-left" />
          <div className="rpg-corridor rpg-corridor-right" />
          <div className="rpg-corridor rpg-corridor-bottom" />

          {MAP_ROOMS.map(room => (
            <RpgRoom
              key={room.id}
              room={room}
              agents={agentsByRoom[room.id] || []}
              onFocus={setFocusedRoom}
            />
          ))}
        </div>
      </div>

      {focusedRoom && (
        <RoomFocus
          room={focusedRoom}
          agents={agentsByRoom[focusedRoom.id] || []}
          onClose={() => setFocusedRoom(null)}
        />
      )}
    </section>
  );
}
