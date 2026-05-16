'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useAgentStore } from '@/store/useAgentStore';
import { useShallow } from 'zustand/react/shallow';

export function AgentInspector() {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const selectedAgentId = useAgentStore(s => s.selectedAgentId);
  const selectAgent = useAgentStore(s => s.selectAgent);
  const agent = useAgentStore(useShallow(s => selectedAgentId ? s.agents[selectedAgentId] : null));
  const messages = useAgentStore(useShallow(s => selectedAgentId ? s.agentMessages[selectedAgentId] || [] : []));
  const sendCommand = useAgentStore(s => s.sendAgentCommand);
  const updateAvatar = useAgentStore(s => s.updateAgentAvatar);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const AVAILABLE_AVATARS = [
    '/assets/avatars/avatar1.png',
    '/assets/avatars/avatar2.png',
    '/assets/avatars/avatar3.png',
  ];

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!selectedAgentId || !agent) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 font-pixel">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1f2c] border-4 border-[#2d3748] w-full max-w-xl h-[500px] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.5)]"
      >
        {/* Header */}
        <div className="bg-[#151921] border-b-4 border-[#2d3748] px-4 py-2 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <button 
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="w-12 h-12 border-2 border-slate-600 bg-slate-900 rounded-full overflow-hidden hover:border-cyan-400 transition-colors"
              >
                <img src={agent.avatar} alt="" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white">
                  EDIT
                </div>
              </button>

              {showAvatarPicker && (
                <div className="absolute top-full left-0 mt-2 bg-[#1a1f2c] border-2 border-[#2d3748] p-2 flex gap-2 z-[110] shadow-xl">
                  {AVAILABLE_AVATARS.map((av, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        updateAvatar(selectedAgentId, av);
                        setShowAvatarPicker(false);
                      }}
                      className={`w-10 h-10 border-2 rounded-full overflow-hidden hover:scale-110 transition-transform ${
                        agent.avatar === av ? 'border-cyan-400' : 'border-slate-700'
                      }`}
                    >
                      <img src={av} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-white uppercase">{agent.name}</h3>
              <p className="text-[10px] text-emerald-400">STATUS: {agent.status.toUpperCase()}</p>
            </div>
          </div>
          <button 
            onClick={() => selectAgent(null)}
            className="text-slate-400 hover:text-white text-xl"
          >
            [X]
          </button>
        </div>

        {/* Console */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-2 bg-black/40 pixel-scroll text-sm"
        >
          {messages.map((m) => (
            <div key={m.id} className="flex flex-col">
              <span className={`text-[10px] ${m.role === 'user' ? 'text-cyan-400' : 'text-emerald-400'}`}>
                {m.role === 'user' ? '> OPERATOR' : '> AGENT'} @ {new Date(m.timestamp).toLocaleTimeString()}
              </span>
              <p className="text-white ml-2">{m.content}</p>
            </div>
          ))}
          {messages.length === 0 && (
            <p className="text-slate-600 text-center mt-20 italic">READY FOR COMMANDS...</p>
          )}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t-4 border-[#2d3748] bg-[#151921]">
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) {
                sendCommand(selectedAgentId, input);
                setInput('');
              }
            }}
            className="flex gap-2"
          >
            <span className="text-cyan-400 self-center">{'>'}</span>
            <input 
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="flex-1 bg-transparent border-none focus:ring-0 text-white placeholder:text-slate-700 uppercase"
              placeholder="ENTER COMMAND..."
              autoFocus
            />
          </form>
        </div>
      </motion.div>
    </div>
  );
}
