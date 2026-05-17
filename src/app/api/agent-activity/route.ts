import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const OPENCLAW_BIN = '/home/helinton/.npm-global/bin/openclaw';

const RECENT_MS = 6 * 60 * 60 * 1000;
const ERROR_RECENT_MS = 24 * 60 * 60 * 1000;

const AGENTS = [
  { id: 'main', name: 'Lilith' },
  { id: 'clareza-dev', name: 'Tomas' },
  { id: 'clareza-qa', name: 'Cecilia' },
  { id: 'nodesync-marketing', name: 'Maya' },
  { id: 'personal-finance', name: 'Daikokuten' },
  { id: 'ariel-platform', name: 'Ariel' },
] as const;

type AgentId = typeof AGENTS[number]['id'];
type ActivitySource = 'task' | 'session' | 'schedule';
type ActivityStatus = 'running' | 'recent' | 'idle' | 'error' | 'failed';

type RawTask = {
  taskId?: string;
  runtime?: string;
  agentId?: string;
  label?: string;
  task?: string;
  status?: string;
  createdAt?: number;
  startedAt?: number;
  endedAt?: number;
  lastEventAt?: number;
  terminalSummary?: string;
};

type RawSession = {
  agentId?: string;
  updatedAt?: number;
  kind?: string;
  model?: string;
  modelProvider?: string;
  abortedLastRun?: boolean;
};

type RawSchedule = {
  id?: string;
  agentId?: string;
  name?: string;
  enabled?: boolean;
  status?: string;
  updatedAtMs?: number;
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    runningAtMs?: number;
    lastRunStatus?: string;
    lastStatus?: string;
    lastError?: string;
    consecutiveErrors?: number;
  };
};

type Activity = {
  agentId: AgentId;
  source: ActivitySource;
  status: ActivityStatus;
  rawStatus: string;
  at: string | null;
  timestamp: number;
  summary: string;
};

function redact(value: string) {
  return value
    .replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<redacted>')
    .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, '$1<redacted>')
    .replace(/([?&](?:token|access_token|key|secret|password|auth|signature)=)[^\s&]+/gi, '$1<redacted>')
    .replace(/\b(?:OPENAI|ANTHROPIC|GEMINI|GOOGLE|GOG|TELEGRAM|DISCORD|SLACK)_[A-Z0-9_]*=\S+/g, '<redacted-env>')
    .replace(/(GOG_KEYRING_PASSWORD=)[^\s]+/g, '$1<redacted>')
    .replace(/https?:\/\/\S+/gi, '<redacted-url>')
    .replace(/agent:[A-Za-z0-9:_-]+/g, 'agent:<redacted>');
}

function cleanText(value?: string, max = 120) {
  if (!value) return '';
  const normalized = redact(value)
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return normalized.length > max ? normalized.slice(0, max - 1) + '…' : normalized;
}

function iso(ms?: number) {
  return ms ? new Date(ms).toISOString() : null;
}

function isAgentId(value?: string): value is AgentId {
  return Boolean(value && AGENTS.some(agent => agent.id === value));
}

async function runOpenClaw(args: string[]) {
  const { stdout } = await execFileAsync(OPENCLAW_BIN, args, {
    timeout: 8_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return stdout;
}

async function loadTasks() {
  const stdout = await runOpenClaw(['tasks', 'list', '--json']);
  return JSON.parse(stdout) as { tasks?: RawTask[] };
}

async function loadSessions() {
  const stdout = await runOpenClaw(['sessions', '--all-agents', '--json']);
  return JSON.parse(stdout) as { sessions?: RawSession[] };
}

async function loadSchedules() {
  const stdout = await runOpenClaw(['cron', 'list', '--json']);
  return JSON.parse(stdout) as { jobs?: RawSchedule[] };
}

function taskStatus(status?: string): ActivityStatus {
  if (status === 'running' || status === 'in_progress' || status === 'queued' || status === 'pending') return 'running';
  if (status === 'failed' || status === 'timed_out' || status === 'lost') return 'failed';
  return 'recent';
}

function taskSummary(task: RawTask) {
  if (task.label) return cleanText(task.label);
  const terminalSummary = cleanText(task.terminalSummary, 80);
  if (terminalSummary && !terminalSummary.startsWith('[')) return terminalSummary;
  const rawStatus = cleanText(task.status || 'task', 40);
  return rawStatus === 'unknown' ? 'Task activity' : `Task ${rawStatus}`;
}

function scheduleStatus(job: RawSchedule): ActivityStatus {
  const raw = job.status || job.state?.lastStatus || job.state?.lastRunStatus || 'idle';
  if (raw === 'running' || job.state?.runningAtMs) return 'running';
  if (raw === 'failed' || raw === 'errored' || raw === 'error' || (job.state?.consecutiveErrors ?? 0) > 0) return 'failed';
  return 'recent';
}

function sessionStatus(session: RawSession): ActivityStatus {
  return session.abortedLastRun ? 'failed' : 'recent';
}

function taskActivity(task: RawTask): Activity | null {
  if (!isAgentId(task.agentId)) return null;
  const timestamp = task.lastEventAt || task.endedAt || task.startedAt || task.createdAt || 0;
  if (!timestamp) return null;
  return {
    agentId: task.agentId,
    source: 'task',
    status: taskStatus(task.status),
    rawStatus: cleanText(task.status || 'unknown', 40),
    at: iso(timestamp),
    timestamp,
    summary: taskSummary(task),
  };
}

function sessionActivity(session: RawSession): Activity | null {
  if (!isAgentId(session.agentId) || !session.updatedAt) return null;
  const kind = cleanText(session.kind || 'session', 40);
  const model = cleanText(session.model || session.modelProvider || 'model unavailable', 60);
  return {
    agentId: session.agentId,
    source: 'session',
    status: sessionStatus(session),
    rawStatus: session.abortedLastRun ? 'aborted' : 'updated',
    at: iso(session.updatedAt),
    timestamp: session.updatedAt,
    summary: `${kind} session updated / ${model}`,
  };
}

function scheduleActivity(job: RawSchedule): Activity | null {
  const agentId = job.agentId || 'main';
  if (!isAgentId(agentId)) return null;
  const timestamp = job.state?.runningAtMs || job.state?.lastRunAtMs || job.updatedAtMs || job.state?.nextRunAtMs || 0;
  if (!timestamp) return null;
  const rawStatus = job.status || job.state?.lastStatus || job.state?.lastRunStatus || (job.enabled ? 'idle' : 'disabled');
  return {
    agentId,
    source: 'schedule',
    status: scheduleStatus(job),
    rawStatus: cleanText(rawStatus, 40),
    at: iso(timestamp),
    timestamp,
    summary: cleanText(job.name || 'Schedule activity'),
  };
}

function deriveAgentStatus(activities: Activity[], now: number): ActivityStatus {
  if (activities.some(activity => activity.status === 'running')) return 'running';
  if (activities.some(activity => (activity.status === 'failed' || activity.status === 'error') && now - activity.timestamp <= ERROR_RECENT_MS)) {
    return 'error';
  }
  const latest = activities[0];
  if (latest && now - latest.timestamp <= RECENT_MS) return 'recent';
  return 'idle';
}

function sourceCounts(activities: Activity[]) {
  return activities.reduce<Record<ActivitySource, number>>((acc, activity) => {
    acc[activity.source] += 1;
    return acc;
  }, { task: 0, session: 0, schedule: 0 });
}

export async function GET() {
  const generatedAt = new Date();
  const errors: string[] = [];

  const [taskResult, sessionResult, scheduleResult] = await Promise.allSettled([
    loadTasks(),
    loadSessions(),
    loadSchedules(),
  ]);

  if (taskResult.status === 'rejected') errors.push('tasks unavailable: ' + cleanText(taskResult.reason instanceof Error ? taskResult.reason.message : 'unknown error'));
  if (sessionResult.status === 'rejected') errors.push('sessions unavailable: ' + cleanText(sessionResult.reason instanceof Error ? sessionResult.reason.message : 'unknown error'));
  if (scheduleResult.status === 'rejected') errors.push('schedule unavailable: ' + cleanText(scheduleResult.reason instanceof Error ? scheduleResult.reason.message : 'unknown error'));

  const taskActivities = taskResult.status === 'fulfilled'
    ? (taskResult.value.tasks || []).map(taskActivity).filter((activity): activity is Activity => Boolean(activity))
    : [];
  const sessionActivities = sessionResult.status === 'fulfilled'
    ? (sessionResult.value.sessions || []).map(sessionActivity).filter((activity): activity is Activity => Boolean(activity))
    : [];
  const scheduleActivities = scheduleResult.status === 'fulfilled'
    ? (scheduleResult.value.jobs || []).map(scheduleActivity).filter((activity): activity is Activity => Boolean(activity))
    : [];

  const allActivities = [...taskActivities, ...sessionActivities, ...scheduleActivities]
    .sort((a, b) => b.timestamp - a.timestamp);

  const agents = AGENTS.map(agent => {
    const activities = allActivities
      .filter(activity => activity.agentId === agent.id)
      .slice(0, 4);

    return {
      id: agent.id,
      name: agent.name,
      status: deriveAgentStatus(activities, generatedAt.getTime()),
      lastActivity: activities[0] ? {
        source: activities[0].source,
        at: activities[0].at,
        summary: activities[0].summary,
        status: activities[0].status,
        rawStatus: activities[0].rawStatus,
      } : null,
      sourceCounts: sourceCounts(activities),
      recentActivities: activities.map(activity => ({
        source: activity.source,
        at: activity.at,
        summary: activity.summary,
        status: activity.status,
        rawStatus: activity.rawStatus,
      })),
    };
  });

  return NextResponse.json({
    generatedAt: generatedAt.toISOString(),
    agents,
    errors,
  }, { status: errors.length === 3 ? 500 : 200 });
}
