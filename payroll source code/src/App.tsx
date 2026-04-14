import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, X, LayoutDashboard } from 'lucide-react';
import { cn } from './lib/utils';
import { UniverseBackground } from './components/UniverseBackground';
import { PayrollSystem } from './components/PayrollSystem';

interface Tab {
  id: string;
  title: string;
}

export default function App() {
  const [tabs, setTabs] = useState<Tab[]>([{ id: '1', title: 'Payroll 1' }]);
  const [activeTabId, setActiveTabId] = useState('1');

  const addTab = () => {
    const newId = Math.random().toString(36).substr(2, 9);
    setTabs([...tabs, { id: newId, title: `Payroll ${tabs.length + 1}` }]);
    setActiveTabId(newId);
  };

  const closeTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (tabs.length === 1) return;
    const newTabs = tabs.filter(t => t.id !== id);
    setTabs(newTabs);
    if (activeTabId === id) {
      setActiveTabId(newTabs[newTabs.length - 1].id);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col bg-[#05050F] text-white overflow-hidden font-sans">
      <UniverseBackground />

      {/* Chrome-like Tab Bar */}
      <div className="flex items-end px-2 pt-2 bg-black/40 backdrop-blur-md border-b border-white/10 h-12 relative z-50">
        <div className="flex items-end max-w-full overflow-x-auto no-scrollbar">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onClick={() => setActiveTabId(tab.id)}
              className={cn(
                "group relative h-9 px-8 flex items-center gap-2 cursor-pointer transition-all duration-200 min-w-[120px] max-w-[200px]",
                activeTabId === tab.id 
                  ? "bg-slate-900/90 text-white rounded-t-xl" 
                  : "text-slate-400 hover:bg-white/5 rounded-t-lg"
              )}
            >
              {/* Tab Shape (simplified) */}
              {activeTabId === tab.id && (
                <>
                  <div className="absolute -left-2 bottom-0 w-2 h-2 bg-slate-900/90" style={{ clipPath: 'radial-gradient(circle at 0 0, transparent 100%, #0f172a 100%)' }} />
                  <div className="absolute -right-2 bottom-0 w-2 h-2 bg-slate-900/90" style={{ clipPath: 'radial-gradient(circle at 100% 0, transparent 100%, #0f172a 100%)' }} />
                </>
              )}
              
              <LayoutDashboard size={14} className={cn(activeTabId === tab.id ? "text-blue-400" : "text-slate-500")} />
              <span className="text-xs font-medium truncate select-none">{tab.title}</span>
              
              <button
                onClick={(e) => closeTab(tab.id, e)}
                className={cn(
                  "p-0.5 rounded-full hover:bg-white/20 transition-all ml-auto",
                  activeTabId === tab.id ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                )}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addTab}
          className="mb-1.5 ml-2 p-1.5 rounded-full hover:bg-white/10 text-slate-400 transition-all"
          title="New Tab"
        >
          <Plus size={16} />
        </button>
      </div>

      {/* Tab Content */}
      <div className="flex-1 relative overflow-hidden">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-300",
              activeTabId === tab.id ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
            )}
          >
            <PayrollSystem />
          </div>
        ))}
      </div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
