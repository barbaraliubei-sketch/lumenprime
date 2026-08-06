import { useState, useCallback, useEffect } from 'react';
import {
  Brain,
  ChevronRight,
  Lightbulb,
  CheckCircle2,
  XCircle,
  Loader2,
  RotateCcw,
  TrendingUp,
  Gauge,
} from 'lucide-react';
import { generateDiagnosticQuestion, getHint, type DiagnosticQuestion } from '../lib/api';
import { supabase, type Profile } from '../lib/supabase';

type Phase = 'setup' | 'active' | 'result';

const subjects = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Philosophy',
  'Economics',
  'History',
];

export default function Diagnostic({
  profile,
  updateProfile,
}: {
  profile: Profile | null;
  updateProfile: (u: Partial<Profile>) => Promise<void>;
}) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [subject, setSubject] = useState('Mathematics');
  const [difficulty, setDifficulty] = useState(3);
  const [questionNum, setQuestionNum] = useState(1);
  const [question, setQuestion] = useState<DiagnosticQuestion | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [hintLoading, setHintLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadQuestion = useCallback(async (level: number, qNum: number, lastCorrect?: boolean) => {
    setLoading(true);
    setError(null);
    setHint(null);
    setSelected(null);
    setAnswered(false);
    try {
      const q = await generateDiagnosticQuestion({
        subject,
        difficultyLevel: level,
        questionNumber: qNum,
        lastAnswerCorrect: lastCorrect,
      });
      setQuestion(q);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load question');
    } finally {
      setLoading(false);
    }
  }, [subject]);

  const startDiagnostic = () => {
    setPhase('active');
    setQuestionNum(1);
    setCorrectCount(0);
    setDifficulty(3);
    loadQuestion(3, 1);
  };

  const selectAnswer = (optId: string) => {
    if (answered) return;
    setSelected(optId);
    setAnswered(true);
    const isCorrect = question?.options.find((o) => o.id === optId)?.isCorrect ?? false;
    if (isCorrect) setCorrectCount((c) => c + 1);
  };

  const nextQuestion = () => {
    const lastCorrect = question?.options.find((o) => o.id === selected)?.isCorrect ?? false;
    const newLevel = Math.max(1, Math.min(10, difficulty + (lastCorrect ? 1 : -1)));
    const newQNum = questionNum + 1;
    setDifficulty(newLevel);
    setQuestionNum(newQNum);
    loadQuestion(newLevel, newQNum, lastCorrect);
  };

  const finishDiagnostic = async () => {
    const finalScore = correctCount * 100 + difficulty * 50;
    setPhase('result');
    await supabase.from('diagnostic_attempts').insert({
      subject,
      final_level: difficulty,
      questions_answered: questionNum,
      correct_count: correctCount,
    });
    const newDiagScore = Math.max(profile?.diagnostic_score ?? 0, finalScore);
    const newConfidence = Math.min(100, (profile?.confidence ?? 50) + correctCount * 3);
    const newLoad = difficulty >= 8 ? 'Overloaded' : difficulty <= 2 ? 'Underutilized' : 'Optimal';
    await updateProfile({
      diagnostic_score: newDiagScore,
      confidence: newConfidence,
      cognitive_load: newLoad,
    });
  };

  const requestHint = async () => {
    if (!question) return;
    setHintLoading(true);
    try {
      const res = await getHint({
        question: question.question,
        userAnswer: selected ? question.options.find((o) => o.id === selected)?.text : undefined,
        confidence: profile?.confidence ?? 50,
      });
      setHint(res.hint);
    } catch {
      setHint('Consider what stays constant when the system changes.');
    } finally {
      setHintLoading(false);
    }
  };

  if (phase === 'setup') {
    return (
      <div className="px-4 md:px-10 py-6 md:py-10 pt-20 md:pt-10 max-w-3xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-5 h-5 text-lumen-400" />
            <span className="text-[10px] font-mono uppercase tracking-widest text-lumen-400">Adaptive Placement</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-ink-100">Placement Diagnostic</h1>
          <p className="text-ink-400 mt-2">
            An adaptive test that finds your exact level. Questions get harder or easier based on your answers.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8 space-y-6">
          <div>
            <label className="text-xs text-ink-400 font-mono uppercase tracking-widest mb-3 block">Choose Subject</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {subjects.map((s) => (
                <button
                  key={s}
                  onClick={() => setSubject(s)}
                  className={`px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    subject === s
                      ? 'bg-lumen-500/15 border border-lumen-500/30 text-lumen-300'
                      : 'bg-ink-800/50 border border-white/5 text-ink-300 hover:border-white/10'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-xs text-ink-400 font-mono uppercase tracking-widest mb-3 block">
              Starting Difficulty: <span className="text-lumen-400">{difficulty}/10</span>
            </label>
            <input
              type="range"
              min={1}
              max={10}
              value={difficulty}
              onChange={(e) => setDifficulty(parseInt(e.target.value))}
              className="w-full accent-lumen-500"
            />
            <div className="flex justify-between mt-1 text-[10px] text-ink-500 font-mono">
              <span>Beginner</span><span>Expert</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-ink-800/40 border border-white/5">
            <p className="text-sm text-ink-300">
              You'll answer 5-10 adaptive questions. The system adjusts difficulty in real time based on your responses.
              Take your time — there's no clock.
            </p>
          </div>

          <button
            onClick={startDiagnostic}
            className="w-full py-3.5 rounded-xl bg-lumen-500/15 border border-lumen-500/30 text-lumen-300 font-semibold hover:bg-lumen-500/25 transition-all flex items-center justify-center gap-2"
          >
            Begin Diagnostic <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'result') {
    const accuracy = questionNum > 0 ? Math.round((correctCount / questionNum) * 100) : 0;
    return (
      <div className="px-4 md:px-10 py-6 md:py-10 pt-20 md:pt-10 max-w-3xl mx-auto">
        <div className="glass rounded-2xl p-6 md:p-10 text-center slide-up">
          <div className="w-16 h-16 rounded-full bg-lumen-500/15 flex items-center justify-center mx-auto mb-4 lumen-breathe">
            <Brain className="w-8 h-8 text-lumen-400" />
          </div>
          <h1 className="text-2xl md:text-3xl font-bold text-ink-100 mb-2">Diagnostic Complete</h1>
          <p className="text-ink-400 mb-8">Here's your adaptive placement profile for {subject}.</p>

          <div className="grid grid-cols-3 gap-3 md:gap-4 mb-8">
            <ResultStat icon={Gauge} label="Final Level" value={`${difficulty}/10`} color="lumen" />
            <ResultStat icon={CheckCircle2} label="Correct" value={`${correctCount}/${questionNum}`} color="lumen" />
            <ResultStat icon={TrendingUp} label="Accuracy" value={`${accuracy}%`} color="amber" />
          </div>

          <div className="p-4 rounded-xl bg-ink-800/50 border border-white/5 mb-6 text-left">
            <p className="text-sm text-ink-300">
              {difficulty >= 8
                ? "You're operating at an advanced level. Lumen will challenge you with edge-case problems and synthesis tasks."
                : difficulty >= 5
                ? "Solid foundation. Lumen will focus on building deeper first-principles understanding."
                : "You're at the start of your journey. Lumen will guide you through foundational axioms step by step."}
            </p>
          </div>

          <button
            onClick={() => setPhase('setup')}
            className="px-6 py-3 rounded-xl bg-lumen-500/15 border border-lumen-500/30 text-lumen-300 font-semibold hover:bg-lumen-500/25 transition-all inline-flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> New Diagnostic
          </button>
        </div>
      </div>
    );
  }

  // Active phase
  return (
    <div className="px-4 md:px-10 py-6 md:py-10 pt-20 md:pt-10 max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-ink-400 font-mono uppercase tracking-widest">{subject}</span>
          <span className="text-xs text-ink-400 font-mono">Q{questionNum} · Level {difficulty}/10</span>
        </div>
        <div className="h-1.5 rounded-full bg-ink-800 overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-lumen-500 to-lumen-300 transition-all duration-500"
            style={{ width: `${Math.min(100, (questionNum / 8) * 100)}%` }}
          />
        </div>
      </div>

      {error && (
        <div className="glass rounded-2xl p-6 text-center mb-4 border-coral/30">
          <p className="text-coral text-sm mb-4">{error}</p>
          <button onClick={() => loadQuestion(difficulty, questionNum)} className="text-lumen-400 text-sm">
            Retry
          </button>
        </div>
      )}

      {loading && (
        <div className="glass rounded-2xl p-10 md:p-16 flex flex-col items-center justify-center">
          <Loader2 className="w-8 h-8 text-lumen-400 animate-spin mb-4" />
          <p className="text-ink-400 text-sm">Generating adaptive question…</p>
        </div>
      )}

      {!loading && question && (
        <div className="glass rounded-2xl p-5 md:p-8 slide-up">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-2 py-0.5 rounded-md bg-lumen-500/10 text-[10px] font-mono uppercase tracking-wider text-lumen-400">
              {question.category}
            </span>
            <span className="text-[10px] text-ink-500 font-mono">{question.level}</span>
          </div>

          <h2 className="text-lg md:text-xl font-semibold text-ink-100 mb-6 leading-relaxed">
            {question.question}
          </h2>

          <div className="space-y-2.5 mb-6">
            {question.options.map((opt) => {
              const isSel = selected === opt.id;
              const showResult = answered;
              const isCorrectOpt = opt.isCorrect;
              return (
                <button
                  key={opt.id}
                  onClick={() => selectAnswer(opt.id)}
                  disabled={answered}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                    showResult && isCorrectOpt
                      ? 'bg-lumen-500/10 border-lumen-500/40'
                      : showResult && isSel && !isCorrectOpt
                      ? 'bg-coral/10 border-coral/40'
                      : isSel
                      ? 'bg-lumen-500/10 border-lumen-500/30'
                      : 'bg-ink-800/40 border-white/5 hover:border-white/15'
                  } ${answered ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${
                    showResult && isCorrectOpt
                      ? 'border-lumen-400 bg-lumen-500/20'
                      : showResult && isSel && !isCorrectOpt
                      ? 'border-coral bg-coral/20'
                      : isSel
                      ? 'border-lumen-400'
                      : 'border-ink-600'
                  }`}>
                    {showResult && isCorrectOpt && <CheckCircle2 className="w-4 h-4 text-lumen-400" />}
                    {showResult && isSel && !isCorrectOpt && <XCircle className="w-4 h-4 text-coral" />}
                  </div>
                  <span className={`text-sm ${showResult && isCorrectOpt ? 'text-lumen-200' : showResult && isSel && !isCorrectOpt ? 'text-coral' : 'text-ink-200'}`}>
                    {opt.text}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Hint section */}
          {answered && (
            <div className="fade-in space-y-4">
              <div className="p-4 rounded-xl bg-ink-800/50 border border-white/5">
                <p className="text-xs text-ink-400 font-mono uppercase tracking-widest mb-2">Explanation</p>
                <p className="text-sm text-ink-200">{question.explanation}</p>
              </div>

              {!hint && (
                <button
                  onClick={requestHint}
                  disabled={hintLoading}
                  className="text-sm text-amber-glow hover:text-amber-glow/80 flex items-center gap-2 transition-colors"
                >
                  {hintLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />}
                  {hintLoading ? 'Loading hint…' : 'Get Socratic hint'}
                </button>
              )}

              {hint && (
                <div className="p-4 rounded-xl bg-amber-glow/5 border border-amber-glow/20 fade-in">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-amber-glow flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-ink-200">{hint}</p>
                  </div>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={nextQuestion}
                  className="flex-1 py-3 rounded-xl bg-lumen-500/15 border border-lumen-500/30 text-lumen-300 font-semibold hover:bg-lumen-500/25 transition-all flex items-center justify-center gap-2"
                >
                  Next Question <ChevronRight className="w-4 h-4" />
                </button>
                {questionNum >= 5 && (
                  <button
                    onClick={finishDiagnostic}
                    className="px-5 py-3 rounded-xl bg-ink-800 border border-white/10 text-ink-200 font-medium hover:bg-ink-700 transition-all"
                  >
                    Finish
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ResultStat({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: typeof Brain;
  label: string;
  value: string;
  color: 'lumen' | 'amber';
}) {
  const colors = {
    lumen: 'text-lumen-400 bg-lumen-500/10',
    amber: 'text-amber-glow bg-amber-glow/10',
  };
  return (
    <div className="p-4 rounded-xl bg-ink-800/50 border border-white/5">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mx-auto mb-2 ${colors[color]}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xl md:text-2xl font-bold text-ink-100">{value}</p>
      <p className="text-[10px] text-ink-500 font-mono uppercase tracking-widest mt-1">{label}</p>
    </div>
  );
}
