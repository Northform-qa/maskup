// Supabase Edge Function: aggregate_crowd_reports
// Triggered by pg_cron every 5 minutes.
// For each field, averages crowd_reports from the last 2 hours and writes
// back to fields.active_players_now, crowd_report_count, crowd_report_last_updated.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const RANGE_MIDPOINTS: Record<string, number> = {
  under_25: 12,
  '25_to_50': 37,
  '50_to_100': 75,
  over_100: 120,
}

const TWO_HOURS_MS = 2 * 60 * 60 * 1000

Deno.serve(async (_req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const cutoff = new Date(Date.now() - TWO_HOURS_MS).toISOString()

  // Fetch all recent reports
  const { data: reports, error: reportsErr } = await supabase
    .from('crowd_reports')
    .select('field_id, player_count_range, submitted_at')
    .gte('submitted_at', cutoff)

  if (reportsErr) {
    return new Response(JSON.stringify({ error: reportsErr.message }), { status: 500 })
  }

  // Group by field
  const byField = new Map<string, { midpoints: number[]; latest: string }>()
  for (const row of reports ?? []) {
    const midpoint = RANGE_MIDPOINTS[row.player_count_range]
    if (midpoint == null) continue
    if (!byField.has(row.field_id)) {
      byField.set(row.field_id, { midpoints: [], latest: row.submitted_at })
    }
    const entry = byField.get(row.field_id)!
    entry.midpoints.push(midpoint)
    if (row.submitted_at > entry.latest) entry.latest = row.submitted_at
  }

  // Write aggregated results back to fields
  const updates = Array.from(byField.entries()).map(([field_id, { midpoints, latest }]) => {
    const avg = Math.round(midpoints.reduce((a, b) => a + b, 0) / midpoints.length)
    return supabase.from('fields').update({
      active_players_now: avg,
      crowd_report_count: midpoints.length,
      crowd_report_last_updated: latest,
    }).eq('id', field_id)
  })

  await Promise.all(updates)

  return new Response(JSON.stringify({ updated: byField.size }), {
    headers: { 'Content-Type': 'application/json' },
  })
})
