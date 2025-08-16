-- Create function to safely delete user data
CREATE OR REPLACE FUNCTION delete_user_data(p_table text, p_field text, p_user_id uuid)
RETURNS void AS $$
BEGIN
    EXECUTE format('DELETE FROM %I WHERE %I = $1', p_table, p_field)
    USING p_user_id;
EXCEPTION
    WHEN others THEN
        -- Log error and continue
        RAISE NOTICE 'Error deleting from %: %', p_table, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;