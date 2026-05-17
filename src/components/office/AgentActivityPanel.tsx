'use client';

import { useEffect, useMemo, useState } from 'react';

type ActivityStatus = 'running' | 'recent' | 'idle' | 'error' | 'failed';
type ActivitySource = 'task' | 'session' | 'schedule';

type AgentActivity = {
  id: string;
  name: string;
  status: ActivityStatus;
  lastActivity: {
    source: ActivitySource;
    at: string | null;
    summary: string;
    status: ActivityStatus;
    rawStatus: string;
  } | null;
  sourceCounts: Record<ActivitySource, number>;
  recentActivities: Array<{
    source: ActivitySource;
    at: string | null;
    summary: string;
    status: ActivityStatus;
    rawStatus: string;
  }>;
};

type AgentActivityResponse = {
  generatedAt: string;
  agents: AgentActivity[];
  errors: string[];
};

const STATUS_CLASS: Record<ActivityStatus, string> = {
  running: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200',
  recent: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  idle: 'border-slate-600 bg-slate-950 text-slate-400',
  error: 'border-red-500/40 bg-red-950/30 text-red-200',
  failed: 'border-red-500/40 bg-red-950/30 text-red-200',
};

const SOURCE_CLASS: Record<ActivitySource, string> = {
  task: 'text-violet-300',
  session: 'text-cyan-300',
  schedule: 'text-amber-300',
};

function formatTime(value?: string | null) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status }: { status: ActivityStatus }) {
  return (
    <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase leading-none ${STATUS_CLASS[status]}`}>
      {status}
    </span>
  );
}

function SourceLabel({ source }: { source: ActivitySource }) {
  return <span className={`font-bold uppercase ${SOURCE_CLASS[source]}`}>{source}</span>;
}

export function AgentActivityPanel() {
  const [payload, setPayload] = useState<AgentActivityResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/agent-activity', { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json() as AgentActivityResponse;
        if (active) {
          setPayload(data);
          setError(data.errors?.length ? data.errors.join(' / ') : null);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load agent activity');
      }
    };

    load();
    const timer = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const agents = useMemo(() => payload?.agents || [], [payload]);
  const counts = useMemo(() => agents.reduce<Record<ActivityStatus, number>>((acc, agent) => {
    acc[agent.status] += 1;
    return acc;
  }, { running: 0, recent: 0, idle: 0, error: 0, failed: 0 }), [agents]);

  return (
    <section className="mb-4 border-2 border-[#2d3748] bg-[#111827] p-3">
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isOpen ? 'mb-3' : ''}`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-emerald-300/80">Read-only agent monitor</p>
          <h2 className="text-xl font-bold uppercase leading-none text-slate-100">AGENT ACTIVITY</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-slate-500">
          <span>{payload ? payload.agents.length + ' agents' : 'loading'}</span>
          <span>Updated {formatTime(payload?.generatedAt)}</span>
          <button
            type="button"
            onClick={() => setIsOpen(value => !value)}
            className="border border-emerald-500/50 bg-emerald-950/30 px-2 py-1 font-bold text-emerald-200 hover:border-emerald-300 hover:text-white"
            aria-expanded={isOpen}
          >
            {isOpen ? 'HIDE' : 'OPEN'}
          </button>
        </div>
      </div>

      {!isOpen && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase text-slate-500">
          <span className="border border-slate-800 bg-black/30 px-2 py-1">running {counts.running}</span>
          <span className="border border-slate-800 bg-black/30 px-2 py-1">recent {counts.recent}</span>
          <span className="border border-slate-800 bg-black/30 px-2 py-1">idle {counts.idle}</span>
          <span className="border border-slate-800 bg-black/30 px-2 py-1">errors {counts.error + counts.failed}</span>
        </div>
      )}

      {isOpen && (
        <>
          {error && (
            <div className="mb-3 border border-red-500/50 bg-red-950/20 p-2 text-xs text-red-200">
              Agent activity partially unavailable: {error}
            </div>
          )}

          <div className="grid grid-cols-1 gap-2 xl:grid-cols-2">
            {agents.map(agent => (
              <div key={agent.id} className="border border-slate-800 bg-black/30 p-2">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm uppercase text-slate-100">{agent.name}</p>
                    <p className="truncate text-[10px] uppercase text-slate-600">{agent.id}</p>
                  </div>
                  <StatusPill status={agent.status} />
                </div>

                {agent.lastActivity ? (
                  <div className="min-w-0">
                    <div className="mb-1 flex flex-wrap items-center gap-2 text-[10px] uppercase text-slate-500">
                      <SourceLabel source={agent.lastActivity.source} />
                      <span>{agent.lastActivity.rawStatus}</span>
                      <span>{formatTime(agent.lastActivity.at)}</span>
                    </div>
                    <p className="line-clamp-2 text-xs leading-snug text-slate-400">{agent.lastActivity.summary}</p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-600">No local activity found.</p>
                )}

                <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase text-slate-600">
                  <span>tasks {agent.sourceCounts.task}</span>
                  <span>sessions {agent.sourceCounts.session}</span>
                  <span>schedule {agent.sourceCounts.schedule}</span>
                </div>
              </div>
            ))}
          </div>

          {!agents.length && !error && (
            <p className="border border-slate-800 bg-black/30 p-3 text-xs text-slate-500">No agent activity found.</p>
          )}
        </>
      )}
    </section>
  );
}
