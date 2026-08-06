import { useEffect, useState } from 'react';
import { supabase, type Profile } from './lib/supabase';
import Sidebar from './components/Sidebar';
import Dashboard from './views/Dashboard';
import Diagnostic from './views/Diagnostic';
import Synthesizer from './views/Synthesizer';
import Tutor from './views/Tutor';
import type { View } from './types';

export default function App() {
  const [view, setView] = useState<View>('dashboard');
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', 1)
        .maybeSingle();
      setProfile(data as Profile | null);
      setLoading(false);
    })();
  }, []);

  const updateProfile = async (updates: Partial<Profile>) => {
    const { data } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', 1)
      .select('*')
      .maybeSingle();
    if (data) setProfile(data as Profile);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-ink-950">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-lumen-500/30 border-t-lumen-400 animate-spin" />
          <p className="text-ink-300 text-sm font-mono tracking-widest uppercase">Initializing Lumen</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-ink-950 noise-overlay">
      <Sidebar view={view} setView={setView} profile={profile} />
      <main className="flex-1 ml-0 md:ml-64 overflow-x-hidden">
        <div key={view} className="slide-up">
          {view === 'dashboard' && <Dashboard setView={setView} profile={profile} updateProfile={updateProfile} />}
          {view === 'diagnostic' && <Diagnostic profile={profile} updateProfile={updateProfile} />}
          {view === 'synthesizer' && <Synthesizer />}
          {view === 'tutor' && <Tutor />}
        </div>
      </main>
    </div>
  );
}
