import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';

// GET: Fetch all share tokens for a user
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('userId');

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

    // Get all share tokens for this user
    const { data: shareTokens, error } = await supabase
      .from('form_share_tokens')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching share tokens:', error);
      return NextResponse.json(
        { error: 'Failed to fetch share tokens' },
        { status: 500 }
      );
    }

    return NextResponse.json({ shareTokens });
  } catch (error) {
    console.error('Error in form share token API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST: Create a new share token or update an existing one
export async function POST(request: Request) {
  try {
    const { userId, name, selectedTypes, defaultType, tokenId } = await request.json();

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

    let result;

    // If tokenId is provided, update the existing token
    if (tokenId) {
      const updateData: any = {};

      if (name !== undefined) updateData.name = name;
      if (selectedTypes !== undefined) updateData.selected_types = selectedTypes;
      if (defaultType !== undefined) updateData.default_type = defaultType;

      // Update the existing token
      const { data, error } = await supabase
        .from('form_share_tokens')
        .update(updateData)
        .eq('id', tokenId)
        .eq('user_id', userId) // Ensure the token belongs to the user
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
      // Generate a new share token (UUID)
      const token = randomUUID();
      console.log('Generating new token:', token);

      // Create a new token
      const { data, error } = await supabase
        .from('form_share_tokens')
        .insert({
          user_id: userId,
          token: token,
          name: name || 'Default Link',
          selected_types: selectedTypes || [],
          default_type: defaultType || null
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

// DELETE: Delete a share token
export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url);
    const tokenId = url.searchParams.get('tokenId');
    const userId = url.searchParams.get('userId');

    if (!tokenId || !userId) {
      return NextResponse.json(
        { error: 'Token ID and User ID are required' },
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

    // First check if the token exists
    const { error: fetchError } = await supabase
      .from('form_share_tokens')
      .select('id')
      .eq('id', tokenId)
      .eq('user_id', userId)
      .single();

    if (fetchError) {
      console.error('Error checking if token exists:', fetchError);
      return NextResponse.json(
        { error: 'Token not found or you do not have permission to delete it.' },
        { status: 404 }
      );
    }

    // Delete the token
    const { error } = await supabase
      .from('form_share_tokens')
      .delete()
      .eq('id', tokenId)
      .eq('user_id', userId); // Ensure the token belongs to the user

    if (error) {
      console.error('Error deleting share token:', error);
      return NextResponse.json(
        { error: 'Could not delete share token. Please try again.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in form share token API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
