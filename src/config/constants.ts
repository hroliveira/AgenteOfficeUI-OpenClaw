import { RoomId } from '@/types/agent';

export const OPENCLAW_URL = process.env.NEXT_PUBLIC_OPENCLAW_URL || '';
export const OPENCLAW_TOKEN = process.env.NEXT_PUBLIC_OPENCLAW_TOKEN || '';
export const WS_URL = OPENCLAW_URL;
export const MOCK_MODE =
  process.env.NEXT_PUBLIC_MOCK_MODE === 'true' ||
  (process.env.NEXT_PUBLIC_MOCK_MODE !== 'false' && !OPENCLAW_URL);

export interface RoomConfig {
  id: RoomId;
  label: string;
  icon: string;
  description: string;
  size?: 'large' | 'small';
}

export const ROOMS: RoomConfig[] = [
  { id: 'conference', label: 'PLATFORM OPS', icon: '🖥️', description: 'Runtime and integrations', size: 'large' },
  { id: 'jarvis', label: 'MEETING HALL', icon: '🤝', description: 'Agent alignment room', size: 'large' },
  { id: 'kitchen', label: 'KITCHEN', icon: '☕', description: 'Break Area', size: 'large' },

  { id: 'scribe', label: 'SCRIBE', icon: '✍️', description: 'Writing', size: 'small' },
  { id: 'atlas', label: 'ATLAS', icon: '🌍', description: 'Global Ops', size: 'small' },
  { id: 'claw', label: 'CLAW', icon: '⌘', description: 'Development + QA', size: 'small' },
  { id: 'sentinel', label: 'COMMAND WATCH', icon: '🛡️', description: 'Lilith Operations', size: 'small' },
  { id: 'pixel', label: 'PIXEL', icon: '🎨', description: 'Design', size: 'small' },
  { id: 'nova', label: 'NOVA', icon: '✨', description: 'Innovation', size: 'small' },
  { id: 'vibe', label: 'VIBE', icon: '🎧', description: 'Music', size: 'small' },
  { id: 'trendy', label: 'TRENDY', icon: '👔', description: 'Fashion', size: 'small' },
];

export const AGENT_NAMES = [
  'ATLAS', 'CLAW D', 'CLIP', 'CLIPPER', 'NOVA', 'ORACLE', 'PIXEL', 'SAGE', 'SENTINEL', 'SCRIBE', 'VIBE'
];

export const TOOLS = [
  'browser.search', 'file.read', 'file.write', 'api.call',
  'db.query', 'email.send', 'code.execute'
];

export const ROOM_IDS: RoomId[] = ROOMS.map(r => r.id);
