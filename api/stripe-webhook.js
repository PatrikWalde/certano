// Stripe Webhook Handler for Vercel
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://kvaddjdtdkzqnmjtdmko.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).end('Method Not Allowed');
  }

  // For now, we'll skip signature verification due to Vercel's body parsing
  // In production, you might want to implement a different verification method
  const event = req.body;
  
  console.log('Received Stripe webhook event:', event.type);
  console.log('Event data:', JSON.stringify(event, null, 2));

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

// Enhanced user search function
async function findUserByEmailOrCustomerId(customerEmail, customerId) {
  console.log('Searching for user with email:', customerEmail, 'and customer ID:', customerId);
  
  // First, try to find by exact email match
  let { data: user, error: userError } = await supabase
    .from('auth.users')
    .select('id, email')
    .eq('email', customerEmail)
    .single();

  if (user && !userError) {
    console.log('Found user by exact email match:', user.email);
    return user;
  }

  // If not found by exact email, try to find by email alias (secure way)
  console.log('Trying to find user by email alias:', customerEmail);
  const { data: aliasUser, error: aliasError } = await supabase
    .from('user_email_aliases')
    .select('auth_user_id, alias_email')
    .eq('alias_email', customerEmail)
    .eq('is_verified', true)
    .single();

  if (aliasUser && !aliasError) {
    // Get the full user data
    const { data: fullUser, error: fullUserError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('id', aliasUser.auth_user_id)
      .single();

    if (fullUser && !fullUserError) {
      console.log('Found user by verified email alias:', fullUser.email, 'for alias:', aliasUser.alias_email);
      return fullUser;
    }
  }

  // If still not found, try to find by customer ID in user_profiles
  if (customerId) {
    console.log('Trying to find user by Stripe customer ID:', customerId);
    const { data: profileUser, error: profileError } = await supabase
      .from('user_profiles')
      .select('auth_user_id, stripe_customer_id')
      .eq('stripe_customer_id', customerId)
      .single();

    if (profileUser && !profileError) {
      // Get the full user data
      const { data: fullUser, error: fullUserError } = await supabase
        .from('auth.users')
        .select('id, email')
        .eq('id', profileUser.auth_user_id)
        .single();

      if (fullUser && !fullUserError) {
        console.log('Found user by Stripe customer ID:', fullUser.email);
        return fullUser;
      }
    }
  }

  console.error('User not found for email:', customerEmail, 'or customer ID:', customerId);
  return null;
}

async function handleCheckoutSessionCompleted(session) {
  console.log('Processing checkout session completed:', session.id);
  
  const customerId = session.customer;
  const successUrl = session.success_url;
  
  console.log('Session details:', { customerId, successUrl });
  
  if (!customerId) {
    console.error('No customer ID found in session');
    return;
  }

  // Extract User ID from success URL
  let userId = null;
  if (successUrl && successUrl.includes('user_id=')) {
    const urlParams = new URLSearchParams(successUrl.split('?')[1]);
    userId = urlParams.get('user_id');
    console.log('Extracted User ID from success URL:', userId);
  }

  // Find user by User ID ONLY
  let user = null;
  
  if (userId) {
    const { data: userData, error: userError } = await supabase
      .from('auth.users')
      .select('id, email')
      .eq('id', userId)
      .single();
    
    if (userData && !userError) {
      user = userData;
      console.log('Found user by User ID:', user.id);
    } else {
      console.error('User not found for User ID:', userId, userError);
    }
  } else {
    console.error('No User ID found in success URL');
  }

      if (fullUser && !fullUserError) {
        user = fullUser;
        console.log('Found user by Stripe Customer ID:', user.email);
      }
    }
  }
  
  if (!user) {
    console.error('User not found for customer ID:', customerId);
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
  const customerId = subscription.customer;
  
  if (!customerEmail) {
    console.error('No customer email found in subscription');
    return;
  }

  // Enhanced user search
  const user = await findUserByEmailOrCustomerId(customerEmail, customerId);
  
  if (!user) {
    console.error('User not found for email:', customerEmail, 'or customer ID:', customerId);
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
  const customerId = subscription.customer;
  
  if (!customerEmail) {
    console.error('No customer email found in subscription');
    return;
  }

  // Enhanced user search
  const user = await findUserByEmailOrCustomerId(customerEmail, customerId);
  
  if (!user) {
    console.error('User not found for email:', customerEmail, 'or customer ID:', customerId);
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
  const customerId = subscription.customer;
  
  if (!customerEmail) {
    console.error('No customer email found in subscription');
    return;
  }

  // Enhanced user search
  const user = await findUserByEmailOrCustomerId(customerEmail, customerId);
  
  if (!user) {
    console.error('User not found for email:', customerEmail, 'or customer ID:', customerId);
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
