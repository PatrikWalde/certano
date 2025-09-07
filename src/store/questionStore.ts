import { create } from 'zustand';
import { Question } from '../types';

interface QuestionStore {
  questions: Question[];
  addQuestion: (question: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateQuestion: (id: string, question: Partial<Question>) => void;
  deleteQuestion: (id: string) => void;
  getQuestionById: (id: string) => Question | undefined;
}

// Mock questions for development
const mockQuestions: Question[] = [
  {
    id: '1',
    chapter: 'Signale',
    type: 'multiple_choice',
    prompt: 'Was bedeutet das Signal "Halt erwarten"?',
    options: [
      { id: 'a', text: 'Sofortiger Halt', isCorrect: false },
      { id: 'b', text: 'Halt erwarten', isCorrect: true },
      { id: 'c', text: 'Langsam fahren', isCorrect: false },
      { id: 'd', text: 'Frei fahren', isCorrect: false },
    ],
    explanation: 'Das Signal "Halt erwarten" bedeutet, dass der nächste Haltpunkt erreicht werden soll.',
    difficulty: 'easy',
    tags: ['signale', 'halt'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    chapter: 'Bremssysteme',
    type: 'true_false',
    prompt: 'Die pneumatische Bremse ist das primäre Bremssystem bei Zügen.',
    options: [
      { id: 'true', text: 'Richtig', isCorrect: true },
      { id: 'false', text: 'Falsch', isCorrect: false },
    ],
    explanation: 'Die pneumatische Bremse ist tatsächlich das primäre Bremssystem bei den meisten Zügen.',
    difficulty: 'medium',
    tags: ['bremse', 'pneumatik'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    chapter: 'Fahrzeugtechnik',
    type: 'multiple_choice',
    prompt: 'Welche Komponente ist für die Stromversorgung des Zuges zuständig?',
    options: [
      { id: 'a', text: 'Transformator', isCorrect: true },
      { id: 'b', text: 'Generator', isCorrect: false },
      { id: 'c', text: 'Kondensator', isCorrect: false },
      { id: 'd', text: 'Widerstand', isCorrect: false },
    ],
    explanation: 'Der Transformator wandelt die Oberleitungsspannung in die benötigte Bordspannung um.',
    difficulty: 'hard',
    tags: ['elektrik', 'transformator'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useQuestionStore = create<QuestionStore>((set, get) => ({
  questions: mockQuestions,
  
  addQuestion: (questionData) => {
    const newQuestion: Question = {
      ...questionData,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    set((state) => ({
      questions: [...state.questions, newQuestion],
    }));
  },
  
  updateQuestion: (id, questionData) => {
    set((state) => ({
      questions: state.questions.map((q) =>
        q.id === id
          ? { ...q, ...questionData, updatedAt: new Date().toISOString() }
          : q
      ),
    }));
  },
  
  deleteQuestion: (id) => {
    set((state) => ({
      questions: state.questions.filter((q) => q.id !== id),
    }));
  },
  
  getQuestionById: (id) => {
    return get().questions.find((q) => q.id === id);
  },
}));


