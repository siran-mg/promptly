import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { sendPushNotification } from '@/lib/server/push-notifications';

export async function POST(request: Request) {
  try {
    const { userId, title, body, url, tag } = await request.json();
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Get current user (using getUser for security)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only allow sending notifications to the authenticated user
    if (userId !== user.id) {
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

    // Log the subscriptions for debugging
    console.log(`Found ${subscriptions.length} push subscriptions for user ${userId}`);

    // Send push notifications to all subscriptions
    const results = await Promise.all(
      subscriptions.map(async (sub, index) => {
        try {
          console.log(`Sending push notification to subscription ${index + 1}/${subscriptions.length}`);

          const result = await sendPushNotification(sub.subscription, {
            title,
            body,
            url,
            tag,
          });

          console.log(`Push notification result for subscription ${index + 1}:`, result);
          return result;
        } catch (error) {
          console.error(`Error sending push notification to subscription ${index + 1}:`, error);
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
