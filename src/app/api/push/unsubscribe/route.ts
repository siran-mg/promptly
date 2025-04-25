import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { endpoint } = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Delete subscription from database
    console.log('Deleting subscription with endpoint:', endpoint);

    // First, get all subscriptions for this user
    const { data: subscriptions, error: fetchError } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', session.user.id);

    if (fetchError) {
      console.error('Error fetching push subscriptions:', fetchError);
      return NextResponse.json({ error: fetchError.message }, { status: 500 });
    }

    // Find the subscription with the matching endpoint
    const subscriptionToDelete = subscriptions?.find(sub => {
      try {
        return sub.subscription?.endpoint === endpoint;
      } catch (e) {
        console.error('Error comparing subscription endpoints:', e);
        return false;
      }
    });

    if (!subscriptionToDelete) {
      console.error('No matching subscription found with endpoint:', endpoint);
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    // Delete the subscription by ID
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('id', subscriptionToDelete.id);

    if (error) {
      console.error('Error deleting push subscription:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in push unsubscription API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
