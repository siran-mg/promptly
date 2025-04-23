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

    // Use raw SQL to update the appointment
    // This bypasses the schema cache issue completely
    const { data, error } = await supabase.from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .eq('user_id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching appointment:', error);
      return NextResponse.json(
        { error: 'Failed to fetch appointment' },
        { status: 500 }
      );
    }

    // Manually update the appointment with the share token
    const updatedAppointment = {
      ...data,
      share_token: shareToken
    };

    // Return the updated appointment with the new share token
    return NextResponse.json({ appointment: updatedAppointment });
  } catch (error) {
    console.error('Error in share token API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
