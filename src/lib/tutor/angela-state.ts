'use client';

import { create } from 'zustand';
import { evaluateProactive } from './ProactiveIntervention';
import type { LessonContext, SessionSnapshot } from './LessonContext';

// Zustand store central de Angela. AI_TUTOR_SPEC seccion 5 (state machine)
// + 4.4 (SessionContext) en un solo store para v1.

export type AngelaState =
  | 'idle'
  | 'active'
  | 'suggesting'
  | 'explaining'
  | 'celebrating'
  | 'resting';

export type WidgetMode = 'collapsed' | 'expanded' | 'focus';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'angela-proactive';
  content: string;
  timestamp: number;
  ruleId?: string;
}

export interface ProactiveTrigger {
  ruleId: 'consecutive-errors' | 'time-exceeded';
  messageKey: string;
  messageParams?: Record<string, string | number>;
}

const STORAGE_KEY = 'midsea_angela_chat_v1';
const HISTORY_LIMIT = 20;

interface TutorState {
  // animacion
  angelaState: AngelaState;

  // contexto curricular activo
  lessonContext: LessonContext | null;
  studentFirstName: string | null;

  // sesion (por-leccion, volatil)
  currentExercise: number; // 1-based; 0 si no empezo
  totalExercises: number;
  consecutiveErrors: number;
  totalErrors: number;
  totalCorrect: number;
  sessionStartedAt: number;
  lastExerciseStartedAt: number;
  lastInteractionAt: number;

  // widget
  widgetOpen: boolean;
  widgetMode: WidgetMode;

  // intervencion pendiente (Angela quiere decir algo)
  pendingProactive: ProactiveTrigger | null;
  hasUnreadProactive: boolean;

  // chat
  messages: ChatMessage[];
  isStreaming: boolean;
  hydrated: boolean;
}

interface TutorActions {
  // ciclo de leccion
  setLessonContext: (ctx: LessonContext | null, student?: { firstName: string }) => void;
  startExercises: (total: number) => void;
  recordAnswer: (correct: boolean) => void;
  recordInteraction: () => void;
  resetSession: () => void;

  // widget
  openWidget: (mode?: WidgetMode) => void;
  closeWidget: () => void;
  setWidgetMode: (mode: WidgetMode) => void;

  // chat
  addMessage: (msg: { role: ChatMessage['role']; content: string; ruleId?: string }) => string; // returns id
  appendAssistantToken: (id: string, token: string) => void;
  finishStreaming: () => void;
  clearHistory: () => void;

  // angela state + proactive
  setAngelaState: (state: AngelaState) => void;
  consumeProactive: () => ProactiveTrigger | null;

  // persistencia
  hydrateFromStorage: () => void;

  // snapshot util (para construir prompt)
  getSessionSnapshot: () => SessionSnapshot;
}

let messageIdCounter = 0;
function makeMessageId(): string {
  messageIdCounter += 1;
  return `m_${Date.now()}_${messageIdCounter}`;
}

function persistMessages(messages: ChatMessage[]) {
  try {
    const tail = messages.slice(-HISTORY_LIMIT);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tail));
  } catch {
    /* ignore */
  }
}

function loadMessages(): ChatMessage[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m): m is ChatMessage =>
        typeof m?.id === 'string' &&
        typeof m?.content === 'string' &&
        (m?.role === 'user' || m?.role === 'assistant' || m?.role === 'angela-proactive')
    ).slice(-HISTORY_LIMIT);
  } catch {
    return [];
  }
}

export const useTutorStore = create<TutorState & TutorActions>((set, get) => ({
  angelaState: 'idle',
  lessonContext: null,
  studentFirstName: null,
  currentExercise: 0,
  totalExercises: 0,
  consecutiveErrors: 0,
  totalErrors: 0,
  totalCorrect: 0,
  sessionStartedAt: 0,
  lastExerciseStartedAt: 0,
  lastInteractionAt: 0,
  widgetOpen: false,
  widgetMode: 'collapsed',
  pendingProactive: null,
  hasUnreadProactive: false,
  messages: [],
  isStreaming: false,
  hydrated: false,

  setLessonContext: (ctx, student) => {
    const now = Date.now();
    set({
      lessonContext: ctx,
      studentFirstName: student?.firstName ?? get().studentFirstName,
      angelaState: ctx ? 'active' : 'idle',
      sessionStartedAt: ctx ? now : 0,
      lastExerciseStartedAt: ctx ? now : 0,
      currentExercise: 0,
      totalExercises: 0,
      consecutiveErrors: 0,
      totalErrors: 0,
      totalCorrect: 0,
      pendingProactive: null,
      hasUnreadProactive: false
    });
  },

  startExercises: (total) => {
    const now = Date.now();
    set({
      totalExercises: total,
      currentExercise: total > 0 ? 1 : 0,
      lastExerciseStartedAt: now,
      consecutiveErrors: 0
    });
  },

  recordAnswer: (correct) => {
    const s = get();
    const now = Date.now();
    const consecutiveErrors = correct ? 0 : s.consecutiveErrors + 1;
    const totalErrors = correct ? s.totalErrors : s.totalErrors + 1;
    const totalCorrect = correct ? s.totalCorrect + 1 : s.totalCorrect;
    const currentExercise = Math.min(s.currentExercise + 1, s.totalExercises);

    // Evaluar intervencion proactiva con el snapshot post-actualizacion.
    const proactive = evaluateProactive({
      session: {
        currentExercise,
        totalExercises: s.totalExercises,
        consecutiveErrors,
        totalErrors,
        totalCorrect,
        sessionStartedAt: s.sessionStartedAt,
        lastExerciseStartedAt: s.lastExerciseStartedAt,
        studentInteractedRecently: now - s.lastInteractionAt < 30_000,
        msSinceLastExercise: now - s.lastExerciseStartedAt
      },
      lessonEstMinutes: s.lessonContext?.estMinutes ?? 0,
      studentInteractedWithinMs: now - s.lastInteractionAt
    });

    set({
      consecutiveErrors,
      totalErrors,
      totalCorrect,
      currentExercise,
      lastExerciseStartedAt: now,
      angelaState: proactive ? 'suggesting' : correct ? 'celebrating' : 'active',
      pendingProactive: proactive,
      hasUnreadProactive: proactive ? true : s.hasUnreadProactive
    });

    // Despues de "celebrating" volver a active.
    if (correct && !proactive) {
      setTimeout(() => {
        const cur = get();
        if (cur.angelaState === 'celebrating') set({ angelaState: 'active' });
      }, 1800);
    }
  },

  recordInteraction: () => set({ lastInteractionAt: Date.now() }),

  resetSession: () =>
    set({
      currentExercise: 0,
      totalExercises: 0,
      consecutiveErrors: 0,
      totalErrors: 0,
      totalCorrect: 0,
      pendingProactive: null,
      hasUnreadProactive: false,
      angelaState: 'idle'
    }),

  openWidget: (mode = 'expanded') => {
    set({
      widgetOpen: true,
      widgetMode: mode,
      hasUnreadProactive: false,
      lastInteractionAt: Date.now()
    });
  },

  closeWidget: () => set({ widgetOpen: false, widgetMode: 'collapsed' }),

  setWidgetMode: (mode) => set({ widgetMode: mode }),

  addMessage: ({ role, content, ruleId }) => {
    const id = makeMessageId();
    const messages = [
      ...get().messages,
      { id, role, content, timestamp: Date.now(), ruleId }
    ].slice(-HISTORY_LIMIT);
    set({ messages });
    persistMessages(messages);
    return id;
  },

  appendAssistantToken: (id, token) => {
    const messages = get().messages.map((m) =>
      m.id === id ? { ...m, content: m.content + token } : m
    );
    set({ messages });
    // No persistimos en cada token (demasiado caro); finishStreaming lo hace.
  },

  finishStreaming: () => {
    set({ isStreaming: false, angelaState: 'active' });
    persistMessages(get().messages);
  },

  clearHistory: () => {
    set({ messages: [] });
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },

  setAngelaState: (state) => set({ angelaState: state }),

  consumeProactive: () => {
    const p = get().pendingProactive;
    set({ pendingProactive: null, hasUnreadProactive: false });
    return p;
  },

  hydrateFromStorage: () => {
    if (get().hydrated) return;
    const messages = loadMessages();
    set({ messages, hydrated: true });
  },

  getSessionSnapshot: () => {
    const s = get();
    const now = Date.now();
    return {
      currentExercise: s.currentExercise,
      totalExercises: s.totalExercises,
      consecutiveErrors: s.consecutiveErrors,
      totalErrors: s.totalErrors,
      totalCorrect: s.totalCorrect,
      sessionStartedAt: s.sessionStartedAt,
      lastExerciseStartedAt: s.lastExerciseStartedAt,
      studentInteractedRecently: now - s.lastInteractionAt < 30_000,
      msSinceLastExercise: now - s.lastExerciseStartedAt
    };
  }
}));

// Para componentes que necesitan setStreaming explicitamente al iniciar fetch.
export function setStreaming(isStreaming: boolean) {
  useTutorStore.setState({ isStreaming });
}
