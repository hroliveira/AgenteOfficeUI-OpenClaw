import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const OPENCLAW_BIN = '/home/helinton/.npm-global/bin/openclaw';

type RawTask = {
  taskId?: string;
  runtime?: string;
  agentId?: string;
  label?: string;
  task?: string;
  status?: string;
  deliveryStatus?: string;
  createdAt?: number;
  startedAt?: number;
  endedAt?: number;
  lastEventAt?: number;
  terminalSummary?: string;
};

type TaskStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled' | 'unknown';

function redact(value: string) {
  return value
    .replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<redacted>')
    .replace(/([?&](?:token|access_token|key|secret|password)=)[^\s&]+/gi, '$1<redacted>')
    .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, '$1<redacted>')
    .replace(/(GOG_KEYRING_PASSWORD=)[^\s]+/g, '$1<redacted>');
}

function cleanText(value?: string, max = 180) {
  if (!value) return '';
  const normalized = redact(value).replace(/\s+/g, ' ').trim();
  return normalized.length > max ? normalized.slice(0, max - 1) + '…' : normalized;
}

function normalizeStatus(status?: string): TaskStatus {
  if (!status) return 'unknown';
  if (status === 'queued' || status === 'pending') return 'queued';
  if (status === 'running' || status === 'in_progress') return 'running';
  if (status === 'succeeded' || status === 'completed' || status === 'ok') return 'completed';
  if (status === 'failed' || status === 'timed_out' || status === 'lost') return 'failed';
  if (status === 'cancelled' || status === 'canceled') return 'cancelled';
  return 'unknown';
}

function iso(ms?: number) {
  return ms ? new Date(ms).toISOString() : null;
}

async function loadTasks() {
  const { stdout } = await execFileAsync(OPENCLAW_BIN, ['tasks', 'list', '--json'], {
    timeout: 8_000,
    maxBuffer: 4 * 1024 * 1024,
  });
  return JSON.parse(stdout) as { count?: number; tasks?: RawTask[] };
}

export async function GET() {
  try {
    const payload = await loadTasks();
    const rawTasks = payload.tasks || [];
    const tasks = rawTasks
      .slice()
      .sort((a, b) => (b.lastEventAt || b.startedAt || b.createdAt || 0) - (a.lastEventAt || a.startedAt || a.createdAt || 0))
      .slice(0, 12)
      .map(task => ({
        id: task.taskId || '',
        label: cleanText(task.label || task.task || 'Untitled task', 90),
        runtime: task.runtime || 'unknown',
        agentId: task.agentId || 'unknown',
        status: normalizeStatus(task.status),
        rawStatus: task.status || 'unknown',
        deliveryStatus: task.deliveryStatus || null,
        createdAt: iso(task.createdAt),
        startedAt: iso(task.startedAt),
        endedAt: iso(task.endedAt),
        lastEventAt: iso(task.lastEventAt),
        summary: cleanText(task.terminalSummary || task.task, 180),
      }));

    const counts = tasks.reduce<Record<TaskStatus, number>>((acc, task) => {
      acc[task.status] += 1;
      return acc;
    }, { queued: 0, running: 0, completed: 0, failed: 0, cancelled: 0, unknown: 0 });

    return NextResponse.json({
      generatedAt: new Date().toISOString(),
      totalTracked: payload.count || rawTasks.length,
      shown: tasks.length,
      counts,
      tasks,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to load tasks';
    return NextResponse.json(
      { generatedAt: new Date().toISOString(), totalTracked: 0, shown: 0, counts: null, tasks: [], error: redact(message) },
      { status: 500 }
    );
  }
}
