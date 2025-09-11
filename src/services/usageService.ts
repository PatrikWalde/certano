import { supabase } from '../lib/supabase';

export interface UsageStats {
  dailyUsage: number;
  subscriptionType: 'free' | 'pro' | 'admin';
  canAnswerMore: boolean;
  remainingQuestions: number;
}

export interface UsageTracking {
  id: string;
  userId: string;
  usageDate: string;
  questionsAnswered: number;
  quizzesCompleted: number;
  createdAt: string;
  updatedAt: string;
}

class UsageService {
  /**
   * Get current usage stats for a user
   */
  async getUsageStats(userId: string): Promise<UsageStats> {
    try {
      const { data: userProfile, error } = await supabase
        .from('user_profiles')
        .select('daily_usage, subscription_type, last_usage_date, role')
        .eq('auth_user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching usage stats:', error);
        return {
          dailyUsage: 0,
          subscriptionType: 'free',
          canAnswerMore: true,
          remainingQuestions: 5
        };
      }

      // Check if user is admin
      const isAdmin = userProfile.role === 'admin';
      
      if (isAdmin) {
        return {
          dailyUsage: 0,
          subscriptionType: 'admin',
          canAnswerMore: true,
          remainingQuestions: Infinity
        };
      }

      // Check if last usage was not today (reset counter)
      const today = new Date().toISOString().split('T')[0];
      const lastUsageDate = userProfile.last_usage_date?.split('T')[0];
      
      let dailyUsage = userProfile.daily_usage || 0;
      if (lastUsageDate !== today) {
        dailyUsage = 0;
        // Reset daily usage
        await this.resetDailyUsage(userId);
      }

      const subscriptionType = userProfile.subscription_type || 'free';
      const maxQuestions = subscriptionType === 'pro' ? Infinity : 5;
      const canAnswerMore = dailyUsage < maxQuestions;
      const remainingQuestions = Math.max(0, maxQuestions - dailyUsage);

      return {
        dailyUsage,
        subscriptionType,
        canAnswerMore,
        remainingQuestions: subscriptionType === 'pro' ? Infinity : remainingQuestions
      };
    } catch (error) {
      console.error('Error in getUsageStats:', error);
      return {
        dailyUsage: 0,
        subscriptionType: 'free',
        canAnswerMore: true,
        remainingQuestions: 5
      };
    }
  }

  /**
   * Increment daily usage for a user
   */
  async incrementUsage(userId: string): Promise<{ success: boolean; newUsage: number; limitReached: boolean }> {
    try {
      const { data, error } = await supabase.rpc('increment_daily_usage', {
        user_uuid: userId
      });

      if (error) {
        console.error('Error incrementing usage:', error);
        return { success: false, newUsage: 0, limitReached: false };
      }

      // If return value is -1, limit reached
      if (data === -1) {
        return { success: false, newUsage: 5, limitReached: true };
      }

      return { success: true, newUsage: data, limitReached: false };
    } catch (error) {
      console.error('Error in incrementUsage:', error);
      return { success: false, newUsage: 0, limitReached: false };
    }
  }

  /**
   * Reset daily usage for a user
   */
  async resetDailyUsage(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({
          daily_usage: 0,
          last_usage_date: new Date().toISOString().split('T')[0]
        })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error resetting daily usage:', error);
      }
    } catch (error) {
      console.error('Error in resetDailyUsage:', error);
    }
  }

  /**
   * Get usage history for a user
   */
  async getUsageHistory(userId: string, days: number = 30): Promise<UsageTracking[]> {
    try {
      const { data, error } = await supabase
        .from('usage_tracking')
        .select('*')
        .eq('user_id', userId)
        .gte('usage_date', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('usage_date', { ascending: false });

      if (error) {
        console.error('Error fetching usage history:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getUsageHistory:', error);
      return [];
    }
  }

  /**
   * Check if user can start a quiz
   */
  async canStartQuiz(userId: string): Promise<{ canStart: boolean; reason?: string }> {
    try {
      const usageStats = await this.getUsageStats(userId);
      
      if (!usageStats.canAnswerMore) {
        return {
          canStart: false,
          reason: usageStats.subscriptionType === 'free' 
            ? 'Du hast dein tägliches Limit von 5 Fragen erreicht. Upgrade auf Pro für unbegrenzte Fragen!'
            : 'Unbekannter Fehler'
        };
      }

      return { canStart: true };
    } catch (error) {
      console.error('Error in canStartQuiz:', error);
      return { canStart: false, reason: 'Fehler beim Überprüfen der Nutzung' };
    }
  }

  /**
   * Update subscription type for a user
   */
  async updateSubscription(userId: string, subscriptionType: 'free' | 'pro'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ subscription_type: subscriptionType })
        .eq('auth_user_id', userId);

      if (error) {
        console.error('Error updating subscription:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error in updateSubscription:', error);
      return false;
    }
  }
}

export const usageService = new UsageService();
