import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Chapter {
  id: string;
  name: string;
  description: string;
  color: string;
  icon: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ChapterStore {
  chapters: Chapter[];
  addChapter: (chapter: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateChapter: (id: string, chapter: Partial<Chapter>) => void;
  deleteChapter: (id: string) => void;
  getChapterById: (id: string) => Chapter | undefined;
  reorderChapters: (fromIndex: number, toIndex: number) => void;
}

// Default chapters for development
const defaultChapters: Chapter[] = [
  {
    id: '1',
    name: 'Signale',
    description: 'Alle Fragen zu Signalen, Lichtzeichen und akustischen Signalen',
    color: 'blue',
    icon: '🚦',
    order: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Bremssysteme',
    description: 'Fragen zu pneumatischen, elektrischen und mechanischen Bremssystemen',
    color: 'red',
    icon: '🛑',
    order: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Fahrzeugtechnik',
    description: 'Technische Fragen zu Lokomotiven, Waggons und Systemen',
    color: 'green',
    icon: '🚂',
    order: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'Sicherheit',
    description: 'Sicherheitsvorschriften, Notfallverfahren und Schutzmaßnahmen',
    color: 'yellow',
    icon: '⚠️',
    order: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Störungen',
    description: 'Fehlerbehebung, Störungsdiagnose und Notfallverfahren',
    color: 'orange',
    icon: '🔧',
    order: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const useChapterStore = create<ChapterStore>()(
  persist(
    (set, get) => ({
      chapters: defaultChapters,
      
      addChapter: (chapterData) => {
        const state = get();
        // Calculate the next order number
        const nextOrder = state.chapters.length > 0 
          ? Math.max(...state.chapters.map(c => c.order)) + 1 
          : 1;
        
        const newChapter: Chapter = {
          ...chapterData,
          id: Date.now().toString(),
          order: nextOrder,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        
        set((state) => ({
          chapters: [...state.chapters, newChapter].sort((a, b) => a.order - b.order),
        }));
      },
      
      updateChapter: (id, chapterData) => {
        set((state) => ({
          chapters: state.chapters.map((c) =>
            c.id === id
              ? { ...c, ...chapterData, updatedAt: new Date().toISOString() }
              : c
      ),
        }));
      },
      
      deleteChapter: (id) => {
        set((state) => ({
          chapters: state.chapters.filter((c) => c.id !== id),
        }));
      },
      
      getChapterById: (id) => {
        return get().chapters.find((c) => c.id === id);
      },
      
      reorderChapters: (fromIndex: number, toIndex: number) => {
        set((state) => {
          const newChapters = [...state.chapters];
          const [movedChapter] = newChapters.splice(fromIndex, 1);
          newChapters.splice(toIndex, 0, movedChapter);
          
          // Update order numbers
          const updatedChapters = newChapters.map((chapter, index) => ({
            ...chapter,
            order: index + 1,
            updatedAt: new Date().toISOString(),
          }));
          
          return { chapters: updatedChapters };
        });
      },
    }),
    {
      name: 'certano-chapters', // unique name for localStorage key
      partialize: (state) => ({ chapters: state.chapters }), // only persist chapters
    }
  )
);
