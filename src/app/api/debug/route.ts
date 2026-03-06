import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Force rebuild v2 - 2024
const BUILD_VERSION = '2.0.0-debug-' + Date.now();

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars', version: BUILD_VERSION });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: Record<string, unknown> = {};

  try {
    const tables = ['players', 'game_rounds', 'moon_ball_state', 'meme_game_state', 'team_vote_state', 'revealed_cells', 'hall_of_fame', 'player_votes'];
    
    for (const table of tables) {
      const { data, error, count } = await supabase.from(table).select('*', { count: 'exact' }).limit(1);
      results[table] = {
        exists: !error,
        error: error?.message || null,
        sampleData: data?.[0] || null,
        totalCount: count || 0
      };
    }

    // Check current game state
    const { data: currentRound } = await supabase
      .from('game_rounds')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1);

    return NextResponse.json({ 
      version: BUILD_VERSION,
      timestamp: new Date().toISOString(),
      tables: results,
      currentRound: currentRound?.[0] || null
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), version: BUILD_VERSION }, { status: 500 });
  }
}
