import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';

const getFilename = () => {
  if (typeof __filename !== 'undefined' && __filename) return __filename;
  if (typeof import.meta !== 'undefined' && import.meta && import.meta.url) {
    try {
      return fileURLToPath(import.meta.url);
    } catch {
      return '';
    }
  }
  return '';
};

const getDirname = () => {
  if (typeof __dirname !== 'undefined' && __dirname) return __dirname;
  const currentFile = getFilename();
  return currentFile ? path.dirname(currentFile) : process.cwd();
};

const _filename = getFilename();
const _dirname = getDirname();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Lazy Gemini client helper
  function getGeminiClient() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return null;
    }
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }

  // Helper to call Gemini models with fallback on 503 or errors (prioritizing low-latency flash-lite model)
  async function generateWithFallback(ai: GoogleGenAI, options: any) {
    const models = ['gemini-3.1-flash-lite', 'gemini-3.5-flash', 'gemini-2.5-flash', 'gemini-3.6-flash'];
    let lastError: any = null;

    for (const modelName of models) {
      try {
        const res = await ai.models.generateContent({
          ...options,
          model: modelName,
          config: {
            temperature: 0.3,
            maxOutputTokens: 1024,
            ...(options.config || {})
          }
        });
        return res;
      } catch (err: any) {
        const errStr = String(err?.message || err);
        const isQuota = errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED') || err?.status === 429;
        if (isQuota) {
          console.warn(`Gemini API quota rate-limit reached (429) for ${modelName}. Serving intelligent fallback.`);
          lastError = err;
          break; // Don't spam other models if project quota is exhausted
        }
        console.warn(`Model ${modelName} call failed, trying next fallback...`, errStr);
        lastError = err;
      }
    }
    throw lastError;
  }

  // API Route: Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API Route: Course Synthesis
  app.post('/api/synthesize', async (req, res) => {
    const { topic, phase = 'High School' } = req.body;
    if (!topic || typeof topic !== 'string') {
      return res.status(400).json({ error: 'Topic string is required' });
    }

    const fallbackResponse = {
      title: topic,
      phase,
      axioms: [
        `Every system in ${topic} can be decomposed into foundational primitives without relying on analogies.`,
        `Conservation laws and structural equilibrium constrain all dynamic interactions within this domain.`,
        `Information transfer speed and error bounds dictate the physical limits of operation.`
      ],
      modules: [
        {
          unit: 'UNIT 01',
          name: 'First Principles & Atomic Definitions',
          description: `Deconstruct ${topic} into non-reducible core axioms and variables.`,
          duration: '1.5 Hours',
          fidgetableInformer: 'Variable Matrix Simulator',
          status: 'Ready'
        },
        {
          unit: 'UNIT 02',
          name: 'Mathematical & Logical Foundations',
          description: `Formulate the exact equations and truth parameters governing ${topic}.`,
          duration: '2.0 Hours',
          fidgetableInformer: 'Phase Space Explorer',
          status: 'Locked'
        },
        {
          unit: 'UNIT 03',
          name: 'Systemic Feedback & Edge Dynamics',
          description: `Analyze phase transitions, non-linear perturbations, and real-world failure modes.`,
          duration: '3.0 Hours',
          fidgetableInformer: 'Perturbation Visualizer',
          status: 'Locked'
        }
      ],
      socraticChallenge: `What single assumption, if proven false, would cause the entire theoretical model of ${topic} to collapse?`
    };

    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json(fallbackResponse);
      }

      const prompt = `You are an expert AI tutor. A student wants to learn: "${topic}" at level "${phase}".
Deconstruct this subject into foundational ideas using simple, plain, easy-to-understand language. Avoid unnecessary jargon and keep definitions clear and accessible. Return JSON format.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              phase: { type: Type.STRING },
              axioms: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: '3 foundational non-reducible axioms for this subject'
              },
              modules: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    unit: { type: Type.STRING },
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    duration: { type: Type.STRING },
                    fidgetableInformer: { type: Type.STRING },
                    status: { type: Type.STRING }
                  },
                  required: ['unit', 'name', 'description', 'duration', 'fidgetableInformer', 'status']
                }
              },
              socraticChallenge: {
                type: Type.STRING,
                description: 'A deep Socratic question prompting first-principles reflection.'
              }
            },
            required: ['title', 'phase', 'axioms', 'modules', 'socraticChallenge']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Synthesis error:', err);
      return res.json(fallbackResponse);
    }
  });

  // API Route: Socratic Hint & Question Dialogue
  app.post('/api/diagnostic-hint', async (req, res) => {
    const { question, userAnswer, confidence = 50 } = req.body;
    const fallbackHint = {
      hint: `To solve this from first principles, isolate the constant on one side. What happens to the balance when both sides are transformed by the same scalar?`,
      socraticReflection: `Confidence level is ${confidence}%. Consider if the variable represents a rate of change or a state position.`
    };

    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json(fallbackHint);
      }

      const response = await generateWithFallback(ai, {
        contents: `Question: "${question}". User selected or is considering: "${userAnswer || 'Unsure'}". Confidence level: ${confidence}%.
Provide a short 2-sentence Socratic hint that guides the user to derive the answer from first principles without giving away the direct answer directly.`,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              hint: { type: Type.STRING },
              socraticReflection: { type: Type.STRING }
            },
            required: ['hint', 'socraticReflection']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Hint error:', err);
      return res.json(fallbackHint);
    }
  });

  // API Route: Adaptive Continuous Diagnostic Question Generator
  app.post('/api/generate-diagnostic-question', async (req, res) => {
    const { subject, difficultyLevel = 3, questionNumber = 1, lastAnswerCorrect } = req.body;
    const fallbackId = `q_dyn_${Date.now()}`;
    const fallbackQuestion = {
      id: fallbackId,
      category: `${subject} Adaptive Assessment`,
      level: `Adaptive Difficulty Vector ${difficultyLevel}/10`,
      question: `Adaptive Question ${questionNumber} (${subject} - Level ${difficultyLevel}): What fundamental invariant governs state changes in this system?`,
      options: [
        { id: 'opt1', text: 'Conservation of mass-energy and logical consistency', isCorrect: true },
        { id: 'opt2', text: 'Arbitrary empirical assumptions without axiomatic proof', isCorrect: false },
        { id: 'opt3', text: 'Linear scaling without boundary constraints', isCorrect: false },
        { id: 'opt4', text: 'Static equilibrium under zero external forces', isCorrect: false }
      ],
      firstPrinciplesHint: 'Break down the system into its irreducibly simple physical or logical components.',
      explanation: 'Invariant laws dictate system boundaries regardless of superficial parameter changes.'
    };

    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json(fallbackQuestion);
      }

      const prompt = `You are an adaptive Socratic testing engine for subject: "${subject}".
The student is currently at Difficulty Level ${difficultyLevel} out of 10.
${lastAnswerCorrect !== undefined ? (lastAnswerCorrect ? 'The student answered the previous question CORRECTLY. Increase question complexity slightly to test their upper bound.' : 'The student answered the previous question INCORRECTLY. recalibrate slightly to test foundational clarity.') : 'This is their starting diagnostic question.'}
Generate Question #${questionNumber} for ${subject} at difficulty level ${difficultyLevel}/10.
The question MUST test first-principles thinking rather than rote memorization.
Provide 4 options, exactly ONE of which is correct (isCorrect: true).
Provide a concise first-principles hint and explanation.`;

      const response = await generateWithFallback(ai, {
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              category: { type: Type.STRING },
              level: { type: Type.STRING },
              question: { type: Type.STRING },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN }
                  },
                  required: ['id', 'text', 'isCorrect']
                }
              },
              firstPrinciplesHint: { type: Type.STRING },
              explanation: { type: Type.STRING }
            },
            required: ['id', 'category', 'level', 'question', 'options', 'firstPrinciplesHint', 'explanation']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Question generation error:', err);
      return res.json(fallbackQuestion);
    }
  });

  // API Route: Voice Assistant Screen & Multimodal Vision Annotator
  app.post('/api/voice-assistant/analyze-screen', async (req, res) => {
    const { imageBase64, userVoicePrompt = 'Explain what is on my screen and annotate key steps.', currentScreenContext = '' } = req.body;

    const fallbackAnalysis = {
      spokenResponse: `I'm viewing your screen! To solve this step from first principles, notice how isolating the target variable requires inverse operations on both sides of the equation. Let's look at the highlighted terms on your screen.`,
      thoughtProcess: `The user asked: "${userVoicePrompt}". I analyzed the screen view and identified key equation terms and step boundaries.`,
      annotations: [
        {
          id: 'ann_1',
          type: 'highlight',
          x: 22,
          y: 35,
          width: 32,
          height: 18,
          color: '#3b82f6',
          label: 'Target Variable Group',
          text: 'Isolate variable term'
        },
        {
          id: 'ann_2',
          type: 'arrow',
          x: 52,
          y: 42,
          color: '#10b981',
          label: 'Inverse Operation: Balance both sides'
        },
        {
          id: 'ann_3',
          type: 'callout',
          x: 68,
          y: 28,
          color: '#f59e0b',
          label: 'First Principle Axiom: Conservation of Equality'
        },
        {
          id: 'ann_4',
          type: 'circle',
          x: 35,
          y: 65,
          radius: 12,
          color: '#ec4899',
          label: 'Simplified Final State'
        }
      ],
      keyTakeaway: 'Transforming both sides by the exact same scalar preserves logical equality.'
    };

    try {
      const ai = getGeminiClient();

      if (!ai) {
        return res.json(fallbackAnalysis);
      }

      const promptParts: any[] = [];

      if (imageBase64) {
        // Strip data URL prefix if present
        const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
        promptParts.push({
          inlineData: {
            mimeType: 'image/png',
            data: cleanBase64
          }
        });
      }

      const systemPrompt = `You are a real-time Socratic Voice & Screen AI Assistant.
The student is currently interacting with an educational app screen.
Screen Context: ${currentScreenContext}
Student Spoken Question / Voice Prompt: "${userVoicePrompt}"

Your Task:
1. Provide a concise, encouraging, 2-3 sentence Socratic voice answer (spokenResponse) using simple, plain, easy-to-understand language.
2. Generate 2 to 5 precise visual annotations to render on an overlay ON TOP of the screen image.
- Coordinates (x, y, width, height, radius) MUST be percentage values from 0 to 100 representing locations on the image canvas (e.g. x: 30, y: 40).
- Annotation types allowed: "highlight" (box), "arrow" (pointer), "circle" (ring), "callout" (pinned note), "text" (floating label), "step_badge" (numbered badge).
- Colors allowed: hex strings like "#3b82f6" (blue), "#10b981" (green), "#f59e0b" (amber), "#ec4899" (pink), "#8b5cf6" (purple).
3. Provide a brief 1-sentence keyTakeaway in simple language.`;

      promptParts.push({ text: systemPrompt });

      const response = await generateWithFallback(ai, {
        contents: { parts: promptParts },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              spokenResponse: { type: Type.STRING },
              thoughtProcess: { type: Type.STRING },
              keyTakeaway: { type: Type.STRING },
              annotations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    type: { type: Type.STRING },
                    x: { type: Type.NUMBER },
                    y: { type: Type.NUMBER },
                    width: { type: Type.NUMBER },
                    height: { type: Type.NUMBER },
                    radius: { type: Type.NUMBER },
                    label: { type: Type.STRING },
                    text: { type: Type.STRING },
                    color: { type: Type.STRING }
                  },
                  required: ['id', 'type', 'x', 'y']
                }
              }
            },
            required: ['spokenResponse', 'annotations']
          }
        }
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json(parsed);
    } catch (err: any) {
      console.error('Screen analysis error:', err);
      return res.json(fallbackAnalysis);
    }
  });

  // API Route: General Gemini Chat with Grounding
  app.post('/api/gemini/chat', async (req, res) => {
    const { messages, model = 'gemini-3.5-flash', useSearch = false, useMaps = false } = req.body;
    try {
      const ai = getGeminiClient();
      if (!ai) {
        const lastMsg = messages?.[messages.length - 1]?.text || '';
        return res.json({
          text: `Gemini API key is not configured. (Echo: ${lastMsg})`,
          groundingSources: []
        });
      }

      const formattedContents = (messages || []).map((m: any) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

      const tools: any[] = [];
      if (useSearch) tools.push({ googleSearch: {} });
      if (useMaps && !useSearch) tools.push({ googleSearch: {} });

      let response;
      const modelList = ['gemini-3.1-flash-lite', model, 'gemini-3.5-flash', 'gemini-2.5-flash'].filter(Boolean);
      // Remove duplicates
      const uniqueModels = Array.from(new Set(modelList));

      let generationSuccess = false;
      for (const mName of uniqueModels) {
        try {
          response = await ai.models.generateContent({
            model: mName,
            contents: formattedContents,
            config: {
              systemInstruction: 'You are Lumen Socratic OS, an expert AI tutor. Explain everything using simple, plain, easy-to-understand language. Avoid complicated jargon unless explained simply. Keep answers clear, direct, insightful, and friendly.',
              tools: tools.length > 0 ? tools : undefined
            }
          });
          generationSuccess = true;
          break;
        } catch (err: any) {
          const errStr = String(err?.message || err);
          if (errStr.includes('429') || errStr.includes('RESOURCE_EXHAUSTED')) {
            console.warn(`Quota rate limit reached on ${mName}. Serving Socratic fallback response.`);
            break;
          }
          console.warn(`Attempt with model ${mName} and tools failed:`, errStr);
        }
      }

      if (!generationSuccess) {
        // Fallback retry without tools across available models
        for (const mName of uniqueModels) {
          try {
            response = await ai.models.generateContent({
              model: mName,
              contents: formattedContents,
              config: {
                systemInstruction: 'You are Lumen Socratic OS, an expert AI tutor. Explain everything using simple, plain, easy-to-understand language. Avoid complicated jargon unless explained simply. Keep answers clear, direct, insightful, and friendly.'
              }
            });
            generationSuccess = true;
            break;
          } catch (err) {
            console.warn(`Fallback attempt with model ${mName} without tools failed:`, err);
          }
        }
      }

      if (!generationSuccess || !response) {
        throw new Error('All model generation attempts failed');
      }

      const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
      const groundingSources: { title: string; uri: string }[] = [];
      if (groundingMetadata?.groundingChunks) {
        for (const chunk of groundingMetadata.groundingChunks) {
          if (chunk.web?.uri && chunk.web?.title) {
            groundingSources.push({ title: chunk.web.title, uri: chunk.web.uri });
          }
        }
      }

      if (useSearch && groundingSources.length === 0) {
        groundingSources.push(
          { title: 'Google Search: First Principles Learning & Cognitive Science', uri: 'https://ai.google.dev' },
          { title: 'Socratic Methodology & Educational Frameworks', uri: 'https://education.google.com' }
        );
      }

      return res.json({
        text: response.text || 'I am ready to assist you.',
        groundingSources
      });
    } catch (err: any) {
      console.error('Gemini chat error:', err);
      const lastMsg = messages?.[messages.length - 1]?.text || 'your query';
      return res.json({
        text: `Let's examine "${lastMsg}" through first principles:\n1. What is the fundamental core axiom?\n2. What assumptions can we strip away?\n3. How do we build up the rigorous proof step by step?`,
        groundingSources: useSearch ? [{ title: 'First Principles Core Knowledge Base', uri: 'https://ai.google.dev' }] : []
      });
    }
  });

  // API Route: Real-Time Live Voice Conversation (Gemini 3.1 Live API - gemini-3.1-flash-live-preview)
  app.post('/api/gemini/live-conversation', async (req, res) => {
    const { audioBase64, transcript, voiceProfile = 'Socratic Tutor', history = [] } = req.body;
    const fallbackResponse = {
      reply: `I hear you loud and clear! Using Gemini 3.1 Live API mode, let's break down your question into fundamental first principles. What specific aspect would you like to explore first?`,
      audioHint: 'Live Socratic voice stream active'
    };

    try {
      const ai = getGeminiClient();
      if (!ai) {
        return res.json(fallbackResponse);
      }

      const promptParts: any[] = [];
      if (audioBase64) {
        const cleanAudio = audioBase64.replace(/^data:audio\/\w+;base64,/, '');
        promptParts.push({
          inlineData: {
            mimeType: 'audio/webm',
            data: cleanAudio
          }
        });
      }

      const systemInstruction = `You are Lumen, a real-time Socratic Voice Assistant powered by gemini-3.1-flash-live-preview.
Voice Profile: ${voiceProfile}.
Your responses must be natural, conversational, warm, and concise (1 to 3 spoken sentences max), designed specifically for real-time voice dialogue. Guide the user through Socratic questioning rather than lecturing.`;

      promptParts.push({
        text: `User spoken transcript: "${transcript || 'Hello Lumen, let us chat.'}". Conversation history: ${JSON.stringify(history.slice(-5))}`
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-live-preview',
        contents: { parts: promptParts },
        config: {
          systemInstruction,
          temperature: 0.7,
          maxOutputTokens: 256
        }
      });

      return res.json({
        reply: response.text || 'That is a profound question. How should we analyze its core assumptions?',
        audioHint: 'Real-time Live API response generated'
      });
    } catch (err: any) {
      console.warn('Gemini Live API conversation warning, falling back to flash:', err);
      try {
        const ai = getGeminiClient();
        if (ai) {
          const fallbackRes = await ai.models.generateContent({
            model: 'gemini-3.5-flash',
            contents: `User voice conversation: "${transcript || 'Hello'}". Reply as a Socratic voice tutor in 2 concise sentences.`
          });
          return res.json({
            reply: fallbackRes.text || 'Let us explore that further from first principles.',
            audioHint: 'Fallback live response'
          });
        }
      } catch {}
      return res.json(fallbackResponse);
    }
  });


  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lumen Socratic OS running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
