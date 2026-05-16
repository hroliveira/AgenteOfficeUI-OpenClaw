'use client';

import { memo, useState } from 'react';
import Image from 'next/image';
import { useAgentStore } from '@/store/useAgentStore';
import { useShallow } from 'zustand/react/shallow';

export const Sidebar = memo(function Sidebar() {
  const agents = useAgentStore(useShallow(s => Object.values(s.agents)));
  const selectAgent = useAgentStore(s => s.selectAgent);
  const selectedAgentId = useAgentStore(s => s.selectedAgentId);
  const [filter, setFilter] = useState<'all' | 'working' | 'idle'>('all');
  const [query, setQuery] = useState('');

  const filteredAgents = agents.filter(a => {
    if (filter === 'working') return a.status !== 'idle';
    if (filter === 'idle') return a.status === 'idle';
    return true;
  }).filter(a => {
    const term = query.trim().toLowerCase();
    if (!term) return true;
    return a.name.toLowerCase().includes(term) || a.id.toLowerCase().includes(term) || a.room.toLowerCase().includes(term);
  });

  return (
    <div className="flex h-full w-full flex-col bg-[#0b0e14] font-pixel md:w-72">
      <div className="border-b-2 border-[#2d3748] p-3 sm:p-4">
        <h2 className="mb-3 text-xl font-bold uppercase leading-none tracking-normal text-slate-200">
          TEAM STATUS
        </h2>
        
        <div className="relative mb-4">
          <input 
            type="text" 
            placeholder="Search agent or room..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-2 border-[#2d3748] bg-[#151921] px-3 py-1 text-sm text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-600">⌕</span>
        </div>

        <div className="flex flex-wrap gap-2 text-[10px] font-bold text-slate-500">
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

      <div className="flex-1 space-y-1 overflow-y-auto p-2 pixel-scroll">
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
              <Image src={agent.avatar} alt="" width={40} height={40} className="h-full w-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-center">
                <span className="truncate text-sm font-bold uppercase text-white">{agent.name}</span>
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
