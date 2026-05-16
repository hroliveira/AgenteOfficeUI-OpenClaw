'use client';

import { Sidebar } from '@/components/sidebar/Sidebar';
import { OfficeGrid } from '@/components/office/OfficeGrid';
import { useAgentWebSocket } from '@/hooks/useAgentWebSocket';
import { AgentInspector } from '@/components/office/AgentInspector';

function WebSocketInit() {
  useAgentWebSocket();
  return null;
}

export default function HomePage() {
  return (
    <main className="flex h-screen w-screen overflow-hidden bg-[#0b0e14] font-pixel select-none">
      <WebSocketInit />

      {/* Sidebar - Largura Fixa */}
      <div className="flex-shrink-0 w-72 h-full border-r-4 border-[#2d3748]">
        <Sidebar />
      </div>

      {/* Grid de Salas - Expandível */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-[#0b0e14]">
        <OfficeGrid />
      </div>

      <AgentInspector />
    </main>
  );
}
