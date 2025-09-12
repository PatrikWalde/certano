import { loadStripe, Stripe } from '@stripe/stripe-js';
import { supabase } from '../lib/supabase';
import { SubscriptionPlan, StripeCheckoutSession, SubscriptionStatus } from '../types';

// Initialize Stripe
let stripePromise: Promise<Stripe | null>;

const getStripe = () => {
  if (!stripePromise) {
    const publishableKey = (import.meta as any).env.VITE_STRIPE_PUBLISHABLE_KEY;
    if (!publishableKey) {
      console.warn('Stripe publishable key not found. Stripe features will be disabled.');
      return Promise.resolve(null);
    }
    stripePromise = loadStripe(publishableKey);
  }
  return stripePromise;
};

// Export getStripe for potential future use
export { getStripe };

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro Monatlich',
    description: 'Unbegrenzte Fragen, erweiterte Statistiken und mehr',
    price: 9.90,
    currency: 'CHF',
    interval: 'month',
    features: [
      'Unbegrenzte Fragen pro Tag',
      'Keine täglichen Limits',
      'Vollzugriff auf alle Quiz-Features',
      'Erweiterte Lernstatistiken',
      'Prioritätssupport per E-Mail'
    ],
    stripePriceId: (import.meta as any).env.VITE_STRIPE_PRICE_ID_PRO || 'price_1S69AqDWHue2lSGxN5vo5Jit',
    popular: true
  },
  {
    id: 'pro-yearly',
    name: 'Pro Jährlich',
    description: 'Unbegrenzte Fragen, erweiterte Statistiken und mehr - 2 Monate gratis!',
    price: 99.00,
    currency: 'CHF',
    interval: 'year',
    features: [
      'Unbegrenzte Fragen pro Tag',
      'Keine täglichen Limits',
      'Vollzugriff auf alle Quiz-Features',
      'Erweiterte Lernstatistiken',
      'Prioritätssupport per E-Mail',
      '2 Monate gratis (17% Ersparnis)'
    ],
    stripePriceId: 'price_1S69BADWHue2lSGxeWmOtL5u'
  }
];

class StripeService {
  /**
   * Create a Stripe checkout session (temporary direct implementation)
   */
  async createCheckoutSession(_priceId: string, _userId: string): Promise<StripeCheckoutSession> {
    try {
      // This method is not used in the current implementation
      // We use direct payment links instead
      throw new Error('This method is not implemented - use redirectToCheckout instead');
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe checkout (using direct checkout with User ID in customerEmail)
   */
  async redirectToCheckout(priceId: string, userId: string): Promise<void> {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe not initialized');
      }

      console.log('Creating direct checkout with User ID:', { priceId, userId });

      // Create checkout session directly with Stripe (client-side)
      const { error } = await stripe.redirectToCheckout({
        lineItems: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        successUrl: `${window.location.origin}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}&user_id=${userId}`,
        cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
        // Remove customerEmail - let user enter their own email
      });

      if (error) {
        throw new Error(error.message);
      }
      
    } catch (error) {
      console.error('Error in redirectToCheckout:', error);
      throw error;
    }
  }

  /**
   * Get subscription status for a user
   */
  async getSubscriptionStatus(userId: string): Promise<SubscriptionStatus> {
    try {
      const { data, error } = await supabase.functions.invoke('get-subscription-status', {
        body: { userId }
      });

      if (error) {
        console.error('Error getting subscription status:', error);
        return {
          isActive: false,
          plan: 'free'
        };
      }

      return data;
    } catch (error) {
      console.error('Error in getSubscriptionStatus:', error);
      return {
        isActive: false,
        plan: 'free'
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('cancel-subscription', {
        body: { userId }
      });

      if (error) {
        console.error('Error canceling subscription:', error);
        return false;
      }

      return data.success;
    } catch (error) {
      console.error('Error in cancelSubscription:', error);
      return false;
    }
  }

  /**
   * Reactivate subscription
   */
  async reactivateSubscription(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('reactivate-subscription', {
        body: { userId }
      });

      if (error) {
        console.error('Error reactivating subscription:', error);
        return false;
      }

      return data.success;
    } catch (error) {
      console.error('Error in reactivateSubscription:', error);
      return false;
    }
  }

  /**
   * Get customer portal URL
   */
  async getCustomerPortalUrl(userId: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('create-portal-session', {
        body: { 
          userId,
          returnUrl: `${window.location.origin}/profile`
        }
      });

      if (error) {
        console.error('Error creating portal session:', error);
        throw new Error('Fehler beim Erstellen der Kundenportal-Session');
      }

      return data.url;
    } catch (error) {
      console.error('Error in getCustomerPortalUrl:', error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
