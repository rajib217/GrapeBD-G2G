-- First drop existing procedure
DROP FUNCTION IF EXISTS delete_user_data;

-- Create a new function to safely delete user and all related data
CREATE OR REPLACE FUNCTION delete_user_cascade(user_id uuid) 
RETURNS void AS $$
BEGIN
    -- Delete from messages table
    DELETE FROM messages 
    WHERE sender_id = user_id OR receiver_id = user_id;

    -- Delete from gifts table
    DELETE FROM gifts 
    WHERE sender_id = user_id OR recipient_id = user_id;
    
    -- Delete from user_stocks
    DELETE FROM user_stocks 
    WHERE user_id = user_id;
    
    -- Delete from reactions
    DELETE FROM reactions 
    WHERE user_id = user_id;
    
    -- Delete from comments
    DELETE FROM comments 
    WHERE user_id = user_id;
    
    -- Delete from posts
    DELETE FROM posts 
    WHERE user_id = user_id;
    
    -- Finally delete the profile
    DELETE FROM profiles 
    WHERE id = user_id;

EXCEPTION
    WHEN others THEN
        RAISE EXCEPTION 'Failed to delete user data: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;