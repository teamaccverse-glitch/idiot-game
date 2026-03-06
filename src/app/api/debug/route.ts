import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Missing env vars' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);
  const results: Record<string, unknown> = {};

  try {
    // Test each table
    const tables = ['players', 'game_rounds', 'moon_ball_state', 'meme_game_state', 'team_vote_state', 'revealed_cells', 'hall_of_fame', 'player_votes'];
    
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select('*').limit(1);
      results[table] = {
        exists: !error,
        error: error?.message || null,
        sampleData: data?.[0] || null
      };
    }

    return NextResponse.json({ tables: results });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
