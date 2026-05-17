'use client';

import { memo, useMemo, useState } from 'react';
import Image from 'next/image';
import { useAgentStore } from '@/store/useAgentStore';

export const Sidebar = memo(function Sidebar() {
  const agentsById = useAgentStore(s => s.agents);
  const agents = useMemo(() => Object.values(agentsById), [agentsById]);
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

  const statusColor = (status: string) => {
    if (status === 'working') return 'bg-emerald-400';
    if (status === 'busy') return 'bg-violet-400';
    if (status === 'error') return 'bg-red-400';
    return 'bg-slate-500';
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#0b0e14] font-pixel md:w-64">
      <div className="border-b-2 border-[#2d3748] p-2.5 sm:p-3">
        <h2 className="mb-2 text-lg font-bold uppercase leading-none tracking-normal text-slate-200">
          TEAM STATUS
        </h2>
        
        <div className="relative mb-3">
          <input 
            type="text" 
            placeholder="Search agent or room..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full border-2 border-[#2d3748] bg-[#151921] px-2.5 py-0.5 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500/50 focus:outline-none"
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

      <div className="flex-1 space-y-1 overflow-y-auto p-1 pixel-scroll">
        {filteredAgents.filter(Boolean).map(agent => (
          <div 
            key={agent.id} 
            onClick={() => selectAgent(agent.id)}
            className={`
              p-1 border-2 transition-all cursor-pointer grid grid-cols-[3rem_1fr] gap-2
              ${selectedAgentId === agent.id 
                ? 'bg-cyan-900/20 border-cyan-500/50' 
                : 'bg-[#1a1f2c] border-[#2d3748] hover:border-[#4a5568]'}
            `}
          >
            <div className="flex flex-col items-center gap-1">
              <div className="h-11 w-11 bg-[#0b0e14] border border-[#2d3748] flex items-center justify-center overflow-hidden rounded-full">
                <Image src={agent.avatar} alt="" width={44} height={44} className="h-full w-full object-cover" />
              </div>
              <div className="h-1 w-9 overflow-hidden bg-slate-800">
                <div className={`h-full w-full ${statusColor(agent.status)}`} />
              </div>
            </div>
            <div className="min-w-0 py-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-xs font-bold uppercase leading-none text-white">{agent.name}</span>
                <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${statusColor(agent.status)}`} />
              </div>
              <p className="mt-1 truncate text-[9px] uppercase leading-none text-slate-500">{agent.id}</p>
              <p className={`mt-2 text-[9px] font-bold uppercase leading-none ${
                agent.status === 'working' ? 'text-emerald-400' :
                agent.status === 'busy' ? 'text-violet-400' :
                agent.status === 'error' ? 'text-red-400' : 'text-slate-500'
              }`}>
                {agent.status}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});
