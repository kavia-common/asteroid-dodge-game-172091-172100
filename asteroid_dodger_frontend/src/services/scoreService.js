import { supabase } from '../lib/supabaseClient';

/**
 * Score service for submitting and reading scores.
 * Table: scores(user_id uuid pk, email text, best_score int, updated_at timestamptz)
 */

// PUBLIC_INTERFACE
export async function submitBestScore(userId, email, score) {
  /**
   * Upserts the user's best score. Only increases stored score.
   * Returns { data, error, updated } where updated indicates if a new best was saved.
   */
  if (!userId) return { data: null, error: new Error('Missing user id'), updated: false };
  try {
    // Fetch current best
    const { data: current, error: selErr } = await supabase
      .from('scores')
      .select('best_score')
      .eq('user_id', userId)
      .maybeSingle();

    if (selErr && selErr.code !== 'PGRST116') {
      // table missing or rls error, bubble up
      return { data: null, error: selErr, updated: false };
    }

    const currentBest = current?.best_score ?? null;
    const nextBest = currentBest == null ? score : Math.max(currentBest, score);
    const willUpdate = currentBest == null || nextBest > currentBest;

    if (!willUpdate) {
      return { data: { best_score: currentBest }, error: null, updated: false };
    }

    const payload = {
      user_id: userId,
      email: email || null,
      best_score: nextBest,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase.from('scores').upsert(payload, { onConflict: 'user_id' }).select().maybeSingle();
    return { data, error, updated: !error };
  } catch (e) {
    return { data: null, error: e, updated: false };
  }
}

// PUBLIC_INTERFACE
export async function getTopScores(limit = 10) {
  /** Get top N scores. */
  return supabase
    .from('scores')
    .select('user_id, email, best_score, updated_at')
    .order('best_score', { ascending: false })
    .limit(limit);
}
