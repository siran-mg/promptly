import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { appointmentId } = await request.json();

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Appointment ID is required' },
        { status: 400 }
      );
    }

    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });

    // Check authentication
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Generate a new share token (UUID)
    const shareToken = randomUUID();

    // Update the appointment with the new share token
    const { data, error } = await supabase
      .from('appointments')
      .update({ share_token: shareToken })
      .eq('id', appointmentId)
      .eq('user_id', session.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating appointment:', error);
      return NextResponse.json(
        { error: 'Could not generate share link. Please try again.' },
        { status: 500 }
      );
    }

    // Return the updated appointment with the share token
    return NextResponse.json({ appointment: data });
  } catch (error) {
    console.error('Error in share token API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
