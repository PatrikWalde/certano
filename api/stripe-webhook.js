// Stripe Webhook Handler for Vercel
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  console.log('Received Stripe webhook event:', event.type);

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object);
        break;
      
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object);
        break;
      
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  const customerEmail = session.customer_details?.email;
  if (!customerEmail) {
    console.error('No customer email found in session');
    return;
  }

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (userError || !user) {
    console.error('User not found for email:', customerEmail);
    return;
  }

  // Update user profile to Pro
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      subscription_type: 'pro',
      subscription_status: 'active',
      subscription_start_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', user.id);

  if (updateError) {
    console.error('Error updating user profile:', updateError);
  } else {
    console.log('Successfully updated user to Pro:', user.id);
  }
}

async function handleSubscriptionCreated(subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  const customerEmail = subscription.customer_email;
  if (!customerEmail) {
    console.error('No customer email found in subscription');
    return;
  }

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (userError || !user) {
    console.error('User not found for email:', customerEmail);
    return;
  }

  // Update user profile to Pro
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      subscription_type: 'pro',
      subscription_status: 'active',
      subscription_start_date: new Date(subscription.created * 1000).toISOString(),
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', user.id);

  if (updateError) {
    console.error('Error updating user profile:', updateError);
  } else {
    console.log('Successfully created Pro subscription for user:', user.id);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  const customerEmail = subscription.customer_email;
  if (!customerEmail) {
    console.error('No customer email found in subscription');
    return;
  }

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (userError || !user) {
    console.error('User not found for email:', customerEmail);
    return;
  }

  const subscriptionStatus = subscription.status === 'active' ? 'active' : 'inactive';

  // Update user profile
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      subscription_status: subscriptionStatus,
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', user.id);

  if (updateError) {
    console.error('Error updating user profile:', updateError);
  } else {
    console.log('Successfully updated subscription status for user:', user.id);
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  const customerEmail = subscription.customer_email;
  if (!customerEmail) {
    console.error('No customer email found in subscription');
    return;
  }

  // Find user by email
  const { data: user, error: userError } = await supabase
    .from('auth.users')
    .select('id')
    .eq('email', customerEmail)
    .single();

  if (userError || !user) {
    console.error('User not found for email:', customerEmail);
    return;
  }

  // Downgrade user to free
  const { error: updateError } = await supabase
    .from('user_profiles')
    .update({
      subscription_type: 'free',
      subscription_status: 'cancelled',
      subscription_end_date: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('auth_user_id', user.id);

  if (updateError) {
    console.error('Error updating user profile:', updateError);
  } else {
    console.log('Successfully downgraded user to free:', user.id);
  }
}

async function handlePaymentSucceeded(invoice) {
  console.log('Processing payment succeeded:', invoice.id);
  // Payment succeeded - subscription is active
  // This is handled by subscription.updated event
}

async function handlePaymentFailed(invoice) {
  console.log('Processing payment failed:', invoice.id);
  // Payment failed - subscription might be past due
  // This is handled by subscription.updated event
}
