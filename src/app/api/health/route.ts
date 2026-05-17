import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const execFileAsync = promisify(execFile);
const OPENCLAW_BIN = '/home/helinton/.npm-global/bin/openclaw';

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

type TelegramAccountHealth = {
  accountId?: string;
  running?: boolean;
  connected?: boolean;
  mode?: string;
  lastConnectedAt?: number;
  lastError?: string | null;
};

type OpenClawHealth = {
  ok?: boolean;
  eventLoop?: {
    degraded?: boolean;
    delayP99Ms?: number;
    utilization?: number;
  };
  modelPricing?: {
    state?: string;
  };
  channels?: {
    telegram?: {
      accounts?: Record<string, TelegramAccountHealth>;
    };
  };
  heartbeatSeconds?: number;
};

function statusFromActive(active?: string): HealthStatus {
  if (active === 'active') return 'ok';
  if (active === 'activating' || active === 'reloading') return 'degraded';
  if (active === 'failed' || active === 'inactive') return 'down';
  return 'unknown';
}

function overallStatus(items: Array<{ status: HealthStatus }>) {
  if (items.some(item => item.status === 'down')) return 'down';
  if (items.some(item => item.status === 'degraded' || item.status === 'unknown')) return 'degraded';
  return 'ok';
}

function redact(value: string) {
  return value
    .replace(/bot\d+:[A-Za-z0-9_-]+/g, 'bot<redacted>')
    .replace(/([?&](?:token|access_token|key|secret|password)=)[^\s&]+/gi, '$1<redacted>')
    .replace(/(authorization:\s*bearer\s+)[^\s]+/gi, '$1<redacted>')
    .replace(/(GOG_KEYRING_PASSWORD=)[^\s]+/g, '$1<redacted>');
}

async function run(command: string, args: string[]) {
  const { stdout } = await execFileAsync(command, args, {
    timeout: 5_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout;
}

async function systemdService(id: string, label: string): Promise<ServiceHealth> {
  try {
    const stdout = await run('systemctl', [
      '--user',
      'show',
      id,
      '--property=ActiveState',
      '--property=SubState',
      '--property=ActiveEnterTimestamp',
      '--property=MainPID',
      '--no-pager',
    ]);
    const fields = Object.fromEntries(
      stdout
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(line => {
          const index = line.indexOf('=');
          return [line.slice(0, index), line.slice(index + 1)];
        })
    );
    const status = statusFromActive(fields.ActiveState);
    const pid = fields.MainPID && fields.MainPID !== '0' ? `pid ${fields.MainPID}` : 'no pid';
    return {
      id,
      label,
      status,
      detail: `${fields.ActiveState || 'unknown'} / ${fields.SubState || 'unknown'} / ${pid}`,
      since: fields.ActiveEnterTimestamp || undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'status unavailable';
    return { id, label, status: 'unknown', detail: redact(message) };
  }
}

async function openClawHealth() {
  try {
    const stdout = await run(OPENCLAW_BIN, ['health', '--json']);
    return JSON.parse(stdout) as OpenClawHealth;
  } catch {
    return null;
  }
}

async function recentGatewayEvents() {
  try {
    const stdout = await run('journalctl', [
      '--user',
      '-u',
      'openclaw-gateway.service',
      '--since',
      '2 hours ago',
      '--no-pager',
      '-o',
      'cat',
    ]);

    return stdout
      .split('\n')
      .map(line => line.trim())
      .filter(line => /error|fail|warn|timeout|exception|telegram|gateway\] ready/i.test(line))
      .slice(-10)
      .map(redact);
  } catch {
    return [];
  }
}

function channelStatus(account: TelegramAccountHealth): HealthStatus {
  if (account.running && account.connected && !account.lastError) return 'ok';
  if (account.running || account.connected) return 'degraded';
  return 'down';
}

export async function GET() {
  const [gateway, ui, health, recentEvents] = await Promise.all([
    systemdService('openclaw-gateway.service', 'OpenClaw Gateway'),
    systemdService('agenteofficeui-3034.service', 'Agente Office UI'),
    openClawHealth(),
    recentGatewayEvents(),
  ]);

  const channels: ChannelHealth[] = Object.values(health?.channels?.telegram?.accounts || {}).map(account => ({
    id: account.accountId || 'telegram',
    label: account.accountId ? `Telegram / ${account.accountId}` : 'Telegram',
    status: channelStatus(account),
    mode: account.mode,
    lastConnectedAt: account.lastConnectedAt ? new Date(account.lastConnectedAt).toISOString() : undefined,
    lastError: account.lastError ? redact(account.lastError) : null,
  }));

  const services = [gateway, ui];
  const status = overallStatus([...services, ...channels]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    status,
    services,
    channels,
    metrics: {
      eventLoop: health?.eventLoop ? {
        status: health.eventLoop.degraded ? 'degraded' : 'ok',
        delayP99Ms: health.eventLoop.delayP99Ms ?? null,
        utilization: health.eventLoop.utilization ?? null,
      } : null,
      modelPricing: health?.modelPricing?.state || 'unknown',
      heartbeatSeconds: health?.heartbeatSeconds ?? null,
      tokenUsage: 'unavailable',
    },
    recentEvents,
  });
}
