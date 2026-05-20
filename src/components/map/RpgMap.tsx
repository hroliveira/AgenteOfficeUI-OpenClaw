'use client';

import { useMemo, useState } from 'react';
import { MAP_ROOMS, MEETING_ROOM_ID } from '@/config/mapLayout';
import { useAgentStore } from '@/store/useAgentStore';
import { MapRoom } from '@/types/agent';
import { RpgRoom } from './RpgRoom';
import { RoomFocus } from './RoomFocus';

export function RpgMap() {
  const agentsById = useAgentStore(s => s.agents);
  const agents = useMemo(() => Object.values(agentsById), [agentsById]);
  const [focusedRoom, setFocusedRoom] = useState<MapRoom | null>(null);
  const [meetingMode, setMeetingMode] = useState(false);
  const meetingRoom = useMemo(() => MAP_ROOMS.find(room => room.id === MEETING_ROOM_ID) || null, []);
  const displayedAgents = useMemo(() => (
    meetingMode ? agents.map(agent => ({ ...agent, room: MEETING_ROOM_ID })) : agents
  ), [agents, meetingMode]);

  const agentsByRoom = useMemo(() => {
    return displayedAgents.reduce<Record<string, typeof displayedAgents>>((acc, agent) => {
      acc[agent.room] = acc[agent.room] || [];
      acc[agent.room].push(agent);
      return acc;
    }, {});
  }, [displayedAgents]);

  function toggleMeetingMode() {
    setMeetingMode(value => {
      const next = !value;
      if (next && meetingRoom) setFocusedRoom(meetingRoom);
      return next;
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 border-2 border-[#2d3748] bg-[#111827] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase leading-none text-white">RPG Map</h2>
          <p className="mt-1 text-xs leading-none text-slate-500">
            {meetingMode ? 'Meeting mode active: all agents in Meeting Hall' : 'Top-down experimental office view'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300/80">
          <span>{agents.length} agents mapped</span>
          <button
            type="button"
            onClick={toggleMeetingMode}
            className={`border px-2 py-1 font-bold leading-none tracking-normal transition-colors ${meetingMode ? 'border-amber-300 bg-amber-300 text-black' : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-cyan-400 hover:text-white'}`}
            aria-pressed={meetingMode}
          >
            Meeting mode
          </button>
        </div>
      </div>

      <div className={`rpg-map-shell ${meetingMode ? 'rpg-map-shell-meeting' : ''}`}>
        <div className="rpg-map">
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
