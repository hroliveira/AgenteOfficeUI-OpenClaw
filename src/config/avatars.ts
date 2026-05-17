export const AGENT_AVATARS: Record<string, string> = {
  main: '/assets/avatars/avatar-lilith.png',
  'clareza-dev': '/assets/avatars/avatar-tomas.png',
  'clareza-qa': '/assets/avatars/avatar-cecilia.png',
  'nodesync-marketing': '/assets/avatars/avatar-maya.png',
  'personal-finance': '/assets/avatars/avatar-daikokuten.png',
  'ariel-platform': '/assets/avatars/avatar-ariel.png',
};

export const AVATAR_OPTIONS = [
  '/assets/avatars/avatar-lilith.png',
  '/assets/avatars/avatar-tomas.png',
  '/assets/avatars/avatar-cecilia.png',
  '/assets/avatars/avatar-maya.png',
  '/assets/avatars/avatar-daikokuten.png',
  '/assets/avatars/avatar-ariel.png',
  '/assets/avatars/avatar1.png',
  '/assets/avatars/avatar2.png',
  '/assets/avatars/avatar3.png',
];

export function avatarForAgent(agentId: string) {
  return AGENT_AVATARS[agentId] || AVATAR_OPTIONS[agentId.length % AVATAR_OPTIONS.length];
}
