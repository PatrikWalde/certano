// Create Stripe Checkout Session with Customer ID
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kvaddjdtdkzqnmjtdmko.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  try {
    const { priceId, userId, successUrl, cancelUrl } = req.body;

    console.log('Create checkout session request:', { priceId, userId, successUrl, cancelUrl });

    if (!priceId || !userId) {
      console.error('Missing required parameters:', { priceId, userId });
      return res.status(400).json({ error: 'Missing required parameters' });
    }

    // Get user data from Supabase
    console.log('Looking for user with ID:', userId);
    const { data: user, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('id', userId)
      .single();

    console.log('User query result:', { user, userError });

    if (userError || !user) {
      console.error('User not found:', { userId, userError });
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if user already has a Stripe customer ID
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('stripe_customer_id')
      .eq('auth_user_id', userId)
      .single();

    let customerId = userProfile?.stripe_customer_id;

    // If no customer ID exists, create a new Stripe customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: {
          user_id: userId,
        },
      });
      customerId = customer.id;

      // Save customer ID to user profile
      await supabase
        .from('user_profiles')
        .update({ stripe_customer_id: customerId })
        .eq('auth_user_id', userId);
    }

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        user_id: userId,
      },
    });

    res.json({ sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: error.message });
  }
}
