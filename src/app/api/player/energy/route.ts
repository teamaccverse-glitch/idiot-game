import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

interface EnergyRequest {
  playerId: string;
  amount: number;
}

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body: EnergyRequest = await request.json();
    const { playerId, amount } = body;

    if (!playerId || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Get current player
    const { data: player, error: playerError } = await supabase
      .from('players')
      .select('*')
      .eq('id', playerId)
      .single();

    if (playerError || !player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // Add energy (capped at max_energy, which is 5)
    const newEnergy = Math.min(player.energy + amount, player.max_energy || 5);

    const { data: updatedPlayer, error: updateError } = await supabase
      .from('players')
      .update({
        energy: newEnergy,
        last_energy_update: new Date().toISOString(),
      })
      .eq('id', playerId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update energy' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      player: updatedPlayer,
    });
  } catch (error) {
    console.error('Error in energy API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
