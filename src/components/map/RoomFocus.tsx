'use client';

import { X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Agent, MapRoom } from '@/types/agent';
import { useAgentStore } from '@/store/useAgentStore';
import { AgentSprite } from './AgentSprite';

interface RoomFocusProps {
  room: MapRoom;
  agents: Agent[];
  onClose: () => void;
}

type ActivityStatus = 'running' | 'recent' | 'idle' | 'error' | 'failed';
type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';
type ScheduleStatus = 'ok' | 'idle' | 'skipped' | 'failed' | 'disabled' | 'unknown';

type ActivityItem = {
  source: 'task' | 'session' | 'schedule';
  at: string | null;
  summary: string;
  status: ActivityStatus;
  rawStatus: string;
};

type AgentActivity = {
  id: string;
  name: string;
  status: ActivityStatus;
  recentActivities: ActivityItem[];
};

type TaskItem = {
  id: string;
  label: string;
  agentId: string;
  status: TaskStatus;
  lastEventAt: string | null;
  summary: string;
};

type ScheduleItem = {
  id: string;
  name: string;
  agentId: string | null;
  targetAgentId: string | null;
  targetLabel: string | null;
  sessionTarget: string | null;
  status: ScheduleStatus;
  nextRunAt: string | null;
  lastRunAt: string | null;
};

type RoomSignals = {
  activities: AgentActivity[];
  tasks: TaskItem[];
  schedule: ScheduleItem[];
};

const STATUS_CLASS: Record<ActivityStatus | TaskStatus | ScheduleStatus, string> = {
  running: 'border-cyan-500/50 bg-cyan-950/30 text-cyan-200',
  recent: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  idle: 'border-slate-700 bg-slate-950 text-slate-400',
  error: 'border-red-500/40 bg-red-950/30 text-red-200',
  failed: 'border-red-500/40 bg-red-950/30 text-red-200',
  queued: 'border-slate-600 bg-slate-950 text-slate-300',
  completed: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  cancelled: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  unknown: 'border-slate-600 bg-slate-950/40 text-slate-300',
  ok: 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200',
  skipped: 'border-amber-500/40 bg-amber-950/30 text-amber-200',
  disabled: 'border-slate-600 bg-slate-950 text-slate-400',
};

function formatTime(value?: string | null) {
  if (!value) return 'n/a';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'n/a';
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function StatusPill({ status }: { status: ActivityStatus | TaskStatus | ScheduleStatus }) {
  return (
    <span className={`border px-2 py-0.5 text-[10px] font-bold uppercase leading-none ${STATUS_CLASS[status]}`}>
      {status}
    </span>
  );
}

export function RoomFocus({ room, agents, onClose }: RoomFocusProps) {
  const selectAgent = useAgentStore(s => s.selectAgent);
  const agentIds = useMemo(() => new Set(agents.map(agent => agent.id)), [agents]);
  const [signals, setSignals] = useState<RoomSignals | null>(null);
  const [signalsError, setSignalsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadSignals = async () => {
      try {
        const [activityResponse, taskResponse, scheduleResponse] = await Promise.all([
          fetch('/api/agent-activity', { cache: 'no-store' }),
          fetch('/api/tasks', { cache: 'no-store' }),
          fetch('/api/schedule', { cache: 'no-store' }),
        ]);

        if (!activityResponse.ok || !taskResponse.ok || !scheduleResponse.ok) {
          throw new Error('room signals unavailable');
        }

        const [activityPayload, taskPayload, schedulePayload] = await Promise.all([
          activityResponse.json() as Promise<{ agents?: AgentActivity[] }>,
          taskResponse.json() as Promise<{ tasks?: TaskItem[] }>,
          scheduleResponse.json() as Promise<{ schedule?: ScheduleItem[] }>,
        ]);

        if (!active) return;

        setSignals({
          activities: (activityPayload.agents || []).filter(agent => agentIds.has(agent.id)),
          tasks: (taskPayload.tasks || []).filter(task => agentIds.has(task.agentId)).slice(0, 4),
          schedule: (schedulePayload.schedule || [])
            .filter(item => {
              const targetAgentId = item.targetAgentId || item.agentId;
              return targetAgentId ? agentIds.has(targetAgentId) : agentIds.has('main') && item.sessionTarget === 'main';
            })
            .slice(0, 4),
        });
        setSignalsError(null);
      } catch (error) {
        if (active) setSignalsError(error instanceof Error ? error.message : 'Unable to load room signals');
      }
    };

    loadSignals();
    const timer = setInterval(loadSignals, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [agentIds]);

  const recentActivities = useMemo(() => {
    return (signals?.activities || [])
      .flatMap(agent => agent.recentActivities.map(activity => ({ ...activity, agentName: agent.name })))
      .sort((a, b) => new Date(b.at || 0).getTime() - new Date(a.at || 0).getTime())
      .slice(0, 4);
  }, [signals]);

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/80 p-3 font-pixel">
      <div className="pixel-box flex max-h-[88vh] w-full max-w-4xl flex-col overflow-hidden bg-[#111827]">
        <div className="flex items-center justify-between gap-3 border-b-4 border-[#2d3748] bg-[#151921] px-4 py-3">
          <div className="min-w-0">
            <p className="text-[10px] uppercase tracking-[0.18em] text-cyan-300/80">Room Focus</p>
            <h2 className="truncate text-2xl font-bold uppercase leading-none text-white">{room.label}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 shrink-0 place-items-center border-2 border-slate-700 bg-slate-950 text-slate-300 hover:border-cyan-400 hover:text-white"
            aria-label="Close room focus"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 gap-4 overflow-y-auto p-4 md:grid-cols-[1.35fr_0.65fr]">
          <section className="rpg-focus-floor relative min-h-[320px] overflow-hidden border-4 border-[#2d3748] bg-[#172033]">
            <div
              className="rpg-focus-bg"
              style={{
                backgroundPosition: `${Math.max(0, Math.min(room.x + room.w / 2, 100))}% ${Math.max(0, Math.min(room.y + room.h / 2, 100))}%`,
              }}
            />
            <div className="absolute left-4 top-4 max-w-[70%]">
              <p className="rpg-focus-description text-sm leading-snug text-slate-200">{room.description}</p>
            </div>
            {agents.map((agent, index) => (
              <AgentSprite
                key={agent.id}
                agent={agent}
                index={index}
                total={agents.length}
                anchorX={room.agentX}
                anchorY={room.agentY}
              />
            ))}
            {!agents.length && (
              <div className="absolute inset-0 grid place-items-center text-sm uppercase tracking-widest text-slate-500">
                Empty room
              </div>
            )}
          </section>

          <section className="space-y-3 border-2 border-[#2d3748] bg-[#151921] p-3">
            <h3 className="mb-3 text-xs uppercase text-cyan-300">Agents in room</h3>
            <div className="space-y-2">
              {agents.map(agent => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => selectAgent(agent.id)}
                  className="w-full border-2 border-slate-800 bg-slate-950 px-3 py-2 text-left hover:border-cyan-500/60"
                >
                  <span className="block truncate text-sm uppercase leading-none text-white">{agent.name}</span>
                  <span className="mt-1 block text-[10px] uppercase leading-none text-slate-500">{agent.status}</span>
                </button>
              ))}
              {!agents.length && <p className="text-sm text-slate-500">No agents assigned.</p>}
            </div>

            <div className="border-t border-slate-800 pt-3">
              <h3 className="mb-2 text-xs uppercase text-emerald-300">Room signals</h3>
              {signalsError && <p className="text-xs text-red-300">{signalsError}</p>}
              {!signals && !signalsError && <p className="text-xs text-slate-500">Loading signals...</p>}

              {signals && (
                <div className="space-y-3">
                  <div>
                    <p className="mb-1 text-[10px] uppercase text-slate-500">Activity</p>
                    <div className="space-y-1.5">
                      {recentActivities.map((activity, index) => (
                        <div key={activity.agentName + activity.source + activity.at + index} className="border border-slate-800 bg-black/25 p-2">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <StatusPill status={activity.status} />
                            <span className="text-[10px] uppercase text-slate-500">{activity.agentName} / {activity.source}</span>
                          </div>
                          <p className="line-clamp-2 text-xs leading-snug text-slate-400">{activity.summary}</p>
                          <p className="mt-1 text-[10px] uppercase text-slate-600">{formatTime(activity.at)}</p>
                        </div>
                      ))}
                      {!recentActivities.length && <p className="text-xs text-slate-600">No recent room activity.</p>}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] uppercase text-slate-500">Tasks</p>
                    <div className="space-y-1.5">
                      {signals.tasks.map(task => (
                        <div key={task.id || task.label} className="border border-slate-800 bg-black/25 p-2">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <StatusPill status={task.status} />
                            <span className="text-[10px] uppercase text-slate-600">{formatTime(task.lastEventAt)}</span>
                          </div>
                          <p className="truncate text-xs uppercase text-slate-300">{task.label}</p>
                        </div>
                      ))}
                      {!signals.tasks.length && <p className="text-xs text-slate-600">No tracked room tasks.</p>}
                    </div>
                  </div>

                  <div>
                    <p className="mb-1 text-[10px] uppercase text-slate-500">Schedule</p>
                    <div className="space-y-1.5">
                      {signals.schedule.map(item => (
                        <div key={item.id || item.name} className="border border-slate-800 bg-black/25 p-2">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <StatusPill status={item.status} />
                            <span className="text-[10px] uppercase text-slate-600">next {formatTime(item.nextRunAt)}</span>
                            {item.targetLabel && <span className="text-[10px] uppercase text-cyan-400">{item.targetLabel}</span>}
                          </div>
                          <p className="truncate text-xs uppercase text-slate-300">{item.name}</p>
                        </div>
                      ))}
                      {!signals.schedule.length && <p className="text-xs text-slate-600">No room schedule.</p>}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
