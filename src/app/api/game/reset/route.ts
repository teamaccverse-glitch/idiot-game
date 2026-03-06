import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const MEMES = ['🤡', '👽', '🦄', '🐸', '🤖', '👹', '🤠', '😈', '👺', '🧙'];

const BATTLES = [
  { id: '1', left: { name: 'iOS', emoji: '🍎' }, right: { name: 'Android', emoji: '🤖' } },
  { id: '2', left: { name: 'McDonalds', emoji: '🍔' }, right: { name: 'Burger King', emoji: '👑' } },
  { id: '3', left: { name: 'Cats', emoji: '🐱' }, right: { name: 'Dogs', emoji: '🐕' } },
  { id: '4', left: { name: 'Coffee', emoji: '☕' }, right: { name: 'Tea', emoji: '🍵' } },
  { id: '5', left: { name: 'PlayStation', emoji: '🎮' }, right: { name: 'Xbox', emoji: '🕹️' } },
  { id: '6', left: { name: 'Pineapple on Pizza', emoji: '🍍' }, right: { name: 'No Pineapple', emoji: '🍕' } },
  { id: '7', left: { name: 'Summer', emoji: '☀️' }, right: { name: 'Winter', emoji: '❄️' } },
  { id: '8', left: { name: 'Twitter', emoji: '🐦' }, right: { name: 'Threads', emoji: '🧵' } },
];

export async function POST(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = await request.json().catch(() => ({}));
    const { forceReset = false } = body;

    // Get active round
    const { data: activeRound } = await supabase
      .from('game_rounds')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // Check if reset is needed
    let needsReset = false;

    if (!activeRound) {
      needsReset = true;
    } else {
      const startTime = new Date(activeRound.start_time);
      const now = new Date();
      const hoursPassed = (now.getTime() - startTime.getTime()) / (1000 * 60 * 60);
      if (hoursPassed >= 48 || forceReset) {
        needsReset = true;
      }
    }

    if (!needsReset) {
      return NextResponse.json({
        message: 'No reset needed',
        reset: false,
        activeRound,
      });
    }

    // Mark current round as completed
    if (activeRound) {
      await supabase
        .from('game_rounds')
        .update({
          status: forceReset ? 'early_reset' : 'completed',
          end_time: new Date().toISOString(),
        })
        .eq('id', activeRound.id);
    }

    // Get next round number
    const { data: allRounds } = await supabase
      .from('game_rounds')
      .select('round_number')
      .order('round_number', { ascending: false })
      .limit(1);

    const nextRoundNumber = (allRounds?.[0]?.round_number || 0) + 1;

    // Create new round
    const { data: newRound, error: newRoundError } = await supabase
      .from('game_rounds')
      .insert({
        round_number: nextRoundNumber,
        status: 'active',
        start_time: new Date().toISOString(),
      })
      .select()
      .single();

    if (newRoundError || !newRound) {
      console.error('Error creating new round:', newRoundError);
      return NextResponse.json({ error: 'Failed to create new round' }, { status: 500 });
    }

    // Initialize moon ball state
    await supabase.from('moon_ball_state').insert({
      round_id: newRound.id,
      ball_position: 50,
      total_pushes_moon: 0,
      total_pushes_earth: 0,
      moon_reached: false,
      earth_reached: false,
    });

    // Initialize meme game state (20x20 grid = 400 cells)
    const randomMemePosition = Math.floor(Math.random() * 400);
    const randomMemeEmoji = MEMES[Math.floor(Math.random() * MEMES.length)];

    await supabase.from('meme_game_state').insert({
      round_id: newRound.id,
      meme_position: randomMemePosition,
      meme_emoji: randomMemeEmoji,
      total_reveals: 0,
      meme_found: false,
    });

    // Initialize team vote state
    const randomBattle = BATTLES[Math.floor(Math.random() * BATTLES.length)];

    await supabase.from('team_vote_state').insert({
      round_id: newRound.id,
      battle_id: randomBattle.id,
      left_name: randomBattle.left.name,
      left_emoji: randomBattle.left.emoji,
      right_name: randomBattle.right.name,
      right_emoji: randomBattle.right.emoji,
      left_votes: 0,
      right_votes: 0,
    });

    return NextResponse.json({
      message: 'Game reset successfully',
      reset: true,
      newRound,
    });
  } catch (error) {
    console.error('Error in game reset API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
