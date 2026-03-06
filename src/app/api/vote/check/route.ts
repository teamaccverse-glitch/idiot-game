import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const roundId = searchParams.get('roundId');

    if (!playerId || !roundId) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
    }

    // Get all votes by this player in this round
    const { data: votes, error } = await supabase
      .from('player_votes')
      .select('battle_id')
      .eq('player_id', playerId)
      .eq('round_id', roundId);

    if (error) {
      console.error('Error checking votes:', error);
      return NextResponse.json({ votedBattles: [] });
    }

    const votedBattles = votes?.map((v) => v.battle_id) || [];

    return NextResponse.json({ votedBattles });
  } catch (error) {
    console.error('Error in vote check API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
