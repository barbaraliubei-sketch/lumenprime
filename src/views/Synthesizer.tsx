import { useState, useEffect } from 'react';
import {
  Sparkles,
  ChevronRight,
  Loader2,
  Lock,
  Unlock,
  Atom,
  BookOpen,
  Clock,
  Wand2,
  HelpCircle,
  Save,
  Check,
  Layers,
} from 'lucide-react';
import { synthesizeCourse, type SynthResponse } from '../lib/api';
import { supabase, type SynthesizedPath, type SynthModule } from '../lib/supabase';

const phases = ['Middle School', 'High School', 'Undergraduate', 'Graduate', 'Professional'];

const suggestions = [
  'Quantum Computing',
  'Organic Chemistry',
  'Linear Algebra',
  'Game Theory',
  'Neural Networks',
  'Thermodynamics',
];

export default function Synthesizer() {
  const [topic, setTopic] = useState('');
  const [phase, setPhase] = useState('High School');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SynthResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [savedPaths, setSavedPaths] = useState<SynthesizedPath[]>([]);
  const [savedId, setSavedId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('synthesized_paths')
        .select('*')
        .order('created_at', { ascending: false });
      setSavedPaths((data as SynthesizedPath[]) || []);
    })();
  }, []);

  const handleSynthesize = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSavedId(null);
    try {
      const res = await synthesizeCourse(topic.trim(), phase);
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synthesis failed');
    } finally {
      setLoading(false);
    }
  };

  const savePath = async () => {
    if (!result) return;
    const { data } = await supabase
      .from('synthesized_paths')
      .insert({
        title: result.title,
        phase: result.phase,
        axioms: result.axioms,
        modules: result.modules,
        socratic_challenge: result.socraticChallenge,
      })
      .select('*')
      .maybeSingle();
    if (data) {
      const newPath = data as SynthesizedPath;
      setSavedPaths((prev) => [newPath, ...prev]);
      setSavedId(newPath.id);
    }
  };

  return (
    <div className="px-4 md:px-10 py-6 md:py-10 pt-20 md:pt-10 max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-5 h-5 text-lumen-400" />
          <span className="text-[10px] font-mono uppercase tracking-widest text-lumen-400">Course Synthesizer</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-ink-100">Socratic Course Synthesizer</h1>
        <p className="text-ink-400 mt-2">
          Type any subject. Lumen deconstructs it into axioms, modules, and a Socratic challenge.
        </p>
      </div>

      {/* Input */}
      <div className="glass rounded-2xl p-5 md:p-6 mb-6">
        <div className="space-y-4">
          <div>
            <label className="text-xs text-ink-400 font-mono uppercase tracking-widest mb-2 block">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSynthesize()}
              placeholder="e.g. Quantum Mechanics, Game Theory, Organic Chemistry…"
              className="w-full px-4 py-3 rounded-xl bg-ink-800/60 border border-white/5 text-ink-100 placeholder-ink-500 focus:outline-none focus:border-lumen-500/30 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs text-ink-400 font-mono uppercase tracking-widest mb-2 block">Developmental Phase</label>
            <div className="flex flex-wrap gap-2">
              {phases.map((p) => (
                <button
                  key={p}
                  onClick={() => setPhase(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    phase === p
                      ? 'bg-lumen-500/15 border border-lumen-500/30 text-lumen-300'
                      : 'bg-ink-800/50 border border-white/5 text-ink-400 hover:text-ink-200'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => setTopic(s)}
                className="px-2.5 py-1 rounded-md text-[11px] text-ink-400 bg-ink-800/40 border border-white/5 hover:border-lumen-500/20 hover:text-lumen-400 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={handleSynthesize}
            disabled={!topic.trim() || loading}
            className="w-full py-3.5 rounded-xl bg-lumen-500/15 border border-lumen-500/30 text-lumen-300 font-semibold hover:bg-lumen-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Synthesizing course…
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" /> Synthesize Course
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="glass rounded-2xl p-5 text-center mb-6 border-coral/30">
          <p className="text-coral text-sm">{error}</p>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="glass rounded-2xl p-6 md:p-8 space-y-4">
          <div className="h-7 w-2/3 rounded-lg bg-ink-800 shimmer" />
          <div className="grid md:grid-cols-3 gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-20 rounded-xl bg-ink-800 shimmer" />
            ))}
          </div>
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-24 rounded-xl bg-ink-800 shimmer" />
            ))}
          </div>
        </div>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4 slide-up">
          {/* Title + save */}
          <div className="glass rounded-2xl p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl md:text-2xl font-bold text-ink-100">{result.title}</h2>
                <p className="text-xs text-ink-500 mt-1 font-mono uppercase tracking-widest">{result.phase}</p>
              </div>
              <button
                onClick={savePath}
                disabled={!!savedId}
                className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all flex-shrink-0 ${
                  savedId
                    ? 'bg-lumen-500/15 border border-lumen-500/30 text-lumen-400 cursor-default'
                    : 'bg-ink-800 border border-white/10 text-ink-200 hover:bg-ink-700'
                }`}
              >
                {savedId ? <><Check className="w-4 h-4" /> Saved</> : <><Save className="w-4 h-4" /> Save</>}
              </button>
            </div>
          </div>

          {/* Axioms */}
          <div className="glass rounded-2xl p-5 md:p-6">
            <h3 className="text-sm font-semibold text-lumen-400 mb-4 flex items-center gap-2">
              <Atom className="w-4 h-4" /> Foundational Axioms
            </h3>
            <div className="space-y-3">
              {result.axioms.map((axiom, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-ink-800/40 border border-white/5">
                  <span className="text-xs font-mono text-lumen-400/60 mt-0.5">A{i + 1}</span>
                  <p className="text-sm text-ink-200 leading-relaxed">{axiom}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Modules */}
          <div className="glass rounded-2xl p-5 md:p-6">
            <h3 className="text-sm font-semibold text-lumen-400 mb-4 flex items-center gap-2">
              <Layers className="w-4 h-4" /> Course Modules
            </h3>
            <div className="space-y-3">
              {result.modules.map((mod, i) => (
                <ModuleCard key={i} mod={mod} index={i} />
              ))}
            </div>
          </div>

          {/* Socratic challenge */}
          <div className="glass rounded-2xl p-5 md:p-6 border-amber-glow/20">
            <h3 className="text-sm font-semibold text-amber-glow mb-3 flex items-center gap-2">
              <HelpCircle className="w-4 h-4" /> Socratic Challenge
            </h3>
            <p className="text-base text-ink-100 leading-relaxed italic">"{result.socraticChallenge}"</p>
          </div>
        </div>
      )}

      {/* Saved paths */}
      {savedPaths.length > 0 && !result && !loading && (
        <div className="glass rounded-2xl p-5 md:p-6">
          <h3 className="text-sm font-semibold text-ink-200 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-lumen-400" /> Your Saved Courses
          </h3>
          <div className="space-y-2">
            {savedPaths.map((p) => (
              <div
                key={p.id}
                className="flex items-center gap-3 p-3 rounded-xl bg-ink-800/40 border border-white/5 hover:border-lumen-500/20 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-lumen-500/10 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-4 h-4 text-lumen-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink-100 truncate">{p.title}</p>
                  <p className="text-xs text-ink-500">{p.phase} · {p.modules?.length || 0} modules</p>
                </div>
                <span className="text-xs text-ink-500 font-mono">
                  {new Date(p.created_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function ModuleCard({ mod, index }: { mod: SynthModule; index: number; key?: string | number }) {
  const isLocked = mod.status?.toLowerCase() === 'locked';
  const Icon = isLocked ? Lock : Unlock;
  return (
    <div className="p-4 rounded-xl bg-ink-800/40 border border-white/5 hover:border-white/10 transition-colors float-up" style={{ animationDelay: `${index * 80}ms` }}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
          isLocked ? 'bg-ink-700' : 'bg-lumen-500/10'
        }`}>
          <Icon className={`w-4 h-4 ${isLocked ? 'text-ink-500' : 'text-lumen-400'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-lumen-400/60">{mod.unit}</span>
            <span className="flex items-center gap-1 text-[10px] text-ink-500 font-mono">
              <Clock className="w-3 h-3" /> {mod.duration}
            </span>
          </div>
          <h4 className="text-sm font-semibold text-ink-100 mb-1">{mod.name}</h4>
          <p className="text-xs text-ink-400 leading-relaxed mb-2">{mod.description}</p>
          <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md bg-amber-glow/5 border border-amber-glow/15 text-[10px] text-amber-glow">
            <Sparkles className="w-3 h-3" /> {mod.fidgetableInformer}
          </div>
        </div>
      </div>
    </div>
  );
}
