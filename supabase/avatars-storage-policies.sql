-- Create policies for the avatars bucket

-- INSERT policy (for uploading)
CREATE POLICY "Allow users to upload their own avatars" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  (bucket_id = 'avatars') AND 
  (name LIKE 'avatar-' || auth.uid() || '-%')
);

-- SELECT policy (for viewing)
CREATE POLICY "Allow public access to avatars" ON storage.objects
FOR SELECT TO public
USING (bucket_id = 'avatars');

-- UPDATE policy (for replacing)
CREATE POLICY "Allow users to update their own avatars" ON storage.objects
FOR UPDATE TO authenticated
USING (
  (bucket_id = 'avatars') AND 
  (name LIKE 'avatar-' || auth.uid() || '-%')
);

-- DELETE policy (for removing)
CREATE POLICY "Allow users to delete their own avatars" ON storage.objects
FOR DELETE TO authenticated
USING (
  (bucket_id = 'avatars') AND 
  (name LIKE 'avatar-' || auth.uid() || '-%')
);
