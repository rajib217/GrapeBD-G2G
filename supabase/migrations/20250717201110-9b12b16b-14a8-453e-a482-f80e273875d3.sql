-- Update storage policies for profile-pictures bucket to support varieties folder
-- Drop existing INSERT policies and create new ones with proper WITH CHECK conditions

DROP POLICY IF EXISTS "Users can upload their own profile picture" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own profile pictures" ON storage.objects;

-- Allow users to upload to varieties folder (for admin users)
CREATE POLICY "Users can upload varieties images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'profile-pictures' AND 
  (
    -- Allow user folder uploads (existing functionality)
    (auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Allow varieties folder uploads for all authenticated users
    ((storage.foldername(name))[1] = 'varieties')
  )
);

-- Allow users to update varieties images
CREATE POLICY "Users can update varieties images" 
ON storage.objects 
FOR UPDATE 
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND 
  (
    -- Allow user folder updates (existing functionality)
    (auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Allow varieties folder updates for all authenticated users
    ((storage.foldername(name))[1] = 'varieties')
  )
);

-- Allow users to delete varieties images
CREATE POLICY "Users can delete varieties images" 
ON storage.objects 
FOR DELETE 
TO authenticated
USING (
  bucket_id = 'profile-pictures' AND 
  (
    -- Allow user folder deletes (existing functionality)
    (auth.uid()::text = (storage.foldername(name))[1]) OR
    -- Allow varieties folder deletes for all authenticated users
    ((storage.foldername(name))[1] = 'varieties')
  )
);