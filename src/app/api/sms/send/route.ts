import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { userId, phone, message } = await request.json();
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

    // Check if user has SMS notifications enabled
    const { data: smsSubscription, error: subscriptionError } = await supabase
      .from('sms_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (subscriptionError) {
      console.error('Error fetching SMS subscription:', subscriptionError);
      return NextResponse.json({ error: subscriptionError.message }, { status: 500 });
    }

    if (!smsSubscription || !smsSubscription.enabled) {
      return NextResponse.json({
        success: false,
        message: 'SMS notifications are not enabled for this user'
      });
    }

    // Use the phone number from the subscription if not provided
    const phoneNumber = phone || smsSubscription.phone_number;
    
    if (!phoneNumber) {
      return NextResponse.json({
        success: false,
        message: 'No phone number available for this user'
      });
    }

    // Call Supabase Edge Function to send SMS
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/send-sms`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
      },
      body: JSON.stringify({
        to: phoneNumber,
        body: message,
        userId: userId
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Error sending SMS:', result);
      return NextResponse.json({ error: result.error || 'Failed to send SMS' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: 'SMS notification sent successfully'
    });
  } catch (error) {
    console.error('Error in SMS send route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
