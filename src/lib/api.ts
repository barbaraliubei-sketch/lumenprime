export type SynthResponse = {
  title: string;
  phase: string;
  axioms: string[];
  modules: {
    unit: string;
    name: string;
    description: string;
    duration: string;
    fidgetableInformer: string;
    status: string;
  }[];
  socraticChallenge: string;
};

export type DiagnosticQuestion = {
  id: string;
  category: string;
  level: string;
  question: string;
  options: { id: string; text: string; isCorrect: boolean }[];
  firstPrinciplesHint: string;
  explanation: string;
};

export type HintResponse = {
  hint: string;
  socraticReflection: string;
};

export type ChatResponse = {
  text: string;
  groundingSources: { title: string; uri: string }[];
};

async function postJson(url: string, body: unknown): Promise<Response> {
  return fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

export async function synthesizeCourse(topic: string, phase: string): Promise<SynthResponse> {
  const res = await postJson('/api/synthesize', { topic, phase });
  if (!res.ok) throw new Error(`Synthesis failed (${res.status})`);
  const data = await res.json();
  if (!data || !data.title) throw new Error('Invalid synthesis response');
  return data;
}

export async function generateDiagnosticQuestion(params: {
  subject: string;
  difficultyLevel: number;
  questionNumber: number;
  lastAnswerCorrect?: boolean;
}): Promise<DiagnosticQuestion> {
  const res = await postJson('/api/generate-diagnostic-question', params);
  if (!res.ok) throw new Error(`Question generation failed (${res.status})`);
  const data = await res.json();
  if (!data || !data.question || !Array.isArray(data.options)) throw new Error('Invalid question response');
  return data;
}

export async function getHint(params: {
  question: string;
  userAnswer?: string;
  confidence?: number;
}): Promise<HintResponse> {
  const res = await postJson('/api/diagnostic-hint', params);
  if (!res.ok) throw new Error(`Hint request failed (${res.status})`);
  const data = await res.json();
  if (!data || !data.hint) throw new Error('Invalid hint response');
  return data;
}

export async function sendChatMessage(params: {
  messages: { sender: string; text: string }[];
  useSearch?: boolean;
}): Promise<ChatResponse> {
  const res = await postJson('/api/gemini/chat', {
    messages: params.messages,
    useSearch: params.useSearch ?? false,
  });
  if (!res.ok) throw new Error(`Chat failed (${res.status})`);
  const data = await res.json();
  if (!data || typeof data.text !== 'string') throw new Error('Invalid chat response');
  return data;
}
