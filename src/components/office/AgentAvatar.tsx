'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Agent } from '@/types/agent';
import { useAgentStore } from '@/store/useAgentStore';

interface AgentAvatarProps {
  agent: Agent;
}

const STATUS_COLOR: Record<Agent['status'], string> = {
  idle: 'border-slate-600 bg-slate-900',
  working: 'border-emerald-400 bg-slate-900 shadow-[0_0_15px_rgba(16,185,129,0.5)]',
  busy: 'border-violet-400 bg-slate-900 shadow-[0_0_15px_rgba(167,139,250,0.5)]',
  error: 'border-red-500 bg-slate-900 shadow-[0_0_15px_rgba(239,68,68,0.5)]',
};

export const AgentAvatar = memo(function AgentAvatar({ agent }: AgentAvatarProps) {
  const selectAgent = useAgentStore(s => s.selectAgent);
  const isSelected = useAgentStore(s => s.selectedAgentId === agent.id);
  
  // Detectar movimento para animação de caminhada
  const [isMoving, setIsMoving] = useState(false);
  const prevPos = useRef(agent.position);

  useEffect(() => {
    if (prevPos.current.x !== agent.position.x || prevPos.current.y !== agent.position.y) {
      setIsMoving(true);
      const timer = setTimeout(() => setIsMoving(false), 1500); // Duração da transição
      prevPos.current = agent.position;
      return () => clearTimeout(timer);
    }
  }, [agent.position]);

  const workingAnim = {
    y: [0, -6, 0],
    transition: { repeat: Infinity, duration: 0.6, times: [0, 0.5, 1], ease: "linear" }
  };

  // Animação de caminhada (Wobble lateral)
  const walkingAnim = {
    rotate: [-5, 5, -5],
    y: [0, -3, 0],
    transition: { repeat: Infinity, duration: 0.4, ease: "linear" }
  };

  // Animação Idle (Respiração)
  const idleAnim = {
    scale: [1, 1.02, 1],
    transition: { repeat: Infinity, duration: 3, ease: "easeInOut" }
  };

  return (
    <motion.div 
      layoutId={agent.id}
      initial={false}
      animate={{ 
        left: `${agent.position.x}%`, 
        top: `${agent.position.y}%`,
      }}
      transition={{ 
        type: "spring", 
        stiffness: 40, 
        damping: 15,
        mass: 1.2
      }}
      className="absolute group z-10 cursor-pointer"
      onClick={(e) => {
        e.stopPropagation();
        selectAgent(agent.id);
      }}
    >
      <motion.div
        animate={
          isMoving ? walkingAnim : 
          agent.status === 'working' ? workingAnim : 
          idleAnim
        }
        className={`
          w-14 h-14 border-2 flex flex-col items-center justify-center
          transition-all duration-300 relative rounded-full overflow-hidden
          ${STATUS_COLOR[agent.status]}
          ${isSelected ? 'ring-2 ring-white scale-110 z-20 shadow-[0_0_20px_white]' : 'scale-100'}
        `}
      >
        <img 
          src={agent.avatar} 
          alt={agent.name}
          className="w-full h-full object-cover"
        />
        
        {/* Tool Bubble */}
        <AnimatePresence>
          {agent.lastTool && (agent.status === 'working' || agent.status === 'busy') && (
            <motion.div
              initial={{ opacity: 0, y: 0, scale: 0.5 }}
              animate={{ opacity: 1, y: -24, scale: 1 }}
              exit={{ opacity: 0, scale: 0.5 }}
              className="absolute -top-6 bg-white text-black text-[8px] font-bold px-1.5 py-0.5 rounded-sm border border-black whitespace-nowrap z-[60]"
            >
              🔧 {agent.lastTool.toUpperCase()}
              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Shadow em baixo do agente */}
        <div className="absolute -bottom-1 w-6 h-1 bg-black/40 rounded-full blur-[1px]" />

        {/* Label de Nome */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1 bg-black/80 px-1 border border-slate-700 pointer-events-none z-50">
          <span className="text-[10px] font-pixel text-white whitespace-nowrap uppercase leading-none">
            {agent.name}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
});
