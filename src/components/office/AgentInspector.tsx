'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { useAgentStore } from '@/store/useAgentStore';

const AVAILABLE_AVATARS = [
  '/assets/avatars/avatar1.png',
  '/assets/avatars/avatar2.png',
  '/assets/avatars/avatar3.png',
];

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="border-b border-slate-800/80 py-2 last:border-b-0">
      <dt className="text-[10px] uppercase text-slate-500">{label}</dt>
      <dd className="mt-1 break-words text-sm leading-tight text-slate-100">
        {value || 'Not configured'}
      </dd>
    </div>
  );
}

function SkillList({ skills }: { skills: string[] }) {
  if (!skills.length) {
    return <p className="text-sm text-slate-500">No skills configured.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {skills.map(skill => (
        <span
          key={skill}
          className="border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] uppercase leading-none text-cyan-200"
        >
          {skill}
        </span>
      ))}
    </div>
  );
}

export function AgentInspector() {
  const selectedAgentId = useAgentStore(s => s.selectedAgentId);
  const selectAgent = useAgentStore(s => s.selectAgent);
  const agent = useAgentStore(s => selectedAgentId ? s.agents[selectedAgentId] : null);
  const updateAvatar = useAgentStore(s => s.updateAgentAvatar);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const fallbackModels = useMemo(
    () => agent?.fallbackModels?.join(', ') || 'None',
    [agent?.fallbackModels]
  );

  if (!selectedAgentId || !agent) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 p-4 font-pixel">
      <motion.div
        initial={{ opacity: 0, scale: 0.92 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex max-h-[88vh] w-full max-w-3xl flex-col border-4 border-[#2d3748] bg-[#111827] shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-center justify-between border-b-4 border-[#2d3748] bg-[#151921] px-4 py-3">
          <div className="flex min-w-0 items-center gap-4">
            <div className="group relative shrink-0">
              <button
                type="button"
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="relative h-14 w-14 overflow-hidden rounded-full border-2 border-slate-600 bg-slate-950 transition-colors hover:border-cyan-400"
                aria-label="Change avatar"
              >
                <Image src={agent.avatar} alt="" width={56} height={56} className="h-full w-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[9px] text-white opacity-0 transition-opacity group-hover:opacity-100">
                  EDIT
                </span>
              </button>

              {showAvatarPicker && (
                <div className="absolute left-0 top-full z-[110] mt-2 flex gap-2 border-2 border-[#2d3748] bg-[#1a1f2c] p-2 shadow-xl">
                  {AVAILABLE_AVATARS.map(av => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => {
                        updateAvatar(selectedAgentId, av);
                        setShowAvatarPicker(false);
                      }}
                      className={`h-10 w-10 overflow-hidden rounded-full border-2 transition-transform hover:scale-110 ${agent.avatar === av ? 'border-cyan-400' : 'border-slate-700'}`}
                      aria-label="Select avatar"
                    >
                      <Image src={av} alt="" width={40} height={40} className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {agent.emoji && <span className="text-xl leading-none">{agent.emoji}</span>}
                <h3 className="truncate text-xl font-bold uppercase leading-none text-white">{agent.name}</h3>
              </div>
              <p className="mt-1 text-[10px] uppercase text-emerald-400">
                {agent.id} / {agent.status}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => selectAgent(null)}
            className="shrink-0 px-2 text-xl text-slate-400 hover:text-white"
            aria-label="Close agent panel"
          >
            [X]
          </button>
        </div>

        <div className="grid flex-1 gap-4 overflow-y-auto bg-black/30 p-4 md:grid-cols-[1.15fr_0.85fr]">
          <section className="space-y-4">
            <div className="border-2 border-[#2d3748] bg-[#151921] p-4">
              <h4 className="mb-2 text-xs uppercase text-cyan-300">Role</h4>
              <p className="text-base leading-snug text-slate-100">
                {agent.description || 'No role description configured.'}
              </p>
            </div>

            <div className="border-2 border-[#2d3748] bg-[#151921] p-4">
              <h4 className="mb-3 text-xs uppercase text-cyan-300">Skills</h4>
              <SkillList skills={agent.skills || []} />
            </div>
          </section>

          <section className="border-2 border-[#2d3748] bg-[#151921] p-4">
            <h4 className="mb-2 text-xs uppercase text-cyan-300">Runtime</h4>
            <dl>
              <InfoRow label="Workspace" value={agent.workspace} />
              <InfoRow label="Primary model" value={agent.primaryModel} />
              <InfoRow label="Fallbacks" value={fallbackModels} />
              <InfoRow label="Heartbeat" value={agent.heartbeat} />
              <InfoRow label="Last tool" value={agent.lastTool || 'None'} />
            </dl>
          </section>
        </div>
      </motion.div>
    </div>
  );
}
