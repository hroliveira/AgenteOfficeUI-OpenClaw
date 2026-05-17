'use client';

import { useEffect, useMemo, useState } from 'react';
import { useAgentStore } from '@/store/useAgentStore';
import { RoomCard } from './RoomCard';
import { ROOMS } from '@/config/constants';
import { OperationsTabs } from './OperationsTabs';

export function OfficeGrid() {
  const [clock, setClock] = useState('');
  const agentsById = useAgentStore(s => s.agents);
  const connectionStatus = useAgentStore(s => s.connectionStatus);
  const agents = useMemo(() => Object.values(agentsById), [agentsById]);

  useEffect(() => {
    const tick = () => setClock(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    tick();
    const timer = setInterval(tick, 30_000);
    return () => clearInterval(timer);
  }, []);

  const largeRooms = ROOMS.filter(r => r.size === 'large');
  const smallRooms = ROOMS.filter(r => r.size === 'small');
  const stats = useMemo(() => ({
    total: agents.length,
    active: agents.filter(a => a.status !== 'idle').length,
    errors: agents.filter(a => a.status === 'error').length,
  }), [agents]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#0b0e14] bg-grid p-3 pixel-scroll sm:p-4">
      <div className="mb-4 border-b border-[#2d3748] px-1 pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">OpenClaw Pixel World</p>
            <h1 className="text-3xl font-bold leading-none tracking-normal text-slate-100 sm:text-4xl">
              AGENT OFFICE
            </h1>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center text-sm sm:min-w-[420px]">
            <div className="pixel-stat">
              <span>{stats.total}</span>
              <small>agents</small>
            </div>
            <div className="pixel-stat">
              <span>{stats.active}</span>
              <small>active</small>
            </div>
            <div className="pixel-stat">
              <span>{stats.errors}</span>
              <small>errors</small>
            </div>
            <div className="pixel-stat">
              <span className={connectionStatus === 'connected' ? 'text-emerald-300' : 'text-amber-300'}>
                {clock || '--:--'}
              </span>
              <small>{connectionStatus}</small>
            </div>
          </div>
        </div>
      </div>

      <OperationsTabs />

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <div className="flex flex-col gap-4 xl:col-span-5">
          {largeRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:col-span-7">
          {smallRooms.map(room => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}
