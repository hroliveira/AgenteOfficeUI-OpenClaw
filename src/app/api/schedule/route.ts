import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const OPENCLAW_BIN = '/home/helinton/.npm-global/bin/openclaw';

type RawSchedule = {
  id?: string;
  name?: string;
  enabled?: boolean;
  deleteAfterRun?: boolean;
  agentId?: string;
  sessionTarget?: string;
  wakeMode?: string;
  schedule?: {
    kind?: string;
    at?: string;
    expr?: string;
    tz?: string;
    everyMs?: number;
  };
  payload?: {
    kind?: string;
  };
  delivery?: {
    mode?: string;
    channel?: string;
  };
  state?: {
    nextRunAtMs?: number;
    lastRunAtMs?: number;
    lastRunStatus?: string;
    lastStatus?: string;
    lastDurationMs?: number;
    lastError?: string;
    consecutiveErrors?: number;
    consecutiveSkipped?: number;
  };
  status?: string;
  updatedAtMs?: number;
};

type ScheduleStatus = 'ok' | 'idle' | 'skipped' | 'failed' | 'disabled' | 'unknown';

const AGENT_TARGETS = [
  { id: 'ariel-platform', label: 'Ariel', aliases: ['ariel'] },
  { id: 'clareza-dev', label: 'Tomas', aliases: ['tomas', 'tomás', 'dev'] },
  { id: 'clareza-qa', label: 'Cecilia', aliases: ['cecilia', 'cecília', 'qa'] },
  { id: 'nodesync-marketing', label: 'Maya', aliases: ['maya', 'marketing'] },
  { id: 'personal-finance', label: 'Daikokuten', aliases: ['daikokuten', 'financeiro', 'finance'] },
  { id: 'main', label: 'Lilith', aliases: ['lilith', 'agenda'] },
] as const;

function redact(value: string) {
  return value
    .replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<redacted>')
    .replace(/([?&](?:token|access_token|key|secret|password)=)[^\s&]+/gi, '$1<redacted>')
    .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, '$1<redacted>')
    .replace(/(GOG_KEYRING_PASSWORD=)[^\s]+/g, '$1<redacted>');
}

function cleanText(value?: string, max = 100) {
  if (!value) return '';
  const normalized = redact(value).replace(/\s+/g, ' ').trim();
  return normalized.length > max ? normalized.slice(0, max - 1) + '…' : normalized;
}

function iso(ms?: number) {
  return ms ? new Date(ms).toISOString() : null;
}

function normalizeStatus(job: RawSchedule): ScheduleStatus {
  if (!job.enabled) return 'disabled';
  const status = job.state?.lastStatus || job.state?.lastRunStatus || job.status || 'idle';
  if (status === 'ok' || status === 'succeeded') return 'ok';
  if (status === 'idle') return 'idle';
  if (status === 'skipped') return 'skipped';
  if (status === 'failed' || status === 'errored' || status === 'error') return 'failed';
  return 'unknown';
}

function scheduleLabel(job: RawSchedule) {
  const schedule = job.schedule;
  if (!schedule?.kind) return 'unknown';
  if (schedule.kind === 'at') return 'one-shot';
  if (schedule.kind === 'cron') return schedule.tz ? 'cron / ' + schedule.tz : 'cron';
  if (schedule.kind === 'every') return 'every';
  return schedule.kind;
}

function scheduleDetail(job: RawSchedule) {
  const schedule = job.schedule;
  if (!schedule) return '';
  if (schedule.kind === 'at') return schedule.at || '';
  if (schedule.kind === 'cron') return schedule.expr || '';
  if (schedule.kind === 'every') return schedule.everyMs ? String(schedule.everyMs) + ' ms' : '';
  return '';
}

function inferTargetAgent(job: RawSchedule) {
  if (job.agentId && job.agentId !== 'main') {
    const direct = AGENT_TARGETS.find(agent => agent.id === job.agentId);
    if (direct) return direct;
  }

  const haystack = cleanText([job.name, job.sessionTarget, job.payload?.kind].filter(Boolean).join(' '), 240).toLowerCase();
  const inferred = AGENT_TARGETS
    .filter(agent => agent.id !== 'main')
    .find(agent => agent.aliases.some(alias => haystack.includes(alias)));
  if (inferred) return inferred;

  if (job.agentId) {
    const direct = AGENT_TARGETS.find(agent => agent.id === job.agentId);
    if (direct) return direct;
  }

  if (job.sessionTarget === 'main') return AGENT_TARGETS.find(agent => agent.id === 'main')!;
  return null;
}

async function loadSchedule() {
  const { stdout } = await execFileAsync(OPENCLAW_BIN, ['cron', 'list', '--json'], {
    timeout: 8_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return JSON.parse(stdout) as { total?: number; jobs?: RawSchedule[] };
}

export async function GET() {
  try {
    const payload = await loadSchedule();
    const jobs = payload.jobs || [];
    const schedule = jobs
      .slice()
      .sort((a, b) => (a.state?.nextRunAtMs || Number.MAX_SAFE_INTEGER) - (b.state?.nextRunAtMs || Number.MAX_SAFE_INTEGER))
      .map(job => {
        const targetAgent = inferTargetAgent(job);

        return {
          id: job.id || '',
          name: cleanText(job.name || 'Untitled schedule', 90),
          enabled: Boolean(job.enabled),
          deleteAfterRun: Boolean(job.deleteAfterRun),
          status: normalizeStatus(job),
          rawStatus: job.state?.lastStatus || job.state?.lastRunStatus || job.status || null,
          type: scheduleLabel(job),
          detail: cleanText(scheduleDetail(job), 80),
          agentId: job.agentId || null,
          targetAgentId: targetAgent?.id || null,
          targetLabel: targetAgent?.label || null,
          sessionTarget: job.sessionTarget || null,
          payloadKind: job.payload?.kind || null,
          deliveryMode: job.delivery?.mode || null,
          wakeMode: job.wakeMode || null,
          nextRunAt: iso(job.state?.nextRunAtMs),
          lastRunAt: iso(job.state?.lastRunAtMs),
          lastDurationMs: job.state?.lastDurationMs ?? null,
          lastError: job.state?.lastError ? cleanText(job.state.lastError, 120) : null,
          consecutiveErrors: job.state?.consecutiveErrors ?? 0,
          consecutiveSkipped: job.state?.consecutiveSkipped ?? 0,
        };
      });

    const counts = schedule.reduce((acc, job) => {
      acc.total += 1;
      if (job.enabled) acc.enabled += 1;
      else acc.disabled += 1;
      if (job.type === 'one-shot') acc.oneShot += 1;
      if (job.type.startsWith('cron')) acc.recurring += 1;
      return acc;
    }, { total: 0, enabled: 0, disabled: 0, oneShot: 0, recurring: 0 });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      total: payload.total || jobs.length,
      shown: schedule.length,
      counts,
      schedule,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load schedule';
    return NextResponse.json(
      { generatedAt: new Date().toISOString(), total: 0, shown: 0, counts: null, schedule: [], error: redact(message) },
      { status: 500 }
    );
  }
}
