import { useState } from 'react';
import { db, supabase } from '../lib/supabase';
import { ChapterData, Question, Topic } from '../types';

interface UseSupabaseReturn {
  // Topics
  getTopics: () => Promise<Topic[]>;
  createTopic: (topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Topic | null>;
  updateTopic: (id: string, topicData: Partial<Topic>) => Promise<Topic | null>;
  deleteTopic: (id: string) => Promise<boolean>;
  reorderTopics: (topics: Topic[]) => Promise<boolean>;

  // Chapters
  getChapters: () => Promise<ChapterData[]>;
  getChaptersByTopic: (topicId: string) => Promise<ChapterData[]>;
  createChapter: (chapterData: Omit<ChapterData, 'id' | 'createdAt' | 'updatedAt'>) => Promise<ChapterData | null>;
  updateChapter: (id: string, chapterData: Partial<ChapterData>) => Promise<ChapterData | null>;
  deleteChapter: (id: string) => Promise<boolean>;
  reorderChapters: (chapters: ChapterData[]) => Promise<boolean>;

  // Questions
  getQuestions: () => Promise<Question[]>;
  createQuestion: (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Question | null>;
  updateQuestion: (id: string, questionData: Partial<Question>) => Promise<Question | null>;
  deleteQuestion: (id: string) => Promise<boolean>;

  // State
  loading: boolean;
  error: string | null;
}

export const useSupabase = (): UseSupabaseReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Topics
  const getTopics = async (): Promise<Topic[]> => {
    setLoading(true);
    setError(null);
    try {
      console.log('Calling db.topics.getAll()...');
      const { data, error } = await db.topics.getAll();
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error in getTopics:', error);
        throw error;
      }
      
      console.log('Raw topics data:', data);
      
      // Transform Supabase data to Topic format
      return (data as any[])?.map((topic: any) => ({
        id: topic.id,
        name: topic.name,
        description: topic.description || '',
        icon: topic.icon || '📚',
        color: topic.color || '#3b82f6',
        orderIndex: topic.order_index || 0,
        isActive: topic.is_active || true,
        createdAt: topic.created_at,
        updatedAt: topic.updated_at
      })) || [];
    } catch (err) {
      console.error('Error in getTopics:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Themen');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createTopic = async (topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>): Promise<Topic | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.topics.create({
        name: topicData.name,
        description: topicData.description,
        icon: topicData.icon,
        color: topicData.color,
        order_index: topicData.orderIndex,
        is_active: topicData.isActive
      });
      
      if (error) throw error;
      if (!data) throw new Error('Keine Daten zurückgegeben');
      
      const newTopic = data;
      return {
        id: newTopic.id,
        name: newTopic.name,
        description: newTopic.description || '',
        icon: newTopic.icon || '📚',
        color: newTopic.color || '#3b82f6',
        orderIndex: newTopic.order_index || 0,
        isActive: newTopic.is_active || true,
        createdAt: newTopic.created_at,
        updatedAt: newTopic.updated_at
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Themas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateTopic = async (id: string, topicData: Partial<Topic>): Promise<Topic | null> => {
    setLoading(true);
    setError(null);
    try {
      const updateData: any = {};
      if (topicData.name !== undefined) updateData.name = topicData.name;
      if (topicData.description !== undefined) updateData.description = topicData.description;
      if (topicData.icon !== undefined) updateData.icon = topicData.icon;
      if (topicData.color !== undefined) updateData.color = topicData.color;
      if (topicData.orderIndex !== undefined) updateData.order_index = topicData.orderIndex;
      if (topicData.isActive !== undefined) updateData.is_active = topicData.isActive;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await db.topics.update(id, updateData);
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Keine Daten zurückgegeben');
      
      const updatedTopic = data[0];
      return {
        id: updatedTopic.id,
        name: updatedTopic.name,
        description: updatedTopic.description || '',
        icon: updatedTopic.icon || '📚',
        color: updatedTopic.color || '#3b82f6',
        orderIndex: updatedTopic.order_index || 0,
        isActive: updatedTopic.is_active || true,
        createdAt: updatedTopic.created_at,
        updatedAt: updatedTopic.updated_at
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Themas');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteTopic = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await db.topics.delete(id);
      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Themas');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reorderTopics = async (topics: Topic[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const updates = topics.map((topic, index) => ({ 
        id: topic.id, 
        order_index: index + 1 
      }));
      const result = await db.topics.reorder(updates);
      if (result.error) throw result.error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Neuanordnen der Themen');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Chapters
  const getChapters = async (): Promise<ChapterData[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.chapters.getAll();
      if (error) throw error;
      
      // Transform Supabase data to ChapterData format
      return (data as any[])?.map((chapter: any) => ({
        id: chapter.id,
        name: chapter.name,
        description: chapter.description || '',
        color: chapter.color || '#3b82f6',
        icon: chapter.icon || '📚',
        isActive: chapter.is_active || true,
        topicId: chapter.topic_id,
        order: chapter.order || 0,
        createdAt: chapter.created_at,
        updatedAt: chapter.updated_at
      })) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kapitel');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const getChaptersByTopic = async (topicId: string): Promise<ChapterData[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.chapters.getByTopic(topicId);
      if (error) throw error;
      
      // Transform Supabase data to ChapterData format
      return (data as any[])?.map((chapter: any) => ({
        id: chapter.id,
        name: chapter.name,
        description: chapter.description || '',
        color: chapter.color || '#3b82f6',
        icon: chapter.icon || '📚',
        isActive: chapter.is_active || true,
        topicId: chapter.topic_id,
        order: chapter.order || 0,
        createdAt: chapter.created_at,
        updatedAt: chapter.updated_at
      })) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Kapitel');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createChapter = async (chapterData: Omit<ChapterData, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChapterData | null> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.chapters.create({
        name: chapterData.name,
        description: chapterData.description,
        color: chapterData.color,
        icon: chapterData.icon,
        is_active: chapterData.isActive,
        topic_id: chapterData.topicId,
        order: chapterData.order
      });
      
      if (error) throw error;
      if (!data) throw new Error('Keine Daten zurückgegeben');
      
      const newChapter = data;
      return {
        id: newChapter.id,
        name: newChapter.name,
        description: newChapter.description || '',
        color: newChapter.color || '#3b82f6',
        icon: newChapter.icon || '📚',
        isActive: newChapter.is_active || true,
        topicId: newChapter.topic_id,
        order: newChapter.order || 0,
        createdAt: newChapter.created_at,
        updatedAt: newChapter.updated_at
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Kapitels');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateChapter = async (id: string, chapterData: Partial<ChapterData>): Promise<ChapterData | null> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Updating chapter:', id, 'with data:', chapterData);
      
      // Get the old chapter name before update (for questions update)
      let oldChapterName: string | null = null;
      if (chapterData.name !== undefined) {
        try {
          const { data: oldChapter } = await db.chapters.getById(id);
          oldChapterName = oldChapter?.name || null;
          console.log('📝 Old chapter name:', oldChapterName);
        } catch (err) {
          console.warn('⚠️ Could not get old chapter name:', err);
        }
      }
      
      // Update questions FIRST if chapter name is changing (to avoid foreign key constraint)
      if (chapterData.name !== undefined && oldChapterName) {
        console.log('🔄 Updating questions FIRST that reference chapter:', oldChapterName, '->', chapterData.name);
        try {
          // Use a custom SQL function to update questions and chapter in one transaction
          const { error: updateError } = await supabase.rpc('update_chapter_with_questions', {
            chapter_id: id,
            old_chapter_name: oldChapterName,
            new_chapter_name: chapterData.name,
            new_description: chapterData.description,
            new_color: chapterData.color,
            new_icon: chapterData.icon,
            new_is_active: chapterData.isActive,
            new_topic_id: chapterData.topicId,
            new_order: chapterData.order
          });
          
          if (updateError) {
            console.warn('⚠️ Could not update chapter with questions:', updateError);
            throw new Error(`Kapitel konnte nicht aktualisiert werden: ${updateError.message}`);
          } else {
            console.log('✅ Updated chapter and questions successfully');
            // Return early since the SQL function handled everything
            return {
              id: id,
              name: chapterData.name || '',
              description: chapterData.description || '',
              color: chapterData.color || '#3b82f6',
              icon: chapterData.icon || '📚',
              isActive: chapterData.isActive || true,
              topicId: chapterData.topicId || '',
              order: chapterData.order || 0,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            };
          }
        } catch (err) {
          console.error('❌ Error updating chapter with questions:', err);
          throw err;
        }
      }
      
      const updateData: any = {};
      if (chapterData.name !== undefined) updateData.name = chapterData.name;
      if (chapterData.description !== undefined) updateData.description = chapterData.description;
      if (chapterData.color !== undefined) updateData.color = chapterData.color;
      if (chapterData.icon !== undefined) updateData.icon = chapterData.icon;
      if (chapterData.isActive !== undefined) updateData.is_active = chapterData.isActive;
      if (chapterData.topicId !== undefined) updateData.topic_id = chapterData.topicId;
      if (chapterData.order !== undefined) updateData.order = chapterData.order;
      
      updateData.updated_at = new Date().toISOString();

      console.log('📝 Update data prepared:', updateData);

      const { data, error } = await db.chapters.update(id, updateData);
      
      if (error) {
        console.error('❌ Supabase error:', error);
        console.error('❌ Error details:', error.message, error.code, error.details);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ No data returned from update');
        throw new Error('Keine Daten zurückgegeben');
      }
      
      console.log('✅ Chapter updated successfully:', data[0]);
      
      const updatedChapter = data[0];
      return {
        id: updatedChapter.id,
        name: updatedChapter.name,
        description: updatedChapter.description || '',
        color: updatedChapter.color || '#3b82f6',
        icon: updatedChapter.icon || '📚',
        isActive: updatedChapter.is_active || true,
        topicId: updatedChapter.topic_id,
        order: updatedChapter.order || 0,
        createdAt: updatedChapter.created_at,
        updatedAt: updatedChapter.updated_at
      };
    } catch (err) {
      console.error('❌ Error in updateChapter:', err);
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Kapitels');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteChapter = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await db.chapters.delete(id);
      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen des Kapitels');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const reorderChapters = async (chapters: ChapterData[]): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      // Update each chapter's order individually
      for (let i = 0; i < chapters.length; i++) {
        const chapter = chapters[i];
        const { error } = await db.chapters.update(chapter.id, {
          order: i + 1,
          updated_at: new Date().toISOString()
        });
        if (error) throw error;
      }
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Neuanordnen der Kapitel');
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Questions
  const getQuestions = async (): Promise<Question[]> => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await db.questions.getAll();
      if (error) throw error;
      
      // Transform Supabase data to Question format
      return (data as any[])?.map((question: any) => ({
        id: question.id,
        questionNumber: question.question_number,
        chapter: question.chapter,
        type: question.type,
        prompt: question.prompt,
        explanation: question.explanation || '',
        // difficulty: question.difficulty || 'easy', // Removed - difficulty column no longer exists
        tags: question.tags || [],
        media: question.media || '',
        isOpenQuestion: question.is_open_question || false,
        options: question.options || [],
        matchingPairs: question.matching_pairs || [],
        fillBlankOptions: question.fill_blank_options || [],
        blankCount: question.blank_count || 0,
        createdAt: question.created_at,
        updatedAt: question.updated_at
      })) || [];
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Fragen');
      return [];
    } finally {
      setLoading(false);
    }
  };

  const createQuestion = async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>): Promise<Question | null> => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔄 Creating question with data:', questionData);
      
      const { data, error } = await db.questions.create({
        question_number: questionData.questionNumber,
        prompt: questionData.prompt,
        type: questionData.type,
        chapter: questionData.chapter,
        // difficulty: questionData.difficulty, // Removed - difficulty column no longer exists
        options: questionData.options,
        matching_pairs: questionData.matchingPairs,
        fill_blank_options: questionData.fillBlankOptions,
        blank_count: questionData.blankCount,
        explanation: questionData.explanation,
        media: questionData.media || null,
        is_open_question: questionData.isOpenQuestion,
        tags: questionData.tags
      });
      
      if (error) {
        console.error('❌ Supabase error:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.error('❌ No data returned from create');
        throw new Error('Keine Daten zurückgegeben');
      }
      
      console.log('✅ Question created successfully:', data[0]);
      
      const newQuestion = data[0];
      return {
        id: newQuestion.id,
        questionNumber: newQuestion.question_number,
        chapter: newQuestion.chapter,
        type: newQuestion.type,
        prompt: newQuestion.prompt,
        explanation: newQuestion.explanation || '',
        // difficulty: newQuestion.difficulty || 'easy', // Removed - difficulty column no longer exists
        tags: newQuestion.tags || [],
        media: newQuestion.media?.url || '',
        isOpenQuestion: newQuestion.is_open_question || false,
        options: newQuestion.options || [],
        matchingPairs: newQuestion.matching_pairs || [],
        fillBlankOptions: newQuestion.fill_blank_options || [],
        blankCount: newQuestion.blank_count || 0,
        createdAt: newQuestion.created_at,
        updatedAt: newQuestion.updated_at
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Frage');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateQuestion = async (id: string, questionData: Partial<Question>): Promise<Question | null> => {
    setLoading(true);
    setError(null);
    try {
      const updateData: any = {};
      if (questionData.questionNumber !== undefined) updateData.question_number = questionData.questionNumber;
      if (questionData.prompt !== undefined) updateData.prompt = questionData.prompt;
      if (questionData.type !== undefined) updateData.type = questionData.type;
      if (questionData.chapter !== undefined) updateData.chapter = questionData.chapter;
      // if (questionData.difficulty !== undefined) updateData.difficulty = questionData.difficulty; // Removed - difficulty column no longer exists
      if (questionData.options !== undefined) updateData.options = questionData.options;
      if (questionData.matchingPairs !== undefined) updateData.matching_pairs = questionData.matchingPairs;
      if (questionData.fillBlankOptions !== undefined) updateData.fill_blank_options = questionData.fillBlankOptions;
      if (questionData.blankCount !== undefined) updateData.blank_count = questionData.blankCount;
      if (questionData.explanation !== undefined) updateData.explanation = questionData.explanation;
      if (questionData.media !== undefined) updateData.media = questionData.media ? { url: questionData.media } : null;
      if (questionData.isOpenQuestion !== undefined) updateData.is_open_question = questionData.isOpenQuestion;
      if (questionData.tags !== undefined) updateData.tags = questionData.tags;
      
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await db.questions.update(id, updateData);
      if (error) throw error;
      if (!data || data.length === 0) throw new Error('Keine Daten zurückgegeben');
      
      const updatedQuestion = data[0];
      return {
        id: updatedQuestion.id,
        questionNumber: updatedQuestion.question_number,
        chapter: updatedQuestion.chapter,
        type: updatedQuestion.type,
        prompt: updatedQuestion.prompt,
        explanation: updatedQuestion.explanation || '',
        // difficulty: updatedQuestion.difficulty || 'easy', // Removed - difficulty column no longer exists
        tags: updatedQuestion.tags || [],
        media: updatedQuestion.media?.url || '',
        isOpenQuestion: updatedQuestion.is_open_question || false,
        options: updatedQuestion.options || [],
        matchingPairs: updatedQuestion.matching_pairs || [],
        fillBlankOptions: updatedQuestion.fill_blank_options || [],
        blankCount: updatedQuestion.blank_count || 0,
        createdAt: updatedQuestion.created_at,
        updatedAt: updatedQuestion.updated_at
      };
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren der Frage');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteQuestion = async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const { error } = await db.questions.delete(id);
      if (error) throw error;
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Löschen der Frage');
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    // Topics
    getTopics,
    createTopic,
    updateTopic,
    deleteTopic,
    reorderTopics,

    // Chapters
    getChapters,
    getChaptersByTopic,
    createChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,

    // Questions
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,

    // State
    loading,
    error,
  };
};
