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

function avatarFor(agentId: string) {
  const hash = [...agentId].reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATARS[hash % AVATARS.length];
}

function configPath() {
  return process.env.OPENCLAW_CONFIG_PATH || '/home/helinton/.openclaw/openclaw.json';
}

export async function GET() {
  try {
    const rawConfig = await readFile(configPath(), 'utf8');
    const config = JSON.parse(rawConfig) as OpenClawConfig;
    const agents = (config.agents?.list || [])
      .filter(agent => agent.id)
      .map(agent => ({
        id: agent.id!,
        name: agent.identity?.name || agent.name || agent.id!,
        status: 'idle',
        avatar: avatarFor(agent.id!),
        description: agent.identity?.theme || '',
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
