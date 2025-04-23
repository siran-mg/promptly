import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
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
    
    // Check if a share token already exists for this user
    const { data: existingToken, error: fetchError } = await supabase
      .from('form_share_tokens')
      .select('*')
      .eq('user_id', userId)
      .single();
      
    if (fetchError && fetchError.code !== 'PGRST116') {
      // If there's an error other than "no rows returned"
      console.error('Error checking for existing token:', fetchError);
      return NextResponse.json(
        { error: 'Failed to check for existing token' },
        { status: 500 }
      );
    }
    
    let result;
    
    if (existingToken) {
      // Update the existing token
      const { data, error } = await supabase
        .from('form_share_tokens')
        .update({ token: shareToken })
        .eq('id', existingToken.id)
        .select()
        .single();
        
      if (error) {
        console.error('Error updating share token:', error);
        return NextResponse.json(
          { error: 'Could not update share token. Please try again.' },
          { status: 500 }
        );
      }
      
      result = data;
    } else {
      // Create a new token
      const { data, error } = await supabase
        .from('form_share_tokens')
        .insert({
          user_id: userId,
          token: shareToken
        })
        .select()
        .single();
        
      if (error) {
        console.error('Error creating share token:', error);
        return NextResponse.json(
          { error: 'Could not create share token. Please try again.' },
          { status: 500 }
        );
      }
      
      result = data;
    }
    
    return NextResponse.json({ shareToken: result });
  } catch (error) {
    console.error('Error in form share token API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
