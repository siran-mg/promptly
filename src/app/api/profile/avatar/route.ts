import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Define the storage bucket name
const STORAGE_BUCKET_NAME = "avatars";

export async function POST(request: Request) {
  try {
    // Get the form data from the request
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const fileType = file.type;
    if (!fileType.startsWith("image/")) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload an image file (JPEG, PNG, etc.)' },
        { status: 400 }
      );
    }

    // Validate file size (max 2MB)
    const maxSize = 2 * 1024 * 1024; // 2MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Please upload an image smaller than 2MB' },
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

    const userId = session.user.id;

    // We don't need to create the bucket as it already exists
    // Just log that we're using the existing bucket
    console.log('Using existing avatars bucket for profile picture upload');

    // Try to delete the old avatar if it exists
    try {
      // Get the current profile to check for existing avatar
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_url')
        .eq('id', userId)
        .single();

      if (profile?.avatar_url) {
        try {
          // Extract the file path from the URL
          const url = new URL(profile.avatar_url);
          const pathParts = url.pathname.split('/');
          const filePath = pathParts[pathParts.length - 1];

          if (filePath && filePath.startsWith('avatar-')) {
            const { error: removeError } = await supabase.storage
              .from(STORAGE_BUCKET_NAME)
              .remove([filePath]);

            if (removeError) {
              console.warn("Could not remove old avatar, but continuing:", removeError);
            } else {
              console.log("Deleted old avatar:", filePath);
            }
          }
        } catch (deleteErr) {
          // Just log the error but continue with the upload
          console.error("Error deleting old avatar:", deleteErr);
        }
      }
    } catch (err) {
      console.error("Error checking for existing avatar:", err);
      // Continue with the upload
    }

    // Create a safe filename
    const fileExt = file.name.split('.').pop();
    const safeFileName = `avatar-${userId}-${Date.now()}.${fileExt}`;

    // Convert the file to an ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload file to Supabase Storage
    const { data, error } = await supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .upload(safeFileName, buffer, {
        contentType: file.type,
        cacheControl: "3600",
        upsert: true,
      });

    if (error) {
      console.error('Error uploading avatar:', error);
      return NextResponse.json(
        { error: 'Could not upload avatar. Please try again.' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(STORAGE_BUCKET_NAME)
      .getPublicUrl(data.path);

    // First check if the avatar_url column exists
    try {
      // Try to update the profile with the new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('Error updating profile with avatar URL:', updateError);

        // If the error is about the column not existing, we'll handle it gracefully
        if (updateError.message && updateError.message.includes("Could not find the 'avatar_url' column")) {
          console.log('The avatar_url column might not exist yet. Returning the URL anyway.');
          // We'll return success but with a warning
          return NextResponse.json({
            avatar_url: publicUrl,
            message: 'Avatar uploaded successfully, but profile could not be updated. The avatar_url column might be missing.',
            warning: true
          });
        } else {
          // For other errors, return an error response
          return NextResponse.json(
            { error: 'Could not update profile with avatar URL. Please try again.' },
            { status: 500 }
          );
        }
      }
    } catch (err) {
      console.error('Unexpected error updating profile:', err);
      // Return the URL anyway so the frontend can at least display the image
      return NextResponse.json({
        avatar_url: publicUrl,
        message: 'Avatar uploaded successfully, but profile could not be updated.',
        warning: true
      });
    }

    // Return the updated avatar URL
    return NextResponse.json({
      avatar_url: publicUrl,
      message: 'Avatar uploaded successfully'
    });
  } catch (error) {
    console.error('Error in avatar upload API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
