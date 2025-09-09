import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useSupabase } from '../hooks/useSupabase';
import { ChapterData, Topic, Question } from '../types';
import TopicTable from '../components/TopicTable';
import SortableChapterTable from '../components/SortableChapterTable';
import QuestionEditor from '../components/QuestionEditor';

const AdminPage: React.FC = () => {
  const { isAdmin, loading } = useAuth();
  const { 
    getTopics, 
    // createTopic, 
    updateTopic, 
    deleteTopic, 
    reorderTopics,
    getChapters, 
    // createChapter, 
    updateChapter, 
    deleteChapter, 
    reorderChapters,
    getQuestions,
    createQuestion,
    updateQuestion,
    deleteQuestion,
    loading: supabaseLoading, 
    error: supabaseError 
  } = useSupabase();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [chapters, setChapters] = useState<ChapterData[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [filteredQuestions, setFilteredQuestions] = useState<Question[]>([]);
  const [questionSearchTerm, setQuestionSearchTerm] = useState('');
  const [questionFilters, setQuestionFilters] = useState({
    type: '',
    chapter: '',
    status: '',
    topic: ''
  });
  const [activeTab, setActiveTab] = useState<'questions' | 'chapters' | 'topics' | 'users' | 'stats'>('questions');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [showQuestionEditor, setShowQuestionEditor] = useState(false);
  const [adminStats, setAdminStats] = useState({
    totalUsers: 0,
    totalQuizAttempts: 0,
    recentActivity: [] as any[],
    popularChapters: [] as any[]
  });
  const [users, setUsers] = useState<any[]>([]);
  const [editingUser, setEditingUser] = useState<any | null>(null);
  const [showUserEditor, setShowUserEditor] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      console.log('Admin detected, loading data...');
      loadData();
    } else {
      console.log('Not admin, skipping data load');
    }
  }, [isAdmin]); // Remove loadData from dependencies to prevent double loading

  // Filter questions based on search term and filters
  useEffect(() => {
    let filtered = questions;

    // Apply search term filter
    if (questionSearchTerm.trim()) {
      filtered = filtered.filter(question => 
        question.questionNumber?.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
        question.prompt.toLowerCase().includes(questionSearchTerm.toLowerCase()) ||
        question.chapter.toLowerCase().includes(questionSearchTerm.toLowerCase())
      );
    }

    // Apply type filter
    if (questionFilters.type) {
      filtered = filtered.filter(question => question.type === questionFilters.type);
    }

    // Apply chapter filter
    if (questionFilters.chapter) {
      filtered = filtered.filter(question => question.chapter === questionFilters.chapter);
    }

    // Apply status filter (assuming all questions are active for now)
    if (questionFilters.status) {
      filtered = filtered.filter((_q: any) => {
        // For now, all questions are considered "active"
        // You can extend this when you add status field to questions
        return questionFilters.status === 'active';
      });
    }

    // Apply topic filter (through chapter)
    if (questionFilters.topic) {
      const chaptersInTopic = chapters.filter(chapter => chapter.topicId === questionFilters.topic);
      const chapterNames = chaptersInTopic.map(chapter => chapter.name);
      filtered = filtered.filter(question => chapterNames.includes(question.chapter));
    }

    setFilteredQuestions(filtered);
  }, [questions, questionSearchTerm, questionFilters, chapters]);

  const loadData = async () => {
    try {
      console.log('Loading data...');
      const [topicsData, chaptersData, questionsData] = await Promise.all([
        getTopics(),
        getChapters(),
        getQuestions()
      ]);
      console.log('Topics loaded:', topicsData);
      console.log('Chapters loaded:', chaptersData);
      console.log('Questions loaded:', questionsData);
      setTopics(topicsData);
      setChapters(chaptersData);
      setQuestions(questionsData);
      
      // Load admin statistics and users
      await Promise.all([
        loadAdminStats(),
        loadUsers()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const loadAdminStats = async () => {
    try {
      // Import the quiz service functions
      const { getQuizSessions } = await import('../services/quizService');
      
      // Get quiz sessions for statistics
      const quizSessions = await getQuizSessions(100); // Get more sessions for stats
      
      // Calculate statistics
      const totalQuizAttempts = quizSessions.length;
      
      // Calculate recent activity (last 7 days)
      const now = new Date();
      // const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const recentActivity = [];
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);
        
        const daySessions = quizSessions.filter(session => {
          const sessionDate = new Date(session.completed_at);
          return sessionDate >= dayStart && sessionDate < dayEnd;
        });
        
        const dayName = i === 0 ? 'Heute' : 
                       i === 1 ? 'Gestern' : 
                       `Vor ${i} Tagen`;
        
        recentActivity.push({
          day: dayName,
          count: daySessions.length
        });
      }
      
      // Calculate popular chapters
      const chapterStats: { [key: string]: number } = {};
      quizSessions.forEach(session => {
        const chapter = session.chapter_name || 'Unbekannt';
        chapterStats[chapter] = (chapterStats[chapter] || 0) + 1;
      });
      
      const popularChapters = Object.entries(chapterStats)
        .map(([chapter, count]) => ({ chapter, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Top 5 chapters
      
      // For now, we'll estimate total users (this would need a proper user count function)
      const totalUsers = 1; // You can implement a proper user count function later
      
      setAdminStats({
        totalUsers,
        totalQuizAttempts,
        recentActivity,
        popularChapters
      });
      
    } catch (error) {
      console.error('Error loading admin stats:', error);
    }
  };

  const loadUsers = async () => {
    try {
      // Import supabase client
      const { supabase } = await import('../lib/supabase');
      
      // Try to load from our custom user_profiles table first (no admin permissions needed)
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('*');
      
      if (!usersError && usersData) {
        // Transform users from our custom table
        const transformedUsers = usersData.map((user: any) => ({
          id: user.auth_user_id,
          email: 'pw@patrikwalde.com', // We know this is the admin user
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          name: `${user.first_name} ${user.last_name}`.trim() || 'Unbekannt',
          city: user.city || '',
          evu: user.evu || '',
          role: user.role || 'user',
          status: 'active', // Assume active for now
          created_at: user.created_at,
          last_sign_in: null
        }));
        
        setUsers(transformedUsers);
        setAdminStats(prev => ({ ...prev, totalUsers: transformedUsers.length }));
        console.log('Loaded users from custom table:', transformedUsers);
        return;
      }
      
      console.log('Custom users table not available, trying admin API:', usersError);
      
      // Fallback: Try admin API
      const { data: { users: authUsers }, error } = await supabase.auth.admin.listUsers();
      
      if (error) {
        console.log('Admin API not available, using fallback method:', error.message);
        
        // Final fallback: Get current user and show them
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const currentUserData = {
            id: currentUser.id,
            email: currentUser.email || '',
            firstName: currentUser.user_metadata?.first_name || currentUser.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: currentUser.user_metadata?.last_name || currentUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Unbekannt',
            city: currentUser.user_metadata?.city || '',
            evu: currentUser.user_metadata?.evu || '',
            role: currentUser.email === 'pw@patrikwalde.com' ? 'admin' : 'user',
            status: currentUser.email_confirmed_at ? 'active' : 'pending',
            created_at: currentUser.created_at,
            last_sign_in: currentUser.last_sign_in_at
          };
          
          setUsers([currentUserData]);
          setAdminStats(prev => ({ ...prev, totalUsers: 1 }));
          console.log('Loaded current user:', currentUserData);
        } else {
          console.log('No current user found');
          setUsers([]);
          setAdminStats(prev => ({ ...prev, totalUsers: 0 }));
        }
        return;
      }
      
      // Transform auth users to our format
      const transformedUsers = authUsers.map((user: any) => ({
        id: user.id,
        email: user.email,
        firstName: user.user_metadata?.first_name || user.user_metadata?.full_name?.split(' ')[0] || '',
        lastName: user.user_metadata?.last_name || user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Unbekannt',
        city: user.user_metadata?.city || '',
        evu: user.user_metadata?.evu || '',
        role: user.user_metadata?.role || (user.email === 'pw@patrikwalde.com' ? 'admin' : 'user'),
        status: user.email_confirmed_at ? 'active' : 'pending',
        created_at: user.created_at,
        last_sign_in: user.last_sign_in_at
      }));
      
      setUsers(transformedUsers);
      setAdminStats(prev => ({ ...prev, totalUsers: transformedUsers.length }));
      console.log('Loaded users from admin API:', transformedUsers);
      
    } catch (error) {
      console.error('Error loading users:', error);
      
      // Final fallback: show current user
      try {
        const { supabase } = await import('../lib/supabase');
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          const currentUserData = {
            id: currentUser.id,
            email: currentUser.email || '',
            firstName: currentUser.user_metadata?.first_name || currentUser.user_metadata?.full_name?.split(' ')[0] || '',
            lastName: currentUser.user_metadata?.last_name || currentUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
            name: currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0] || 'Unbekannt',
            city: currentUser.user_metadata?.city || '',
            evu: currentUser.user_metadata?.evu || '',
            role: currentUser.email === 'pw@patrikwalde.com' ? 'admin' : 'user',
            status: 'active',
            created_at: currentUser.created_at
          };
          
          setUsers([currentUserData]);
          setAdminStats(prev => ({ ...prev, totalUsers: 1 }));
        }
      } catch (fallbackError) {
        console.error('Fallback user loading failed:', fallbackError);
        setUsers([]);
        setAdminStats(prev => ({ ...prev, totalUsers: 0 }));
      }
    }
  };


  // const handleSaveTopic = async (topicData: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) => {
  //   try {
  //     // This is a new topic
  //     const newTopic = await createTopic(topicData);
  //     if (newTopic) {
  //       setTopics(prev => [...prev, newTopic]);
  //     }
  //   } catch (error) {
  //     console.error('Error saving topic:', error);
  //   }
  // };

  const handleUpdateTopic = async (topic: Topic) => {
    try {
      // Only pass the fields that can be updated, excluding id, createdAt, updatedAt
      const updateData = {
        name: topic.name,
        description: topic.description,
        icon: topic.icon,
        color: topic.color,
        orderIndex: topic.orderIndex,
        isActive: topic.isActive
      };
      
      const updatedTopic = await updateTopic(topic.id, updateData);
      if (updatedTopic) {
        setTopics(prev => prev.map(t => t.id === updatedTopic.id ? updatedTopic : t));
      }
    } catch (error) {
      console.error('Error updating topic:', error);
    }
  };

  const handleDeleteTopic = async (topicId: string) => {
    try {
      const success = await deleteTopic(topicId);
      if (success) {
        setTopics(prev => prev.filter(t => t.id !== topicId));
        // Also remove topic_id from chapters that were assigned to this topic
        setChapters(prev => prev.map(c => 
          c.topicId === topicId ? { ...c, topicId: undefined } : c
        ));
      }
    } catch (error) {
      console.error('Error deleting topic:', error);
    }
  };

  const handleReorderTopics = async (reorderedTopics: Topic[]) => {
    try {
      const success = await reorderTopics(reorderedTopics);
      if (success) {
        setTopics(reorderedTopics);
      }
    } catch (error) {
      console.error('Error reordering topics:', error);
    }
  };

  // const handleSaveChapter = async (chapterData: Omit<ChapterData, 'id' | 'createdAt' | 'updatedAt'>) => {
  //   try {
  //     // This is a new chapter
  //     const newChapter = await createChapter(chapterData);
  //     if (newChapter) {
  //       setChapters(prev => [...prev, newChapter]);
  //     }
  //   } catch (error) {
  //     console.error('Error saving chapter:', error);
  //   }
  // };

  const handleUpdateChapter = async (chapter: ChapterData) => {
    try {
      // Only pass the fields that can be updated, excluding id, createdAt, updatedAt
      const updateData = {
        name: chapter.name,
        description: chapter.description,
        color: chapter.color,
        icon: chapter.icon,
        isActive: chapter.isActive,
        topicId: chapter.topicId,
        order: chapter.order
      };
      
      const updatedChapter = await updateChapter(chapter.id, updateData);
      if (updatedChapter) {
        setChapters(prev => prev.map(c => c.id === updatedChapter.id ? updatedChapter : c));
      }
    } catch (error) {
      console.error('Error updating chapter:', error);
    }
  };

  const handleDeleteChapter = async (chapterId: string) => {
    try {
      const success = await deleteChapter(chapterId);
      if (success) {
        setChapters(prev => prev.filter(c => c.id !== chapterId));
      }
    } catch (error) {
      console.error('Error deleting chapter:', error);
    }
  };

  const handleReorderChapters = async (reorderedChapters: ChapterData[]) => {
    try {
      const success = await reorderChapters(reorderedChapters);
      if (success) {
        setChapters(reorderedChapters);
      }
    } catch (error) {
      console.error('Error reordering chapters:', error);
    }
  };

  // Questions handlers
  const handleSaveQuestion = async (questionData: Omit<Question, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (editingQuestion) {
        // Update existing question
        const updatedQuestion = await updateQuestion(editingQuestion.id, questionData);
        if (updatedQuestion) {
          setQuestions(prev => prev.map(q => q.id === updatedQuestion.id ? updatedQuestion : q));
        }
      } else {
        // Create new question
        const newQuestion = await createQuestion(questionData);
        if (newQuestion) {
          setQuestions(prev => [...prev, newQuestion]);
        }
      }
      closeQuestionEditor();
    } catch (error) {
      console.error('Error saving question:', error);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diese Frage löschen möchten?')) {
      try {
        const success = await deleteQuestion(questionId);
        if (success) {
          setQuestions(prev => prev.filter(q => q.id !== questionId));
        }
      } catch (error) {
        console.error('Error deleting question:', error);
      }
    }
  };

  const openQuestionEditor = (question?: Question) => {
    setEditingQuestion(question || null);
    setShowQuestionEditor(true);
  };

  const closeQuestionEditor = () => {
    setEditingQuestion(null);
    setShowQuestionEditor(false);
  };

  // User management functions
  const openUserEditor = (user?: any) => {
    setEditingUser(user || null);
    setShowUserEditor(true);
  };

  const closeUserEditor = () => {
    setEditingUser(null);
    setShowUserEditor(false);
  };

  const handleSaveUser = async (userData: any) => {
    try {
      // Import supabase client
      const { supabase } = await import('../lib/supabase');
      
      if (editingUser) {
        // Try to update in our custom user_profiles table first
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            first_name: userData.firstName,
            last_name: userData.lastName,
            city: userData.city,
            evu: userData.evu,
            role: userData.role,
            updated_at: new Date().toISOString()
          })
          .eq('auth_user_id', editingUser.id);
        
        if (!updateError) {
          console.log('User updated in custom table');
          
          // Also try to update auth user metadata if admin API is available
          try {
            await supabase.auth.admin.updateUserById(editingUser.id, {
              user_metadata: {
                full_name: `${userData.firstName} ${userData.lastName}`,
                first_name: userData.firstName,
                last_name: userData.lastName,
                city: userData.city,
                evu: userData.evu,
                role: userData.role
              }
            });
            console.log('User metadata also updated via admin API');
          } catch (adminError) {
            console.log('Admin API not available for metadata update:', adminError);
          }
          
          // Update local state
          setUsers(prev => prev.map(u => 
            u.id === editingUser.id 
              ? { 
                  ...u, 
                  firstName: userData.firstName,
                  lastName: userData.lastName,
                  name: `${userData.firstName} ${userData.lastName}`,
                  city: userData.city,
                  evu: userData.evu,
                  role: userData.role 
                }
              : u
          ));
          
          alert('Benutzerdaten wurden erfolgreich aktualisiert!');
          
        } else {
          console.log('Custom table update failed, trying admin API:', updateError);
          
          // Fallback: Try admin API
          try {
            const { error } = await supabase.auth.admin.updateUserById(editingUser.id, {
              user_metadata: {
                full_name: `${userData.firstName} ${userData.lastName}`,
                first_name: userData.firstName,
                last_name: userData.lastName,
                city: userData.city,
                evu: userData.evu,
                role: userData.role
              }
            });
            
            if (error) {
              throw error;
            }
            
            console.log('User updated via admin API');
            alert('Benutzerdaten wurden über Admin-API aktualisiert!');
          } catch (adminError) {
            console.log('Admin API also failed, updating local state only:', adminError);
            
            // Final fallback: Update local state only
            setUsers(prev => prev.map(u => 
              u.id === editingUser.id 
                ? { 
                    ...u, 
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    name: `${userData.firstName} ${userData.lastName}`,
                    city: userData.city,
                    evu: userData.evu,
                    role: userData.role 
                  }
                : u
            ));
            
            alert('Benutzerdaten wurden lokal aktualisiert. Für persistente Speicherung ist die Benutzer-Tabelle erforderlich.');
          }
        }
        
      } else {
        // For new users, we can't create them here
        alert('Neue Benutzer können nur über die Registrierungsseite erstellt werden.');
        console.log('Would create user with data:', userData);
      }
      
      closeUserEditor();
    } catch (error) {
      console.error('Error saving user:', error);
      alert('Fehler beim Speichern der Benutzerdaten. Bitte versuchen Sie es erneut.');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (window.confirm('Sind Sie sicher, dass Sie diesen Benutzer löschen möchten?')) {
      try {
        // Import supabase client
        const { supabase } = await import('../lib/supabase');
        
        try {
          const { error } = await supabase.auth.admin.deleteUser(userId);
          
          if (error) {
            throw error;
          }
          
          console.log('User deleted via admin API');
        } catch (adminError) {
          console.log('Admin API not available, removing from local state only:', adminError);
          alert('Benutzer wurde nur lokal entfernt. Für dauerhaftes Löschen sind Admin-Berechtigungen erforderlich.');
        }
        
        // Update local state regardless of admin API success
        setUsers(prev => prev.filter(u => u.id !== userId));
        setAdminStats(prev => ({ ...prev, totalUsers: prev.totalUsers - 1 }));
        
      } catch (error) {
        console.error('Error deleting user:', error);
        alert('Fehler beim Löschen des Benutzers. Bitte versuchen Sie es erneut.');
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-gray-200 dark:text-gray-300">Lade Admin-Bereich...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-900 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 text-6xl mb-4">🚫</div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 dark:text-white mb-2">Zugriff verweigert</h1>
          <p className="text-gray-700 dark:text-gray-200 dark:text-gray-300">Du hast keine Berechtigung, diese Seite zu besuchen.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-700 dark:bg-gray-900 transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="px-4 py-6 sm:px-0">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 dark:text-white">Admin-Bereich</h1>
          <p className="mt-2 text-gray-700 dark:text-gray-200 dark:text-gray-300">
            Verwalte Themen, Kapitel und die Lernstruktur der Anwendung.
          </p>
        </div>

        {/* Error Display */}
        {supabaseError && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800 dark:text-red-200">Fehler</h3>
                  <div className="mt-2 text-sm text-red-700 dark:text-red-300">{supabaseError}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Indicator */}
        {supabaseLoading && (
          <div className="mb-6 px-4 sm:px-0">
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-blue-700">Wird verarbeitet...</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-0 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('questions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'questions'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              ❓ Fragen verwalten
            </button>
            <button
              onClick={() => setActiveTab('chapters')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'chapters'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📖 Kapitel verwalten
            </button>
            <button
              onClick={() => setActiveTab('topics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'topics'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📚 Themen verwalten
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              👥 Benutzer verwalten
            </button>
            <button
              onClick={() => setActiveTab('stats')}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === 'stats'
                  ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              📊 Statistiken
            </button>
          </nav>
        </div>

        {/* Content */}
        <div className="px-4 sm:px-0">
          {activeTab === 'questions' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4">Fragen verwalten</h2>
              <p className="text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-4">
                Hier können Sie alle Fragen der Anwendung verwalten, bearbeiten und neue hinzufügen.
              </p>
              
              {/* Fragen-Liste */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-white">Alle Fragen</h3>
                  <button 
                    onClick={() => openQuestionEditor()}
                    className="bg-blue-600 dark:bg-blue-700 text-white px-4 py-2 rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
                  >
                    Neue Frage hinzufügen
                  </button>
                </div>

                {/* Suchfeld */}
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex-1">
                    <input
                      type="text"
                      placeholder="Nach Fragenummer, Fragentext oder Kapitel suchen..."
                      value={questionSearchTerm}
                      onChange={(e) => setQuestionSearchTerm(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                  {(questionSearchTerm || Object.values(questionFilters).some(filter => filter !== '')) && (
                    <button
                      onClick={() => {
                        setQuestionSearchTerm('');
                        setQuestionFilters({ type: '', chapter: '', status: '', topic: '' });
                      }}
                      className="px-4 py-2 text-gray-600 dark:text-gray-300 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700 dark:hover:bg-gray-700 transition-colors"
                    >
                      ✕ Alle Filter löschen
                    </button>
                  )}
                </div>

                {/* Filter */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                  {/* Typ Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Typ</label>
                    <select
                      value={questionFilters.type}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                    >
                      <option value="">Alle Typen</option>
                      <option value="multiple_choice">Multiple Choice</option>
                      <option value="true_false">Richtig/Falsch</option>
                      <option value="open_ended">Offene Frage</option>
                      <option value="matching">Zuordnung</option>
                      <option value="image_question">Bild</option>
                      <option value="fill_blank">Lückentext</option>
                    </select>
                  </div>

                  {/* Kapitel Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Kapitel</label>
                    <select
                      value={questionFilters.chapter}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, chapter: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                    >
                      <option value="">Alle Kapitel</option>
                      {chapters.map((chapter) => (
                        <option key={chapter.id} value={chapter.name}>
                          {chapter.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                    <select
                      value={questionFilters.status}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                    >
                      <option value="">Alle Status</option>
                      <option value="active">Aktiv</option>
                      <option value="inactive">Inaktiv</option>
                    </select>
                  </div>

                  {/* Thema Filter */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Thema</label>
                    <select
                      value={questionFilters.topic}
                      onChange={(e) => setQuestionFilters(prev => ({ ...prev, topic: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                    >
                      <option value="">Alle Themen</option>
                      {topics.map((topic) => (
                        <option key={topic.id} value={topic.id}>
                          {topic.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {(questionSearchTerm || Object.values(questionFilters).some(filter => filter !== '')) && (
                  <div className="text-sm text-gray-700 dark:text-gray-200 mb-4">
                    {filteredQuestions.length} von {questions.length} Fragen gefunden
                    {Object.values(questionFilters).some(filter => filter !== '') && (
                      <span className="ml-2 text-blue-600">
                        (gefiltert)
                      </span>
                    )}
                  </div>
                )}
                
                {/* Fragen-Tabelle */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          <span className="hidden sm:inline">Fragenummer</span>
                          <span className="sm:hidden">#</span>
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Frage
                        </th>
                        <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Typ
                        </th>
                        <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Kapitel
                        </th>
                        <th className="hidden sm:table-cell px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredQuestions.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-4 text-center text-gray-700 dark:text-gray-200 dark:text-gray-300">
                            {questionSearchTerm ? 'Keine Fragen gefunden, die dem Suchbegriff entsprechen.' : 'Keine Fragen gefunden. Erstellen Sie die erste Frage!'}
                          </td>
                        </tr>
                      ) : (
                        filteredQuestions.map((question) => (
                          <tr key={question.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                                {question.questionNumber || 'Keine Nummer'}
                              </div>
                            </td>
                            <td className="px-3 sm:px-6 py-4">
                              <div className="max-w-xs">
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {question.prompt}
                                </p>
                                {question.explanation && (
                                  <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                                    {question.explanation}
                                  </p>
                                )}
                                {/* Mobile: Show type and status inline */}
                                <div className="md:hidden mt-2 flex flex-wrap gap-1">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                    question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' :
                                    question.type === 'true_false' ? 'bg-green-100 text-green-800' :
                                    question.type === 'open_ended' ? 'bg-purple-100 text-purple-800' :
                                    question.type === 'matching' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-gray-100 text-gray-800'
                                  }`}>
                                    {question.type === 'multiple_choice' ? 'MC' :
                                     question.type === 'true_false' ? 'R/F' :
                                     question.type === 'open_ended' ? 'Offen' :
                                     question.type === 'matching' ? 'Zuord.' :
                                     question.type}
                                  </span>
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                    Aktiv
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                question.type === 'multiple_choice' ? 'bg-blue-100 text-blue-800' :
                                question.type === 'true_false' ? 'bg-green-100 text-green-800' :
                                question.type === 'open_ended' ? 'bg-purple-100 text-purple-800' :
                                question.type === 'matching' ? 'bg-yellow-100 text-yellow-800' :
                                question.type === 'image_question' ? 'bg-pink-100 text-pink-800' :
                                question.type === 'fill_blank' ? 'bg-indigo-100 text-indigo-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {question.type === 'multiple_choice' ? 'Multiple Choice' :
                                 question.type === 'true_false' ? 'Richtig/Falsch' :
                                 question.type === 'open_ended' ? 'Offene Frage' :
                                 question.type === 'matching' ? 'Zuordnung' :
                                 question.type === 'image_question' ? 'Bild' :
                                 question.type === 'fill_blank' ? 'Lückentext' :
                                 question.type}
                              </span>
                            </td>
                            <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {question.chapter}
                            </td>
                            <td className="hidden sm:table-cell px-6 py-4 whitespace-nowrap">
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Aktiv
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <div className="flex flex-col sm:flex-row space-y-1 sm:space-y-0 sm:space-x-2">
                                <button 
                                  onClick={() => openQuestionEditor(question)}
                                  className="text-blue-600 hover:text-blue-900 touch-manipulation px-2 py-1 rounded"
                                >
                                  Bearbeiten
                                </button>
                                <button 
                                  onClick={() => handleDeleteQuestion(question.id)}
                                  className="text-red-600 hover:text-red-900 touch-manipulation px-2 py-1 rounded"
                                >
                                  Löschen
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'chapters' && (
            <SortableChapterTable
              chapters={chapters}
              topics={topics}
              onEdit={handleUpdateChapter}
              onDelete={handleDeleteChapter}
              onReorder={handleReorderChapters}
            />
          )}
          
          {activeTab === 'topics' && (
            <TopicTable
              topics={topics}
              onEdit={handleUpdateTopic}
              onDelete={handleDeleteTopic}
              onReorder={handleReorderTopics}
            />
          )}
          
          
          {activeTab === 'users' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4">Benutzer verwalten</h2>
              <p className="text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-4">
                Hier können Sie alle registrierten Benutzer einsehen und deren Berechtigungen verwalten.
              </p>
              
              {/* Benutzer-Liste */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Registrierte Benutzer</h3>
                  <button 
                    onClick={() => openUserEditor()}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
                  >
                    Benutzer einladen
                  </button>
                </div>
                
                {/* Benutzer-Tabelle */}
                <div className="overflow-x-auto -mx-4 sm:mx-0">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Benutzer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          E-Mail
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Ort
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          EVU
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Rolle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="px-6 py-4 text-center text-gray-700 dark:text-gray-200 dark:text-gray-300">
                            Keine Benutzer gefunden
                          </td>
                        </tr>
                      ) : (
                        users.map((user) => (
                          <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-700">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="flex-shrink-0 h-10 w-10">
                                  <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center">
                                    <span className="text-white font-medium text-sm">
                                      {user.name.charAt(0).toUpperCase()}
                                    </span>
                                  </div>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100 dark:text-gray-100">{user.name}</div>
                                  <div className="text-sm text-gray-700 dark:text-gray-200 dark:text-gray-300">
                                    {user.created_at && new Date(user.created_at).toLocaleDateString('de-DE')}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.city || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">{user.evu || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.role === 'admin' ? 'Admin' : 'Benutzer'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {user.status === 'active' ? 'Aktiv' : 'Ausstehend'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button 
                                onClick={() => openUserEditor(user)}
                                className="text-blue-600 hover:text-blue-900 mr-3"
                              >
                                Bearbeiten
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Löschen
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          {activeTab === 'stats' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 transition-colors duration-300">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 dark:text-white mb-4">Statistiken</h2>
              <p className="text-gray-700 dark:text-gray-200 dark:text-gray-300 mb-6">
                Hier können Sie detaillierte Statistiken über die Nutzung der Anwendung einsehen.
              </p>
              
              {/* Statistik-Karten */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-blue-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-blue-600">Registrierte Benutzer</p>
                      <p className="text-2xl font-semibold text-blue-900">{adminStats.totalUsers}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-green-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-green-600">Kapitel</p>
                      <p className="text-2xl font-semibold text-green-900">{chapters.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-purple-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-purple-600">Fragen</p>
                      <p className="text-2xl font-semibold text-purple-900">{questions.length}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-orange-600 rounded-md flex items-center justify-center">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                      </div>
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-orange-600">Quiz-Versuche</p>
                      <p className="text-2xl font-semibold text-orange-900">{adminStats.totalQuizAttempts}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Detaillierte Statistiken */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-white mb-4">Aktivität der letzten 7 Tage</h3>
                  <div className="space-y-3">
                    {adminStats.recentActivity.slice(0, 3).map((activity, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-200">{activity.day}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{activity.count} Aktivitäten</span>
                      </div>
                    ))}
                    {adminStats.recentActivity.length === 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-4">
                        Keine Aktivitäten in den letzten 7 Tagen
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-6">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-white mb-4">Beliebte Kapitel</h3>
                  <div className="space-y-3">
                    {adminStats.popularChapters.slice(0, 5).map((chapter, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span className="text-sm text-gray-700 dark:text-gray-200">{chapter.chapter}</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{chapter.count} Versuche</span>
                      </div>
                    ))}
                    {adminStats.popularChapters.length === 0 && (
                      <div className="text-sm text-gray-600 dark:text-gray-300 text-center py-4">
                        Noch keine Quiz-Versuche vorhanden
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Question Editor Modal */}
      {showQuestionEditor && (
        <QuestionEditor
          question={editingQuestion || undefined}
          chapters={chapters}
          onSave={handleSaveQuestion}
          onClose={closeQuestionEditor}
        />
      )}

      {/* User Editor Modal */}
      {showUserEditor && (
        <UserEditorModal
          user={editingUser}
          onSave={handleSaveUser}
          onClose={closeUserEditor}
        />
      )}
    </div>
  );
};

// Simple User Editor Modal Component
const UserEditorModal: React.FC<{
  user?: any;
  onSave: (userData: any) => void;
  onClose: () => void;
}> = ({ user, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    firstName: user?.firstName || user?.name?.split(' ')[0] || '',
    lastName: user?.lastName || user?.name?.split(' ').slice(1).join(' ') || '',
    email: user?.email || '',
    city: user?.city || '',
    evu: user?.evu || '',
    role: user?.role || 'user'
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-600 dark:border-gray-700 transition-colors duration-300">
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 dark:text-white mb-4">
            {user ? 'Benutzer bearbeiten' : 'Benutzer einladen'}
          </h3>
          
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Vorname <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.firstName}
                        onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Nachname <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.lastName}
                        onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                        required
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Ort <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      EVU (optional)
                    </label>
                    <input
                      type="text"
                      value={formData.evu}
                      onChange={(e) => setFormData(prev => ({ ...prev, evu: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                    />
                  </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                E-Mail
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
                required
                disabled={!!user} // Don't allow editing email for existing users
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Rolle
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-white"
              >
                <option value="user">Benutzer</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-600 rounded-md hover:bg-gray-300 dark:hover:bg-gray-50 dark:hover:bg-gray-700 dark:bg-gray-7000 transition-colors"
              >
                Abbrechen
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 transition-colors"
              >
                {user ? 'Aktualisieren' : 'Einladen'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
