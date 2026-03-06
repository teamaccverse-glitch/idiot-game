-- Idiot Games - Complete Database Setup
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ DROP EXISTING TABLES (in order of dependencies) ============
DROP TABLE IF EXISTS hall_of_fame CASCADE;
DROP TABLE IF EXISTS revealed_cells CASCADE;
DROP TABLE IF EXISTS player_votes CASCADE;
DROP TABLE IF EXISTS moon_ball_moves CASCADE;
DROP TABLE IF EXISTS meme_game_state CASCADE;
DROP TABLE IF EXISTS moon_ball_state CASCADE;
DROP TABLE IF EXISTS team_vote_state CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS game_rounds CASCADE;

-- ============ PLAYERS ============
CREATE TABLE players (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  energy INTEGER DEFAULT 3 CHECK (energy >= 0 AND energy <= 5),
  max_energy INTEGER DEFAULT 5,
  last_energy_update TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_wins INTEGER DEFAULT 0,
  moon_wins INTEGER DEFAULT 0,
  earth_wins INTEGER DEFAULT 0,
  meme_wins INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ GAME ROUNDS ============
CREATE TABLE game_rounds (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_number INTEGER NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_time TIMESTAMP WITH TIME ZONE,
  reset_early BOOLEAN DEFAULT FALSE,
  reset_reason TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'early_reset')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ MOON BALL STATE ============
CREATE TABLE moon_ball_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE NOT NULL,
  ball_position INTEGER DEFAULT 50 CHECK (ball_position >= 0 AND ball_position <= 100),
  total_pushes_moon INTEGER DEFAULT 0,
  total_pushes_earth INTEGER DEFAULT 0,
  moon_reached BOOLEAN DEFAULT FALSE,
  earth_reached BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id)
);

-- ============ MOON BALL MOVES ============
CREATE TABLE moon_ball_moves (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  direction TEXT NOT NULL CHECK (direction IN ('moon', 'earth')),
  distance_moved INTEGER NOT NULL,
  position_before INTEGER NOT NULL,
  position_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ MEME GAME STATE ============
CREATE TABLE meme_game_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE NOT NULL,
  meme_position INTEGER NOT NULL CHECK (meme_position >= 0 AND meme_position < 400),
  meme_emoji TEXT DEFAULT '🤡',
  total_reveals INTEGER DEFAULT 0,
  meme_found BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id)
);

-- ============ REVEALED CELLS ============
CREATE TABLE revealed_cells (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  cell_index INTEGER NOT NULL CHECK (cell_index >= 0 AND cell_index < 400),
  is_meme BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id, cell_index)
);

-- ============ TEAM VOTE STATE ============
CREATE TABLE team_vote_state (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE NOT NULL,
  battle_id TEXT NOT NULL,
  left_name TEXT NOT NULL,
  left_emoji TEXT NOT NULL,
  right_name TEXT NOT NULL,
  right_emoji TEXT NOT NULL,
  left_votes INTEGER DEFAULT 0,
  right_votes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id)
);

-- ============ PLAYER VOTES ============
CREATE TABLE player_votes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  battle_id TEXT NOT NULL,
  vote_side TEXT NOT NULL CHECK (vote_side IN ('left', 'right')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_id, player_id, battle_id)
);

-- ============ HALL OF FAME ============
CREATE TABLE hall_of_fame (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  round_id UUID REFERENCES game_rounds(id) ON DELETE CASCADE NOT NULL,
  player_id UUID REFERENCES players(id) ON DELETE SET NULL,
  player_name TEXT NOT NULL,
  win_type TEXT NOT NULL CHECK (win_type IN ('moon', 'earth', 'meme')),
  attempts INTEGER,
  ball_position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============ ENABLE ROW LEVEL SECURITY ============
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE moon_ball_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE moon_ball_moves ENABLE ROW LEVEL SECURITY;
ALTER TABLE meme_game_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE revealed_cells ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_vote_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

-- ============ RLS POLICIES (Allow all for anon access) ============
-- Players
CREATE POLICY "Anyone can view players" ON players FOR SELECT USING (true);
CREATE POLICY "Anyone can insert players" ON players FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update players" ON players FOR UPDATE USING (true);

-- Game rounds
CREATE POLICY "Anyone can view game_rounds" ON game_rounds FOR SELECT USING (true);
CREATE POLICY "Anyone can insert game_rounds" ON game_rounds FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update game_rounds" ON game_rounds FOR UPDATE USING (true);

-- Moon ball state
CREATE POLICY "Anyone can view moon_ball_state" ON moon_ball_state FOR SELECT USING (true);
CREATE POLICY "Anyone can insert moon_ball_state" ON moon_ball_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update moon_ball_state" ON moon_ball_state FOR UPDATE USING (true);

-- Moon ball moves
CREATE POLICY "Anyone can view moon_ball_moves" ON moon_ball_moves FOR SELECT USING (true);
CREATE POLICY "Anyone can insert moon_ball_moves" ON moon_ball_moves FOR INSERT WITH CHECK (true);

-- Meme game state
CREATE POLICY "Anyone can view meme_game_state" ON meme_game_state FOR SELECT USING (true);
CREATE POLICY "Anyone can insert meme_game_state" ON meme_game_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update meme_game_state" ON meme_game_state FOR UPDATE USING (true);

-- Revealed cells
CREATE POLICY "Anyone can view revealed_cells" ON revealed_cells FOR SELECT USING (true);
CREATE POLICY "Anyone can insert revealed_cells" ON revealed_cells FOR INSERT WITH CHECK (true);

-- Team vote state
CREATE POLICY "Anyone can view team_vote_state" ON team_vote_state FOR SELECT USING (true);
CREATE POLICY "Anyone can insert team_vote_state" ON team_vote_state FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update team_vote_state" ON team_vote_state FOR UPDATE USING (true);

-- Player votes
CREATE POLICY "Anyone can view player_votes" ON player_votes FOR SELECT USING (true);
CREATE POLICY "Anyone can insert player_votes" ON player_votes FOR INSERT WITH CHECK (true);

-- Hall of fame
CREATE POLICY "Anyone can view hall_of_fame" ON hall_of_fame FOR SELECT USING (true);
CREATE POLICY "Anyone can insert hall_of_fame" ON hall_of_fame FOR INSERT WITH CHECK (true);

-- ============ INITIAL DATA ============
-- Insert first game round
INSERT INTO game_rounds (round_number, status)
VALUES (1, 'active');

-- Initialize moon ball state
INSERT INTO moon_ball_state (round_id, ball_position)
SELECT id, 50 FROM game_rounds WHERE status = 'active' LIMIT 1;

-- Initialize meme game state (random position in 20x20 grid)
INSERT INTO meme_game_state (round_id, meme_position, meme_emoji)
SELECT id, floor(random() * 400)::int, '🤡' FROM game_rounds WHERE status = 'active' LIMIT 1;

-- Initialize team vote state
INSERT INTO team_vote_state (round_id, battle_id, left_name, left_emoji, right_name, right_emoji)
SELECT id, '1', 'iOS', '🍎', 'Android', '🤖' FROM game_rounds WHERE status = 'active' LIMIT 1;

-- ============ CREATE INDEXES ============
CREATE INDEX IF NOT EXISTS idx_players_username ON players(username);
CREATE INDEX IF NOT EXISTS idx_game_rounds_status ON game_rounds(status);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_win_type ON hall_of_fame(win_type);
CREATE INDEX IF NOT EXISTS idx_hall_of_fame_created_at ON hall_of_fame(created_at DESC);
