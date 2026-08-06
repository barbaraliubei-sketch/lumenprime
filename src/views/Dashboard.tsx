import { useEffect, useState } from 'react';
import {
  Brain,
  Sparkles,
  TrendingUp,
  Zap,
  Target,
  ArrowRight,
  Clock,
  Award,
  Activity,
} from 'lucide-react';
import { supabase, type Profile, type SynthesizedPath, type DiagnosticAttempt } from '../lib/supabase';
import type { View } from '../types';

export default function Dashboard({
  setView,
  profile,
  updateProfile,
}: {
  setView: (v: View) => void;
  profile: Profile | null;
  updateProfile: (u: Partial<Profile>) => Promise<void>;
}) {
  const [paths, setPaths] = useState<SynthesizedPath[]>([]);
  const [attempts, setAttempts] = useState<DiagnosticAttempt[]>([]);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: a }] = await Promise.all([
        supabase.from('synthesized_paths').select('*').order('created_at', { ascending: false }).limit(5),
        supabase.from('diagnostic_attempts').select('*').order('created_at', { ascending: false }).limit(5),
      ]);
      setPaths((p as SynthesizedPath[]) || []);
      setAttempts((a as DiagnosticAttempt[]) || []);
    })();
  }, []);

  const confidence = profile?.confidence ?? 50;
  const diagScore = profile?.diagnostic_score ?? 0;
  const cognitiveLoad = profile?.cognitive_load ?? 'Optimal';

  const loadColor =
    cognitiveLoad === 'Overloaded' ? 'text-coral' : cognitiveLoad === 'Underutilized' ? 'text-amber-glow' : 'text-lumen-400';

  return (
    <div className="px-4 md:px-10 py-6 md:py-10 pt-20 md:pt-10 max-w-7xl mx-auto">
      {/* Hero */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="px-2.5 py-1 rounded-full bg-lumen-500/10 border border-lumen-500/20 text-[10px] font-mono uppercase tracking-widest text-lumen-400">
            Socratic OS
          </span>
        </div>
        <h1 className="text-3xl md:text-5xl font-bold text-ink-100 leading-tight">
          Master anything from <span className="text-gradient-lumen">first principles</span>.
        </h1>
        <p className="text-ink-400 mt-3 text-base md:text-lg max-w-2xl">
          Adaptive placement, fidgetable informers, intelligence graph, and a Socratic course synthesizer — all in one learning OS.
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard
          icon={Target}
          label="Diagnostic Score"
          value={diagScore.toString()}
          suffix="pts"
          color="lumen"
        />
        <StatCard
          icon={TrendingUp}
          label="Confidence"
          value={`${confidence}%`}
          color="amber"
          progress={confidence}
        />
        <StatCard
          icon={Activity}
          label="Cognitive Load"
          value={cognitiveLoad}
          color={cognitiveLoad === 'Overloaded' ? 'coral' : 'lumen'}
        />
        <StatCard
          icon={Sparkles}
          label="Courses Built"
          value={paths.length.toString()}
          color="lumen"
        />
      </div>

      {/* Quick actions */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <ActionCard
          icon={Brain}
          title="Run Diagnostic"
          desc="Adaptive placement test that finds your level"
          onClick={() => setView('diagnostic')}
          color="lumen"
        />
        <ActionCard
          icon={Sparkles}
          title="Synthesize a Course"
          desc="Generate a Socratic course from any topic"
          onClick={() => setView('synthesizer')}
          color="amber"
        />
        <ActionCard
          icon={Zap}
          title="Ask Lumen Tutor"
          desc="Chat with your AI Socratic tutor anytime"
          onClick={() => setView('tutor')}
          color="lumen"
        />
      </div>

      {/* Two-column section */}
      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        {/* Synthesized paths */}
        <div className="glass rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-100 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lumen-400" />
              Synthesized Courses
            </h2>
            <button
              onClick={() => setView('synthesizer')}
              className="text-xs text-lumen-400 hover:text-lumen-300 flex items-center gap-1 transition-colors"
            >
              Build new <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {paths.length === 0 ? (
            <EmptyState
              icon={Sparkles}
              text="No courses yet. Synthesize your first one."
              action={() => setView('synthesizer')}
              actionLabel="Start"
            />
          ) : (
            <div className="space-y-3">
              {paths.map((p) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-white/5 hover:border-lumen-500/20 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-lumen-500/10 flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-4 h-4 text-lumen-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-100 truncate">{p.title}</p>
                    <p className="text-xs text-ink-500">{p.phase} · {p.modules?.length || 0} modules</p>
                  </div>
                  <Clock className="w-3.5 h-3.5 text-ink-600 flex-shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Diagnostic history */}
        <div className="glass rounded-2xl p-5 md:p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-ink-100 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-glow" />
              Diagnostic History
            </h2>
            <button
              onClick={() => setView('diagnostic')}
              className="text-xs text-lumen-400 hover:text-lumen-300 flex items-center gap-1 transition-colors"
            >
              New <ArrowRight className="w-3 h-3" />
            </button>
          </div>
          {attempts.length === 0 ? (
            <EmptyState
              icon={Brain}
              text="No diagnostics yet. Take your first placement test."
              action={() => setView('diagnostic')}
              actionLabel="Start"
            />
          ) : (
            <div className="space-y-3">
              {attempts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/50 border border-white/5"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-glow/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-4 h-4 text-amber-glow" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-100 truncate">{a.subject}</p>
                    <p className="text-xs text-ink-500">
                      Level {a.final_level}/10 · {a.correct_count}/{a.questions_answered} correct
                    </p>
                  </div>
                  <span className="text-xs text-ink-400 font-mono">
                    {new Date(a.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Confidence slider */}
      <div className="glass rounded-2xl p-5 md:p-6 mt-4 md:mt-6">
        <h2 className="text-lg font-semibold text-ink-100 mb-1">Calibrate Confidence</h2>
        <p className="text-sm text-ink-400 mb-4">
          Lumen adapts to your self-reported confidence. Adjust anytime.
        </p>
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={0}
            max={100}
            value={confidence}
            onChange={(e) => updateProfile({ confidence: parseInt(e.target.value) })}
            className="flex-1 accent-lumen-500"
          />
          <span className="text-2xl font-bold text-lumen-400 font-mono w-16 text-right">{confidence}%</span>
        </div>
        <div className="flex justify-between mt-2 text-[10px] text-ink-500 font-mono uppercase tracking-wider">
          <span>Unsure</span>
          <span>Confident</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  suffix,
  color,
  progress,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  suffix?: string;
  color: 'lumen' | 'amber' | 'coral';
  progress?: number;
}) {
  const colors = {
    lumen: 'text-lumen-400 bg-lumen-500/10',
    amber: 'text-amber-glow bg-amber-glow/10',
    coral: 'text-coral bg-coral/10',
  };
  return (
    <div className="glass rounded-2xl p-4 md:p-5">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <p className="text-[10px] text-ink-500 font-mono uppercase tracking-widest mb-1">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl md:text-3xl font-bold text-ink-100">{value}</span>
        {suffix && <span className="text-xs text-ink-500">{suffix}</span>}
      </div>
      {progress !== undefined && (
        <div className="mt-3 h-1.5 rounded-full bg-ink-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-lumen-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

function ActionCard({
  icon: Icon,
  title,
  desc,
  onClick,
  color,
}: {
  icon: typeof Brain;
  title: string;
  desc: string;
  onClick: () => void;
  color: 'lumen' | 'amber';
}) {
  const colors = {
    lumen: 'group-hover:border-lumen-500/30 group-hover:shadow-[0_0_30px_-10px_rgba(16,184,138,0.4)]',
    amber: 'group-hover:border-amber-glow/30 group-hover:shadow-[0_0_30px_-10px_rgba(251,191,36,0.3)]',
  };
  const iconColors = {
    lumen: 'bg-lumen-500/10 text-lumen-400 group-hover:bg-lumen-500/20',
    amber: 'bg-amber-glow/10 text-amber-glow group-hover:bg-amber-glow/20',
  };
  return (
    <button
      onClick={onClick}
      className={`group glass rounded-2xl p-5 text-left transition-all duration-300 hover:scale-[1.02] border border-white/5 ${colors[color]}`}
    >
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-colors ${iconColors[color]}`}>
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-base font-semibold text-ink-100 mb-1">{title}</h3>
      <p className="text-sm text-ink-400">{desc}</p>
      <div className="flex items-center gap-1 mt-3 text-xs text-lumen-400 opacity-0 group-hover:opacity-100 transition-opacity">
        Open <ArrowRight className="w-3 h-3" />
      </div>
    </button>
  );
}

function EmptyState({
  icon: Icon,
  text,
  action,
  actionLabel,
}: {
  icon: typeof Brain;
  text: string;
  action: () => void;
  actionLabel: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-12 h-12 rounded-xl bg-ink-800 flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-ink-500" />
      </div>
      <p className="text-sm text-ink-400 mb-3">{text}</p>
      <button
        onClick={action}
        className="px-4 py-2 rounded-lg bg-lumen-500/10 border border-lumen-500/20 text-lumen-400 text-xs font-medium hover:bg-lumen-500/20 transition-colors"
      >
        {actionLabel}
      </button>
    </div>
  );
}
