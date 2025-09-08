import { useState, useEffect } from 'react';

interface QuizResult {
  id: string;
  questions: any[];
  answers: any[];
  startTime: Date;
  endTime: Date;
  score: number;
  totalQuestions: number;
  chapter?: string;
  synced: boolean;
}

interface OfflineStorageState {
  isOnline: boolean;
  pendingResults: QuizResult[];
  isIndexedDBSupported: boolean;
}

export const useOfflineStorage = () => {
  const [state, setState] = useState<OfflineStorageState>({
    isOnline: navigator.onLine,
    pendingResults: [],
    isIndexedDBSupported: 'indexedDB' in window,
  });

  useEffect(() => {
    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Synchronisiere ausstehende Ergebnisse
      syncPendingResults();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Lade ausstehende Ergebnisse beim Start
    loadPendingResults();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const initIndexedDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('CertanoDB', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        
        // Quiz-Ergebnisse Store
        if (!db.objectStoreNames.contains('quizResults')) {
          const store = db.createObjectStore('quizResults', { keyPath: 'id' });
          store.createIndex('synced', 'synced', { unique: false });
          store.createIndex('timestamp', 'endTime', { unique: false });
        }

        // Offline-Fragen Store
        if (!db.objectStoreNames.contains('offlineQuestions')) {
          const store = db.createObjectStore('offlineQuestions', { keyPath: 'id' });
          store.createIndex('chapter', 'chapter', { unique: false });
        }
      };
    });
  };

  const saveQuizResult = async (result: Omit<QuizResult, 'id' | 'synced'>) => {
    if (!state.isIndexedDBSupported) {
      console.warn('IndexedDB not supported, cannot save offline');
      return;
    }

    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['quizResults'], 'readwrite');
      const store = transaction.objectStore('quizResults');

      const quizResult: QuizResult = {
        ...result,
        id: `quiz_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        synced: false,
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.add(quizResult);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      // Aktualisiere lokalen State
      setState(prev => ({
        ...prev,
        pendingResults: [...prev.pendingResults, quizResult],
      }));

      // Versuche sofort zu synchronisieren wenn online
      if (state.isOnline) {
        await syncQuizResult(quizResult);
      }

      console.log('Quiz result saved offline:', quizResult.id);
    } catch (error) {
      console.error('Error saving quiz result:', error);
    }
  };

  const loadPendingResults = async () => {
    if (!state.isIndexedDBSupported) return;

    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['quizResults'], 'readonly');
      const store = transaction.objectStore('quizResults');
      const index = store.index('synced');

      const request = index.getAll(false as any); // Nur nicht-synchronisierte
      
      request.onsuccess = () => {
        setState(prev => ({
          ...prev,
          pendingResults: request.result,
        }));
      };
    } catch (error) {
      console.error('Error loading pending results:', error);
    }
  };

  const syncQuizResult = async (result: QuizResult) => {
    try {
      const response = await fetch('/api/quiz-results', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...result,
          startTime: result.startTime.toISOString(),
          endTime: result.endTime.toISOString(),
        }),
      });

      if (response.ok) {
        // Als synchronisiert markieren
        await markAsSynced(result.id);
        
        // Aus lokalem State entfernen
        setState(prev => ({
          ...prev,
          pendingResults: prev.pendingResults.filter(r => r.id !== result.id),
        }));

        console.log('Quiz result synced:', result.id);
        return true;
      } else {
        throw new Error(`HTTP ${response.status}`);
      }
    } catch (error) {
      console.error('Error syncing quiz result:', error);
      return false;
    }
  };

  const markAsSynced = async (id: string) => {
    if (!state.isIndexedDBSupported) return;

    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['quizResults'], 'readwrite');
      const store = transaction.objectStore('quizResults');

      const getRequest = store.get(id);
      getRequest.onsuccess = () => {
        const result = getRequest.result;
        if (result) {
          result.synced = true;
          store.put(result);
        }
      };
    } catch (error) {
      console.error('Error marking as synced:', error);
    }
  };

  const syncPendingResults = async () => {
    if (!state.isOnline || state.pendingResults.length === 0) return;

    console.log('Syncing pending results:', state.pendingResults.length);

    for (const result of state.pendingResults) {
      await syncQuizResult(result);
    }
  };

  const saveOfflineQuestions = async (questions: any[]) => {
    if (!state.isIndexedDBSupported) return;

    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['offlineQuestions'], 'readwrite');
      const store = transaction.objectStore('offlineQuestions');

      // Lösche alte Fragen
      await new Promise<void>((resolve, reject) => {
        const clearRequest = store.clear();
        clearRequest.onsuccess = () => resolve();
        clearRequest.onerror = () => reject(clearRequest.error);
      });

      // Speichere neue Fragen
      for (const question of questions) {
        await new Promise<void>((resolve, reject) => {
          const request = store.add(question);
          request.onsuccess = () => resolve();
          request.onerror = () => reject(request.error);
        });
      }

      console.log('Offline questions saved:', questions.length);
    } catch (error) {
      console.error('Error saving offline questions:', error);
    }
  };

  const loadOfflineQuestions = async (): Promise<any[]> => {
    if (!state.isIndexedDBSupported) return [];

    try {
      const db = await initIndexedDB();
      const transaction = db.transaction(['offlineQuestions'], 'readonly');
      const store = transaction.objectStore('offlineQuestions');

      return new Promise((resolve, reject) => {
        const request = store.getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Error loading offline questions:', error);
      return [];
    }
  };

  return {
    ...state,
    saveQuizResult,
    loadPendingResults,
    syncPendingResults,
    saveOfflineQuestions,
    loadOfflineQuestions,
  };
};


