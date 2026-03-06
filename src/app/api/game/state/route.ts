import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Get active round
    const { data: activeRound, error: roundError } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (roundError) {
      console.error('Round error:', roundError);
      return NextResponse.json({ error: 'Round query failed', details: roundError.message }, { status: 500 });
    }

    if (!activeRound) {
      return NextResponse.json({
        activeRound: null,
        moonBallState: null,
        memeGameState: null,
        teamVoteState: null,
        revealedCells: [],
        hallOfFame: [],
      });
    }

    // Get all game states
    const [moonRes, memeRes, voteRes, cellsRes, fameRes] = await Promise.all([
      supabase.from('moon_ball_state').select('*').eq('round_id', activeRound.id).maybeSingle(),
      supabase.from('meme_game_state').select('*').eq('round_id', activeRound.id).maybeSingle(),
      supabase.from('team_vote_state').select('*').eq('round_id', activeRound.id).maybeSingle(),
      supabase.from('revealed_cells').select('cell_index, is_meme').eq('round_id', activeRound.id),
      supabase.from('hall_of_fame').select('*').order('created_at', { ascending: false }).limit(20),
    ]);

    // Log any errors but don't fail
    if (moonRes.error) console.error('Moon ball error:', moonRes.error);
    if (memeRes.error) console.error('Meme game error:', memeRes.error);
    if (voteRes.error) console.error('Team vote error:', voteRes.error);
    if (cellsRes.error) console.error('Revealed cells error:', cellsRes.error);
    if (fameRes.error) console.error('Hall of fame error:', fameRes.error);

    return NextResponse.json({
      activeRound,
      moonBallState: moonRes.data || null,
      memeGameState: memeRes.data || null,
      teamVoteState: voteRes.data || null,
      revealedCells: cellsRes.data || [],
      hallOfFame: fameRes.data || [],
    });

  } catch (err) {
    console.error('Game state error:', err);
    return NextResponse.json({ error: 'Server error', details: String(err) }, { status: 500 });
  }
}
