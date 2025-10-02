-- Create users profile table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE,
    email TEXT,
    full_name TEXT,
    avatar_url TEXT,
    credits INTEGER NOT NULL DEFAULT 500,
    games_played INTEGER NOT NULL DEFAULT 0,
    games_won INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE
    DEFAULT TIMEZONE('utc'::TEXT, NOW()) NOT NULL,
    PRIMARY KEY (id)
);

-- Create games table for blackjack games
CREATE TABLE IF NOT EXISTS public.games (
    id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'waiting' CHECK (
        status IN ('waiting', 'in_progress', 'finished')
    ),
    created_by UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(
        'utc'::TEXT, NOW()
    ) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(
        'utc'::TEXT, NOW()
    ) NOT NULL
);

-- Create game_players table for player participation
CREATE TABLE IF NOT EXISTS public.game_players (
    id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
    game_id UUID REFERENCES public.games (id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    chips INTEGER NOT NULL DEFAULT 1000,
    current_bet INTEGER DEFAULT 0,
    hand JSONB DEFAULT '[]'::JSONB,
    -- active - Player is still playing and can take actions (hit, stand, etc.)
    -- bust - Player's hand value exceeds 21 and they've lost.
    -- stand - Player has chosen to stand and is done taking cards.
    -- blackjack - Player has achieved a blackjack (21 with their first two
    -- cards).
    status TEXT NOT NULL DEFAULT 'active' CHECK (
        status IN ('active', 'bust', 'stand', 'blackjack')
    ),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(
        'utc'::TEXT, NOW()
    ) NOT NULL,
    UNIQUE (game_id, user_id),
    UNIQUE (game_id, position)
);

-- Create game_history table for completed games
CREATE TABLE IF NOT EXISTS public.game_history (
    id UUID DEFAULT GEN_RANDOM_UUID() PRIMARY KEY,
    game_id UUID REFERENCES public.games (id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users (id) ON DELETE CASCADE,
    result TEXT NOT NULL CHECK (result IN ('win', 'lose', 'push')),
    chips_won INTEGER DEFAULT 0,
    chips_lost INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE(
        'utc'::TEXT, NOW()
    ) NOT NULL
);

-- Row Level Security (RLS) Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_history ENABLE ROW LEVEL SECURITY;

-- Profiles policies
-- Allow all users to view public profile information (name, avatar, etc.)
CREATE POLICY profiles_select_policy ON profiles
FOR SELECT USING (true);

-- Users can only create their own profile record
CREATE POLICY profiles_insert_policy ON profiles
FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can only update their own profile information
CREATE POLICY profiles_update_policy ON profiles
FOR UPDATE USING (auth.uid() = id);

-- Games policies
-- Allow all users to browse and view available games
CREATE POLICY games_select_policy ON games
FOR SELECT USING (true);

-- Only authenticated users can create new games
CREATE POLICY games_insert_policy ON games
FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Only the game creator can update game settings and status
CREATE POLICY games_update_policy ON games
FOR UPDATE USING (auth.uid() = created_by);

-- Game players policies
-- Players can only see other players in games they are participating in
CREATE POLICY game_players_select_policy ON game_players
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM game_players AS gp
        WHERE
            gp.game_id = game_players.game_id
            AND gp.user_id = auth.uid()
    )
);

-- Users can join games by adding themselves as players
CREATE POLICY game_players_insert_policy ON game_players
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Players can only update their own game state (bets, hands, status)
CREATE POLICY game_players_update_policy ON game_players
FOR UPDATE USING (auth.uid() = user_id);

-- Game history policies
-- Users can only access their own game history and results
CREATE POLICY game_history_select_policy ON game_history
FOR SELECT USING (auth.uid() = user_id);

-- Game history records can only be created for the authenticated user
CREATE POLICY game_history_insert_policy ON game_history
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Functions and triggers
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, credits, games_played, games_won)
        VALUES (
          NEW.id,
          NEW.email,
          NEW.raw_user_meta_data->>'full_name',
          NEW.raw_user_meta_data->>'avatar_url',
          500,
          0,
          0
        );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile for new users
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update profile stats when game history is added
CREATE OR REPLACE FUNCTION public.update_profile_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- Update games_played count
    UPDATE public.profiles 
    SET games_played = games_played + 1
    WHERE id = NEW.user_id;
    
    -- Update games_won count if the result is a win
    IF NEW.result = 'win' THEN
        UPDATE public.profiles 
        SET games_won = games_won + 1
        WHERE id = NEW.user_id;
    END IF;
    
    -- Update credits based on chips won/lost
    UPDATE public.profiles 
    SET credits = credits + NEW.chips_won - NEW.chips_lost
    WHERE id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update profile stats when game history is added
CREATE TRIGGER update_profile_stats_trigger
AFTER INSERT ON public.game_history
FOR EACH ROW EXECUTE FUNCTION public.update_profile_stats();

-- Triggers for updated_at
CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_updated_at BEFORE UPDATE ON public.games
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
