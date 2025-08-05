-- Fix storage policy for post images - change role from public to authenticated
DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;

CREATE POLICY "Users can upload their own post images" 
ON storage.objects 
FOR INSERT 
TO authenticated
WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);