'use client';

import { memo, useMemo } from 'react';
import Image from 'next/image';
import { useAgentStore } from '@/store/useAgentStore';
import { AgentAvatar } from './AgentAvatar';
import { RoomConfig } from '@/config/constants';

interface RoomCardProps {
  room: RoomConfig;
}

export const RoomCard = memo(function RoomCard({ room }: RoomCardProps) {
  const agentsById = useAgentStore(s => s.agents);
  const agents = useMemo(
    () => Object.values(agentsById).filter(a => a.room === room.id),
    [agentsById, room.id]
  );

  const isLarge = room.size === 'large';

  const getDecorationImage = () => {
    switch (room.id) {
      case 'conference': return '/assets/conference.png';
      case 'jarvis': return '/assets/servers.png';
      case 'kitchen': return '/assets/kitchen.png';
      default: return null;
    }
  };

  const decoration = getDecorationImage();

  return (
    <div className={`pixel-box flex flex-col ${isLarge ? 'min-h-[220px] sm:min-h-[250px]' : 'min-h-[150px]'}`}>
      <div className="flex items-center justify-between gap-2 border-b-4 border-[#1a1f2c] bg-[#2d3748] px-2 py-1">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-[10px] text-slate-400 font-pixel">SECTOR: {room.id.toUpperCase()}</span>
          <span className="truncate text-sm font-pixel font-bold text-white tracking-widest">{room.label}</span>
        </div>
        <div className="h-3 w-3 flex-shrink-0 border border-[#064e3b] bg-emerald-500 shadow-[0_0_8px_#10b981]" />
      </div>

      <div className="flex-1 room-floor relative overflow-hidden p-2">
        {decoration && (
          <div className="absolute inset-0 flex items-center justify-center p-4 opacity-80">
            <Image
              src={decoration} 
              alt={room.label} 
              width={320}
              height={220}
              className="max-w-full max-h-full object-contain opacity-60 pixelated pointer-events-none select-none"
            />
          </div>
        )}

        {/* Agentes na sala */}
        {agents.map(agent => (
          <AgentAvatar key={agent.id} agent={agent} />
        ))}
        
        {agents.length === 0 && !decoration && (
          <div className="absolute inset-0 flex flex-col items-center justify-center opacity-20">
            <span className="text-5xl">{room.icon}</span>
            <span className="mt-2 text-xs uppercase tracking-widest">{room.description}</span>
          </div>
        )}
      </div>
    </div>
  );
});
