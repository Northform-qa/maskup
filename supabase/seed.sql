-- Maskup — Seed data (5 real Ontario fields)
-- Run AFTER schema.sql in the Supabase SQL editor

insert into public.fields (
  name, address, city, province, lat, lng,
  phone, website, description,
  field_types, num_fields, typical_capacity,
  rentals_available, rental_pricing, pricing,
  hours, seasonal_start, seasonal_end,
  weather_status, listing_status
) values
(
  'Sgt. Splatter''s Project Paintball',
  '54 Wingold Avenue',
  'Toronto', 'ON',
  43.6934, -79.4445,
  '(416) 781-0991',
  'sgtsplatters.com',
  'Canada''s largest indoor paintball facility — a 35,000 sq ft two-storey urban war zone of buildings and abandoned vehicles in the heart of Toronto. Designed by a Hollywood set designer. 20 different game scenarios. Walk-ins welcome.',
  ARRAY['Indoor','Speedball'],
  4, 80,
  true, 'Marker, mask and coverall included in session fee',
  '$35–60 per session',
  '{
    "Mon": "12pm–10pm",
    "Tue": "12pm–10pm",
    "Wed": "12pm–10pm",
    "Thu": "12pm–10pm",
    "Fri": "9am–12am",
    "Sat": "9am–12am",
    "Sun": "9am–12am"
  }',
  null, null,
  'open', 'published'
),
(
  'Flag Raiders Paintball',
  '1450 Bishop St N',
  'Cambridge', 'ON',
  43.4041, -80.3467,
  null,
  'flagraiders.com',
  'A woodball destination with 14 playable fields across wooded terrain. Ontario''s most field-diverse paintball park. Bring your own gear or rent on-site.',
  ARRAY['Woodsball','Scenario','Speedball'],
  14, 200,
  true, 'Full rental package available',
  '$30–55 per session',
  '{
    "Mon": "Closed",
    "Tue": "Closed",
    "Wed": "Closed",
    "Thu": "Closed",
    "Fri": "Closed",
    "Sat": "9am–5pm",
    "Sun": "9am–5pm"
  }',
  '2026-04-01', '2026-10-31',
  'open', 'published'
),
(
  'Survival Tactics Outdoor Paintball',
  '5638 King Street',
  'Caledon East', 'ON',
  43.8728, -79.8599,
  null,
  'survivaltacticsinc.com',
  'Over 20 acres of play space — walk, crawl and run through forest and obstacle fields for a real battle experience. Ideal for birthday parties, bachelor parties and corporate events.',
  ARRAY['Woodsball','Scenario'],
  6, 120,
  true, 'Full rental packages available',
  '$40–65 per session',
  '{
    "Mon": "Closed",
    "Tue": "Closed",
    "Wed": "Closed",
    "Thu": "Closed",
    "Fri": "Closed",
    "Sat": "9am–5pm",
    "Sun": "9am–5pm"
  }',
  '2026-05-01', '2026-10-31',
  'open', 'published'
),
(
  'Combat Pursuit Outdoor Paintball',
  '3765 North Road',
  'Pickering', 'ON',
  43.8563, -79.1875,
  null,
  'combatpursuit.com',
  'GTA''s closest outdoor paintball park — only 15 minutes from Toronto city limits. Separate beginner and advanced games. Multiple unique outdoor playing fields. Also offers MicroBall low-impact and Airsoft.',
  ARRAY['Woodsball','Scenario','Speedball','Airsoft'],
  8, 150,
  true, 'Full gear rental included in packages',
  '$45–70 per session',
  '{
    "Mon": "Closed",
    "Tue": "Closed",
    "Wed": "Closed",
    "Thu": "Closed",
    "Fri": "Closed",
    "Sat": "9am–5pm",
    "Sun": "9am–5pm"
  }',
  '2026-03-15', '2026-11-15',
  'open', 'published'
),
(
  'DMZ Paintball & Airsoft',
  '12 Export Rd Unit 3',
  'St. Catharines', 'ON',
  43.1594, -79.2469,
  null,
  'dmzpaintball.com',
  'Central to Niagara, located in St. Catharines. Open all year with both indoor and outdoor fields. Best pro shop in Niagara with over 300 paintball and airsoft guns in stock. Great for birthday parties and bachelor parties.',
  ARRAY['Woodsball','Speedball','Scenario','Airsoft'],
  5, 100,
  true, 'Full rental packages and pro shop on site',
  '$35–55 per session',
  '{
    "Mon": "Closed",
    "Tue": "Closed",
    "Wed": "Closed",
    "Thu": "Closed",
    "Fri": "Closed",
    "Sat": "9am–5pm",
    "Sun": "9am–5pm"
  }',
  null, null,
  'rain_delay', 'published'
);

-- Sample event on Sgt. Splatter's
insert into public.events (field_id, title, event_type, date, start_time, end_time, price, capacity, spots_remaining)
select f.id, 'Big Game: Urban Assault', 'big_game', '2026-06-14', '10:00', '16:00', 55.00, 80, 43
from public.fields f where f.name = 'Sgt. Splatter''s Project Paintball';

insert into public.events (field_id, title, event_type, date, start_time, end_time, price, capacity, spots_remaining)
select f.id, 'Walk-on Saturday', 'walk_on', '2026-06-21', '09:00', '17:00', 40.00, 60, 60
from public.fields f where f.name = 'Sgt. Splatter''s Project Paintball';

-- Sample events on Flag Raiders
insert into public.events (field_id, title, event_type, date, start_time, end_time, price, capacity, spots_remaining)
select f.id, 'Operation Overlord — Big Game', 'big_game', '2026-06-14', '09:00', '17:00', 50.00, 200, 87
from public.fields f where f.name = 'Flag Raiders Paintball';
