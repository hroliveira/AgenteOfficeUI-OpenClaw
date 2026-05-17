'use client';

import { useEffect, useMemo, useState } from 'react';

type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';

type TaskItem = {
  id: string;
  label: string;
  runtime: string;
  agentId: string;
  status: TaskStatus;
  rawStatus: string;
  deliveryStatus: string | null;
  createdAt: string | null;
  startedAt: string | null;
  endedAt: string | null;
  lastEventAt: string | null;
  summary: string;
};

type TasksResponse = {
  generatedAt: string;
  totalTracked: number;
  shown: number;
  counts: Record<TaskStatus, number> | null;
  tasks: TaskItem[];
  error?: string;
};

const STATUS_CLASS: Record<TaskStatus, string> = {
  queued: 'border-slate-600 bg-slate-950 text-slate-300',
  running: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200',
  completed: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  failed: 'border-red-500/40 bg-red-950/30 text-red-200',
  cancelled: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  unknown: 'border-slate-600 bg-slate-950/40 text-slate-300',
};

function formatTime(value?: string | null) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status }: { status: TaskStatus }) {
  return (
    <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase leading-none ${STATUS_CLASS[status]}`}>
      {status}
    </span>
  );
}

export function TasksPanel() {
  const [payload, setPayload] = useState<TasksResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/tasks', { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json() as TasksResponse;
        if (active) {
          setPayload(data);
          setError(data.error || null);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load tasks');
      }
    };

    load();
    const timer = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const counts = payload?.counts;
  const taskRows = useMemo(() => payload?.tasks || [], [payload]);

  return (
    <section className="mb-4 border-2 border-[#2d3748] bg-[#111827] p-3">
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isOpen ? 'mb-3' : ''}`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-violet-300/80">Read-only task monitor</p>
          <h2 className="text-xl font-bold uppercase leading-none text-slate-100">TASKS</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-slate-500">
          <span>{payload ? payload.shown + '/' + payload.totalTracked + ' shown' : 'loading'}</span>
          <span>Updated {formatTime(payload?.generatedAt)}</span>
          <button
            type="button"
            onClick={() => setIsOpen(value => !value)}
            className="border border-violet-500/50 bg-violet-950/30 px-2 py-1 font-bold text-violet-200 hover:border-violet-300 hover:text-white"
            aria-expanded={isOpen}
          >
            {isOpen ? 'HIDE' : 'OPEN'}
          </button>
        </div>
      </div>

      {!isOpen && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase text-slate-500">
          <span className="border border-slate-800 bg-black/30 px-2 py-1">completed {counts?.completed ?? 0}</span>
          <span className="border border-slate-800 bg-black/30 px-2 py-1">running {counts?.running ?? 0}</span>
          <span className="border border-slate-800 bg-black/30 px-2 py-1">failed {counts?.failed ?? 0}</span>
        </div>
      )}

      {isOpen && (
        <>
      {error && (
        <div className="border border-red-500/50 bg-red-950/20 p-2 text-xs text-red-200">
          Tasks unavailable: {error}
        </div>
      )}

      {counts && (
        <div className="mb-3 grid grid-cols-3 gap-2 text-center text-xs sm:grid-cols-6">
          {(Object.keys(counts) as TaskStatus[]).map(status => (
            <div key={status} className="border border-slate-800 bg-black/30 px-2 py-1">
              <span className="block text-base leading-none text-slate-100">{counts[status]}</span>
              <small className="block uppercase text-slate-500">{status}</small>
            </div>
          ))}
        </div>
      )}

      <div className="space-y-2">
        {taskRows.map(task => (
          <div key={task.id} className="grid gap-2 border border-slate-800 bg-black/30 p-2 md:grid-cols-[1fr_auto]">
            <div className="min-w-0">
              <div className="mb-1 flex flex-wrap items-center gap-2">
                <StatusPill status={task.status} />
                <span className="text-[10px] uppercase text-slate-500">{task.runtime} / {task.agentId}</span>
                <span className="text-[10px] uppercase text-slate-600">last {formatTime(task.lastEventAt)}</span>
              </div>
              <p className="truncate text-sm uppercase text-slate-100">{task.label}</p>
              {task.summary && <p className="mt-1 line-clamp-2 text-xs leading-snug text-slate-500">{task.summary}</p>}
            </div>
            <div className="flex items-start justify-between gap-2 text-[10px] uppercase text-slate-600 md:flex-col md:items-end">
              <span>start {formatTime(task.startedAt || task.createdAt)}</span>
              <span>end {formatTime(task.endedAt)}</span>
            </div>
          </div>
        ))}

        {!error && !taskRows.length && (
          <p className="border border-slate-800 bg-black/30 p-3 text-xs text-slate-500">No tracked tasks found.</p>
        )}
      </div>
        </>
      )}
    </section>
  );
}
