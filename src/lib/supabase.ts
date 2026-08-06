import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: number;
  display_name: string;
  diagnostic_score: number;
  confidence: number;
  cognitive_load: string;
  updated_at: string;
};

export type SynthModule = {
  unit: string;
  name: string;
  description: string;
  duration: string;
  fidgetableInformer: string;
  status: string;
};

export type SynthesizedPath = {
  id: string;
  title: string;
  phase: string;
  axioms: string[];
  modules: SynthModule[];
  socratic_challenge: string | null;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  sender: 'user' | 'lumen';
  text: string;
  action_taken: string | null;
  created_at: string;
};

export type DiagnosticAttempt = {
  id: string;
  subject: string;
  final_level: number;
  questions_answered: number;
  correct_count: number;
  created_at: string;
};

export type UnitProgress = {
  id: string;
  path_id: string;
  unit_id: string;
  progress: number;
  updated_at: string;
};
