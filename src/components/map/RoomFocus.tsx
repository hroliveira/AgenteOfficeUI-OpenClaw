'use client';

import { X } from 'lucide-react';
import { Agent, MapRoom } from '@/types/agent';
import { useAgentStore } from '@/store/useAgentStore';
import { AgentSprite } from './AgentSprite';

interface RoomFocusProps {
  room: MapRoom;
  agents: Agent[];
  onClose: () => void;
}

export function RoomFocus({ room, agents, onClose }: RoomFocusProps) {
  const selectAgent = useAgentStore(s => s.selectAgent);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 font-pixel">
      <div className="pixel-box flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden bg-[#111827]">
        <div className="flex items-center justify-between gap-3 border-b-4 border-[#2d3748] bg-[#151921] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/80">Room Focus</p>
            <h2 className="truncate text-2xl font-bold uppercase leading-none text-white">{room.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center border-2 border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400 hover:text-white"
            aria-label="Close room focus"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[1.35fr_0.65fr]">
          <section className="rpg-focus-floor relative min-h-[320px] overflow-hidden border-4 border-[#2d3748] bg-[#172033]">
            <div className="absolute left-4 top-4 max-w-[70%]">
              <p className="text-sm leading-snug text-slate-300">{room.description}</p>
            </div>
            {agents.map((agent, index) => (
              <AgentSprite key={agent.id} agent={agent} index={index} total={agents.length} />
            ))}
            {!agents.length && (
              <div className="absolute inset-0 grid place-items-center text-sm uppercase tracking-widest text-slate-500">
                Empty room
              </div>
            )}
          </section>

          <section className="border-2 border-[#2d3748] bg-[#151921] p-3">
            <h3 className="mb-3 text-xs uppercase text-cyan-300">Agents in room</h3>
            <div className="space-y-2">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => selectAgent(agent.id)}
                  className="w-full border-2 border-slate-800 bg-slate-950 px-3 py-2 text-left hover:border-cyan-500/60"
                >
                  <span className="block truncate text-sm uppercase leading-none text-white">{agent.name}</span>
                  <span className="mt-1 block text-[10px] uppercase leading-none text-slate-500">{agent.status}</span>
                </button>
              ))}
              {!agents.length && <p className="text-sm text-slate-500">No agents assigned.</p>}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
