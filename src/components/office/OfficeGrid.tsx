'use client';

import { useShallow } from 'zustand/react/shallow';
import { useAgentStore } from '@/store/useAgentStore';
import { RoomCard } from './RoomCard';
import { ROOMS } from '@/config/constants';

export function OfficeGrid() {
  const largeRooms = ROOMS.filter(r => r.size === 'large');
  const smallRooms = ROOMS.filter(r => r.size === 'small');

  return (
    <div className="flex-1 overflow-y-auto p-4 bg-[#0b0e14] custom-scrollbar">
      {/* Header Estilo Pixel */}
      <div className="flex justify-between items-center mb-4 px-2 border-b border-[#2d3748] pb-2">
        <h1 className="text-xl font-bold tracking-tighter text-slate-300">
          TEAM OVERVIEW v3.2
        </h1>
        <div className="text-xl text-slate-400">
          TIME: {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} PM
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Coluna Esquerda: Salas Grandes */}
        <div className="col-span-5 flex flex-col gap-4">
          {largeRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        {/* Coluna Direita: Grid de Salas Pequenas (2 colunas) */}
        <div className="col-span-7 grid grid-cols-2 gap-4">
          {smallRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}
