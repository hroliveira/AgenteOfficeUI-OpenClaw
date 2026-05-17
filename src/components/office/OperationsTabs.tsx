'use client';

import { useState } from 'react';
import { AgentActivityPanel } from './AgentActivityPanel';
import { ObservabilityPanel } from './ObservabilityPanel';
import { SchedulePanel } from './SchedulePanel';
import { TasksPanel } from './TasksPanel';

type TabId = 'health' | 'activity' | 'tasks' | 'schedule';

const TABS: Array<{ id: TabId; label: string; tone: string }> = [
  { id: 'health', label: 'Health', tone: 'text-cyan-200 border-cyan-500/50 bg-cyan-950/20' },
  { id: 'activity', label: 'Activity', tone: 'text-emerald-200 border-emerald-500/50 bg-emerald-950/20' },
  { id: 'tasks', label: 'Tasks', tone: 'text-violet-200 border-violet-500/50 bg-violet-950/20' },
  { id: 'schedule', label: 'Schedule', tone: 'text-amber-200 border-amber-500/50 bg-amber-950/20' },
];

export function OperationsTabs() {
  const [activeTab, setActiveTab] = useState<TabId>('health');

  return (
    <section className="mb-4 border-2 border-[#2d3748] bg-[#0f1724] p-2">
      <div className="mb-2 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
        <div className="px-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-slate-500">Operations cockpit</p>
          <h2 className="text-lg font-bold uppercase leading-none text-slate-100">CONTROL PANELS</h2>
        </div>

        <div className="grid grid-cols-2 gap-1 sm:grid-cols-4">
          {TABS.map(tab => {
            const selected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`border px-3 py-1.5 text-[10px] font-bold uppercase transition-colors ${
                  selected ? tab.tone : 'border-slate-800 bg-black/20 text-slate-500 hover:border-slate-600 hover:text-slate-200'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="[&>section]:mb-0">
        {activeTab === 'health' && <ObservabilityPanel />}
        {activeTab === 'activity' && <AgentActivityPanel />}
        {activeTab === 'tasks' && <TasksPanel />}
        {activeTab === 'schedule' && <SchedulePanel />}
      </div>
    </section>
  );
}
