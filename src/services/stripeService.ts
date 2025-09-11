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

// Subscription Plans Configuration
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'pro-monthly',
    name: 'Pro Monatlich',
    description: 'Unbegrenzte Fragen, erweiterte Statistiken und mehr',
    price: 9.99,
    currency: 'EUR',
    interval: 'month',
    features: [
      'Unbegrenzte Fragen pro Tag',
      'Erweiterte Statistiken',
      'Prioritätssupport',
      'Alle Kapitel freigeschaltet',
      'Export-Funktionen'
    ],
    stripePriceId: (import.meta as any).env.VITE_STRIPE_PRICE_ID_PRO || 'price_pro_monthly',
    popular: true
  },
  {
    id: 'pro-yearly',
    name: 'Pro Jährlich',
    description: 'Unbegrenzte Fragen, erweiterte Statistiken und mehr - 2 Monate gratis!',
    price: 99.99,
    currency: 'EUR',
    interval: 'year',
    features: [
      'Unbegrenzte Fragen pro Tag',
      'Erweiterte Statistiken',
      'Prioritätssupport',
      'Alle Kapitel freigeschaltet',
      'Export-Funktionen',
      '2 Monate gratis (17% Ersparnis)'
    ],
    stripePriceId: 'price_pro_yearly'
  }
];

class StripeService {
  /**
   * Create a Stripe checkout session (temporary direct implementation)
   */
  async createCheckoutSession(priceId: string, userId: string): Promise<StripeCheckoutSession> {
    try {
      // Temporary: Create checkout session directly with Stripe
      // In production, this should be done via Supabase Edge Functions
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe ist nicht verfügbar');
      }

      // For now, we'll create a simple checkout session
      // This is a simplified version - in production you'd want server-side validation
      const { error, session } = await stripe.redirectToCheckout({
        lineItems: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
        customerEmail: user?.email, // We'll get this from the auth context
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        throw new Error('Fehler beim Erstellen der Checkout-Session');
      }

      return { id: session?.id || '', url: '' };
    } catch (error) {
      console.error('Error in createCheckoutSession:', error);
      throw error;
    }
  }

  /**
   * Redirect to Stripe checkout (simplified direct implementation)
   */
  async redirectToCheckout(priceId: string, userId: string): Promise<void> {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error('Stripe ist nicht verfügbar');
      }

      // Direct checkout redirect - simplified for testing
      const { error } = await stripe.redirectToCheckout({
        lineItems: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        successUrl: `${window.location.origin}/dashboard?success=true`,
        cancelUrl: `${window.location.origin}/upgrade?canceled=true`,
      });

      if (error) {
        console.error('Stripe checkout error:', error);
        throw new Error('Fehler beim Weiterleiten zur Zahlung');
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
