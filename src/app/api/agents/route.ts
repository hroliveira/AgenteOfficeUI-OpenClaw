import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type OpenClawAgentConfig = {
  id?: string;
  name?: string;
  identity?: {
    name?: string;
    emoji?: string;
    theme?: string;
  };
  model?: {
    primary?: string;
    fallbacks?: string[];
  };
  workspace?: string;
  cwd?: string;
  heartbeat?: {
    every?: string;
  };
  skills?: string[];
};

type OpenClawConfig = {
  agents?: {
    list?: OpenClawAgentConfig[];
  };
};

const AVATARS = [
  '/assets/avatars/avatar1.png',
  '/assets/avatars/avatar2.png',
  '/assets/avatars/avatar3.png',
];

const OPENCLAW_CONFIG_PATH = '/home/helinton/.openclaw/openclaw.json';
const HOME_PATH = '/home/helinton';

function avatarFor(agentId: string) {
  const hash = [...agentId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATARS[hash % AVATARS.length];
}

function displayPath(path?: string) {
  if (!path) return undefined;
  return path.startsWith(HOME_PATH) ? path.replace(HOME_PATH, '~') : path;
}

function heartbeatStatus(agent: OpenClawAgentConfig) {
  if (agent.heartbeat === undefined || agent.heartbeat === null) return 'Not configured';
  if (agent.heartbeat.every === '0m') return 'Manual / disabled';
  if (agent.heartbeat.every) return `Every ${agent.heartbeat.every}`;
  return 'Enabled';
}

export async function GET() {
  try {
    const rawConfig = await readFile(OPENCLAW_CONFIG_PATH, 'utf8');
    const config = JSON.parse(rawConfig) as OpenClawConfig;
    const agents = (config.agents?.list || [])
      .filter(agent => agent.id)
      .map(agent => ({
        id: agent.id!,
        name: agent.identity?.name || agent.name || agent.id!,
        status: 'idle',
        avatar: avatarFor(agent.id!),
        description: agent.identity?.theme || '',
        emoji: agent.identity?.emoji || '',
        workspace: displayPath(agent.workspace || agent.cwd),
        primaryModel: agent.model?.primary || 'default',
        fallbackModels: agent.model?.fallbacks || [],
        heartbeat: heartbeatStatus(agent),
        skills: agent.skills || [],
      }));

    return NextResponse.json({ agents });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { agents: [], error: `Unable to load OpenClaw agents: ${message}` },
      { status: 500 }
    );
  }
}
