-- Fix the storage policies for profile picture uploads
-- Drop existing policies that might be causing issues
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;
DROP POLICY IF EXISTS "Profile pictures are publicly accessible" ON storage.objects;

-- Create correct policies for profile-pictures bucket
CREATE POLICY "Users can upload their own profile pictures"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own profile pictures"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own profile pictures"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'profile-pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Profile pictures are publicly accessible"
ON storage.objects
FOR SELECT
USING (bucket_id = 'profile-pictures');