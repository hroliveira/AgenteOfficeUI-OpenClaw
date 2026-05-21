'use client';

import { useEffect, useMemo, useState } from 'react';

type ScheduleStatus = 'ok' | 'idle' | 'skipped' | 'failed' | 'disabled' | 'unknown';

type ScheduleItem = {
  id: string;
  name: string;
  enabled: boolean;
  deleteAfterRun: boolean;
  status: ScheduleStatus;
  rawStatus: string | null;
  type: string;
  detail: string;
  agentId: string | null;
  targetAgentId: string | null;
  targetLabel: string | null;
  sessionTarget: string | null;
  payloadKind: string | null;
  deliveryMode: string | null;
  wakeMode: string | null;
  nextRunAt: string | null;
  lastRunAt: string | null;
  lastDurationMs: number | null;
  lastError: string | null;
  consecutiveErrors: number;
  consecutiveSkipped: number;
};

type ScheduleResponse = {
  generatedAt: string;
  total: number;
  shown: number;
  counts: { total: number; enabled: number; disabled: number; oneShot: number; recurring: number } | null;
  schedule: ScheduleItem[];
  error?: string;
};

const STATUS_CLASS: Record<ScheduleStatus, string> = {
  ok: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  idle: 'border-cyan-500/40 bg-cyan-950/30 text-cyan-200',
  skipped: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  failed: 'border-red-500/40 bg-red-950/30 text-red-200',
  disabled: 'border-slate-600 bg-slate-950 text-slate-400',
  unknown: 'border-slate-600 bg-slate-950/40 text-slate-300',
};

function formatTime(value?: string | null) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status }: { status: ScheduleStatus }) {
  return (
    <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase leading-none ${STATUS_CLASS[status]}`}>
      {status}
    </span>
  );
}

export function SchedulePanel() {
  const [payload, setPayload] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/schedule', { cache: 'no-store' });
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const data = await response.json() as ScheduleResponse;
        if (active) {
          setPayload(data);
          setError(data.error || null);
        }
      } catch (loadError) {
        if (active) setError(loadError instanceof Error ? loadError.message : 'Unable to load schedule');
      }
    };

    load();
    const timer = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const items = useMemo(() => payload?.schedule || [], [payload]);
  const counts = payload?.counts;

  return (
    <section className="mb-4 border-2 border-[#2d3748] bg-[#111827] p-3">
      <div className={`flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between ${isOpen ? 'mb-3' : ''}`}>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-amber-300/80">Read-only schedule monitor</p>
          <h2 className="text-xl font-bold uppercase leading-none text-slate-100">SCHEDULE</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase text-slate-500">
          <span>{payload ? payload.shown + '/' + payload.total + ' shown' : 'loading'}</span>
          <span>Updated {formatTime(payload?.generatedAt)}</span>
          <button
            type="button"
            onClick={() => setIsOpen(value => !value)}
            className="border border-amber-500/50 bg-amber-950/30 px-2 py-1 font-bold text-amber-200 hover:border-amber-300 hover:text-white"
            aria-expanded={isOpen}
          >
            {isOpen ? 'HIDE' : 'OPEN'}
          </button>
        </div>
      </div>

      {!isOpen && (
        <div className="mt-2 flex flex-wrap gap-2 text-[10px] uppercase text-slate-500">
          <span className="border border-slate-800 bg-black/30 px-2 py-1">enabled {counts?.enabled ?? 0}</span>
          <span className="border border-slate-800 bg-black/30 px-2 py-1">one-shot {counts?.oneShot ?? 0}</span>
          <span className="border border-slate-800 bg-black/30 px-2 py-1">recurring {counts?.recurring ?? 0}</span>
        </div>
      )}

      {isOpen && (
        <>
          {error && (
            <div className="border border-red-500/50 bg-red-950/20 p-2 text-xs text-red-200">
              Schedule unavailable: {error}
            </div>
          )}

          {counts && (
            <div className="mb-3 grid grid-cols-2 gap-2 text-center text-xs sm:grid-cols-5">
              <div className="border border-slate-800 bg-black/30 px-2 py-1"><span className="block text-base leading-none text-slate-100">{counts.total}</span><small className="block uppercase text-slate-500">total</small></div>
              <div className="border border-slate-800 bg-black/30 px-2 py-1"><span className="block text-base leading-none text-slate-100">{counts.enabled}</span><small className="block uppercase text-slate-500">enabled</small></div>
              <div className="border border-slate-800 bg-black/30 px-2 py-1"><span className="block text-base leading-none text-slate-100">{counts.disabled}</span><small className="block uppercase text-slate-500">disabled</small></div>
              <div className="border border-slate-800 bg-black/30 px-2 py-1"><span className="block text-base leading-none text-slate-100">{counts.oneShot}</span><small className="block uppercase text-slate-500">one-shot</small></div>
              <div className="border border-slate-800 bg-black/30 px-2 py-1"><span className="block text-base leading-none text-slate-100">{counts.recurring}</span><small className="block uppercase text-slate-500">recurring</small></div>
            </div>
          )}

          <div className="space-y-2">
            {items.map(item => (
              <div key={item.id} className="grid gap-2 border border-slate-800 bg-black/30 p-2 md:grid-cols-[1fr_auto]">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <StatusPill status={item.status} />
                    <span className="text-[10px] uppercase text-slate-500">{item.type}</span>
                    <span className="text-[10px] uppercase text-cyan-400">{item.targetLabel || item.targetAgentId || 'unassigned'}</span>
                    <span className="text-[10px] uppercase text-slate-600">{item.sessionTarget || item.agentId || 'no target'}</span>
                  </div>
                  <p className="truncate text-sm uppercase text-slate-100">{item.name}</p>
                  <p className="mt-1 truncate text-xs text-slate-500">{item.detail || item.payloadKind || 'No schedule detail'}</p>
                  {item.lastError && <p className="mt-1 truncate text-xs text-red-300">{item.lastError}</p>}
                </div>
                <div className="flex items-start justify-between gap-2 text-[10px] uppercase text-slate-600 md:flex-col md:items-end">
                  <span>next {formatTime(item.nextRunAt)}</span>
                  <span>last {formatTime(item.lastRunAt)}</span>
                </div>
              </div>
            ))}

            {!error && !items.length && (
              <p className="border border-slate-800 bg-black/30 p-3 text-xs text-slate-500">No schedules found.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
