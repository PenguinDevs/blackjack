-- Create stored procedure to handle blackjack game results in a transaction
CREATE OR REPLACE FUNCTION public.handle_blackjack_game_result(
    p_user_id UUID,
    p_bet_amount INTEGER,
    p_winnings INTEGER,
    p_game_result TEXT,
    p_new_credits INTEGER,
    p_new_games_played INTEGER,
    p_new_games_won INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_game_id UUID;
BEGIN
    -- Create a game record for the blackjack session
    INSERT INTO public.games (name, status, created_by)
    VALUES ('Blackjack', 'finished', p_user_id)
    RETURNING id INTO v_game_id;
    
    -- Create game history record
    INSERT INTO public.game_history (
        game_id, 
        user_id, 
        result, 
        chips_won, 
        chips_lost
    )
    VALUES (
        v_game_id, 
        p_user_id, 
        p_game_result,
        CASE 
            WHEN p_game_result = 'win' THEN p_winnings - p_bet_amount
            WHEN p_game_result = 'push' THEN 0
            ELSE 0
        END,
        CASE 
            WHEN p_game_result = 'lose' THEN p_bet_amount
            ELSE 0
        END
    );
    
    -- Update profile stats
    UPDATE public.profiles 
    SET 
        credits = p_new_credits,
        games_played = p_new_games_played,
        games_won = p_new_games_won,
        updated_at = TIMEZONE('utc'::text, NOW())
    WHERE id = p_user_id;
    
EXCEPTION
    WHEN OTHERS THEN
        -- If anything fails, rollback the transaction
        RAISE EXCEPTION 'Failed to record game result: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.handle_blackjack_game_result(
    UUID, INTEGER, INTEGER, TEXT, INTEGER, INTEGER, INTEGER
) TO authenticated;
