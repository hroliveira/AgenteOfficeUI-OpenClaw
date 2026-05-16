'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent } from '@/types/agent';

interface AgentListItemProps {
  agent: Agent;
}

const STATUS_LIGHT: Record<Agent['status'], string> = {
  idle: 'bg-slate-600',
  working: 'bg-cyan-400',
  busy: 'bg-violet-400',
  error: 'bg-red-500',
};

const STATUS_TEXT: Record<Agent['status'], string> = {
  idle: 'text-slate-500',
  working: 'text-cyan-400',
  busy: 'text-violet-400',
  error: 'text-red-400',
};

const STATUS_LABEL: Record<Agent['status'], string> = {
  idle: 'idle',
  working: 'working',
  busy: 'busy',
  error: 'error',
};

export const AgentListItem = memo(function AgentListItem({ agent }: AgentListItemProps) {
  const isActive = agent.status !== 'idle';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.25 }}
      className={`
        flex items-center gap-3 px-3 py-2.5 rounded-lg
        border transition-all duration-300 cursor-default
        ${isActive
          ? 'border-slate-700 bg-slate-800/60'
          : 'border-transparent bg-transparent hover:bg-slate-800/30'
        }
      `}
    >
      {/* Status light */}
      <div className="relative flex-shrink-0">
        <motion.div
          className={`w-2.5 h-2.5 rounded-full ${STATUS_LIGHT[agent.status]}`}
          animate={isActive ? { opacity: [1, 0.4, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        />
        {isActive && (
          <div className={`absolute inset-0 rounded-full ${STATUS_LIGHT[agent.status]} opacity-30 scale-[2.5] blur-sm`} />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-bold text-slate-200 font-mono truncate">
            {agent.name}
          </span>
          <span className={`text-[9px] font-mono font-bold uppercase ml-1 ${STATUS_TEXT[agent.status]}`}>
            {STATUS_LABEL[agent.status]}
          </span>
        </div>
        <AnimatePresence mode="wait">
          {agent.lastTool ? (
            <motion.p
              key={agent.lastTool}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="text-[9px] text-slate-600 font-mono truncate"
            >
              🔧 {agent.lastTool}
            </motion.p>
          ) : (
            <p className="text-[9px] text-slate-700 font-mono">—</p>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});
