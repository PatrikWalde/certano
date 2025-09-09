import { supabase } from '../lib/supabase';
import { SessionAnswer } from '../types';

export interface QuizSessionData {
  sessionType: 'quick_quiz' | 'chapter_quiz' | 'error_review';
  chapterName?: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracyRate: number;
  totalTimeSeconds: number;
  xpEarned: number;
  answers: SessionAnswer[];
}

export const saveQuizSession = async (sessionData: QuizSessionData) => {
  try {
    console.log('Speichere Quiz-Session:', sessionData);
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Benutzer nicht angemeldet');
    }

    console.log('Benutzer-ID für Session:', user.id);

    // 1. Erstelle Quiz-Session
    const { data: session, error: sessionError } = await supabase
      .from('quiz_sessions')
      .insert({
        user_id: user.id,
        session_type: sessionData.sessionType,
        chapter_name: sessionData.chapterName,
        total_questions: sessionData.totalQuestions,
        correct_answers: sessionData.correctAnswers,
        accuracy_rate: sessionData.accuracyRate,
        total_time_seconds: sessionData.totalTimeSeconds,
        xp_earned: sessionData.xpEarned,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (sessionError) {
      console.log('Fehler beim Speichern der Quiz-Session:', sessionError);
      // Wenn die Tabelle noch nicht existiert, nur die Statistiken aktualisieren
      if (sessionError.code === 'PGRST205') {
        console.log('Quiz-Sessions Tabelle noch nicht erstellt. Aktualisiere nur Statistiken.');
        await updateUserStats(user.id, sessionData);
        return null; // Keine Session-ID zurückgeben
      }
      throw sessionError;
    }

    // 2. Speichere alle Antworten
    const answersToInsert = sessionData.answers.map(answer => ({
      session_id: session.id,
      question_id: answer.questionId,
      user_answer: answer.userAnswer,
      selected_options: answer.selectedOptions,
      fill_blank_answers: answer.fillBlankAnswers,
      is_correct: answer.isCorrect,
      time_spent_seconds: answer.timeSpent,
      answered_at: answer.answeredAt
    }));

    const { error: answersError } = await supabase
      .from('quiz_answers')
      .insert(answersToInsert);

    if (answersError) {
      console.warn('Fehler beim Speichern der Antworten:', answersError);
      // Nicht werfen, da die Session bereits gespeichert wurde
    }

    // 3. Aktualisiere Benutzer-Statistiken
    await updateUserStats(user.id, sessionData);

    return session;
  } catch (error) {
    console.error('Fehler beim Speichern der Quiz-Session:', error);
    throw error;
  }
};

const updateUserStats = async (userId: string, sessionData: QuizSessionData) => {
  try {
    console.log('Aktualisiere Statistiken für Benutzer:', userId, 'mit Daten:', sessionData);
    
    // Hole aktuelle Statistiken
    const { data: currentStats, error: fetchError } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      if (fetchError.code === 'PGRST205') {
        console.log('user_stats Tabelle existiert nicht. Statistiken werden nicht aktualisiert.');
        return;
      }
      throw fetchError;
    }

    const newStats = {
      user_id: userId,
      total_questions_answered: (currentStats?.total_questions_answered || 0) + sessionData.totalQuestions,
      total_correct_answers: (currentStats?.total_correct_answers || 0) + sessionData.correctAnswers,
      total_xp: (currentStats?.total_xp || 0) + sessionData.xpEarned,
      current_level: Math.floor(((currentStats?.total_xp || 0) + sessionData.xpEarned) / 100) + 1,
      current_streak: (currentStats?.current_streak || 0) + 1, // Vereinfacht - könnte komplexer sein
      longest_streak: Math.max(currentStats?.longest_streak || 0, (currentStats?.current_streak || 0) + 1),
      total_time_spent: (currentStats?.total_time_spent || 0) + sessionData.totalTimeSeconds
    };

    if (currentStats) {
      // Aktualisiere bestehende Statistiken
      const { error: updateError } = await supabase
        .from('user_stats')
        .update(newStats)
        .eq('user_id', userId);
      
      if (updateError) {
        throw updateError;
      }
      console.log('Statistiken erfolgreich aktualisiert');
    } else {
      // Erstelle neue Statistiken
      const { error: insertError } = await supabase
        .from('user_stats')
        .insert(newStats);
      
      if (insertError) {
        throw insertError;
      }
      console.log('Neue Statistiken erfolgreich erstellt');
    }

    // Aktualisiere Kapitel-Statistiken
    await updateChapterStats(userId, sessionData);
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Benutzer-Statistiken:', error);
  }
};

const updateChapterStats = async (userId: string, sessionData: QuizSessionData) => {
  try {
    console.log('Aktualisiere Kapitel-Statistiken für Benutzer:', userId);
    
    // Gruppiere Antworten nach Kapitel
    const chapterAnswers: { [chapter: string]: { correct: number; total: number } } = {};
    
    sessionData.answers.forEach(answer => {
      // Verwende das Kapitel aus der Antwort oder fallback zum Session-Kapitel
      const chapter = (answer as any).chapter || sessionData.chapterName || 'Unbekannt';
      if (!chapterAnswers[chapter]) {
        chapterAnswers[chapter] = { correct: 0, total: 0 };
      }
      chapterAnswers[chapter].total++;
      if (answer.isCorrect) {
        chapterAnswers[chapter].correct++;
      }
    });

    // Aktualisiere jedes Kapitel
    for (const [chapterName, stats] of Object.entries(chapterAnswers)) {
      const { data: currentChapterStats, error: _fetchError } = await supabase
        .from('chapter_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('chapter', chapterName)
        .single();

      const newChapterStats = {
        user_id: userId,
        chapter: chapterName,
        total_questions: (currentChapterStats?.total_questions || 0) + stats.total,
        correct_answers: (currentChapterStats?.correct_answers || 0) + stats.correct,
        progress: Math.round(((currentChapterStats?.correct_answers || 0) + stats.correct) / ((currentChapterStats?.total_questions || 0) + stats.total) * 100),
        last_practiced: new Date().toISOString(),
        attempts: (currentChapterStats?.attempts || 0) + 1
      };

      if (currentChapterStats) {
        // Aktualisiere bestehende Kapitel-Statistiken
        const { error: updateError } = await supabase
          .from('chapter_stats')
          .update(newChapterStats)
          .eq('user_id', userId)
          .eq('chapter', chapterName);
        
        if (updateError && updateError.code !== 'PGRST205') {
          console.error('Fehler beim Aktualisieren der Kapitel-Statistiken:', updateError);
        }
      } else {
        // Erstelle neue Kapitel-Statistiken
        const { error: insertError } = await supabase
          .from('chapter_stats')
          .insert(newChapterStats);
        
        if (insertError && insertError.code !== 'PGRST205') {
          console.error('Fehler beim Erstellen der Kapitel-Statistiken:', insertError);
        }
      }
    }
    
    console.log('Kapitel-Statistiken erfolgreich aktualisiert');
  } catch (error) {
    console.error('Fehler beim Aktualisieren der Kapitel-Statistiken:', error);
  }
};

export const getQuizSessions = async (limit: number = 10) => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Benutzer nicht angemeldet');
    }

    const { data, error } = await supabase
      .from('quiz_attempts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error loading quiz_attempts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Fehler beim Laden der Quiz-Sessions:', error);
    return [];
  }
};


export const getUserStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Benutzer nicht angemeldet');
    }

    console.log('Lade Statistiken für Benutzer:', user.id);

    const { data, error } = await supabase
      .from('user_stats')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Keine Daten gefunden - erstelle Standard-Statistiken
        console.log('Keine Statistiken gefunden, erstelle Standard-Werte');
        return {
          id: null,
          user_id: user.id,
          total_questions_answered: 0,
          total_correct_answers: 0,
          total_xp: 0,
          current_level: 1,
          current_streak: 0,
          longest_streak: 0,
          total_time_spent: 0,
          weekly_goal: 50,
          weekly_progress: 0,
          last_quiz_date: null
        };
      } else if (error.code === 'PGRST205') {
        // Tabelle existiert nicht
        console.log('user_stats Tabelle existiert nicht');
        return {
          id: null,
          user_id: user.id,
          total_questions_answered: 0,
          total_correct_answers: 0,
          total_xp: 0,
          current_level: 1,
          current_streak: 0,
          longest_streak: 0,
          total_time_spent: 0,
          weekly_goal: 50,
          weekly_progress: 0,
          last_quiz_date: null
        };
      } else {
        throw error;
      }
    }

    console.log('Statistiken erfolgreich geladen:', data);
    return data;
  } catch (error) {
    console.error('Fehler beim Laden der Benutzer-Statistiken:', error);
    // Fallback zu Standard-Werten
    return {
      id: null,
      user_id: null,
      total_questions_answered: 0,
      total_correct_answers: 0,
      total_xp: 0,
      current_level: 1,
      current_streak: 0,
      longest_streak: 0,
      total_time_spent: 0,
      weekly_goal: 50,
      weekly_progress: 0,
      last_quiz_date: null
    };
  }
};

export const getChapterStats = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('Benutzer nicht angemeldet');
    }

    console.log('Lade Kapitel-Statistiken für Benutzer:', user.id);

    const { data, error } = await supabase
      .from('chapter_stats')
      .select('*')
      .eq('user_id', user.id);

    if (error) {
      if (error.code === 'PGRST205') {
        // Tabelle existiert nicht
        console.log('chapter_stats Tabelle existiert nicht');
        return [];
      }
      throw error;
    }

    console.log('Kapitel-Statistiken erfolgreich geladen:', data);
    return data || [];
  } catch (error) {
    console.error('Fehler beim Laden der Kapitel-Statistiken:', error);
    return [];
  }
};
