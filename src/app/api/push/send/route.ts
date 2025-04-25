import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/server/push-notifications';

export async function POST(request: Request) {
  try {
    const { userId, title, body, url, tag } = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    // Get current user
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // Only allow sending notifications to the authenticated user
    if (userId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    
    // Get all push subscriptions for the user
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId);
    
    if (error) {
      console.error('Error fetching push subscriptions:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        success: false, 
        message: 'No push subscriptions found for this user' 
      });
    }
    
    // Send push notifications to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub) => {
        try {
          const result = await sendPushNotification(sub.subscription, {
            title,
            body,
            url,
            tag,
          });
          return result;
        } catch (error) {
          console.error('Error sending push notification:', error);
          return { success: false, error };
        }
      })
    );
    
    const allSuccessful = results.every((result) => result.success);
    
    return NextResponse.json({ 
      success: allSuccessful, 
      results,
      sentTo: subscriptions.length
    });
  } catch (error) {
    console.error('Error in push notification send API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
