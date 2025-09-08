import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
})

// Auth Helper Functions
export const auth = {
  // Sign up
  signUp: async (email: string, password: string, userData?: any) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: userData
      }
    })
    return { data, error }
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    return { data, error }
  },

  // Sign out
  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  // Get current user
  getUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  // Get session
  getSession: async () => {
    const { data: { session }, error } = await supabase.auth.getSession()
    return { session, error }
  },

  // Listen to auth changes
  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  }
}

// Database Helper Functions
export const db = {
  // Topics
  topics: {
    getAll: async () => {
      console.log('Testing topics table access...');
      try {
        const result = await supabase.from('topics').select('*').order('order_index');
        console.log('Topics table access result:', result);
        return result;
      } catch (error) {
        console.error('Error accessing topics table:', error);
        throw error;
      }
    },
    getById: (id: string) => supabase.from('topics').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('topics').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('topics').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('topics').delete().eq('id', id),
    reorder: async (updates: { id: string; order_index: number }[]) => {
      // Update each topic individually to avoid upsert issues
      const results = [];
      for (const update of updates) {
        const result = await supabase
          .from('topics')
          .update({ order_index: update.order_index })
          .eq('id', update.id);
        results.push(result);
      }
      return { data: results, error: null };
    }
  },

  // Questions
  questions: {
    getAll: () => supabase.from('questions').select('*'),
    getByChapter: (chapter: string) => supabase.from('questions').select('*').eq('chapter', chapter),
    getById: (id: string) => supabase.from('questions').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('questions').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('questions').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('questions').delete().eq('id', id),
    getRandom: (count: number, chapter?: string) => {
      let query = supabase.from('questions').select('*').limit(count)
      if (chapter) {
        query = query.eq('chapter', chapter)
      }
      return query
    }
  },

  // Chapters
  chapters: {
    getAll: () => supabase.from('chapters').select('*').order('order'),
    getByTopic: (topicId: string) => supabase.from('chapters').select('*').eq('topic_id', topicId).order('order'),
    getById: (id: string) => supabase.from('chapters').select('*').eq('id', id).single(),
    create: (data: any) => supabase.from('chapters').insert(data).select().single(),
    update: (id: string, data: any) => supabase.from('chapters').update(data).eq('id', id).select().single(),
    delete: (id: string) => supabase.from('chapters').delete().eq('id', id),
    reorder: async (updates: { id: string; order: number }[]) => {
      // Update each chapter individually to avoid upsert issues
      const results = [];
      for (const update of updates) {
        const result = await supabase
          .from('chapters')
          .update({ order: update.order })
          .eq('id', update.id);
        results.push(result);
      }
      return { data: results, error: null };
    }
  },

  // User Stats
  userStats: {
    getByUser: (userId: string) => supabase.from('user_stats').select('*').eq('user_id', userId).single(),
    create: (data: any) => supabase.from('user_stats').insert(data),
    update: (id: string, data: any) => supabase.from('user_stats').update(data).eq('id', id),
    upsert: (data: any) => supabase.from('user_stats').upsert(data)
  },

  // Quiz Attempts
  quizAttempts: {
    getByUser: (userId: string) => supabase.from('quiz_attempts').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    create: (data: any) => supabase.from('quiz_attempts').insert(data)
  },

  // Question Errors
  questionErrors: {
    getByUser: (userId: string) => supabase.from('question_errors').select('*').eq('user_id', userId),
    upsert: (data: any) => supabase.from('question_errors').upsert(data)
  }
}

// Storage Helper Functions
export const storage = {
  // Upload image
  uploadImage: async (file: File, path: string) => {
    const { data, error } = await supabase.storage
      .from('images')
      .upload(path, file)
    return { data, error }
  },

  // Get image URL
  getImageUrl: (path: string) => {
    const { data } = supabase.storage
      .from('images')
      .getPublicUrl(path)
    return data.publicUrl
  },

  // Delete image
  deleteImage: async (path: string) => {
    const { error } = await supabase.storage
      .from('images')
      .remove([path])
    return { error }
  }
}

export default supabase
