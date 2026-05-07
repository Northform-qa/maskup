-- Maskup — pg_cron jobs
-- ─────────────────────────────────────────────────────────────────────────────
-- PREREQUISITE: Enable pg_cron before running this file.
--   Supabase dashboard → Database → Extensions → search "pg_cron" → Enable
--
-- Then run this file in the SQL editor.
--
-- To verify jobs are registered after running:
--   select jobname, schedule, command from cron.job;
-- ─────────────────────────────────────────────────────────────────────────────

-- Midnight ET reset: clear active player data on all fields.
-- Supabase runs UTC. Midnight ET (EST) = 05:00 UTC; (EDT) = 04:00 UTC.
-- 05:00 UTC is safe year-round.
select cron.schedule(
  'midnight-crowd-reset',
  '0 5 * * *',
  $$
    update public.fields
    set
      active_players_now = null,
      crowd_report_count = 0,
      crowd_report_last_updated = null;
  $$
);

-- Trigger the crowd aggregation Edge Function every 5 minutes.
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY with real values.
-- Use the service role key here (server-side only — never expose in client code).
select cron.schedule(
  'aggregate-crowd-reports',
  '*/5 * * * *',
  $$
    select net.http_post(
      url     := 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/aggregate_crowd_reports',
      headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body    := '{}'::jsonb
    );
  $$
);
