'use client';

import { memo } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { useShallow } from 'zustand/react/shallow';
import { AgentAvatar } from './AgentAvatar';
import { RoomConfig } from '@/config/constants';

interface RoomCardProps {
  room: RoomConfig;
}

export const RoomCard = memo(function RoomCard({ room }: RoomCardProps) {
  const agents = useAgentStore(useShallow(s => 
    Object.values(s.agents).filter(a => a.room === room.id)
  ));

  const isLarge = room.size === 'large';

  // Seleciona a imagem de fundo correta baseada no ID da sala
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
    <div className={`pixel-box flex flex-col ${isLarge ? 'h-[220px]' : 'h-[140px]'}`}>
      <div className="bg-[#2d3748] border-b-4 border-[#1a1f2c] px-2 py-1 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-slate-400 font-pixel">SECTOR: {room.id.toUpperCase()}</span>
          <span className="text-sm font-pixel font-bold text-white tracking-widest">{room.label}</span>
        </div>
        <div className="w-3 h-3 bg-emerald-500 shadow-[0_0_8px_#10b981] border border-[#064e3b]" />
      </div>

      <div className="flex-1 room-floor relative p-2">
        {/* Asset de Decoração (Móveis) */}
        {decoration && (
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <img 
              src={decoration} 
              alt={room.label} 
              className="max-w-full max-h-full object-contain opacity-60 pixelated pointer-events-none select-none"
            />
          </div>
        )}

        {/* Agentes na sala */}
        {agents.map(agent => (
          <AgentAvatar key={agent.id} agent={agent} />
        ))}
        
        {agents.length === 0 && !decoration && (
          <div className="absolute inset-0 flex items-center justify-center opacity-10">
            <span className="text-6xl">{room.icon}</span>
          </div>
        )}
      </div>
    </div>
  );
});
