import {
  LayoutDashboard,
  Brain,
  Sparkles,
  MessageSquare,
  Lightbulb,
} from 'lucide-react';
import type { View } from '../types';
import type { Profile } from '../lib/supabase';

const navItems: { id: View; label: string; icon: typeof LayoutDashboard; desc: string }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, desc: 'Overview & progress' },
  { id: 'diagnostic', label: 'Diagnostic', icon: Brain, desc: 'Adaptive placement' },
  { id: 'synthesizer', label: 'Synthesizer', icon: Sparkles, desc: 'Build a course' },
  { id: 'tutor', label: 'Lumen Tutor', icon: MessageSquare, desc: 'Ask anything' },
];

export default function Sidebar({
  view,
  setView,
  profile,
}: {
  view: View;
  setView: (v: View) => void;
  profile: Profile | null;
}) {
  return (
    <>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-50 glass-strong px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-lumen-500/20 flex items-center justify-center">
            <Lightbulb className="w-5 h-5 text-lumen-400" />
          </div>
          <span className="font-bold text-ink-100">Lumen</span>
        </div>
        <div className="flex gap-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setView(item.id)}
              className={`p-2 rounded-lg transition-colors ${
                view === item.id
                  ? 'bg-lumen-500/20 text-lumen-400'
                  : 'text-ink-400 hover:text-ink-200 hover:bg-ink-800'
              }`}
            >
              <item.icon className="w-5 h-5" />
            </button>
          ))}
        </div>
      </div>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col glass border-r border-white/5 z-40">
        <div className="px-6 py-7 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-lumen-500/30 to-lumen-700/20 flex items-center justify-center lumen-breathe">
              <Lightbulb className="w-5 h-5 text-lumen-400" />
            </div>
            <div>
              <h1 className="font-bold text-ink-100 text-lg leading-none">Lumen</h1>
              <p className="text-[10px] text-ink-400 font-mono uppercase tracking-widest mt-1">Socratic OS</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setView(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                  active
                    ? 'bg-lumen-500/10 border border-lumen-500/20'
                    : 'border border-transparent hover:bg-ink-800/60'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  active ? 'bg-lumen-500/20' : 'bg-ink-800 group-hover:bg-ink-700'
                }`}>
                  <item.icon className={`w-4 h-4 ${active ? 'text-lumen-400' : 'text-ink-400'}`} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-medium ${active ? 'text-lumen-300' : 'text-ink-200'}`}>{item.label}</p>
                  <p className="text-[10px] text-ink-500">{item.desc}</p>
                </div>
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-4 border-t border-white/5">
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-lumen-500 to-lumen-700 flex items-center justify-center text-sm font-bold text-ink-950">
              {(profile?.display_name || 'L')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-ink-200 font-medium truncate">{profile?.display_name || 'Learner'}</p>
              <p className="text-[10px] text-ink-500 font-mono">
                {profile?.diagnostic_score ?? 0} pts · {profile?.confidence ?? 50}%
              </p>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
