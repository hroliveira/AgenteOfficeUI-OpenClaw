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
    <main className="flex h-dvh w-screen flex-col overflow-hidden bg-[#0b0e14] font-pixel select-none md:flex-row">
      <WebSocketInit />

      <div className="h-[42dvh] w-full flex-shrink-0 border-b-4 border-[#2d3748] md:h-full md:w-64 md:border-b-0 md:border-r-4">
        <Sidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative z-10 bg-[#0b0e14]">
        <OfficeGrid />
      </div>

      <AgentInspector />
    </main>
  );
}
