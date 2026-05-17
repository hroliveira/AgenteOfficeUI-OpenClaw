'use client';

import { useEffect, useMemo, useState } from 'react';

type HealthStatus = 'ok' | 'degraded' | 'down' | 'unknown';

type ServiceHealth = {
  id: string;
  label: string;
  status: HealthStatus;
  detail: string;
  since?: string;
};

type ChannelHealth = {
  id: string;
  label: string;
  status: HealthStatus;
  mode?: string;
  lastConnectedAt?: string;
  lastError?: string | null;
};

type HealthResponse = {
  generatedAt: string;
  status: HealthStatus;
  services: ServiceHealth[];
  channels: ChannelHealth[];
  metrics: {
    eventLoop: {
      status: string;
      delayP99Ms: number | null;
      utilization: number | null;
    } | null;
    modelPricing: string;
    heartbeatSeconds: number | null;
    tokenUsage: string;
  };
  recentEvents: string[];
};

const STATUS_CLASS: Record<HealthStatus, string> = {
  ok: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  degraded: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  down: 'border-red-500/40 bg-red-950/30 text-red-200',
  unknown: 'border-slate-600 bg-slate-950/40 text-slate-300',
};

function statusLabel(status: HealthStatus) {
  if (status === 'ok') return 'OK';
  if (status === 'degraded') return 'WARN';
  if (status === 'down') return 'DOWN';
  return 'UNKNOWN';
}

function formatTime(value?: string) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status }: { status: HealthStatus }) {
  return (
    <span className={`border px-2 py-0.5 text-[10px] font-bold leading-none ${STATUS_CLASS[status]}`}>
      {statusLabel(status)}
    </span>
  );
}

function HealthCard({ label, status, detail }: { label: string; status: HealthStatus; detail: string }) {
  return (
    <div className="border-2 border-[#2d3748] bg-[#151921] p-2">
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="truncate text-xs uppercase text-slate-200">{label}</span>
        <StatusPill status={status} />
      </div>
      <p className="truncate text-[10px] text-slate-500">{detail}</p>
    </div>
  );
}

export function ObservabilityPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const response = await fetch('/api/health', { cache: 'no-store' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json() as HealthResponse;
        if (active) {
          setHealth(data);
          setError(null);
        }
      } catch (loadError) {
        if (active) {
          setError(loadError instanceof Error ? loadError.message : 'Unable to load health');
        }
      }
    };

    load();
    const timer = setInterval(load, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const visibleEvents = useMemo(() => health?.recentEvents.slice(-3) || [], [health]);

  if (error) {
    return (
      <section className="mb-4 border-2 border-red-500/50 bg-red-950/20 p-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm uppercase text-red-200">System Health</h2>
          <StatusPill status="down" />
        </div>
        <p className="mt-2 text-xs text-red-200">Health endpoint unavailable: {error}</p>
      </section>
    );
  }

  if (!health) {
    return (
      <section className="mb-4 border-2 border-[#2d3748] bg-[#111827] p-3">
        <h2 className="text-sm uppercase text-slate-300">System Health</h2>
        <p className="mt-2 text-xs text-slate-500">Loading local health...</p>
      </section>
    );
  }

  return (
    <section className="mb-4 border-2 border-[#2d3748] bg-[#111827] p-3">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/80">Read-only observability</p>
          <h2 className="text-xl font-bold uppercase leading-none text-slate-100">SYSTEM HEALTH</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] uppercase text-slate-500">Updated {formatTime(health.generatedAt)}</span>
          <StatusPill status={health.status} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-5">
        {health.services.map(service => (
          <HealthCard key={service.id} label={service.label} status={service.status} detail={service.detail} />
        ))}
        {health.channels.map(channel => (
          <HealthCard
            key={channel.id}
            label={channel.label}
            status={channel.status}
            detail={channel.lastError || `${channel.mode || 'channel'} / last ${formatTime(channel.lastConnectedAt)}`}
          />
        ))}
      </div>

      <div className="mt-3 grid grid-cols-1 gap-2 lg:grid-cols-[0.7fr_1.3fr]">
        <div className="border border-slate-800 bg-black/30 p-2 text-[10px] uppercase text-slate-400">
          <div className="flex justify-between gap-2">
            <span>Event loop</span>
            <span className={health.metrics.eventLoop?.status === 'ok' ? 'text-emerald-300' : 'text-amber-300'}>
              {health.metrics.eventLoop?.status || 'unknown'}
            </span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span>Delay p99</span>
            <span>{health.metrics.eventLoop?.delayP99Ms ?? 'n/a'} ms</span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span>Model pricing</span>
            <span>{health.metrics.modelPricing}</span>
          </div>
          <div className="mt-1 flex justify-between gap-2">
            <span>Token usage</span>
            <span>{health.metrics.tokenUsage}</span>
          </div>
        </div>

        <div className="border border-slate-800 bg-black/30 p-2">
          <h3 className="mb-1 text-[10px] uppercase text-slate-400">Recent gateway signals</h3>
          {visibleEvents.length ? (
            <ul className="space-y-1">
              {visibleEvents.map(event => (
                <li key={event} className="truncate text-[10px] text-slate-500">{event}</li>
              ))}
            </ul>
          ) : (
            <p className="text-[10px] text-slate-600">No recent warnings or errors.</p>
          )}
        </div>
      </div>
    </section>
  );
}
