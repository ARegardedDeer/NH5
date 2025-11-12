-- Discovery Swipe Actions Table
-- Tracks user interactions in the Tinder-style discovery feature
-- Actions: skip, rate, add
-- Skip resets after 30 days to re-show anime

CREATE TABLE IF NOT EXISTS discovery_swipe_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  anime_id UUID REFERENCES anime(id) ON DELETE CASCADE NOT NULL,
  action TEXT CHECK (action IN ('skip', 'rate', 'add')) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_swipe_user ON discovery_swipe_actions(user_id);
CREATE INDEX IF NOT EXISTS idx_swipe_anime ON discovery_swipe_actions(anime_id);
CREATE INDEX IF NOT EXISTS idx_swipe_created ON discovery_swipe_actions(created_at);
CREATE INDEX IF NOT EXISTS idx_swipe_user_action ON discovery_swipe_actions(user_id, action);

-- Composite index for finding recent skips
CREATE INDEX IF NOT EXISTS idx_swipe_user_skip_recent
  ON discovery_swipe_actions(user_id, action, created_at)
  WHERE action = 'skip';

-- RLS (Row Level Security) policies
ALTER TABLE discovery_swipe_actions ENABLE ROW LEVEL SECURITY;

-- Users can insert their own swipe actions
CREATE POLICY "Users can insert their own swipe actions"
  ON discovery_swipe_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can view their own swipe actions
CREATE POLICY "Users can view their own swipe actions"
  ON discovery_swipe_actions FOR SELECT
  USING (auth.uid() = user_id);

-- Users can delete their own swipe actions (for cleanup/reset)
CREATE POLICY "Users can delete their own swipe actions"
  ON discovery_swipe_actions FOR DELETE
  USING (auth.uid() = user_id);

-- Optional: Add comment for documentation
COMMENT ON TABLE discovery_swipe_actions IS
  'Tracks user interactions in the Discovery Swipe feature. Skip actions expire after 30 days.';

COMMENT ON COLUMN discovery_swipe_actions.action IS
  'Type of action: skip (left swipe), rate (down swipe), add (right swipe to watchlist)';
