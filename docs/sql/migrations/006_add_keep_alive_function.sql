-- Keep-alive function to prevent database from being paused
-- This function performs a simple query to register activity
CREATE OR REPLACE FUNCTION keep_alive()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result json;
BEGIN
  -- Simple query to register database activity
  SELECT json_build_object(
    'status', 'active',
    'timestamp', NOW(),
    'total_users', (SELECT COUNT(*) FROM auth.users),
    'total_anime', (SELECT COUNT(*) FROM user_lists)
  ) INTO result;

  RETURN result;
END;
$$;

-- Grant execute permission to anon and authenticated users
GRANT EXECUTE ON FUNCTION keep_alive() TO anon;
GRANT EXECUTE ON FUNCTION keep_alive() TO authenticated;

COMMENT ON FUNCTION keep_alive() IS 'Simple function to keep database active and prevent auto-pause';
