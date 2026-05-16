'use client';

import { memo, useState } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { useShallow } from 'zustand/react/shallow';
import { AgentListItem } from './AgentListItem';

export const Sidebar = memo(function Sidebar() {
  const agents = useAgentStore(useShallow(s => Object.values(s.agents)));
  const selectAgent = useAgentStore(s => s.selectAgent);
  const selectedAgentId = useAgentStore(s => s.selectedAgentId);
  const [filter, setFilter] = useState<'all' | 'working' | 'idle'>('all');

  const filteredAgents = agents.filter(a => {
    if (filter === 'working') return a.status !== 'idle';
    if (filter === 'idle') return a.status === 'idle';
    return true;
  });

  return (
    <div className="w-72 bg-[#0b0e14] border-r-2 border-[#2d3748] flex flex-col font-pixel h-full">
      <div className="p-4 border-b-2 border-[#2d3748]">
        <h2 className="text-lg font-bold text-slate-300 mb-4 tracking-tighter uppercase">
          TEAM STATUS OVERVIEW
        </h2>
        
        {/* Search Mock */}
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search..." 
            className="w-full bg-[#151921] border-2 border-[#2d3748] px-3 py-1 text-sm focus:outline-none focus:border-cyan-500/50"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">🔍</span>
        </div>

        {/* Filters */}
        <div className="flex gap-2 text-[10px] font-bold text-slate-500">
          <button 
            onClick={() => setFilter('all')}
            className={`hover:text-cyan-400 ${filter === 'all' ? 'text-cyan-400' : ''}`}
          >
            [ALL]
          </button>
          <button 
            onClick={() => setFilter('working')}
            className={`hover:text-emerald-400 ${filter === 'working' ? 'text-emerald-400' : ''}`}
          >
            [WORKING]
          </button>
          <button 
            onClick={() => setFilter('idle')}
            className={`hover:text-slate-300 ${filter === 'idle' ? 'text-slate-300' : ''}`}
          >
            [IDLE]
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pixel-scroll p-2 space-y-1">
        {filteredAgents.filter(Boolean).map(agent => (
          <div 
            key={agent.id} 
            onClick={() => selectAgent(agent.id)}
            className={`
              p-2 border-2 transition-all cursor-pointer flex items-center gap-3
              ${selectedAgentId === agent.id 
                ? 'bg-cyan-900/20 border-cyan-500/50' 
                : 'bg-[#1a1f2c] border-[#2d3748] hover:border-[#4a5568]'}
            `}
          >
            <div className="w-10 h-10 bg-[#0b0e14] border border-[#2d3748] flex items-center justify-center overflow-hidden rounded-full">
              <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold text-white uppercase">{agent.name}</span>
                <div className={`w-2 h-2 rounded-full ${
                  agent.status === 'working' ? 'bg-emerald-400' :
                  agent.status === 'busy' ? 'bg-violet-400' :
                  agent.status === 'error' ? 'bg-red-400' : 'bg-slate-500'
                }`} />
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-[10px] font-bold ${
                  agent.status === 'working' ? 'text-emerald-400' : 'text-slate-500'
                }`}>
                  [{agent.status.toUpperCase()}]
                </span>
                {agent.status !== 'idle' && (
                  <div className="flex-1 h-1 bg-slate-800 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[65%]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
