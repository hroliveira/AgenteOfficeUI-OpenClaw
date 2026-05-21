'use client';

import { useEffect, useMemo, useState } from 'react';
import { MAP_ROOMS, MEETING_ROOM_ID } from '@/config/mapLayout';
import { useAgentStore } from '@/store/useAgentStore';
import { MapRoom } from '@/types/agent';
import { RpgRoom, RoomSignalSummary } from './RpgRoom';
import { RoomFocus } from './RoomFocus';

type ActivityStatus = 'running' | 'recent' | 'idle' | 'error' | 'failed';
type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';
type ScheduleStatus = 'ok' | 'idle' | 'skipped' | 'failed' | 'disabled' | 'unknown';

type AgentActivity = {
  id: string;
  status: ActivityStatus;
};

type TaskItem = {
  agentId: string;
  status: TaskStatus;
};

type ScheduleItem = {
  agentId: string | null;
  targetAgentId: string | null;
  status: ScheduleStatus;
  nextRunAt: string | null;
};

type SignalPayload = {
  activities: AgentActivity[];
  tasks: TaskItem[];
  schedule: ScheduleItem[];
};

function emptyRoomSignals(): RoomSignalSummary {
  return {
    activityCount: 0,
    taskCount: 0,
    scheduleCount: 0,
    hasFailure: false,
    nextScheduleAt: null,
  };
}

export function RpgMap() {
  const agentsById = useAgentStore(s => s.agents);
  const agents = useMemo(() => Object.values(agentsById), [agentsById]);
  const [focusedRoom, setFocusedRoom] = useState<MapRoom | null>(null);
  const [meetingMode, setMeetingMode] = useState(false);
  const [signals, setSignals] = useState<SignalPayload | null>(null);
  const meetingRoom = useMemo(() => MAP_ROOMS.find(room => room.id === MEETING_ROOM_ID) || null, []);
  const displayedAgents = useMemo(() => (
    meetingMode ? agents.map(agent => ({ ...agent, room: MEETING_ROOM_ID })) : agents
  ), [agents, meetingMode]);

  const agentsByRoom = useMemo(() => {
    return displayedAgents.reduce<Record<string, typeof displayedAgents>>((acc, agent) => {
      acc[agent.room] = acc[agent.room] || [];
      acc[agent.room].push(agent);
      return acc;
    }, {});
  }, [displayedAgents]);

  useEffect(() => {
    let active = true;

    const loadSignals = async () => {
      try {
        const [activityResponse, taskResponse, scheduleResponse] = await Promise.all([
          fetch('/api/agent-activity', { cache: 'no-store' }),
          fetch('/api/tasks', { cache: 'no-store' }),
          fetch('/api/schedule', { cache: 'no-store' }),
        ]);

        if (!activityResponse.ok || !taskResponse.ok || !scheduleResponse.ok) return;

        const [activityPayload, taskPayload, schedulePayload] = await Promise.all([
          activityResponse.json() as Promise<{ agents?: AgentActivity[] }>,
          taskResponse.json() as Promise<{ tasks?: TaskItem[] }>,
          scheduleResponse.json() as Promise<{ schedule?: ScheduleItem[] }>,
        ]);

        if (!active) return;
        setSignals({
          activities: activityPayload.agents || [],
          tasks: taskPayload.tasks || [],
          schedule: schedulePayload.schedule || [],
        });
      } catch {
        if (active) setSignals(null);
      }
    };

    loadSignals();
    const timer = setInterval(loadSignals, 60_000);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, []);

  const roomSignals = useMemo(() => {
    const summary = MAP_ROOMS.reduce<Record<string, RoomSignalSummary>>((acc, room) => {
      acc[room.id] = emptyRoomSignals();
      return acc;
    }, {});

    if (!signals) return summary;

    MAP_ROOMS.forEach(room => {
      const agentIds = new Set((agentsByRoom[room.id] || []).map(agent => agent.id));
      const roomSummary = summary[room.id];

      const activities = signals.activities.filter(activity => agentIds.has(activity.id));
      const tasks = signals.tasks.filter(task => agentIds.has(task.agentId));
      const schedules = signals.schedule.filter(item => {
        const targetAgentId = item.targetAgentId || item.agentId;
        return targetAgentId ? agentIds.has(targetAgentId) : agentIds.has('main');
      });

      roomSummary.activityCount = activities.filter(activity => activity.status !== 'idle').length;
      roomSummary.taskCount = tasks.length;
      roomSummary.scheduleCount = schedules.length;
      roomSummary.hasFailure = activities.some(activity => activity.status === 'error' || activity.status === 'failed') ||
        tasks.some(task => task.status === 'failed') ||
        schedules.some(item => item.status === 'failed');
      roomSummary.nextScheduleAt = schedules
        .map(item => item.nextRunAt)
        .filter((value): value is string => Boolean(value))
        .sort()[0] || null;
    });

    return summary;
  }, [agentsByRoom, signals]);

  function toggleMeetingMode() {
    setMeetingMode(value => {
      const next = !value;
      if (next && meetingRoom) setFocusedRoom(meetingRoom);
      return next;
    });
  }

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-1 border-2 border-[#2d3748] bg-[#111827] px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold uppercase leading-none text-white">RPG Map</h2>
          <p className="mt-1 text-xs leading-none text-slate-500">
            {meetingMode ? 'Meeting mode active: all agents in Meeting Hall' : 'Top-down experimental office view'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.16em] text-cyan-300/80">
          <span>{agents.length} agents mapped</span>
          <button
            type="button"
            onClick={toggleMeetingMode}
            className={`border px-2 py-1 font-bold leading-none tracking-normal transition-colors ${meetingMode ? 'border-amber-300 bg-amber-300 text-black' : 'border-slate-700 bg-slate-950 text-slate-400 hover:border-cyan-400 hover:text-white'}`}
            aria-pressed={meetingMode}
          >
            Meeting mode
          </button>
        </div>
      </div>

      <div className={`rpg-map-shell ${meetingMode ? 'rpg-map-shell-meeting' : ''}`}>
        <div className="rpg-map">
          {MAP_ROOMS.map(room => (
            <RpgRoom
              key={room.id}
              room={room}
              agents={agentsByRoom[room.id] || []}
              signals={roomSignals[room.id]}
              onFocus={setFocusedRoom}
            />
          ))}
        </div>
      </div>

      {focusedRoom && (
        <RoomFocus
          room={focusedRoom}
          agents={agentsByRoom[focusedRoom.id] || []}
          onClose={() => setFocusedRoom(null)}
        />
      )}
    </section>
  );
}
