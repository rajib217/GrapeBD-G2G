-- Let's explicitly check which functions still have search path issues
-- and recreate them with proper search_path settings

-- Get all function definitions to see what might be missing
SELECT 
    routine_name, 
    routine_definition,
    CASE WHEN routine_definition LIKE '%SET search_path%' THEN 'HAS_SEARCH_PATH' ELSE 'MISSING_SEARCH_PATH' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public';