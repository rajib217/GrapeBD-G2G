-- Fix remaining function search path issues  
-- The remaining functions should be these two that were identified earlier

-- Let's check and fix any other functions that might exist
-- First, let's see what functions exist in the database
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_definition NOT LIKE '%SET search_path%';